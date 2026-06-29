import express from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { buildZohoAuthUrl, decodeZohoState, exchangeZohoCode, getZohoConfig, getValidZohoConnection, saveZohoConnection } from '../services/zohoAuthService.js';
import { fetchZohoCurrentUser } from '../services/zohoCrmService.js';

const router = express.Router();

function handleZohoAuthError(res, error) {
  if (error.code === 'ZOHO_CONFIG_INVALID') {
    return res.status(503).json({
      ok: false,
      connected: false,
      reason: error.code,
      message: error.message,
      missing: error.missing || [],
    });
  }
  return res.status(500).json({
    ok: false,
    connected: false,
    reason: error.code || 'unknown_error',
    message: error.message,
  });
}

export function zohoConnectHandler(req, res) {
  const userId = req.user?.id || req.user?._id?.toString();
  if (!userId) {
    return res.status(401).send('User must be logged in to connect Zoho.');
  }
  try {
    res.redirect(buildZohoAuthUrl(userId, req.workspaceId));
  } catch (error) {
    handleZohoAuthError(res, error);
  }
}

export function zohoConnectUrlHandler(req, res) {
  const userId = req.user?.id || req.user?._id?.toString();
  if (!userId) {
    return res.status(401).json({ ok: false, message: 'User must be logged in to connect Zoho.' });
  }
  try {
    res.json({ ok: true, url: buildZohoAuthUrl(userId, req.workspaceId) });
  } catch (error) {
    handleZohoAuthError(res, error);
  }
}

export async function zohoCallbackHandler(req, res) {
  const { code, state, location, 'accounts-server': accountsServer } = req.query;
  if (!code || !state || !accountsServer) {
    return res.status(400).send('Missing code, state, or accounts-server.');
  }

  try {
    const { userId, workspaceId } = decodeZohoState(state);
    const tokenData = await exchangeZohoCode({
      code,
      accountsServer,
    });
    await saveZohoConnection(userId, {
      ...tokenData,
      location,
      accountsServer,
    }, workspaceId);
    res.send('<h3>Zoho connected successfully</h3><p>You can close this window and return to BillSync.</p>');
  } catch (error) {
    console.error('[Zoho callback]', error.response?.data || error.message);
    res.status(500).send('<h3>Zoho connection failed</h3><p>Check the server logs for the full error details.</p>');
  }
}

export async function zohoStatusHandler(req, res) {
  const userId = req.user?.id || req.user?._id?.toString();
  if (!userId) {
    return res.status(401).json({ connected: false, reason: 'not_logged_in' });
  }

  try {
    const connection = await getValidZohoConnection(userId);
    const me = await fetchZohoCurrentUser(userId).catch(() => null);
    res.json({
      connected: true,
      accountsServer: connection.accountsServer,
      apiDomain: connection.apiDomain,
      scopes: connection.scopes,
      zohoUser: me,
    });
  } catch (error) {
    const code = error.code === 'ZOHO_NOT_CONNECTED' ? 404 : error.code === 'ZOHO_CONFIG_INVALID' ? 503 : 500;
    res.status(code).json({
      connected: false,
      reason: error.code || 'unknown_error',
      message: error.message,
      missing: error.missing || undefined,
      connectUrl: `${getZohoConfig().accountsServer}/oauth/v2/auth`,
    });
  }
}

router.get('/connect', authenticate, zohoConnectHandler);
router.get('/connect-url', authenticate, zohoConnectUrlHandler);
router.get('/callback', zohoCallbackHandler);
router.get('/status', authenticate, zohoStatusHandler);

export default router;

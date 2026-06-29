import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import ZohoConnection from '../models/ZohoConnection.js';
import { getJwtSecret } from '../../auth/services/authTokenService.js';

const DEFAULT_SCOPES = [
  'ZohoCRM.modules.ALL',
  'ZohoCRM.settings.ALL',
].join(',');

export function getZohoConfig() {
  return {
    clientId: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
    redirectUri: process.env.ZOHO_REDIRECT_URI || `${String(process.env.API_BASE_URL || '').replace(/\/$/, '')}/api/integrations/zoho/callback`,
    accountsServer: process.env.ZOHO_ACCOUNTS_SERVER || 'https://accounts.zoho.in',
    scopes: process.env.ZOHO_SCOPES || DEFAULT_SCOPES,
  };
}

export function validateZohoConfig() {
  const config = getZohoConfig();
  const missing = [];
  if (!config.clientId) missing.push('ZOHO_CLIENT_ID');
  if (!config.clientSecret) missing.push('ZOHO_CLIENT_SECRET');
  if (!config.redirectUri || !/^https?:\/\/.+\/api\/integrations\/zoho\/callback$/i.test(config.redirectUri)) {
    missing.push('ZOHO_REDIRECT_URI');
  }
  if (missing.length) {
    const error = new Error(`Zoho OAuth is not configured correctly: ${missing.join(', ')}`);
    error.code = 'ZOHO_CONFIG_INVALID';
    error.missing = missing;
    throw error;
  }
  return config;
}

function objectIdOrValue(value) {
  if (!value) return value;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value;
}

export function encodeZohoState(userId, workspaceId = null) {
  return jwt.sign(
    {
      sub: String(userId),
      workspaceId: workspaceId ? String(workspaceId) : undefined,
      purpose: 'zoho_oauth',
    },
    getJwtSecret(),
    { expiresIn: '15m' }
  );
}

export function decodeZohoState(state) {
  const decoded = jwt.verify(String(state || ''), getJwtSecret());
  if (decoded.purpose !== 'zoho_oauth' || !decoded.sub) {
    throw new Error('Invalid Zoho OAuth state');
  }
  return {
    userId: decoded.sub,
    workspaceId: decoded.workspaceId || null,
  };
}

export function buildZohoAuthUrl(userId, workspaceId = null) {
  const { clientId, redirectUri, accountsServer, scopes } = validateZohoConfig();
  const params = new URLSearchParams({
    scope: scopes,
    client_id: clientId,
    response_type: 'code',
    access_type: 'offline',
    redirect_uri: redirectUri,
    state: encodeZohoState(userId, workspaceId),
    prompt: 'consent',
  });
  return `${accountsServer}/oauth/v2/auth?${params.toString()}`;
}

export async function exchangeZohoCode({ code, accountsServer }) {
  const { clientId, clientSecret, redirectUri } = validateZohoConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const { data } = await axios.post(`${accountsServer}/oauth/v2/token`, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
}

export async function refreshZohoAccessToken(connection) {
  const { clientId, clientSecret } = validateZohoConfig();
  const body = new URLSearchParams({
    refresh_token: connection.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });
  const { data } = await axios.post(`${connection.accountsServer}/oauth/v2/token`, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  connection.accessToken = data.access_token;
  connection.apiDomain = data.api_domain || connection.apiDomain;
  connection.accessTokenExpiresAt = new Date(Date.now() + Number(data.expires_in || 3600) * 1000);
  connection.tokenType = data.token_type || connection.tokenType || 'Bearer';
  connection.raw = { ...(connection.raw || {}), refresh: data };
  await connection.save();
  return connection;
}

export async function saveZohoConnection(userId, payload, workspaceId = null) {
  const expiresIn = Number(payload.expires_in || 3600);
  const update = {
    userId: objectIdOrValue(userId),
    location: payload.location || 'us',
    accountsServer: payload.accountsServer,
    apiDomain: payload.api_domain,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    tokenType: payload.token_type || 'Bearer',
    accessTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
    scopes: String(getZohoConfig().scopes).split(',').map((scope) => scope.trim()).filter(Boolean),
    raw: payload,
  };
  if (workspaceId) {
    update.workspaceId = objectIdOrValue(workspaceId);
  }

  const result = await ZohoConnection.collection.findOneAndUpdate(
    { userId: objectIdOrValue(userId) },
    {
      $set: update,
    },
    { upsert: true, returnDocument: 'after' }
  );
  return result.value;
}

export async function getValidZohoConnection(userId) {
  const connection = await ZohoConnection.findOne({ userId });
  if (!connection) {
    const err = new Error('Zoho is not connected for this user');
    err.code = 'ZOHO_NOT_CONNECTED';
    throw err;
  }

  const stillValid = connection.accessTokenExpiresAt && connection.accessTokenExpiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) {
    return connection;
  }
  return refreshZohoAccessToken(connection);
}

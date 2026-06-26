import { getWorkspaceModuleNavigation } from '../services/moduleNavigationService.js';

function requireWorkspace(req, res) {
  if (req.workspaceId) return true;
  res.status(400).json({ ok: false, message: 'Choose a workspace before loading modules.' });
  return false;
}

export async function listWorkspaceModules(req, res) {
  if (!requireWorkspace(req, res)) return;
  try {
    const data = await getWorkspaceModuleNavigation({
      workspaceId: req.workspaceId,
      userId: req.user?.id,
      user: req.user,
    });
    res.json({
      ok: true,
      data: {
        workspaceId: data.workspaceId,
        modules: data.modules,
        validation: data.validation,
        message: data.message,
      },
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ ok: false, message: err.message || 'Failed to load workspace modules.' });
  }
}

export async function getWorkspaceNavigation(req, res) {
  if (!requireWorkspace(req, res)) return;
  try {
    const data = await getWorkspaceModuleNavigation({
      workspaceId: req.workspaceId,
      userId: req.user?.id,
      user: req.user,
    });
    res.json({
      ok: true,
      data: {
        workspaceId: data.workspaceId,
        navigation: data.navigation,
        modules: data.modules,
        permissions: data.permissions,
        validation: data.validation,
        message: data.message,
      },
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ ok: false, message: err.message || 'Failed to load workspace navigation.' });
  }
}

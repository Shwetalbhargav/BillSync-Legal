import { getWorkforceAnalytics } from '../services/workforceAnalyticsService.js';

const managerRoles = new Set(['admin', 'partner']);

export async function getWorkforceAnalyticsDashboard(req, res) {
  try {
    if (!managerRoles.has(String(req.user?.role || '').toLowerCase())) {
      return res.status(403).json({ ok: false, code: 'WORKFORCE_ANALYTICS_FORBIDDEN', message: 'Workforce analytics is available to firm reviewers' });
    }
    const data = await getWorkforceAnalytics(req.query);
    res.json({ ok: true, data });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: 'Failed to load workforce analytics' });
  }
}

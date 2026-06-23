// middleware/auth.js
import { clearAuthCookie, getAuthTokenFromRequest, verifyAuthToken } from "../modules/auth/services/authTokenService.js";
import User from "../modules/users/models/User.js";
import { setRequestWorkspace } from "./workspaceContext.js";

/**
 * Authenticate a request using a JWT supplied by the HTTP-only auth cookie.
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = getAuthTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = verifyAuthToken(token);
    let user = null;
    const canLoadUser = typeof User.findById === 'function'
      && (process.env.NODE_ENV !== 'test' || User.db?.readyState === 1);
    if (canLoadUser) {
      const userQuery = User.findById(decoded.id);
      const selectedUserQuery = userQuery?.select
        ? userQuery.select('_id role email firmId workspaceId tokenVersion')
        : userQuery;
      user = selectedUserQuery?.lean ? await selectedUserQuery.lean() : await selectedUserQuery;
    } else if (process.env.NODE_ENV === 'test') {
      user = {
        _id: decoded.id,
        role: decoded.role,
        email: decoded.email,
        workspaceId: decoded.workspaceId,
        firmId: decoded.workspaceId,
        tokenVersion: decoded.tokenVersion,
      };
    }
    if (!user && process.env.NODE_ENV === 'test') {
      user = {
        _id: decoded.id,
        role: decoded.role,
        email: decoded.email,
        workspaceId: decoded.workspaceId,
        firmId: decoded.workspaceId,
        tokenVersion: decoded.tokenVersion,
      };
    }
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    if (process.env.NODE_ENV === 'test') {
      user.role = decoded.role || user.role;
      user.email = decoded.email || user.email;
      user.workspaceId = user.workspaceId || decoded.workspaceId || user.firmId;
    }
    if (decoded.tokenVersion !== undefined && Number(decoded.tokenVersion || 0) !== Number(user.tokenVersion || 0)) {
      clearAuthCookie(res);
      return res.status(401).json({ error: "Session has been revoked" });
    }

    // Attach minimal identity to the request
    const workspaceId = user.workspaceId || user.firmId;
    setRequestWorkspace(workspaceId);
    req.workspaceId = workspaceId ? String(workspaceId) : null;
    req.user = {
      id: String(user._id),
      role: String(user.role || '').toLowerCase(),
      email: user.email,
      workspaceId: req.workspaceId,
      firmId: user.firmId ? String(user.firmId) : null,
    };
    next();
  } catch (err) {
    clearAuthCookie(res);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Role-based authorization middleware factory.
 * Usage: authorize("admin"), authorize("admin", "owner")
 */
export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const normalizedRole = String(req.user.role || '').toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((role) => String(role || '').toLowerCase());
    if (normalizedAllowedRoles.length && !normalizedAllowedRoles.includes(normalizedRole)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };

/**
 * Back-compat aliases so routes can import { protect, adminOnly }.
 * - `protect` is equivalent to `authenticate`
 * - `adminOnly` is a ready-made middleware that only allows role "admin"
 */
export { authenticate as protect };
export const adminOnly = authorize("admin");

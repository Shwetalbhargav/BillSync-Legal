import bcrypt from "bcryptjs";
import crypto from "crypto";
import { logger } from "../../../utils/logger.js";
import User from "../../users/models/User.js";
import { toSafeUser } from "../../users/utils/safeUser.js";
import {
  createWorkspaceOwnerAccount,
  normalizeMobile,
  switchUserWorkspace,
} from "../../workspace/services/workspaceMembershipService.js";
import {
  clearAuthCookie,
  getExtensionJwtExpiresIn,
  getDesktopHandoffJwtExpiresIn,
  setAuthCookie,
  signAuthToken,
  signDesktopHandoffToken,
  signDesktopToken,
  signExtensionToken,
  verifyDesktopHandoffToken,
} from "../services/authTokenService.js";

function isDuplicateUserError(err) {
  return err?.code === 11000 && (err?.keyPattern?.name || err?.keyPattern?.mobile);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function withPhase(phase, work) {
  try {
    return work();
  } catch (err) {
    if (!err.phase) err.phase = phase;
    throw err;
  }
}

async function findLoginCandidates(query) {
  if (typeof User.find === 'function') return User.find(query);
  const legacyQuery = {
    mobile: query.mobile,
    ...(query.role ? { role: query.role } : {}),
    ...(query.workspaceId ? { firmId: query.workspaceId } : {}),
  };
  const row = await User.findOne(legacyQuery);
  return row ? [row] : [];
}

// Login uses name + mobile + password + role + firm.
export const loginUser = async (req, res) => {
  const { name, mobile, password, role, firmId, workspaceId } = req.body;

  try {
    if (!name || !mobile || !password) {
      return res.status(400).json({ error: "Name, mobile and password are required" });
    }

    const normalizedMobile = normalizeMobile(mobile);
    const query = { mobile: normalizedMobile };
    if (workspaceId || firmId) query.workspaceId = workspaceId || firmId;
    if (role) query.role = String(role || "").toLowerCase();

    const candidates = await findLoginCandidates(query);
    const user = candidates.find((candidate) => normalizeName(candidate.name) === normalizeName(name));
    if (!user || normalizeName(user.name) !== normalizeName(name)) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = withPhase("auth_token.sign", () => signAuthToken(user));
    withPhase("auth_cookie.set", () => setAuthCookie(res, token));

    res.json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const logoutUser = (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
};

export const loginDesktopUser = async (req, res) => {
  const { name, mobile, password, role, firmId, workspaceId } = req.body;

  try {
    if (!name || !mobile || !password) {
      return res.status(400).json({ error: "Name, mobile and password are required" });
    }

    const normalizedMobile = normalizeMobile(mobile);
    const query = { mobile: normalizedMobile };
    if (workspaceId || firmId) query.workspaceId = workspaceId || firmId;
    if (role) query.role = String(role || "").toLowerCase();

    const candidates = await findLoginCandidates(query);
    const user = candidates.find((candidate) => normalizeName(candidate.name) === normalizeName(name));
    if (!user || normalizeName(user.name) !== normalizeName(name)) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = signDesktopToken(user);

    res.json({
      success: true,
      token,
      tokenType: "Bearer",
      user: toSafeUser(user),
      desktop: {
        purpose: "desktop_agent",
      },
    });
  } catch (err) {
    console.error("Desktop login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Stable "who am I" endpoint for frontend refresh/session bootstrap.
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ success: false, error: "Session user not found" });
    }

    res.json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error("Current user error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const switchWorkspace = async (req, res) => {
  try {
    const workspaceId = req.body?.workspaceId;
    if (!workspaceId) return res.status(400).json({ success: false, error: "workspaceId is required" });
    const { user, membership } = await switchUserWorkspace({ userId: req.user.id, workspaceId });
    const token = signAuthToken(user);
    setAuthCookie(res, token);
    res.json({ success: true, user: toSafeUser(user), membership });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message || "Could not switch workspace" });
  }
};

// Short-lived token for Chrome extension calls.
export const issueExtensionToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const token = signExtensionToken(user);
    res.json({
      success: true,
      token,
      tokenType: "Bearer",
      expiresIn: getExtensionJwtExpiresIn(),
      user: toSafeUser(user),
      extension: req.extensionContext || null,
    });
  } catch (err) {
    console.error("Extension token error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const issueDesktopHandoffToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const handoffToken = signDesktopHandoffToken(user);
    res.json({
      success: true,
      handoffToken,
      tokenType: "Bearer",
      expiresIn: getDesktopHandoffJwtExpiresIn(),
      user: toSafeUser(user),
      desktop: {
        purpose: "desktop_agent_handoff",
      },
    });
  } catch (err) {
    console.error("Desktop handoff token error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const loginDesktopWithHandoff = async (req, res) => {
  try {
    const { handoffToken } = req.body;
    if (!handoffToken) return res.status(400).json({ success: false, error: "handoffToken is required" });

    const decoded = verifyDesktopHandoffToken(handoffToken);
    if (decoded.purpose !== "desktop_agent_handoff") {
      return res.status(401).json({ success: false, error: "Invalid handoff token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const token = signDesktopToken(user);
    res.json({
      success: true,
      token,
      tokenType: "Bearer",
      user: toSafeUser(user),
      desktop: {
        purpose: "desktop_agent",
        source: "web_handoff",
      },
    });
  } catch (err) {
    console.error("Desktop handoff login error:", err);
    res.status(401).json({ success: false, error: "Invalid or expired handoff token" });
  }
};

// Solo registration creates a workspace and Owner membership.
export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, address, password, practiceName, workspaceName, planKey, qualifications } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ error: "Name, email, mobile and password are required" });
    }

    const { workspace, user, membership } = await createWorkspaceOwnerAccount({
      name,
      email,
      mobile,
      address,
      password,
      workspaceName: workspaceName || practiceName,
      planKey,
      qualifications,
    });

    const token = signAuthToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      user: toSafeUser(user),
      workspace,
      membership,
    });
  } catch (err) {
    if (isDuplicateUserError(err)) {
      return res.status(409).json({ error: "User already exists with this name or mobile" });
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    logger.error("auth.register_failed", {
      requestId: req.requestId,
      phase: err.phase,
      code: err.code,
      keyPattern: err.keyPattern,
      validationErrors: err.errors
        ? Object.fromEntries(Object.entries(err.errors).map(([field, error]) => [field, error.message]))
        : undefined,
      error: err,
    });
    res.status(500).json({
      error: "Server error",
      requestId: req.requestId,
      ...(process.env.NODE_ENV === "production" ? {} : {
        detail: err.message,
        phase: err.phase,
        code: err.code,
      }),
    });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const mobile = normalizeMobile(req.body?.mobile);
    const role = String(req.body?.role || "").toLowerCase();
    const firmId = req.body?.firmId;
    if (!mobile || !role || !firmId) {
      return res.status(400).json({ error: "mobile, role and firmId are required" });
    }

    const user = await User.findOne({ mobile, role, firmId });
    if (user) {
      const token = crypto.randomBytes(32).toString("base64url");
      user.passwordResetTokenHash = hashResetToken(token);
      user.passwordResetExpiresAt = new Date(Date.now() + Number(process.env.PASSWORD_RESET_TTL_MS || 30 * 60_000));
      user.passwordResetUsedAt = undefined;
      await user.save();
      if (process.env.NODE_ENV !== "production") {
        return res.json({ success: true, resetToken: token });
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Password reset request error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: "token and password are required" });

    const user = await User.findOne({
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
      passwordResetUsedAt: { $exists: false },
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetUsedAt = new Date();
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const revokeSessions = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } });
    clearAuthCookie(res);
    res.json({ success: true });
  } catch (err) {
    console.error("Session revoke error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

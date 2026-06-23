import bcrypt from "bcryptjs";
import crypto from "crypto";
import Firm from "../../firms/models/Firm.js";
import User from "../../users/models/User.js";
import { toSafeUser } from "../../users/utils/safeUser.js";
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

function normalizeMobile(value) {
  return String(value || "").replace(/\D/g, "");
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

async function resolveFirmId({ firmId, firmName }) {
  if (firmId) {
    const firmExists = await Firm.exists({ _id: firmId });
    if (!firmExists) {
      const error = new Error("Firm not found. Please choose an existing firm.");
      error.statusCode = 400;
      throw error;
    }
    return firmId;
  }

  const normalizedFirmName = String(firmName || "").trim();
  if (!normalizedFirmName) return undefined;

  const firm = await Firm.findOne({
    name: { $regex: `^${escapeRegExp(normalizedFirmName)}$`, $options: "i" },
  });

  if (!firm) {
    const error = new Error("Firm not found. Please enter an existing firm name.");
    error.statusCode = 400;
    throw error;
  }

  return firm._id;
}

// Login uses name + mobile + password + role + firm.
export const loginUser = async (req, res) => {
  const { name, mobile, password, role, firmId } = req.body;

  try {
    if (!name || !mobile || !password || !role || !firmId) {
      return res.status(400).json({ error: "Name, mobile, password, role and firm are required" });
    }

    const normalizedMobile = normalizeMobile(mobile);
    const normalizedRole = String(role || "").toLowerCase();
    const user = await User.findOne({ mobile: normalizedMobile, role: normalizedRole, firmId });
    if (!user || normalizeName(user.name) !== normalizeName(name)) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = signAuthToken(user);
    setAuthCookie(res, token);

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
  const { name, mobile, password, role, firmId } = req.body;

  try {
    if (!name || !mobile || !password || !role || !firmId) {
      return res.status(400).json({ error: "Name, mobile, password, role and firm are required" });
    }

    const normalizedMobile = normalizeMobile(mobile);
    const normalizedRole = String(role || "").toLowerCase();
    const user = await User.findOne({ mobile: normalizedMobile, role: normalizedRole, firmId });
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

// Register all fields needed by the User schema and shared profile fields.
export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, address, role, password, firmId, firmName, qualifications } = req.body;

    if (!name || !mobile || !password || !role) {
      return res.status(400).json({ error: "Name, mobile, password and role are required" });
    }

    const existing = await User.findOne({
      $or: [
        { name },
        { mobile },
      ],
    });
    if (existing) return res.status(409).json({ error: "User already exists with this name or mobile" });

    const resolvedFirmId = await resolveFirmId({ firmId, firmName });
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      mobile,
      address,
      role,
      firmId: resolvedFirmId,
      passwordHash,
      qualifications,
    });

    res.status(201).json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (err) {
    if (isDuplicateUserError(err)) {
      return res.status(409).json({ error: "User already exists with this name or mobile" });
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
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

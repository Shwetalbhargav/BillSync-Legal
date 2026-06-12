import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appRoutes, fallbackRoutes } from "../src/routes/routeConfig.js";
import { fallbackStateCatalog } from "../src/constants/fallbackStates.js";
import { canAccess } from "../src/constants/permissions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const bannedCopy = /\b(API|backend|payload|token|401|CORS|endpoint|database|stack trace|server exception)\b/;
const userFacingDirs = ["src/pages", "src/components", "src/constants"];
const roleWords = {
  Admin: "admin",
  Partner: "partner",
  Lawyer: "lawyer",
  Associate: "associate",
  Intern: "intern",
};

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return fullPath;
  });
}

function findDuplicatePaths(routes) {
  const seen = new Set();
  const duplicates = new Set();
  routes.forEach((route) => {
    if (seen.has(route.path)) duplicates.add(route.path);
    seen.add(route.path);
  });
  return [...duplicates];
}

function expectedRoles(roleGroup = "") {
  if (/All roles|All legal roles/i.test(roleGroup)) {
    return ["admin", "partner", "lawyer", "associate", "intern"];
  }
  return Object.entries(roleWords)
    .filter(([word]) => roleGroup.includes(word))
    .map(([, role]) => role);
}

function scanUserFacingCopy() {
  const matches = [];
  userFacingDirs.forEach((relativeDir) => {
    const fullDir = path.join(root, relativeDir);
    walk(fullDir)
      .filter((file) => /\.(js|jsx)$/.test(file))
      .forEach((file) => {
        const text = fs.readFileSync(file, "utf8");
        text.split(/\r?\n/).forEach((line, index) => {
          if (bannedCopy.test(line)) {
            matches.push(`${path.relative(root, file)}:${index + 1}`);
          }
        });
      });
  });
  return matches;
}

const allRoutes = [...appRoutes, ...fallbackRoutes];
const duplicates = findDuplicatePaths(allRoutes);
const fallbackPaths = new Set(fallbackRoutes.map((route) => route.path));
const fallbackCatalogPaths = new Set(fallbackStateCatalog.map((state) => state.path));
const missingFallbackCatalog = fallbackRoutes.filter((route) => !fallbackCatalogPaths.has(route.path)).map((route) => route.path);
const missingFallbackRoute = fallbackStateCatalog.filter((state) => !fallbackPaths.has(state.path)).map((state) => state.path);
const missingMetadata = appRoutes.filter((route) => !route.path || !route.title || !route.module || !route.moduleKey || !route.roleGroup);
const accessMismatches = appRoutes.flatMap((route) =>
  expectedRoles(route.roleGroup)
    .filter((role) => !canAccess(role, route.moduleKey))
    .map((role) => `${role} cannot access ${route.path} (${route.moduleKey})`),
);
const copyMatches = scanUserFacingCopy();

assert(appRoutes.length >= 75, `Expected at least 75 app routes, found ${appRoutes.length}.`);
assert(fallbackRoutes.length === 24, `Expected 24 fallback routes, found ${fallbackRoutes.length}.`);
assert(fallbackStateCatalog.length === 24, `Expected 24 fallback catalog entries, found ${fallbackStateCatalog.length}.`);
assert(duplicates.length === 0, `Duplicate route paths: ${duplicates.join(", ")}`);
assert(missingFallbackCatalog.length === 0, `Fallback routes missing catalog entries: ${missingFallbackCatalog.join(", ")}`);
assert(missingFallbackRoute.length === 0, `Fallback catalog entries missing routes: ${missingFallbackRoute.join(", ")}`);
assert(missingMetadata.length === 0, `Routes missing metadata: ${missingMetadata.map((route) => route.path).join(", ")}`);
assert(accessMismatches.length === 0, `Role access mismatches: ${accessMismatches.join("; ")}`);
assert(copyMatches.length === 0, `Technical copy found in user-facing source: ${copyMatches.join(", ")}`);

const summary = {
  appRoutes: appRoutes.length,
  fallbackRoutes: fallbackRoutes.length,
  fallbackStates: fallbackStateCatalog.length,
  modules: [...new Set(appRoutes.map((route) => route.module))].sort(),
  checks: {
    duplicatePaths: duplicates.length,
    routeMetadataGaps: missingMetadata.length,
    roleAccessMismatches: accessMismatches.length,
    technicalCopyMatches: copyMatches.length,
  },
};

if (failures.length) {
  console.error("BillSync demo smoke checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log("BillSync demo smoke checks passed.");
console.log(JSON.stringify(summary, null, 2));

import { roleLabels, roles } from "../../constants/roles";

export function RoleSwitcherForTesting({ role, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="hidden sm:inline">View as</span>
      <select
        className="focus-ring rounded-lg border border-border bg-panel px-3 py-2 text-sm font-semibold text-primary"
        value={role}
        onChange={(event) => onChange(event.target.value)}
      >
        {roles.map((item) => (
          <option key={item} value={item}>
            {roleLabels[item]}
          </option>
        ))}
      </select>
    </label>
  );
}

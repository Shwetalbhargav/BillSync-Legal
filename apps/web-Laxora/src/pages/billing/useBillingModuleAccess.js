import { useAuth } from "../../auth/AuthProvider";

const invoiceWriteFallbackPermissions = ["billing.write"];
const paymentWriteFallbackPermissions = ["finance.write", "billing.write"];
const financeReadFallbackPermissions = ["finance.read", "billing.write"];

function hasPermission(permissions, key, fallbackKeys = []) {
  return permissions.includes(key) || fallbackKeys.some((fallbackKey) => permissions.includes(fallbackKey));
}

export function useBillingModuleAccess(moduleKey = "billing") {
  const { moduleNavigation } = useAuth();
  const module = moduleNavigation.modules.find((item) => item.key === moduleKey);
  const permissions = moduleNavigation.permissions?.permissions || [];
  const dynamicReady = moduleNavigation.status === "ready";
  const unavailable = dynamicReady && module && ["hidden", "disabled"].includes(module.state);
  const readOnly = dynamicReady && Boolean(module?.readOnly || module?.state === "read_only");
  const canViewInvoices = !dynamicReady || hasPermission(permissions, "invoice.view", moduleKey === "finance" ? financeReadFallbackPermissions : ["finance.read"]);
  const canCreateInvoices = !dynamicReady || (!readOnly && hasPermission(permissions, "invoice.create", invoiceWriteFallbackPermissions));
  const canSendInvoices = !dynamicReady || (!readOnly && hasPermission(permissions, "invoice.send", invoiceWriteFallbackPermissions));
  const canRecordPayments = !dynamicReady || (!readOnly && hasPermission(permissions, "payment.record", paymentWriteFallbackPermissions));

  return {
    status: moduleNavigation.status,
    unavailable,
    readOnly,
    canViewInvoices,
    canCreateInvoices,
    canSendInvoices,
    canRecordPayments,
    message: unavailable
      ? module?.reason || (moduleKey === "finance" ? "Finance tools are not available for this workspace." : "Billing is not available for this workspace.")
      : readOnly
        ? module?.reason || (moduleKey === "finance" ? "Finance tools are available for review, but changes are paused for this workspace." : "Billing is available for review, but changes are paused for this workspace.")
        : "",
  };
}

const TECHNICIAN_ROLES = new Set(["mechanic", "technician", "blacksmith", "lagermand"]);
const LEADER_ROLES = new Set(["leader", "admin"]);

const isCompanyAdmin = (auth) => Boolean(auth?.isCompanyAdmin);
const isAdmin = (auth) => isCompanyAdmin(auth) || auth?.roles?.includes("admin");
const isLeader = (auth) => isAdmin(auth) || auth?.roles?.some((r) => LEADER_ROLES.has(r));
const isTechnician = (auth) =>
  isAdmin(auth) ||
  auth?.roles?.some((r) => TECHNICIAN_ROLES.has(r)) ||
  auth?.permissions?.includes("time:create");

const TECHNICIAN_EDITABLE_STATUSES = new Set(["draft", "active", "correction_requested", "submitted"]);

module.exports = {
  TECHNICIAN_ROLES,
  LEADER_ROLES,
  TECHNICIAN_EDITABLE_STATUSES,
  isCompanyAdmin,
  isAdmin,
  isLeader,
  isTechnician,
};

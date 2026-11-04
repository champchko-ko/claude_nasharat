export function canReopenTicket(roles: {
  isReporter: boolean;
  canClose: boolean;
  canAssign: boolean;
}): boolean {
  return roles.isReporter || roles.canClose || roles.canAssign;
}

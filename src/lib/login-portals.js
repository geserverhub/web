/** NextAuth credentials portals (`portal` field on signIn). */
export const NEXTAUTH_PORTAL_ROLES = {
  admin: ['ADMIN', 'SUPER_ADMIN'],
  partner: ['PARTNER', 'ADMIN', 'SUPER_ADMIN'],
  /** MCT product back office (/login → /mct-product) */
  client: ['CLIENT', 'ADMIN', 'SUPER_ADMIN'],
};

/** `/api/user/login` targets keyed by pageName prefix. */
export const USER_LOGIN_TARGETS = [
  {
    match: (page) =>
      page === '/energy-dashboard' ||
      page.startsWith('/energy-dashboard/') ||
      page === '/energy-dashboard-login',
    roles: ['CLIENT', 'ADMIN', 'SUPER_ADMIN', 'PARTNER'],
    portalKey: 'energy',
    deniedMessage: 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบ Energy Dashboard',
  },
  {
    match: (page) =>
      page === '/online-classroom' ||
      page.startsWith('/online-classroom/') ||
      page === '/online-classroom-login',
    roles: ['CLIENT', 'ADMIN', 'SUPER_ADMIN', 'PARTNER'],
    portalKey: 'classroom',
    deniedMessage: 'บัญชีนี้ไม่มีสิทธิ์เข้าห้องเรียนออนไลน์',
  },
  {
    match: (page) =>
      page === '/ge-energy-erp' ||
      page.startsWith('/ge-energy-erp/') ||
      page === '/ge-energy-erp-login',
    roles: ['CLIENT', 'ADMIN', 'SUPER_ADMIN', 'PARTNER'],
    portalKey: 'erp',
    deniedMessage: 'บัญชีนี้ไม่มีสิทธิ์เข้าระบบ ERP',
  },
  {
    match: (page) => page === '/ge-energy-tech/login' || page.startsWith('/ge-energy-tech/login'),
    roles: ['CLIENT', 'ADMIN', 'SUPER_ADMIN', 'PARTNER'],
    portalKey: 'geet_login',
    deniedMessage: 'บัญชีนี้ไม่มีสิทธิ์เข้า GE Energy Tech Login',
  },
  {
    match: (page) =>
      page === '/momoge-product' ||
      page.startsWith('/momoge-product/') ||
      page === '/customer-momoge-login',
    roles: ['CLIENT', 'ADMIN', 'SUPER_ADMIN', 'PARTNER'],
    portalKey: 'customer',
    deniedMessage: 'บัญชีนี้ไม่มีสิทธิ์เข้า Momoge Customer Portal',
  },
  {
    match: (page) =>
      page === '/customer-dashboard' ||
      page.startsWith('/customer-dashboard/') ||
      page === '/customer-dashboard-login',
    roles: ['CLIENT', 'ADMIN', 'SUPER_ADMIN', 'PARTNER'],
    portalKey: 'customer',
    deniedMessage: 'บัญชีนี้ไม่มีสิทธิ์เข้า Customer Dashboard',
  },
];

const DEFAULT_USER_LOGIN = {
  roles: ['CLIENT', 'ADMIN', 'SUPER_ADMIN'],
  portalKey: 'client',
  deniedMessage: 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงพอร์ทัลลูกค้า',
};

export function resolveUserLoginTarget(pageName) {
  const page = String(pageName || '').trim();
  return USER_LOGIN_TARGETS.find((t) => t.match(page)) || DEFAULT_USER_LOGIN;
}

export function isRoleAllowedForNextAuthPortal(portal, role) {
  const key = String(portal || '').trim();
  if (!key) return true;
  const allowed = NEXTAUTH_PORTAL_ROLES[key];
  if (!allowed) return true;
  return allowed.includes(role);
}

export function isRoleAllowedForUserLogin(pageName, role) {
  const target = resolveUserLoginTarget(pageName);
  return target.roles.includes(role);
}

export function userLoginPortalKey(pageName) {
  return resolveUserLoginTarget(pageName).portalKey;
}

export function userLoginDeniedMessage(pageName) {
  return resolveUserLoginTarget(pageName).deniedMessage;
}

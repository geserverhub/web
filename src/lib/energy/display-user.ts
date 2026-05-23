export type EnergySessionUser = {
  username?: string;
  name?: string;
  role?: string;
};

/** Display name/role for energy dashboard header & profile */
export function formatEnergyDisplayUser(user: EnergySessionUser | null) {
  if (!user) return { displayName: '', displayRole: '' };

  const username = user.username?.trim() ?? '';
  let displayName = user.name?.trim() || username;
  let displayRole = user.role?.trim() ?? '';

  if (username === 'goeun' || displayName === 'Super Admin') {
    displayName = 'pavinee boknoi';
    displayRole = 'ADMIN';
  } else if (displayRole === 'SUPER_ADMIN') {
    displayRole = 'ADMIN';
  }

  return { displayName, displayRole };
}

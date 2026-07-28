import { ALL_PERMISSIONS, type Permission } from '@/constants/permissions';
import { ROLE_PERMISSIONS, ROLES } from '@/constants/roles';
import { RoleModel } from '@/models/Role';
import type { UserDocument } from '@/models/User';

/**
 * The permission set a signed-in user actually holds: the role's default
 * grant, overridden per-restaurant by an editable `Role` document if one
 * exists, then layered with the user's own grants/revokes.
 *
 * Super Admin is platform-wide and always holds everything — a restaurant's
 * `Role` override cannot be used to weaken the one account that must always
 * be able to fix a misconfigured tenant.
 */
export async function resolveEffectivePermissions(user: UserDocument): Promise<Permission[]> {
  if (user.role === ROLES.SUPER_ADMIN) return ALL_PERMISSIONS;

  let base: Permission[] = [...ROLE_PERMISSIONS[user.role]];

  if (user.restaurantId) {
    const override = await RoleModel.findOne({
      restaurantId: user.restaurantId,
      role: user.role,
    }).lean();
    if (override) base = override.permissions as Permission[];
  }

  const granted = user.permissionOverrides?.granted ?? [];
  const revoked = new Set(user.permissionOverrides?.revoked ?? []);

  const merged = new Set<Permission>([...base, ...granted]);
  for (const permission of revoked) merged.delete(permission);

  return [...merged];
}

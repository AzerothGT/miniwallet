import { CategoryBadge, RoleBadge, StatusBadge } from './Badges.jsx'

export default {
  title: 'Admin/Badges',
}

/**
 * Every badge states its meaning in words. Colour is a second signal, never the
 * only one — a greyed-out row is easy to miss and impossible to interpret for
 * anyone who cannot see the difference.
 */
export const All = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <RoleBadge role="user" label="Pengguna" />
      <RoleBadge role="admin" label="Super Administrator" />
      <StatusBadge suspended={false} />
      <StatusBadge suspended />
      <CategoryBadge category="auth" label="Autentikasi" />
      <CategoryBadge category="wallet" label="Wallet" />
      <CategoryBadge category="admin" label="Administrasi" />
    </div>
  ),
}

export const Roles = {
  render: () => (
    <div className="flex items-center gap-2">
      <RoleBadge role="user" />
      <RoleBadge role="admin" />
    </div>
  ),
}

export const Statuses = {
  render: () => (
    <div className="flex items-center gap-2">
      <StatusBadge suspended={false} />
      <StatusBadge suspended />
    </div>
  ),
}

/** Which area of the system an audit entry belongs to. */
export const Categories = {
  render: () => (
    <div className="flex items-center gap-2">
      <CategoryBadge category="auth" label="Autentikasi" />
      <CategoryBadge category="wallet" label="Wallet" />
      <CategoryBadge category="admin" label="Administrasi" />
    </div>
  ),
}

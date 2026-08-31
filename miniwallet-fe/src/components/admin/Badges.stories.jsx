import { RoleBadge, StatusBadge } from './Badges.jsx'

export default {
  title: 'Admin/Badges',
}

/**
 * Both badges state their meaning in words. Colour is a second signal, never the
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

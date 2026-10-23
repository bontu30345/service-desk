import type { SafeUserListItem } from "../types/user";
import Link from "next/link";
import { UserStatusAction } from "./user-status-action";
import { UserDeleteAction } from "./user-delete-action";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import {
  emptyState,
  linkInline,
  statusBadgeActive,
  statusBadgeInactive,
  tableBody,
  tableCell,
  tableCellMuted,
  tableCellStrong,
  tableElement,
  tableHead,
  tableHeadCell,
  tableRow,
  tableShell,
} from "@/components/ui/ui-classes";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export function UsersTable({
  users,
  hasFilters = false,
}: {
  users: SafeUserListItem[];
  hasFilters?: boolean;
}) {
  if (users.length === 0) {
    return (
      <div className={`space-y-3 ${emptyState}`}>
        <p>
          {hasFilters
            ? "No users match your current filters."
            : "No users found."}
        </p>
        {hasFilters && (
          <Link href="/users" className={`inline-block text-sm ${linkInline}`}>
            Clear filters
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={tableShell}>
      <table className={tableElement}>
        <thead className={tableHead}>
          <tr>
            <th scope="col" className={tableHeadCell}>Photo</th>
            <th scope="col" className={tableHeadCell}>Name</th>
            <th scope="col" className={tableHeadCell}>Email</th>
            <th scope="col" className={tableHeadCell}>Role</th>
            <th scope="col" className={tableHeadCell}>Department</th>
            <th scope="col" className={tableHeadCell}>Status</th>
            <th scope="col" className={tableHeadCell}>Created</th>
            <th scope="col" className={tableHeadCell}>Actions</th>
          </tr>
        </thead>
        <tbody className={tableBody}>
          {users.map((user) => (
            <tr key={user.id} className={tableRow}>
              <td className={tableCell}>
                <ProfileAvatar
                  userId={user.id}
                  name={user.name}
                  version={user.updatedAt.getTime()}
                  hasPhoto={user.hasProfilePhoto}
                  size="small"
                />
              </td>
              <td className={`${tableCell} ${tableCellStrong}`}>
                {user.name}
              </td>
              <td className={`${tableCell} ${tableCellMuted}`}>
                {user.email}
              </td>
              <td className={`${tableCell} ${tableCellMuted}`}>
                {user.role}
              </td>
              <td className={`${tableCell} ${tableCellMuted}`}>
                {user.department?.name ?? "—"}
              </td>
              <td className={tableCell}>
                <span className={user.isActive ? statusBadgeActive : statusBadgeInactive}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className={`${tableCell} ${tableCellMuted}`}>
                {formatDate(user.createdAt)}
              </td>
              <td className={tableCell}>
                <RowActionsMenu label={user.name}>
                  <Link href={`/users/${user.id}/edit`}>Edit</Link>
                  <UserStatusAction userId={user.id} isActive={user.isActive} />
                  <UserDeleteAction userId={user.id} name={user.name} />
                </RowActionsMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

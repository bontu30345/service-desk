import type { Department } from "../types/department";
import Link from "next/link";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { DepartmentDeleteAction } from "./department-delete-action";
import {
  emptyState,
  linkInline,
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

export function DepartmentsTable({
  departments,
  hasSearch = false,
}: {
  departments: Department[];
  hasSearch?: boolean;
}) {
  if (departments.length === 0) {
    return hasSearch ? (
      <div className={`space-y-3 ${emptyState}`}>
        <p>No departments match your search.</p>
        <Link href="/departments" className={`inline-block text-sm ${linkInline}`}>
          Clear search
        </Link>
      </div>
    ) : (
      <p className={emptyState}>No departments found.</p>
    );
  }

  return (
    <div className={tableShell}>
      <table className={tableElement}>
        <thead className={tableHead}>
          <tr>
            <th scope="col" className={tableHeadCell}>
              Department Name
            </th>
            <th scope="col" className={tableHeadCell}>
              Created
            </th>
            <th scope="col" className={tableHeadCell}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className={tableBody}>
          {departments.map((department) => (
            <tr key={department.id} className={tableRow}>
              <td className={`${tableCell} ${tableCellStrong}`}>
                {department.name}
              </td>
              <td className={`${tableCell} ${tableCellMuted}`}>
                {formatDate(department.createdAt)}
              </td>
              <td className={tableCell}>
                <RowActionsMenu label={department.name}>
                  <Link href={`/departments/${department.id}/edit`}>Edit</Link>
                  <DepartmentDeleteAction
                    departmentId={department.id}
                    name={department.name}
                  />
                </RowActionsMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

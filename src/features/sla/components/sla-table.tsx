import Link from "next/link";
import type { SafeSLA } from "../types/sla";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import {
  emptyState,
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

const statusLabels = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  BREACHED: "Breached",
  COMPLETED: "Completed",
} as const;

export function SLATable({ policies }: { policies: SafeSLA[] }) {
  if (policies.length === 0) {
    return (
      <p className={emptyState}>
        No SLA policies found. Create a policy to define response and resolution targets.
      </p>
    );
  }

  return (
    <div className={tableShell}>
      <table className={tableElement}>
        <thead className={tableHead}>
          <tr>
            <th scope="col" className={tableHeadCell}>Policy</th>
            <th scope="col" className={tableHeadCell}>Response (minutes)</th>
            <th scope="col" className={tableHeadCell}>Resolution (minutes)</th>
            <th scope="col" className={tableHeadCell}>Status</th>
            <th scope="col" className={tableHeadCell}>Actions</th>
          </tr>
        </thead>
        <tbody className={tableBody}>
          {policies.map((policy) => (
            <tr key={policy.id} className={tableRow}>
              <td className={`max-w-md ${tableCell}`}>
                <p className={tableCellStrong}>{policy.name}</p>
                <p className={`mt-1 ${tableCellMuted}`}>
                  {policy.description || "—"}
                </p>
              </td>
              <td className={`${tableCell} ${tableCellMuted}`}>
                {policy.responseTimeMinutes} {policy.responseTimeMinutes === 1 ? "min" : "mins"}
              </td>
              <td className={`${tableCell} ${tableCellMuted}`}>
                {policy.resolutionTimeMinutes} {policy.resolutionTimeMinutes === 1 ? "min" : "mins"}
              </td>
              <td className={`${tableCell} ${tableCellMuted}`}>
                {statusLabels[policy.status]}
              </td>
              <td className={tableCell}>
                <RowActionsMenu label={policy.name}>
                  <Link href={`/sla/${policy.id}/edit`}>Edit</Link>
                </RowActionsMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import Link from "next/link";
import { CategoryDeleteAction } from "./category-delete-action";
import type { Category } from "../types/category";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
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

export function CategoriesTable({
  categories,
  hasSearch,
  hasCategories,
}: {
  categories: Category[];
  hasSearch: boolean;
  hasCategories: boolean;
}) {
  if (categories.length === 0) {
    if (hasSearch && hasCategories) {
      return (
        <div className={emptyState}>
          <p>No categories match your search.</p>
          <Link href="/categories" className={`mt-3 inline-block text-sm ${linkInline}`}>
            Clear search
          </Link>
        </div>
      );
    }

    return <p className={emptyState}>No categories found.</p>;
  }

  return (
    <div className={tableShell}>
      <table className={tableElement}>
        <thead className={tableHead}>
          <tr>
            <th scope="col" className={tableHeadCell}>
              Category
            </th>
            <th scope="col" className={tableHeadCell}>
              Description
            </th>
            <th scope="col" className={tableHeadCell}>
              Created
            </th>
            <th scope="col" className={tableHeadCell}>
              Updated
            </th>
            <th scope="col" className={tableHeadCell}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className={tableBody}>
          {categories.map((category) => (
            <tr key={category.id} className={tableRow}>
              <td className={`${tableCell} ${tableCellStrong}`}>
                {category.name}
              </td>
              <td className={`max-w-sm ${tableCell} ${tableCellMuted}`}>
                {category.description || "—"}
              </td>
              <td className={`${tableCell} ${tableCellMuted}`}>
                {formatDate(category.createdAt)}
              </td>
              <td className={`${tableCell} ${tableCellMuted}`}>
                {formatDate(category.updatedAt)}
              </td>
              <td className={tableCell}>
                <RowActionsMenu label={category.name}>
                  <Link href={`/categories/${category.id}/edit`}>Edit</Link>
                  <CategoryDeleteAction
                    categoryId={category.id}
                    name={category.name}
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

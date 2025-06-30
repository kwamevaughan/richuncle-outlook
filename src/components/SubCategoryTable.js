import { useTable } from "../hooks/useTable";
import { Icon } from "@iconify/react";
import CategoryDragDrop from "./CategoryDragDrop";
import CategoryInlineEdit from "./CategoryInlineEdit";
import Image from "next/image";

export function SubCategoryTable({ data, categories, onEdit, onDelete, onReorder, onInlineEdit }) {
  const table = useTable(data);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={table.paged.length > 0 && table.paged.every((row) => table.selected.includes(row.id))}
          onChange={table.selectAll}
        />
        <span className="text-xs">Select All</span>
        {table.selected.length > 0 && (
          <span className="ml-2 text-xs text-blue-600">{table.selected.length} selected</span>
        )}
        {table.selected.length > 0 && (
          <button className="ml-4 px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 text-xs">
            <Icon icon="mdi:delete" className="inline w-4 h-4 mr-1" /> Delete Selected
          </button>
        )}
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="px-2 py-2"></th>
            <th className="px-4 py-2">
              <input
                type="checkbox"
                checked={table.paged.length > 0 && table.paged.every((row) => table.selected.includes(row.id))}
                onChange={table.selectAll}
              />
            </th>
            <th className="px-4 py-2 text-left cursor-pointer" onClick={() => table.handleSort("name")}>Name {table.sortKey === "name" && (table.sortDir === "asc" ? "▲" : "▼")}</th>
            <th className="px-4 py-2 text-left cursor-pointer" onClick={() => table.handleSort("category_name")}>Category</th>
            <th className="px-4 py-2 text-left cursor-pointer" onClick={() => table.handleSort("description")}>Description</th>
            <th className="px-4 py-2 text-left cursor-pointer" onClick={() => table.handleSort("is_active")}>Status</th>
            <th className="px-4 py-2 text-left">Image</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <CategoryDragDrop
          items={table.paged}
          onReorder={(paged, fromIdx, toIdx) => onReorder(paged, fromIdx, toIdx, table.page, table.pageSize)}
        >
          {(sub) => [
            <td key="select" className="px-4 py-2">
              <input
                type="checkbox"
                checked={table.selected.includes(sub.id)}
                onChange={() => table.toggleSelect(sub.id)}
              />
            </td>,
            <td key="name" className="px-4 py-2 font-semibold">
              <CategoryInlineEdit value={sub.name} onSave={(val) => onInlineEdit(sub.id, "name", val)} />
            </td>,
            <td key="cat" className="px-4 py-2">
              {categories.find((c) => c.id === sub.category_id)?.name || "-"}
            </td>,
            <td key="desc" className="px-4 py-2">
              <CategoryInlineEdit value={sub.description} onSave={(val) => onInlineEdit(sub.id, "description", val)} type="textarea" />
            </td>,
            <td key="status" className="px-4 py-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${sub.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>{sub.is_active ? "Active" : "Inactive"}</span>
            </td>,
            <td key="img" className="px-4 py-2">
              <Image src={sub.image_url} alt={sub.name} className="w-10 h-10 rounded object-cover border dark:border-gray-700" />
            </td>,
            <td key="actions" className="px-4 py-2 flex gap-2">
              <button className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900" onClick={() => onEdit(sub)}>
                <Icon icon="mdi:pencil" className="w-5 h-5 text-blue-600" />
              </button>
              <button className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900" onClick={() => onDelete(sub)}>
                <Icon icon="mdi:delete" className="w-5 h-5 text-red-500" />
              </button>
            </td>
          ]}
        </CategoryDragDrop>
      </table>
      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-xs">Rows per page:</span>
          <select
            className="border rounded px-2 py-1 text-xs dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            value={table.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 rounded disabled:opacity-50"
            onClick={() => table.handlePage(Math.max(1, table.page - 1))}
            disabled={table.page === 1}
          >
            <Icon icon="mdi:chevron-left" className="w-4 h-4" />
          </button>
          <span className="text-xs">
            Page {table.page} of {table.totalPages}
          </span>
          <button
            className="px-2 py-1 rounded disabled:opacity-50"
            onClick={() => table.handlePage(Math.min(table.totalPages, table.page + 1))}
            disabled={table.page === table.totalPages}
          >
            <Icon icon="mdi:chevron-right" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 
import { useTable } from "../hooks/useTable";
import { Icon } from "@iconify/react";
import CategoryDragDrop from "./CategoryDragDrop";
import CategoryInlineEdit from "./CategoryInlineEdit";
import Image from "next/image";

export function CategoryTable({ data, onEdit, onDelete, onReorder, onInlineEdit }) {
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
            <th className="px-4 py-2 text-left">Color</th>
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
          {(cat) => [
            <td key="select" className="px-4 py-2">
              <input
                type="checkbox"
                checked={table.selected.includes(cat.id)}
                onChange={() => table.toggleSelect(cat.id)}
              />
            </td>,
            <td key="name" className="px-4 py-2 font-semibold">
              <CategoryInlineEdit value={cat.name} onSave={(val) => onInlineEdit(cat.id, "name", val)} />
            </td>,
            <td key="color" className="px-4 py-2">
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded-full border border-gray-300 align-middle"
                  style={{ backgroundColor: cat.color || "#e5e7eb" }}
                  title={cat.color}
                ></span>
                <span className="text-xs text-gray-500">{cat.color}</span>
              </span>
            </td>,
            <td key="desc" className="px-4 py-2">
              <CategoryInlineEdit value={cat.description} onSave={(val) => onInlineEdit(cat.id, "description", val)} type="textarea" />
            </td>,
            <td key="status" className="px-4 py-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${cat.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>{cat.is_active ? "Active" : "Inactive"}</span>
            </td>,
            <td key="img" className="px-4 py-2">
              <Image src={cat.image_url} alt={cat.name} className="w-10 h-10 rounded object-cover border dark:border-gray-700" />
            </td>,
            <td key="actions" className="px-4 py-2 flex gap-2">
              <button className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900" onClick={() => onEdit(cat)}>
                <Icon icon="mdi:pencil" className="w-5 h-5 text-blue-600" />
              </button>
              <button className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900" onClick={() => onDelete(cat)}>
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
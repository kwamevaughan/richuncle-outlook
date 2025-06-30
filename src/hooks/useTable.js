import { useState, useEffect } from "react";

export function useTable(data, defaultSort = "sort_order") {
  const [sortKey, setSortKey] = useState(defaultSort);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selected, setSelected] = useState([]);

  // Sorting
  const sorted = [...data].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const total = sorted.length;
  const totalPages = Math.ceil(total / pageSize);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Selection
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const selectAll = () => {
    if (paged.every((row) => selected.includes(row.id))) {
      setSelected((prev) => prev.filter((id) => !paged.some((row) => row.id === id)));
    } else {
      setSelected((prev) => [
        ...prev,
        ...paged.filter((row) => !prev.includes(row.id)).map((row) => row.id),
      ]);
    }
  };

  // Sorting handler
  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Pagination handler
  const handlePage = (newPage) => {
    setPage(newPage);
  };

  // Always reset to sort_order after drag-and-drop
  useEffect(() => {
    setSortKey(defaultSort);
    setSortDir("asc");
  }, [data]);

  return {
    paged,
    total,
    totalPages,
    page,
    pageSize,
    setPageSize,
    handlePage,
    sortKey,
    sortDir,
    handleSort,
    selected,
    toggleSelect,
    selectAll,
    setSelected,
    sorted,
    setSorted: () => {},
  };
} 
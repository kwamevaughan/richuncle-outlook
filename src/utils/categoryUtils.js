export function reorderFullList(fullList, pagedList, fromIdx, toIdx, page, pageSize) {
  // Find the global indices
  const globalFrom = (page - 1) * pageSize + fromIdx;
  const globalTo = (page - 1) * pageSize + toIdx;
  console.log('reorderFullList:', { globalFrom, globalTo, fromIdx, toIdx, page, pageSize });
  console.log('Before reorder:', fullList.map(c => c.id));
  const newList = [...fullList];
  const [moved] = newList.splice(globalFrom, 1);
  newList.splice(globalTo, 0, moved);
  console.log('After reorder:', newList.map(c => c.id));
  return newList;
} 
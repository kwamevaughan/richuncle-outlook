import { useRef } from "react";
import { Icon } from "@iconify/react";

export default function CategoryDragDrop({ items, onReorder, children }) {
  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (index) => {
    dragItem.current = index;
  };
  const handleDragEnter = (index) => {
    dragOverItem.current = index;
  };
  const handleDragEnd = () => {
    const listCopy = [...items];
    const dragged = listCopy.splice(dragItem.current, 1)[0];
    listCopy.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null;
    dragOverItem.current = null;
    onReorder(listCopy);
  };

  return (
    <tbody>
      {items.map((item, idx) => (
        <tr
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragEnter={() => handleDragEnter(idx)}
          onDragEnd={handleDragEnd}
          className="hover:bg-blue-50 dark:hover:bg-gray-800 cursor-move group"
        >
          <td className="px-2 py-2 text-center align-middle">
            <Icon icon="mdi:drag" className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
          </td>
          {children(item, idx)}
        </tr>
      ))}
    </tbody>
  );
} 
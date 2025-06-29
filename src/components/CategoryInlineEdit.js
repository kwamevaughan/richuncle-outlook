import { useState, useRef } from "react";
import { Icon } from "@iconify/react";

export default function CategoryInlineEdit({ value, onSave, type = "text", className = "" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef();

  const handleSave = () => {
    setEditing(false);
    if (val !== value) onSave(val);
  };

  return editing ? (
    type === "textarea" ? (
      <textarea
        ref={inputRef}
        className={`border rounded px-2 py-1 w-full text-sm ${className}`}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => e.key === "Enter" && handleSave()}
        autoFocus
      />
    ) : (
      <input
        ref={inputRef}
        className={`border rounded px-2 py-1 w-full text-sm ${className}`}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => e.key === "Enter" && handleSave()}
        autoFocus
      />
    )
  ) : (
    <span
      className={`inline-flex items-center gap-1 cursor-pointer group ${className}`}
      onDoubleClick={() => setEditing(true)}
    >
      {value}
      <Icon
        icon="mdi:pencil"
        className="w-4 h-4 text-gray-400 group-hover:text-blue-500"
        onClick={() => setEditing(true)}
      />
    </span>
  );
} 
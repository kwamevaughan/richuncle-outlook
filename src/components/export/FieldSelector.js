import { Icon } from "@iconify/react";
import { Draggable, Droppable } from "@hello-pangea/dnd";

export default function FieldSelector({
                                          fieldsOrder,
                                          selectedFields,
                                          handleFieldToggle,
                                          mode,
                                      }) {
    return (
        <Droppable droppableId="fieldSelector">
            {(provided, snapshot) => (
                <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-2 gap-4"
                >
                    {fieldsOrder.map((field, index) => (
                        <Draggable key={field.key} draggableId={field.key} index={index}>
                            {(provided, snapshot) => (
                                <label
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`flex items-center gap-2 animate-fade-in p-2 rounded-lg cursor-move ${
                                        mode === "dark"
                                            ? "bg-gray-700 text-white border-gray-600"
                                            : "text-gray-900 border-gray-200"
                                    } ${
                                        snapshot.isDragging
                                            ? "shadow-lg border-2 border-[#f05d23]"
                                            : "border"
                                    }`}
                                    style={{
                                        ...provided.draggableProps.style,
                                        transform: snapshot.isDragging
                                            ? `${provided.draggableProps.style?.transform || ""} translate(0px, 0px)`
                                            : "none",
                                        position: snapshot.isDragging ? "relative" : "static",
                                        top: 0,
                                        left: 0,
                                    }}
                                >
                                    <Icon
                                        icon="mdi:drag"
                                        className={`w-4 h-4 ${
                                            mode === "dark" ? "text-blue-400" : "text-blue-600"
                                        }`}
                                    />
                                    <input
                                        type="checkbox"
                                        checked={selectedFields[field.key]}
                                        onChange={() => handleFieldToggle(field.key)}
                                        className={`h-4 w-4 text-blue-600 border rounded focus:ring-blue-600 focus:ring-2 ${
                                            mode === "dark"
                                                ? "border-gray-500 bg-gray-700 checked:bg-blue-600 checked:border-blue-600"
                                                : "border-gray-300 bg-white checked:bg-blue-600 checked:border-blue-600"
                                        }`}
                                    />
                                    <Icon
                                        icon={field.icon}
                                        className={`w-4 h-4 ${
                                            mode === "dark" ? "text-blue-400" : "text-blue-600"
                                        }`}
                                    />
                                    <span
                                        className={`text-sm ${
                                            mode === "dark"
                                                ? "text-white"
                                                : "text-gray-900"
                                        }`}
                                    >
                                        {field.label}
                                    </span>
                                </label>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
}
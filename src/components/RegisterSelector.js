import { useState, useEffect } from "react";

const RegisterSelector = ({ mode, user, onRegisterChange, selectedRegister }) => {
  const [registers, setRegisters] = useState([]);

  // Fetch registers on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/registers");
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          let filtered = data.data;
          if (user?.role === "cashier" && user?.store_id) {
            filtered = data.data.filter((r) => r.store_id === user.store_id);
          }
          setRegisters(filtered);
          // Auto-select the first register if none selected
          if (filtered.length > 0 && !selectedRegister) {
            onRegisterChange(filtered[0].id);
          }
        }
      } catch (err) {
        setRegisters([]);
      }
    })();
  }, [user, selectedRegister, onRegisterChange]);

  const handleRegisterChange = async (e) => {
    const registerId = e.target.value;
    const selectedRegisterData = registers.find((r) => r.id === registerId);
    
    onRegisterChange(registerId);

    // Show toast notification
    const { toast } = await import("react-hot-toast");
    toast.success(
      `Cash Register switched to: ${
        selectedRegisterData?.name || `Register ${registerId}`
      }`
    );
  };

  return (
    <select
      className={`border rounded px-2 py-1 text-xs sm:text-sm flex-shrink-0 ${
        mode === "dark"
          ? "bg-gray-800 text-white border-gray-700"
          : "bg-white text-gray-900 border-gray-300"
      }`}
      value={selectedRegister || ""}
      onChange={handleRegisterChange}
      style={{ minWidth: "200px", maxWidth: "250px" }}
      disabled={user?.role === "cashier"}
    >
      {registers.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name || `Register ${r.id}`}
        </option>
      ))}
    </select>
  );
};

export default RegisterSelector;
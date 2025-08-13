import { useState, useEffect } from "react";

const RegisterSelector = ({ mode, user, onRegisterChange, setSelectedRegister, selectedRegister, disabled = false, registers: passedRegisters }) => {
  const [registers, setRegisters] = useState([]);

  // Use passed registers or fetch registers on mount
  useEffect(() => {
    if (passedRegisters && passedRegisters.length > 0) {
      // Use passed registers (from CashRegisterModal)
      setRegisters(passedRegisters);
      // Auto-select the first register if none selected
      if (passedRegisters.length > 0 && !selectedRegister) {
        const changeHandler = onRegisterChange || setSelectedRegister;
        if (changeHandler) changeHandler(passedRegisters[0].id);
      }
    } else {
      // Fetch registers (for posHeader usage)
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
              const changeHandler = onRegisterChange || setSelectedRegister;
              if (changeHandler) changeHandler(filtered[0].id);
            }
          }
        } catch (err) {
          setRegisters([]);
        }
      })();
    }
  }, [user, selectedRegister, onRegisterChange, setSelectedRegister, passedRegisters]);

  const handleRegisterChange = async (e) => {
    const registerId = e.target.value;
    const selectedRegisterData = registers.find((r) => r.id === registerId);
    
    const changeHandler = onRegisterChange || setSelectedRegister;
    if (changeHandler) changeHandler(registerId);

    // Show toast notification
    const { toast } = await import("react-hot-toast");
    toast.success(
      `Cash Register switched to: ${
        selectedRegisterData?.name || `Register ${registerId}`
      }`
    );
  };

  const isDisabled = disabled || user?.role === "cashier";
  
  return (
    <div className="flex flex-col gap-1">
      <select
        className={`border rounded px-2 py-1 text-xs sm:text-sm flex-shrink-0 ${
          isDisabled
            ? mode === "dark"
              ? "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
              : "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed"
            : mode === "dark"
            ? "bg-gray-800 text-white border-gray-700"
            : "bg-white text-gray-900 border-gray-300"
        }`}
        value={selectedRegister || ""}
        onChange={handleRegisterChange}
        style={{ minWidth: "200px", maxWidth: "250px" }}
        disabled={isDisabled}
      >
        {registers.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name || `Register ${r.id}`}
          </option>
        ))}
      </select>
      {user?.role === "cashier" && (
        <span className={`text-xs ${
          mode === "dark" ? "text-gray-400" : "text-gray-500"
        }`}>
          Assigned to your store register
        </span>
      )}
    </div>
  );
};

export default RegisterSelector;
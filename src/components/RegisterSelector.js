const RegisterSelector = ({ registers, selectedRegister, setSelectedRegister, disabled }) => {
  return (
    <div className="mb-2">
      <label className="block text-sm font-semibold mb-1">Register</label>
      <select
        className="border rounded px-3 py-2 w-full"
        value={selectedRegister || ""}
        onChange={(e) => setSelectedRegister(e.target.value)}
        disabled={disabled}
      >
        {registers.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name || `Register ${r.id}`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RegisterSelector; 
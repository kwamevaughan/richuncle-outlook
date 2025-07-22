import { useState, useEffect } from "react";

const AddRegisterForm = ({ onRegisterAdded }) => {
  const [name, setName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/stores");
        const result = await response.json();
        if (result.success) {
          setStores(result.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch stores:", err);
      }
    })();
  }, []);

  const handleAdd = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/registers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, store_id: storeId }),
      });
      const result = await response.json();
      if (result.success) {
        setName("");
        setStoreId("");
        if (onRegisterAdded) onRegisterAdded();
        alert("Register added!");
      } else {
        throw new Error(result.error || "Failed to add register");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 flex gap-2 items-end">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Register Name"
        className="border rounded px-3 py-2"
      />
      <select
        value={storeId}
        onChange={(e) => setStoreId(e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="">Select Store</option>
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleAdd}
        disabled={loading || !name || !storeId}
        className="bg-blue-700 text-white rounded px-4 py-2 font-semibold"
      >
        {loading ? "Adding..." : "Add Register"}
      </button>
    </div>
  );
};

export default AddRegisterForm; 
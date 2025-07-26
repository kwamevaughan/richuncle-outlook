import { useState, useEffect, useRef } from "react";
import CategoryImageUpload from "./CategoryImageUpload";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';
import Barcode from 'react-barcode';

export function AddEditModal({ type, mode = "light", item, categories = [], onClose, onSave }) {
  const [localCategories, setLocalCategories] = useState([]);
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [code, setCode] = useState(type === "categories" ? (item?.code || "") : "");
  const [symbol, setSymbol] = useState(type === "units" ? (item?.symbol || "") : "");
  const [address, setAddress] = useState((type === "stores" || type === "customers") ? (item?.address || "") : "");
  const [phone, setPhone] = useState((type === "stores" || type === "customers") ? (item?.phone || "") : "");
  const [email, setEmail] = useState((type === "stores" || type === "customers") ? (item?.email || "") : "");
  const [values, setValues] = useState(item?.values ? (Array.isArray(item.values) ? item.values : item.values.split(',').map(v => v.trim()).filter(Boolean)) : []);
  const [valueInput, setValueInput] = useState("");
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  // Track selected category for subcategories
  const [categoryId, setCategoryId] = useState(item?.category_id || (categories[0]?.id ?? ""));
  const [contactPerson, setContactPerson] = useState(type === "warehouses" ? (item?.contact_person || "") : "");
  const [warehouseEmail, setWarehouseEmail] = useState(type === "warehouses" ? (item?.email || "") : "");
  const [warehouseAddress, setWarehouseAddress] = useState(type === "warehouses" ? (item?.address || "") : "");
  const [usersList, setUsersList] = useState([]);
  const [value, setValue] = useState(item?.value || "");
  const [planId, setPlanId] = useState(item?.plan_id || (categories[0]?.id ?? ""));
  const [dateRange, setDateRange] = useState(() => {
    if (type === 'discounts' && item?.validity && item.validity.includes('to')) {
      const [start, end] = item.validity.split('to').map(s => s.trim());
      return [{ startDate: new Date(start), endDate: new Date(end), key: 'selection' }];
    }
    return [{ startDate: new Date(), endDate: new Date(), key: 'selection' }];
  });
  const [validity, setValidity] = useState(item?.validity || "");
  // --- PRODUCTS MODAL STATE ---
  const [storeId, setStoreId] = useState(item?.store_id || "");
  const [warehouseId, setWarehouseId] = useState(item?.warehouse_id || "");
  const [productName, setProductName] = useState(item?.name || "");
  const [quantity, setQuantity] = useState(item?.quantity || "");
  const [price, setPrice] = useState(item?.price || "");
  const [costPrice, setCostPrice] = useState(item?.cost_price || "");
  const [taxType, setTaxType] = useState(item?.tax_type || "exclusive");
  const [taxPercentage, setTaxPercentage] = useState(item?.tax_percentage || "");
  const [chargeTax, setChargeTax] = useState(
    item?.tax_percentage > 0 || item?.tax_type ? true : false
  );
  const [sku, setSku] = useState(item?.sku || "");
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
  const [subcategoryId, setSubcategoryId] = useState(item?.subcategory_id || "");
  const [brandId, setBrandId] = useState(item?.brand_id || "");
  const [unitId, setUnitId] = useState(item?.unit_id || "");
  const [barcode, setBarcode] = useState(item?.barcode || "");
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [variantAttributes, setVariantAttributes] = useState([]);
  const [selectedVariantAttributes, setSelectedVariantAttributes] = useState(item?.variant_attributes || {});
  const [sellingType, setSellingType] = useState(() => {
    let val = item?.selling_type;
    if (Array.isArray(val) && val.length === 1 && typeof val[0] === "string" && val[0].startsWith("[")) {
      try {
        val = JSON.parse(val[0]);
      } catch {}
    }
    if (typeof val === "string" && val.startsWith("[")) {
      try {
        val = JSON.parse(val);
      } catch {}
    }
    if (Array.isArray(val)) {
      return val;
    }
    if (typeof val === "string" && val) {
      return [val];
    }
    return [];
  });

  // --- EXPENSES MODAL STATE ---
  const [expenseTitle, setExpenseTitle] = useState(item?.title || "");
  const [expenseAmount, setExpenseAmount] = useState(item?.amount || "");
  const [expenseDate, setExpenseDate] = useState(item?.expense_date || new Date().toISOString().split('T')[0]);
  const [expenseCategoryId, setExpenseCategoryId] = useState(item?.expense_category_id || "");
  const [paymentMethod, setPaymentMethod] = useState(item?.payment_method || "cash");
  const [expenseStatus, setExpenseStatus] = useState(item?.status || "paid");
  const [expenseDescription, setExpenseDescription] = useState(item?.description || "");
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Helper to generate a code suggestion
  function suggestCategoryCode(name, existingCodes) {
    if (!name) return "";
    const words = name.trim().split(/\s+/);
    let base = "";
    if (words.length === 1) {
      base = words[0].substring(0, 5).toUpperCase();
    } else {
      base = words.map(w => w[0].toUpperCase()).join("").substring(0, 5);
    }
    let suggestion = base;
    let suffix = 1;
    const codesSet = new Set(existingCodes.map(c => c.toUpperCase()));
    while (codesSet.has(suggestion)) {
      suggestion = base + suffix;
      suffix++;
    }
    return suggestion;
  }

  // Suggest a code from name if user hasn't manually edited code and type is categories
  useEffect(() => {
    if (type === "categories" && !item && !codeManuallyEdited) {
      const existingCodes = categories.map(cat => cat.code || "");
      const suggested = suggestCategoryCode(name, existingCodes);
      setCode(suggested);
    }
    // eslint-disable-next-line
  }, [name, type, item, categories, codeManuallyEdited]);

  useEffect(() => {
    if (type === "warehouses") {
      fetch('/api/users')
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            setUsersList(result.data || []);
          }
        })
        .catch(err => {
          console.error("Failed to fetch users:", err);
        });
    }
  }, [type]);

  // Update fields when editing a customer or store and item changes
  useEffect(() => {
    if ((type === "stores" || type === "customers") && item) {
      setAddress(item.address || "");
      setPhone(item.phone || "");
      setEmail(item.email || "");
    }
  }, [item, type]);

  useEffect(() => {
    if (type === 'discounts') {
      setValidity(
        `${format(dateRange[0].startDate, 'yyyy-MM-dd')} to ${format(dateRange[0].endDate, 'yyyy-MM-dd')}`
      );
    }
    // eslint-disable-next-line
  }, [dateRange, type]);

  useEffect(() => {
    if (type === "products") {
      // Fetch all dropdown data
      Promise.all([
        fetch('/api/stores'),
        fetch('/api/warehouses'),
        fetch('/api/categories'),
        fetch('/api/subcategories'),
        fetch('/api/brands'),
        fetch('/api/units'),
        fetch('/api/variant-attributes')
      ])
      .then(responses => Promise.all(responses.map(r => r.json())))
      .then(results => {
        if (results[0].success) setStores(results[0].data || []);
        if (results[1].success) setWarehouses(results[1].data || []);
        if (results[2].success) setLocalCategories(results[2].data || []);
        if (results[3].success) setSubcategories(results[3].data || []);
        if (results[4].success) setBrands(results[4].data || []);
        if (results[5].success) setUnits(results[5].data || []);
        if (results[6].success) setVariantAttributes(results[6].data || []);
      })
      .catch(err => {
        console.error("Failed to fetch dropdown data:", err);
      });
    } else if (type === "expenses") {
      // Fetch expense categories
      fetch('/api/expense-categories')
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            setExpenseCategories(result.data || []);
          }
        })
        .catch(err => {
          console.error("Failed to fetch expense categories:", err);
        });
    }
  }, [type]);

  // Auto-generate SKU from product name if not manually edited
  useEffect(() => {
    if (type === "products" && !skuManuallyEdited && productName) {
      const base = productName.trim().toUpperCase().replace(/\s+/g, "-").substring(0, 10);
      setSku(base + "-" + Math.floor(1000 + Math.random() * 9000));
    }
    // Auto-generate barcode if not present and not editing an item
    if (type === "products" && !item && productName && !barcode) {
      setBarcode('BC' + Math.floor(100000000 + Math.random() * 900000000));
    }
  }, [productName, type, skuManuallyEdited]);

  // Handle Add New Category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      const result = await response.json();
      if (result.success) {
        setLocalCategories((prev) => [...prev, result.data]);
        setCategoryId(result.data.id);
        setShowAddCategory(false);
        setNewCategoryName("");
      }
    } catch (err) {
      console.error("Failed to add category:", err);
    }
    setLoading(false);
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value.toUpperCase());
    setCodeManuallyEdited(true);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (codeManuallyEdited && e.target.value === "") {
      setCodeManuallyEdited(false);
    }
  };

  const handleValueInputKeyDown = (e) => {
    if ((e.key === "," || e.key === "Enter") && valueInput.trim()) {
      e.preventDefault();
      if (!values.includes(valueInput.trim())) {
        setValues([...values, valueInput.trim()]);
      }
      setValueInput("");
    }
  };

  const handleRemoveValue = (val) => {
    setValues(values.filter((v) => v !== val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (type === "discounts") {
      if (!name.trim()) {
        setError("Name is required");
        return;
      }
      if (!value) {
        setError("Value is required");
        return;
      }
      if (!planId) {
        setError("Discount Plan is required");
        return;
      }
      if (!validity) {
        setError("Validity is required");
        return;
      }
    } else if (type === "plans") {
      if (!name.trim()) {
        setError("Plan Name is required");
        return;
      }
    } else if (type === "variant_attributes") {
      if (!name.trim()) {
        setError("Variant is required");
        return;
      }
      if (!values.length) {
        setError("At least one value is required");
        return;
      }
    } else if (type === "units") {
      if (!name.trim()) {
        setError("Unit is required");
        return;
      }
      if (!symbol.trim()) {
        setError("Symbol is required");
        return;
      }
    } else if (type === "stores") {
      if (!name.trim()) {
        setError("Store Name is required");
        return;
      }
      if (!address.trim()) {
        setError("Address is required");
        return;
      }
      if (!phone.trim()) {
        setError("Phone is required");
        return;
      }
      if (!email.trim()) {
        setError("Email is required");
        return;
      }
    } else if (type === "warehouses") {
      if (!name.trim()) {
        setError("Warehouse is required");
        return;
      }
      if (!contactPerson.trim()) {
        setError("Contact Person is required");
        return;
      }
      if (!phone.trim()) {
        setError("Phone is required");
        return;
      }
      if (!warehouseEmail.trim()) {
        setError("Email is required");
        return;
      }
      if (!warehouseAddress.trim()) {
        setError("Address is required");
        return;
      }
    } else if (type === "customers") {
      if (!name.trim()) {
        setError("Name is required");
        return;
      }
      if (!phone.trim()) {
        setError("Phone is required");
        return;
      }
    } else if (type === "products") {
      if (!storeId) {
        setError("Store is required");
        return;
      }
      if (!warehouseId) {
        setError("Warehouse is required");
        return;
      }
      if (!productName.trim()) {
        setError("Product Name is required");
        return;
      }
      if (!quantity.trim()) {
        setError("Quantity is required");
        return;
      }
      if (!price.trim()) {
        setError("Price is required");
        return;
      }
      if (!costPrice || costPrice.toString().trim() === "") {
        setError("Cost Price is required");
        return;
      }
      if (chargeTax) {
        if (!taxPercentage || taxPercentage.toString().trim() === "") {
          setError("Tax Percentage is required");
          return;
        }
        if (isNaN(Number(taxPercentage)) || Number(taxPercentage) < 0 || Number(taxPercentage) > 100) {
          setError("Tax Percentage must be a number between 0 and 100");
          return;
        }
      }
      if (!sku.trim()) {
        setError("SKU is required");
        return;
      }
      if (!categoryId) {
        setError("Category is required");
        return;
      }
      if (!unitId) {
        setError("Unit is required");
        return;
      }
    } else if (type === "expenses") {
      if (!expenseTitle.trim()) {
        setError("Title is required");
        return;
      }
      if (!expenseAmount || expenseAmount.toString().trim() === "") {
        setError("Amount is required");
        return;
      }
      if (!expenseDate) {
        setError("Date is required");
        return;
      }
      if (isNaN(Number(expenseAmount)) || Number(expenseAmount) <= 0) {
        setError("Amount must be a positive number");
        return;
      }
    } else if (type === "expense-categories") {
      if (!name.trim()) {
        setError("Name is required");
        return;
      }
    } else {
      if (!name.trim()) {
        setError("Name is required");
        return;
      }
    }
    setLoading(true);
    try {
      if (type === "discounts") {
        await onSave({
          name: name.trim(),
          value: value,
          plan_id: planId,
          validity: validity,
          is_active: isActive,
        });
      } else if (type === "plans") {
        await onSave({
          name: name.trim(),
          is_active: isActive,
        });
      } else if (type === "variant_attributes") {
        await onSave({
          name: name.trim(),
          values: values.join(","),
          is_active: isActive,
        });
      } else if (type === "units") {
        await onSave({
          name: name.trim(),
          symbol: symbol.trim(),
          is_active: isActive,
        });
      } else if (type === "stores") {
        await onSave({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          is_active: isActive,
        });
      } else if (type === "warehouses") {
        await onSave({
          name: name.trim(),
          contact_person: contactPerson.trim(),
          phone: phone.trim(),
          email: warehouseEmail.trim(),
          address: warehouseAddress.trim(),
          is_active: isActive,
        });
      } else if (type === "customers") {
        await onSave({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          is_active: isActive,
        });
      } else if (type === "products") {
        // Clean numeric fields: send as numbers or null, never ""
        const cleanedProduct = {
          name: productName.trim(),
          quantity: quantity === "" ? null : Number(quantity),
          price: price === "" ? null : Number(price),
          cost_price: costPrice === "" ? null : Number(costPrice),
          tax_type: chargeTax ? taxType : null,
          tax_percentage: chargeTax ? (taxPercentage === "" ? null : Number(taxPercentage)) : null,
          sku: sku.trim(),
          store_id: storeId || null,
          warehouse_id: warehouseId || null,
          category_id: categoryId || null,
          subcategory_id: subcategoryId || null,
          brand_id: brandId || null,
          unit_id: unitId || null,
          barcode: barcode.trim(),
          image_url: imageUrl,
          variant_attributes: Object.keys(selectedVariantAttributes).length > 0 ? selectedVariantAttributes : null,
          is_active: isActive,
        };
        await onSave(cleanedProduct);
      } else if (type === "expenses") {
        await onSave({
          title: expenseTitle.trim(),
          amount: expenseAmount.toString(),
          expense_date: expenseDate,
          expense_category_id: expenseCategoryId || null,
          payment_method: paymentMethod,
          status: expenseStatus,
          description: expenseDescription.trim(),
        });
      } else if (type === "expense-categories") {
        await onSave({
          name: name.trim(),
          description: description.trim(),
        });
      } else {
        await onSave({
          name: name.trim(),
          ...(type === "categories" ? { code: code.trim() } : {}),
          ...(type === "subcategories" ? { category_id: categoryId } : {}),
          image_url: imageUrl,
          is_active: isActive,
          ...(type === "variant_attributes" ? { values: values.join(",") } : {}),
          ...(type === "units" ? { symbol: symbol.trim() } : {}),
          ...(type === "stores" ? { 
            address: address.trim(),
            phone: phone.trim(),
            email: email.trim()
          } : {}),
          ...(type === "warehouses" ? {
            contact_person: contactPerson.trim(),
            phone: phone.trim(),
            email: warehouseEmail.trim(),
            address: warehouseAddress.trim(),
          } : {}),
          ...(type === "customers" ? {
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
          } : {}),
          ...(type !== "units" && type !== "stores" && type !== "warehouses" && type !== "customers" ? { description: description.trim() } : {}),
        });
      }
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get entity label for modal title
  const typeLabel = {
    categories: "Category",
    subcategories: "Sub Category",
    brands: "Brand",
    units: "Unit",
    stores: "Store",
    warehouses: "Warehouse",
    customers: "Customer",
    discounts: "Discount",
    plans: "Discount Plan",
    products: "Product",
    expenses: "Expense",
    "expense-categories": "Expense Category",
  }[type] || "Item";

  // Custom modal title for discounts
  const modalTitle = type === "discounts"
    ? `${item ? "Edit" : "Add"} Discount`
    : `${item ? "Edit" : "Add New"} ${typeLabel}`;

  return (
    <>
      <SimpleModal
        isOpen={true}
        onClose={onClose}
        title={modalTitle}
        mode={mode}
        width="max-w-4xl"
      >
        <form onSubmit={handleSubmit}>
          {type === "discounts" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Name<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="Discount name"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Value<span className="text-red-500">*</span></label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  disabled={loading}
                  placeholder="Discount value (e.g. 10, 20)"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Discount Plan<span className="text-red-500">*</span></label>
                <select
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={planId}
                  onChange={e => setPlanId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a plan</option>
                  {localCategories.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Validity<span className="text-red-500">*</span></label>
                <DateRange
                  editableDateInputs={true}
                  onChange={item => setDateRange([item.selection])}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                  rangeColors={["#2563eb"]}
                  disabled={loading}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {`Selected: ${format(dateRange[0].startDate, 'yyyy-MM-dd')} to ${format(dateRange[0].endDate, 'yyyy-MM-dd')}`}
                </div>
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  disabled={loading}
                />
                <span className="text-sm">Active</span>
              </div>
            </>
          ) : type === "plans" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Plan Name<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="Plan name"
                />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  disabled={loading}
                />
                <span className="text-sm">Active</span>
              </div>
            </>
          ) : type === "variant_attributes" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Variant<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Color, Size, Material"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Values<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={valueInput}
                  onChange={e => setValueInput(e.target.value)}
                  onKeyDown={handleValueInputKeyDown}
                  disabled={loading}
                  placeholder="Type a value and press comma or Enter"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {values.map((val, idx) => (
                    <span key={val + idx} className="inline-flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                      {val}
                      <button
                        type="button"
                        className="ml-1 text-blue-500 hover:text-red-500 focus:outline-none"
                        onClick={() => handleRemoveValue(val)}
                        tabIndex={-1}
                        aria-label={`Remove ${val}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-1">Enter value separated by comma</div>
              </div>
            </>
          ) : type === "units" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Unit<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Kilogram, Meter, Liter"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Symbol<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. kg, m, L"
                />
              </div>
            </>
          ) : type === "stores" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Store Name<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Main Store, Downtown Branch"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Address<span className="text-red-500">*</span></label>
                <textarea
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  disabled={loading}
                  placeholder="Enter store address"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Phone<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. +1-555-123-4567"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Email<span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. store@example.com"
                />
              </div>
            </>
          ) : type === "customers" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Name<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Email</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Phone<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. +1-555-123-4567"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Address</label>
                <textarea
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  disabled={loading}
                  placeholder="Enter address"
                  rows={2}
                />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  id="customer-is-active"
                  type="checkbox"
                  className="form-checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  disabled={loading}
                />
                <label htmlFor="customer-is-active" className="text-sm cursor-pointer select-none">Active</label>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Profile Picture</label>
                <CategoryImageUpload value={imageUrl} onChange={setImageUrl} folder="ProfilePictures" userName={name} referralCode={email} />
              </div>
            </>
          ) : type === "warehouses" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Warehouse<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Main Warehouse, Central Depot"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Contact Person<span className="text-red-500">*</span></label>
                <select
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a user</option>
                  {usersList.map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name || user.id}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Phone<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. +1-555-123-4567"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Email<span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={warehouseEmail}
                  onChange={e => setWarehouseEmail(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. warehouse@example.com"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Address<span className="text-red-500">*</span></label>
                <textarea
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={warehouseAddress}
                  onChange={e => setWarehouseAddress(e.target.value)}
                  disabled={loading}
                  placeholder="Enter warehouse address"
                  rows={3}
                />
              </div>
            </>
          ) : type === "products" ? (
            <>
              <div className="mb-6">
                <label className="block mb-1 font-medium">Product Name<span className="text-red-500">*</span></label>
                <input className="w-full border rounded px-3 py-2" value={productName} onChange={e => { setProductName(e.target.value); if (!skuManuallyEdited) setSku(""); }} disabled={loading} placeholder="Product name" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">Store<span className="text-red-500">*</span></label>
                  <select className="w-full border rounded px-3 py-2" value={storeId} onChange={e => setStoreId(e.target.value)} disabled={loading}>
                    <option value="">Select a store</option>
                    {stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Warehouse<span className="text-red-500">*</span></label>
                  <select className="w-full border rounded px-3 py-2" value={warehouseId} onChange={e => setWarehouseId(e.target.value)} disabled={loading}>
                    <option value="">Select a warehouse</option>
                    {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">Quantity<span className="text-red-500">*</span></label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={loading} placeholder="Quantity" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Unit</label>
                  <select className="w-full border rounded px-3 py-2" value={unitId} onChange={e => setUnitId(e.target.value)} disabled={loading}>
                    <option value="">Select a unit</option>
                    {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">Selling Price (in GHS)<span className="text-red-500">*</span></label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={price} onChange={e => setPrice(e.target.value)} disabled={loading} placeholder="Price" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Cost Price (in GHS)<span className="text-red-500">*</span></label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={costPrice} onChange={e => setCostPrice(e.target.value)} disabled={loading} placeholder="Cost Price" />
                </div>
              </div>
              {/* Charge Tax Toggle */}
              <div className="mb-6 flex items-center gap-3">
                <span className="font-medium">Charge Tax?</span>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${chargeTax ? 'bg-blue-600' : 'bg-gray-300'}`}
                  onClick={() => setChargeTax(v => !v)}
                  aria-pressed={chargeTax}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${chargeTax ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </button>
                <span className="text-sm text-gray-500">{chargeTax ? 'Yes' : 'No'}</span>
              </div>
              {/* Tax fields, only if chargeTax is true */}
              {chargeTax && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block mb-1 font-medium">Tax Type<span className="text-red-500">*</span></label>
                    <select className="w-full border rounded px-3 py-2" value={taxType} onChange={e => setTaxType(e.target.value)} disabled={loading}>
                      <option value="exclusive">Exclusive (Tax added on top)</option>
                      <option value="inclusive">Inclusive (Tax included in price)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Tax Percentage (%)<span className="text-red-500">*</span></label>
                    <input type="number" min="0" max="100" step="0.01" className="w-full border rounded px-3 py-2" value={taxPercentage} onChange={e => setTaxPercentage(e.target.value)} disabled={loading} placeholder="0.00" />
                    <div className="text-xs text-gray-500 mt-1">
                      {taxType === 'exclusive' 
                        ? 'Tax will be added on top of the selling price (e.g., GHS 100 + 15% = GHS 115)' 
                        : 'Tax is included in the selling price (e.g., GHS 115 includes 15% tax = GHS 100 + GHS 15)'}
                    </div>
                    {price && taxPercentage && Number(taxPercentage) > 0 && (
                      <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                        <div className="font-medium text-blue-800 mb-1">
                          Tax Calculation for "{productName || 'Product'}":
                        </div>
                        {taxType === 'exclusive' ? (
                          <div className="text-blue-700">
                            <div>Price: GHS {Number(price).toFixed(2)}</div>
                            <div>Tax ({taxPercentage}%): GHS {(Number(price) * Number(taxPercentage) / 100).toFixed(2)}</div>
                            <div className="font-medium">Total: GHS {(Number(price) * (1 + Number(taxPercentage) / 100)).toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-blue-700">
                            <div>Total Price: GHS {Number(price).toFixed(2)}</div>
                            <div>Price without tax: GHS {(Number(price) / (1 + Number(taxPercentage) / 100)).toFixed(2)}</div>
                            <div className="font-medium">Tax included: GHS {(Number(price) - (Number(price) / (1 + Number(taxPercentage) / 100))).toFixed(2)}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">SKU</label>
                  <input className="w-full border rounded px-3 py-2" value={sku} onChange={e => setSku(e.target.value)} disabled={loading} placeholder="SKU" />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Barcode</label>
                  <input className="w-full border rounded px-3 py-2" value={barcode} onChange={e => setBarcode(e.target.value)} disabled={loading} placeholder="Barcode" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">Category<span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select className="w-full border rounded px-3 py-2" value={categoryId} onChange={e => setCategoryId(e.target.value)} disabled={loading}>
                      <option value="">Select a category</option>
                      {localCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <button type="button" className="w-40 px-2 py-1 bg-blue-500 text-white rounded" onClick={() => setShowAddCategory(true)} disabled={loading}>Add New</button>
                  </div>
                  {showAddCategory && (
                    <div className="mt-2 flex gap-2">
                      <input className="w-full border rounded px-3 py-2" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New category name" />
                      <button type="button" className="px-2 py-1 bg-green-500 text-white rounded" onClick={handleAddCategory} disabled={loading}>Save</button>
                      <button type="button" className="px-2 py-1 bg-gray-300 text-black rounded" onClick={() => setShowAddCategory(false)} disabled={loading}>Cancel</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block mb-1 font-medium">Sub Category</label>
                  <select className="w-full border rounded px-3 py-2" value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)} disabled={loading || !categoryId}>
                    <option value="">Select a subcategory</option>
                    {subcategories.filter(sc => sc.category_id === categoryId).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">Brand</label>
                  <select className="w-full border rounded px-3 py-2" value={brandId} onChange={e => setBrandId(e.target.value)} disabled={loading}>
                    <option value="">Select a brand</option>
                    {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                </div>
              </div>
              {/* Variant Attributes Section */}
              {variantAttributes.length > 0 && (
                <div className="mb-6">
                  <label className="block mb-2 font-medium">Variant Attributes (Optional)</label>
                  <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    {variantAttributes.map((attr) => (
                      <div key={attr.id} className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {attr.name}
                          </label>
                          <select
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={selectedVariantAttributes[attr.id] || ""}
                            onChange={(e) => setSelectedVariantAttributes(prev => ({
                              ...prev,
                              [attr.id]: e.target.value
                            }))}
                            disabled={loading}
                          >
                            <option value="">Select {attr.name}</option>
                            {attr.values && attr.values.split(',').map((value, index) => (
                              <option key={index} value={value.trim()}>
                                {value.trim()}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Select variant attributes to create product variations (e.g., Size, Color, etc.)
                  </p>
                </div>
              )}
              <div className="mb-6">
                <label className="block mb-1 font-medium">Item Barcode</label>
                <div className="flex gap-2">
                  <input className="w-full border rounded px-3 py-2" value={barcode} onChange={e => setBarcode(e.target.value)} disabled={loading} placeholder="Barcode" />
                </div>
              </div>
              {barcode && (
                <div className="mt-2 flex justify-center">
                  <Barcode value={barcode} height={60} width={2} displayValue={false} />
                </div>
              )}
              <div className="mb-6">
                <label className="block mb-1 font-medium">Image</label>
                <CategoryImageUpload value={imageUrl} onChange={setImageUrl} folder="ProductImages" userName={productName} referralCode={sku} />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input type="checkbox" className="form-checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} disabled={loading} />
                <span className="text-sm">Active</span>
              </div>
              {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white" disabled={loading}>Save</button>
              </div>
            </>
          ) : type === "expenses" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Title<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={expenseTitle}
                  onChange={e => setExpenseTitle(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. Office Supplies, Rent Payment"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1 font-medium">Amount (GHS)<span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    disabled={loading}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Date<span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1 font-medium">Category</label>
                  <select
                    className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    value={expenseCategoryId}
                    onChange={e => setExpenseCategoryId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select a category</option>
                    {expenseCategories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Payment Method<span className="text-red-500">*</span></label>
                  <select
                    className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    disabled={loading}
                  >
                    <option value="cash">Cash</option>
                    <option value="momo">Mobile Money</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Status<span className="text-red-500">*</span></label>
                <select
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={expenseStatus}
                  onChange={e => setExpenseStatus(e.target.value)}
                  disabled={loading}
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={expenseDescription}
                  onChange={e => setExpenseDescription(e.target.value)}
                  disabled={loading}
                  placeholder="Enter expense description"
                  rows={3}
                />
              </div>
              {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2" disabled={loading}>
                  {loading && <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />} Save
                </button>
              </div>
            </>
          ) : type === "expense-categories" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Name<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Office Supplies, Rent, Utilities"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={loading}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
              {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2" disabled={loading}>
                  {loading && <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />} Save
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Name</label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                />
              </div>
            </>
          )}
          {type === "categories" && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Category Code</label>
              <input
                className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                value={code}
                onChange={handleCodeChange}
                disabled={loading}
                maxLength={10}
                placeholder="e.g. TSHIR, FS, DJ, ACC"
              />
              <div className="text-xs text-gray-400 mt-1">Short, unique code for this category (e.g. TSHIR, FS, DJ, ACC)</div>
            </div>
          )}
          {type === "categories" && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Description</label>
              <textarea
                className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={loading}
                placeholder="Enter category description"
                rows={2}
              />
            </div>
          )}
          {type === "categories" && (
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                disabled={loading}
              />
              <span className="text-sm">Active</span>
            </div>
          )}
          {type === "subcategories" && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Category</label>
              <select
                className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                disabled={loading}
              >
                {localCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
          {type !== "variant_attributes" && type !== "units" && type !== "stores" && type !== "warehouses" && type !== "customers" && type !== "discounts" && type !== "plans" && type !== "products" && type !== "expenses" && type !== "expense-categories" && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Image</label>
              <CategoryImageUpload value={imageUrl} onChange={setImageUrl} />
            </div>
          )}
          {type !== "products" && type !== "expenses" && type !== "expense-categories" && (
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2" disabled={loading}>
                {loading && <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />} Save
              </button>
            </div>
          )}
        </form>
      </SimpleModal>
    </>
  );
} 
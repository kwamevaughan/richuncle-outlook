import { useState, useEffect, useRef } from "react";
import CategoryImageUpload from "./CategoryImageUpload";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import Barcode from "react-barcode";
import toast from "react-hot-toast";

export function AddEditModal({
  type,
  mode = "light",
  item,
  categories = [],
  onClose,
  onSave,
}) {
  const [localCategories, setLocalCategories] = useState([]);
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [code, setCode] = useState(
    type === "categories" ? item?.code || "" : ""
  );
  const [symbol, setSymbol] = useState(
    type === "units" ? item?.symbol || "" : ""
  );
  const [address, setAddress] = useState(
    type === "stores" || type === "customers" ? item?.address || "" : ""
  );
  const [phone, setPhone] = useState(
    type === "stores" || type === "customers" ? item?.phone || "" : ""
  );
  const [email, setEmail] = useState(
    type === "stores" || type === "customers" ? item?.email || "" : ""
  );
  const [values, setValues] = useState(
    item?.values
      ? Array.isArray(item.values)
        ? item.values
        : item.values
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
      : []
  );
  const [valueInput, setValueInput] = useState("");
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  // Track selected category for subcategories
  const [categoryId, setCategoryId] = useState(
    item?.category_id || (categories[0]?.id ?? "")
  );
  const [contactPerson, setContactPerson] = useState(
    type === "warehouses" ? item?.contact_person || "" : ""
  );
  const [warehouseEmail, setWarehouseEmail] = useState(
    type === "warehouses" ? item?.email || "" : ""
  );
  const [warehouseAddress, setWarehouseAddress] = useState(
    type === "warehouses" ? item?.address || "" : ""
  );
  const [usersList, setUsersList] = useState([]);
  const [value, setValue] = useState(item?.value || "");
  const [planId, setPlanId] = useState(
    item?.plan_id || (categories[0]?.id ?? "")
  );
  const [dateRange, setDateRange] = useState(() => {
    if (
      type === "discounts" &&
      item?.validity &&
      item.validity.includes("to")
    ) {
      const [start, end] = item.validity.split("to").map((s) => s.trim());
      return [
        {
          startDate: new Date(start),
          endDate: new Date(end),
          key: "selection",
        },
      ];
    }
    return [{ startDate: new Date(), endDate: new Date(), key: "selection" }];
  });
  const [validity, setValidity] = useState(item?.validity || "");
  // Add discount code field
  const [discountCode, setDiscountCode] = useState(item?.discount_code || "");
  // Add discount type and store selection
  const [discountType, setDiscountType] = useState(
    item?.discount_type || "percentage"
  );
  const [storeId, setStoreId] = useState(item?.store_id || "all");
  const [stores, setStores] = useState([]);
  // --- PRODUCTS MODAL STATE ---
  const [warehouseId, setWarehouseId] = useState(item?.warehouse_id || "");
  const [productName, setProductName] = useState(item?.name || "");
  const [quantity, setQuantity] = useState(item?.quantity || "");
  const [price, setPrice] = useState(item?.price || "");
  const [costPrice, setCostPrice] = useState(item?.cost_price || "");
  const [taxType, setTaxType] = useState(item?.tax_type || "exclusive");
  const [taxPercentage, setTaxPercentage] = useState(
    item?.tax_percentage || ""
  );
  const [chargeTax, setChargeTax] = useState(
    item?.tax_percentage > 0 || item?.tax_type ? true : false
  );
  const [sku, setSku] = useState(item?.sku || "");
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
  const [subcategoryId, setSubcategoryId] = useState(
    item?.subcategory_id || ""
  );
  const [brandId, setBrandId] = useState(item?.brand_id || "");
  const [unitId, setUnitId] = useState(item?.unit_id || "");
  const [barcode, setBarcode] = useState(item?.barcode || "");
  const [warehouses, setWarehouses] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [variantAttributes, setVariantAttributes] = useState([]);
  const [selectedVariantAttributes, setSelectedVariantAttributes] = useState(
    item?.variant_attributes || {}
  );
  const [showVariantAttributes, setShowVariantAttributes] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [sellingType, setSellingType] = useState(() => {
    let val = item?.selling_type;
    if (
      Array.isArray(val) &&
      val.length === 1 &&
      typeof val[0] === "string" &&
      val[0].startsWith("[")
    ) {
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
  const [expenseDate, setExpenseDate] = useState(
    item?.expense_date || new Date().toISOString().split("T")[0]
  );
  const [expenseCategoryId, setExpenseCategoryId] = useState(
    item?.expense_category_id || ""
  );
  const [paymentMethod, setPaymentMethod] = useState(
    item?.payment_method || "cash"
  );
  const [expenseStatus, setExpenseStatus] = useState(item?.status || "paid");
  const [expenseDescription, setExpenseDescription] = useState(
    item?.description || ""
  );
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Helper to generate a code suggestion
  function suggestCategoryCode(name, existingCodes) {
    if (!name) return "";
    const words = name.trim().split(/\s+/);
    let base = "";
    if (words.length === 1) {
      base = words[0].substring(0, 5).toUpperCase();
    } else {
      base = words
        .map((w) => w[0].toUpperCase())
        .join("")
        .substring(0, 5);
    }
    let suggestion = base;
    let suffix = 1;
    const codesSet = new Set(existingCodes.map((c) => c.toUpperCase()));
    while (codesSet.has(suggestion)) {
      suggestion = base + suffix;
      suffix++;
    }
    return suggestion;
  }

  // Update localCategories when categories prop changes
  useEffect(() => {
    if (categories && categories.length > 0) {
      setLocalCategories(categories);
    }
  }, [categories]);

  // Fetch stores for discount modal
  useEffect(() => {
    if (type === "discounts") {
      fetch("/api/stores")
        .then((response) => response.json())
        .then((result) => {
          if (result.success) {
            setStores(result.data || []);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch stores:", err);
        });
    }
  }, [type]);

  // Suggest a code from name if user hasn't manually edited code and type is categories
  useEffect(() => {
    if (type === "categories" && !item && !codeManuallyEdited) {
      const existingCodes = categories.map((cat) => cat.code || "");
      const suggested = suggestCategoryCode(name, existingCodes);
      setCode(suggested);
    }
    // eslint-disable-next-line
  }, [name, type, item, categories, codeManuallyEdited]);

  useEffect(() => {
    if (type === "warehouses") {
      fetch("/api/users")
        .then((response) => response.json())
        .then((result) => {
          if (result.success) {
            setUsersList(result.data || []);
          }
        })
        .catch((err) => {
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
    if (type === "discounts") {
      setValidity(
        `${format(dateRange[0].startDate, "yyyy-MM-dd")} to ${format(
          dateRange[0].endDate,
          "yyyy-MM-dd"
        )}`
      );
    }
    // eslint-disable-next-line
  }, [dateRange, type]);

  useEffect(() => {
    if (type === "products") {
      // Fetch all dropdown data
      Promise.all([
        fetch("/api/stores"),
        fetch("/api/warehouses"),
        fetch("/api/categories"),
        fetch("/api/subcategories"),
        fetch("/api/brands"),
        fetch("/api/units"),
        fetch("/api/variant-attributes"),
      ])
        .then((responses) => Promise.all(responses.map((r) => r.json())))
        .then((results) => {
          if (results[0].success) setStores(results[0].data || []);
          if (results[1].success) setWarehouses(results[1].data || []);
          if (results[2].success) setLocalCategories(results[2].data || []);
          if (results[3].success) setSubcategories(results[3].data || []);
          if (results[4].success) setBrands(results[4].data || []);
          if (results[5].success) setUnits(results[5].data || []);
          if (results[6].success) setVariantAttributes(results[6].data || []);
        })
        .catch((err) => {
          console.error("Failed to fetch dropdown data:", err);
        });
    } else if (type === "expenses") {
      // Fetch expense categories
      fetch("/api/expense-categories")
        .then((response) => response.json())
        .then((result) => {
          if (result.success) {
            setExpenseCategories(result.data || []);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch expense categories:", err);
        });
    }
  }, [type]);

  // State for SKU validation
  const [skuValidation, setSkuValidation] = useState({
    isValid: true,
    message: "",
  });
  const [lastSequentialNumber, setLastSequentialNumber] = useState(1000);
  const [skuCache, setSkuCache] = useState(new Map());
  const [validationTimeout, setValidationTimeout] = useState(null);
  const [sequenceCache, setSequenceCache] = useState(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  // Helper function to generate professional SKU with improvements
  const generateSKU = async (includeVariants = false) => {
    console.log("generateSKU called with:", { productName, includeVariants });

    if (!productName.trim()) {
      console.log("No product name, returning empty");
      return "";
    }

    // Get store prefix (first 2 letters of store name)
    const selectedStore = stores.find((store) => store.id === storeId);
    const storePrefix =
      selectedStore?.name?.substring(0, 2).toUpperCase() || "ST";

    console.log("Store info:", {
      selectedStore: selectedStore?.name,
      storePrefix,
    });

    // Get category code (first 2-3 letters)
    const selectedCategory = localCategories.find(
      (cat) => cat.id === categoryId
    );
    const categoryCode =
      selectedCategory?.code?.substring(0, 3) ||
      selectedCategory?.name?.substring(0, 3).toUpperCase() ||
      "GEN";

    console.log("Category info:", {
      selectedCategory: selectedCategory?.name,
      categoryCode,
    });

    // Get brand code (first 2 letters)
    const selectedBrand = brands.find((brand) => brand.id === brandId);
    const brandCode =
      selectedBrand?.name?.substring(0, 2).toUpperCase() || "XX";

    // Get product name code (first 4 letters, remove spaces/special chars)
    const productCode = productName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 4)
      .padEnd(4, "X");

    // Generate variant code if variants are selected
    let variantCode = "";
    if (includeVariants && Object.keys(selectedVariantAttributes).length > 0) {
      const variantParts = Object.values(selectedVariantAttributes)
        .map((value) => value.substring(0, 1).toUpperCase())
        .join("");
      variantCode = variantParts ? `-${variantParts}` : "";
    }

    // Get next sequential number from database
    let sequentialNumber;
    try {
      const response = await fetch("/api/products/next-sku-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryCode,
          brandCode,
          productCode,
          storePrefix,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        sequentialNumber = result.nextSequence || lastSequentialNumber + 1;
        setLastSequentialNumber(sequentialNumber);
      } else {
        // Fallback to incremental number
        sequentialNumber = lastSequentialNumber + 1;
        setLastSequentialNumber(sequentialNumber);
      }
    } catch (error) {
      console.warn(
        "Failed to get sequence from server, using local increment:",
        error
      );
      sequentialNumber = lastSequentialNumber + 1;
      setLastSequentialNumber(sequentialNumber);
    }

    // Format: STORE-CATEGORY-BRAND-PRODUCT-VARIANT-NUMBER
    // Example: MS-CLO-NI-TSHI-BL-1001 (MainStore-Clothing-Nike-TShirt-Black/Large-1001)
    return `${storePrefix}-${categoryCode}-${brandCode}-${productCode}${variantCode}-${sequentialNumber
      .toString()
      .padStart(4, "0")}`;
  };

  // Function to validate SKU uniqueness with caching and debouncing
  const validateSKU = (skuValue) => {
    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    if (!skuValue.trim()) {
      setSkuValidation({ isValid: true, message: "" });
      return;
    }

    // Check cache first
    if (skuCache.has(skuValue.trim())) {
      const cachedResult = skuCache.get(skuValue.trim());
      setSkuValidation(cachedResult);
      return;
    }

    // Set loading state
    setSkuValidation({ isValid: true, message: "Checking availability..." });

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch("/api/products/validate-sku", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: skuValue.trim(),
            excludeId: item?.id, // Exclude current item when editing
          }),
        });

        const result = await response.json();

        const validationResult = result.exists
          ? {
              isValid: false,
              message: "SKU already exists. Please use a different SKU.",
            }
          : { isValid: true, message: "SKU is available." };

        // Cache the result
        setSkuCache(
          (prev) => new Map(prev.set(skuValue.trim(), validationResult))
        );
        setSkuValidation(validationResult);
      } catch (error) {
        console.warn("Failed to validate SKU:", error);
        setSkuValidation({ isValid: true, message: "" });
      }
    }, 800); // Increased debounce to 800ms

    setValidationTimeout(timeoutId);
  };

  // Auto-generate SKU from product details if not manually edited (with debouncing)
  useEffect(() => {
    // Debug logging
    console.log("SKU Generation Check:", {
      type,
      skuManuallyEdited,
      productName: productName?.substring(0, 20) + "...",
      categoryId,
      storeId,
      hasStores: stores.length,
      hasCategories: localCategories.length,
      shouldGenerate:
        type === "products" && !skuManuallyEdited && productName.trim(),
    });

    // Generate SKU when we have product name (other fields will use defaults)
    if (type === "products" && !skuManuallyEdited && productName.trim()) {
      // Debounce SKU generation to avoid too many API calls
      const timeoutId = setTimeout(async () => {
        console.log("Generating SKU for:", productName);
        const newSku = await generateSKU(true); // Include variants
        console.log("Generated SKU:", newSku);
        setSku(newSku);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }

    // Auto-generate barcode if not present and not editing an item (regardless of toggle state)
    if (type === "products" && !item && productName && !barcode) {
      const newBarcode =
        "BC" + Math.floor(100000000 + Math.random() * 900000000);
      console.log("Auto-generating barcode (toggle independent):", newBarcode);
      setBarcode(newBarcode);
    }
  }, [
    productName,
    categoryId,
    brandId,
    storeId,
    selectedVariantAttributes,
    type,
    skuManuallyEdited,
    stores,
    localCategories,
  ]);

  // Separate useEffect specifically for barcode generation (independent of other fields)
  useEffect(() => {
    console.log("Barcode generation check:", {
      type,
      item: !!item,
      productName: productName?.substring(0, 20),
      currentBarcode: barcode?.substring(0, 10),
      shouldGenerate: type === "products" && !item && productName && !barcode,
    });

    if (type === "products" && !item && productName.trim() && !barcode) {
      const newBarcode =
        "BC" + Math.floor(100000000 + Math.random() * 900000000);
      console.log("Generating barcode independently:", newBarcode);
      setBarcode(newBarcode);
    }
  }, [type, item, productName, barcode]);

  // Note: Barcode generation is now handled independently above, regardless of toggle state

  // Auto-select single options in dropdowns for products
  useEffect(() => {
    if (type === "products" && !item) {
      // Auto-select store if only one available
      if (stores.length === 1 && !storeId) {
        setStoreId(stores[0].id);
      }

      // Auto-select warehouse if only one available
      if (warehouses.length === 1 && !warehouseId) {
        setWarehouseId(warehouses[0].id);
      }

      // Auto-select unit - default to "Pieces" if available, otherwise auto-select if only one available
      if (!unitId) {
        const piecesUnit = units.find(
          (unit) =>
            unit.name.toLowerCase() === "pieces" ||
            unit.name.toLowerCase() === "piece"
        );
        if (piecesUnit) {
          setUnitId(piecesUnit.id);
        } else if (units.length === 1) {
          setUnitId(units[0].id);
        }
      }

      // Auto-select category if only one available
      if (localCategories.length === 1 && !categoryId) {
        setCategoryId(localCategories[0].id);
      }

      // Auto-select brand if only one available
      if (brands.length === 1 && !brandId) {
        setBrandId(brands[0].id);
      }

      // Auto-select variant attributes if only one option available
      variantAttributes.forEach((attr) => {
        if (attr.values) {
          const values = attr.values
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          if (values.length === 1 && !selectedVariantAttributes[attr.id]) {
            setSelectedVariantAttributes((prev) => ({
              ...prev,
              [attr.id]: values[0],
            }));
          }
        }
      });
    }

    // Auto-select for other modal types
    if (
      type === "warehouses" &&
      !item &&
      usersList.length === 1 &&
      !contactPerson
    ) {
      setContactPerson(usersList[0].id);
    }

    if (
      type === "discounts" &&
      !item &&
      localCategories.length === 1 &&
      !planId
    ) {
      setPlanId(localCategories[0].id);
    }

    if (
      type === "expenses" &&
      !item &&
      expenseCategories.length === 1 &&
      !expenseCategoryId
    ) {
      setExpenseCategoryId(expenseCategories[0].id);
    }

    if (
      type === "subcategories" &&
      !item &&
      localCategories.length === 1 &&
      !categoryId
    ) {
      setCategoryId(localCategories[0].id);
    }
  }, [
    type,
    item,
    stores,
    warehouses,
    units,
    localCategories,
    brands,
    variantAttributes,
    usersList,
    expenseCategories,
    storeId,
    warehouseId,
    unitId,
    categoryId,
    brandId,
    selectedVariantAttributes,
    contactPerson,
    planId,
    expenseCategoryId,
  ]);

  // Handle Add New Category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
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
      if (!discountCode.trim()) {
        setError("Discount Code is required");
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
        const errorMsg = "Store is required";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      if (!warehouseId) {
        const errorMsg = "Warehouse is required";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      if (!productName.trim()) {
        const errorMsg = "Product Name is required";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      if (!quantity.trim()) {
        const errorMsg = "Quantity is required";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      if (!price.trim()) {
        const errorMsg = "Price is required";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      if (!costPrice || costPrice.toString().trim() === "") {
        const errorMsg = "Cost Price is required";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      if (chargeTax) {
        if (!taxPercentage || taxPercentage.toString().trim() === "") {
          const errorMsg = "Tax Percentage is required";
          setError(errorMsg);
          toast.error(errorMsg);
          return;
        }
        if (
          isNaN(Number(taxPercentage)) ||
          Number(taxPercentage) < 0 ||
          Number(taxPercentage) > 100
        ) {
          const errorMsg = "Tax Percentage must be a number between 0 and 100";
          setError(errorMsg);
          toast.error(errorMsg);
          return;
        }
      }
      if (!sku.trim()) {
        const errorMsg = "SKU is required";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      if (!skuValidation.isValid) {
        const errorMsg = "Please fix the SKU error before saving";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      if (!categoryId) {
        const errorMsg = "Category is required";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      if (!unitId) {
        const errorMsg = "Unit is required";
        setError(errorMsg);
        toast.error(errorMsg);
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
          discount_code: discountCode.trim(),
          discount_type: discountType,
          store_id: storeId === "all" ? null : storeId,
          is_active: isActive,
        });
      } else if (type === "plans") {
        await onSave({
          name: name.trim(),
          description: description.trim(),
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
          tax_percentage: chargeTax
            ? taxPercentage === ""
              ? null
              : Number(taxPercentage)
            : null,
          sku: sku.trim(),
          store_id: storeId || null,
          warehouse_id: warehouseId || null,
          category_id: categoryId || null,
          subcategory_id: subcategoryId || null,
          brand_id: brandId || null,
          unit_id: unitId || null,
          barcode: barcode.trim(),
          image_url: imageUrl,
          variant_attributes:
            Object.keys(selectedVariantAttributes).length > 0
              ? selectedVariantAttributes
              : null,
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
          ...(type === "variant_attributes"
            ? { values: values.join(",") }
            : {}),
          ...(type === "units" ? { symbol: symbol.trim() } : {}),
          ...(type === "stores"
            ? {
                address: address.trim(),
                phone: phone.trim(),
                email: email.trim(),
              }
            : {}),
          ...(type === "warehouses"
            ? {
                contact_person: contactPerson.trim(),
                phone: phone.trim(),
                email: warehouseEmail.trim(),
                address: warehouseAddress.trim(),
              }
            : {}),
          ...(type === "customers"
            ? {
                email: email.trim(),
                phone: phone.trim(),
                address: address.trim(),
              }
            : {}),
          ...(type !== "units" &&
          type !== "stores" &&
          type !== "warehouses" &&
          type !== "customers"
            ? { description: description.trim() }
            : {}),
        });
      }
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get entity label for modal title
  const typeLabel =
    {
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
  const modalTitle =
    type === "discounts"
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
            <div className="space-y-6">
              {/* Header Card */}
              <div
                className={`rounded-xl p-6 shadow-sm border ${
                  mode === "dark"
                    ? "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Icon icon="mdi:percent" className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-bold ${
                        mode === "dark" ? "text-white" : "text-blue-900"
                      }`}
                    >
                      Discount Details
                    </h3>
                    <p
                      className={`text-sm ${
                        mode === "dark" ? "text-gray-300" : "text-blue-700"
                      }`}
                    >
                      Configure your discount settings
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block mb-2 font-semibold flex items-center gap-2 ${
                      mode === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    <Icon
                      icon="mdi:tag-text"
                      className="w-4 h-4 text-blue-600"
                    />
                    Discount Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      mode === "dark"
                        ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400"
                        : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                    }`}
                    value={name}
                    onChange={handleNameChange}
                    disabled={loading}
                    placeholder="e.g., Summer Sale, Black Friday"
                  />
                </div>
                <div>
                  <label
                    className={`block mb-2 font-semibold flex items-center gap-2 ${
                      mode === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    <Icon
                      icon="mdi:barcode"
                      className="w-4 h-4 text-blue-600"
                    />
                    Discount Code<span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono ${
                      mode === "dark"
                        ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400"
                        : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                    }`}
                    value={discountCode}
                    onChange={(e) =>
                      setDiscountCode(e.target.value.toUpperCase())
                    }
                    disabled={loading}
                    placeholder="e.g., SUMMER20, BLACKFRIDAY"
                  />
                  <p
                    className={`text-xs mt-1 ${
                      mode === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Customers will use this code to apply the discount
                  </p>
                </div>
              </div>

              {/* Value and Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block mb-2 font-semibold flex items-center gap-2 ${
                      mode === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    <Icon
                      icon="fa7-solid:cedi-sign"
                      className="w-4 h-4 text-blue-600"
                    />
                    Discount Value<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`w-full border rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        mode === "dark"
                          ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400"
                          : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                      }`}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      disabled={loading}
                      placeholder={
                        discountType === "percentage" ? "10.00" : "5.00"
                      }
                    />
                    <Icon
                      icon={
                        discountType === "percentage"
                          ? "mdi:percent"
                          : "fa7-solid:cedi-sign"
                      }
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                        mode === "dark" ? "text-gray-500" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      mode === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {discountType === "percentage"
                      ? "Enter the discount percentage (e.g., 10 for 10%)"
                      : "Enter the fixed discount amount in GHS (e.g., 5 for GHS 5.00)"}
                  </p>
                </div>
                <div>
                  <label
                    className={`block mb-2 font-semibold flex items-center gap-2 ${
                      mode === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    <Icon
                      icon="mdi:package-variant"
                      className="w-4 h-4 text-blue-600"
                    />
                    Discount Plan<span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      mode === "dark"
                        ? "border-gray-600 bg-gray-800 text-gray-100"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    disabled={loading}
                  >
                    {localCategories.length === 0 ? (
                      <option value="">No discount plans available</option>
                    ) : (
                      <>
                        <option value="">Select a discount plan</option>
                        {localCategories.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Discount Type and Store Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className={`block mb-2 font-semibold flex items-center gap-2 ${
                      mode === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    <Icon
                      icon="mdi:format-list-bulleted"
                      className="w-4 h-4 text-blue-600"
                    />
                    Discount Type<span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      mode === "dark"
                        ? "border-gray-600 bg-gray-800 text-gray-100"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    disabled={loading}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (GHS)</option>
                  </select>
                  <p
                    className={`text-xs mt-1 ${
                      mode === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Choose whether this is a percentage or fixed amount discount
                  </p>
                </div>
                <div>
                  <label
                    className={`block mb-2 font-semibold flex items-center gap-2 ${
                      mode === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    <Icon icon="mdi:store" className="w-4 h-4 text-blue-600" />
                    Apply to Store
                  </label>
                  {item?.store_id ? (
                    <div
                      className={`w-full border rounded-lg px-4 py-3 ${
                        mode === "dark"
                          ? "border-gray-600 bg-gray-700 text-gray-200"
                          : "border-gray-300 bg-gray-100 text-gray-700"
                      }`}
                    >
                      {stores.find((store) => store.id === item.store_id)
                        ?.name || "Assigned Store"}
                    </div>
                  ) : (
                    <select
                      className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        mode === "dark"
                          ? "border-gray-600 bg-gray-800 text-gray-100"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value)}
                      disabled={loading}
                    >
                      <option value="all">All Stores</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      mode === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {item?.store_id
                      ? "Store is pre-assigned and cannot be changed"
                      : "Select specific store or apply to all stores"}
                  </p>
                </div>
              </div>

              {/* Validity Period */}
              <div>
                <label
                  className={`block mb-2 font-semibold flex items-center gap-2 ${
                    mode === "dark" ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  <Icon
                    icon="mdi:calendar-range"
                    className="w-4 h-4 text-blue-600"
                  />
                  Validity Period<span className="text-red-500">*</span>
                </label>
                <div
                  className={`border rounded-lg p-4 ${
                    mode === "dark"
                      ? "border-gray-600 bg-gray-800"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <DateRange
                    editableDateInputs={true}
                    onChange={(item) => setDateRange([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={dateRange}
                    className="rounded-lg"
                    rangeColors={["#3b82f6"]}
                    disabled={loading}
                  />
                  <div
                    className={`text-sm mt-3 p-3 rounded-lg border ${
                      mode === "dark"
                        ? "text-gray-300 bg-gray-700 border-gray-600"
                        : "text-gray-600 bg-white border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="mdi:calendar-check"
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">Valid from:</span>
                      <span className="text-blue-700">
                        {format(dateRange[0].startDate, "MMM dd, yyyy")}
                      </span>
                      <span className="text-gray-400">to</span>
                      <span className="text-blue-700">
                        {format(dateRange[0].endDate, "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  mode === "dark" ? "bg-gray-800" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={loading}
                  />
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:check-circle"
                      className="w-5 h-5 text-green-600"
                    />
                    <span
                      className={`font-semibold ${
                        mode === "dark" ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      Active
                    </span>
                  </div>
                </div>
                <p
                  className={`text-sm ${
                    mode === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Enable this discount for customers to use
                </p>
              </div>
            </div>
          ) : type === "plans" ? (
            <div className="space-y-6">
              {/* Header Card */}
              <div
                className={`rounded-xl p-6 shadow-sm border ${
                  mode === "dark"
                    ? "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Icon
                      icon="mdi:package-variant"
                      className="w-7 h-7 text-white"
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-bold ${
                        mode === "dark" ? "text-white" : "text-blue-900"
                      }`}
                    >
                      Discount Plan Details
                    </h3>
                    <p
                      className={`text-sm ${
                        mode === "dark" ? "text-gray-300" : "text-blue-700"
                      }`}
                    >
                      Create a plan to organize your discounts
                    </p>
                  </div>
                </div>
              </div>

              {/* Plan Information */}
              <div>
                <label
                  className={`block mb-2 font-semibold flex items-center gap-2 ${
                    mode === "dark" ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  <Icon icon="mdi:tag-text" className="w-4 h-4 text-blue-600" />
                  Plan Name<span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    mode === "dark"
                      ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  }`}
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g., Seasonal Sales, Holiday Promotions, VIP Discounts"
                />
                <p
                  className={`text-xs mt-1 ${
                    mode === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Give your discount plan a descriptive name
                </p>
              </div>

              {/* Description Field */}
              <div>
                <label
                  className={`block mb-2 font-semibold flex items-center gap-2 ${
                    mode === "dark" ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  <Icon icon="mdi:text" className="w-4 h-4 text-blue-600" />
                  Description
                </label>
                <textarea
                  className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none ${
                    mode === "dark"
                      ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  }`}
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  placeholder="Describe the purpose and scope of this discount plan..."
                />
                <p
                  className={`text-xs mt-1 ${
                    mode === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Optional description to help organize your discounts
                </p>
              </div>

              {/* Status Toggle */}
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  mode === "dark" ? "bg-gray-800" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={loading}
                  />
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:check-circle"
                      className="w-5 h-5 text-green-600"
                    />
                    <span
                      className={`font-semibold ${
                        mode === "dark" ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      Active
                    </span>
                  </div>
                </div>
                <p
                  className={`text-sm ${
                    mode === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Enable this plan to be used for creating discounts
                </p>
              </div>
            </div>
          ) : type === "variant_attributes" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Variant<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Color, Size, Material"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Values<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  onKeyDown={handleValueInputKeyDown}
                  disabled={loading}
                  placeholder="Type a value and press comma or Enter"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {values.map((val, idx) => (
                    <span
                      key={val + idx}
                      className="inline-flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium"
                    >
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
                <div className="text-xs text-gray-400 mt-1">
                  Enter value separated by comma
                </div>
              </div>
            </>
          ) : type === "units" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Unit<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Kilogram, Meter, Liter"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Symbol<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. kg, m, L"
                />
              </div>
            </>
          ) : type === "stores" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Store Name<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Main Store, Downtown Branch"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Address<span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                  placeholder="Enter store address"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Phone<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. +1-555-123-4567"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. store@example.com"
                />
              </div>
            </>
          ) : type === "customers" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Name<span className="text-red-500">*</span>
                </label>
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
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Phone<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. +1-555-123-4567"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Address</label>
                <textarea
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={loading}
                />
                <label
                  htmlFor="customer-is-active"
                  className="text-sm cursor-pointer select-none"
                >
                  Active
                </label>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Profile Picture
                </label>
                <CategoryImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  folder="ProfilePictures"
                  userName={name}
                  referralCode={email}
                />
              </div>
            </>
          ) : type === "warehouses" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Warehouse<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Main Warehouse, Central Depot"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Contact Person<span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a user</option>
                  {usersList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Phone<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. +1-555-123-4567"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={warehouseEmail}
                  onChange={(e) => setWarehouseEmail(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. warehouse@example.com"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Address<span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={warehouseAddress}
                  onChange={(e) => setWarehouseAddress(e.target.value)}
                  disabled={loading}
                  placeholder="Enter warehouse address"
                  rows={3}
                />
              </div>
            </>
          ) : type === "products" ? (
            <>
              <div className="mb-6">
                <label className="block mb-1 font-medium">
                  Product Name<span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full border rounded px-3 py-2 ${
                    mode === "dark"
                      ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  }`}
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    console.log("Product name changed to:", e.target.value);
                    // Reset SKU manual edit flag when product name changes
                    if (!item) {
                      // Only for new products, not when editing
                      setSkuManuallyEdited(false);
                    }
                  }}
                  disabled={loading}
                  placeholder="Product name"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">
                    Store<span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full border rounded px-3 py-2 ${
                      mode === "dark"
                        ? "border-gray-600 bg-gray-800 text-gray-100"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select a store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">
                    Warehouse<span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full border rounded px-3 py-2 ${
                      mode === "dark"
                        ? "border-gray-600 bg-gray-800 text-gray-100"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select a warehouse</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">
                    Quantity<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className={`w-full border rounded px-3 py-2 ${
                      mode === "dark"
                        ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400"
                        : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                    }`}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={loading}
                    placeholder="Quantity"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Unit</label>
                  <select
                    className={`w-full border rounded px-3 py-2 ${
                      mode === "dark"
                        ? "border-gray-600 bg-gray-800 text-gray-100"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select a unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">
                    Selling Price (in GHS)
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className={`w-full border rounded px-3 py-2 ${
                      mode === "dark"
                        ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400"
                        : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                    }`}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={loading}
                    placeholder="Price"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">
                    Cost Price (in GHS)<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className={`w-full border rounded px-3 py-2 ${
                      mode === "dark"
                        ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400"
                        : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                    }`}
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    disabled={loading}
                    placeholder="Cost Price"
                  />
                </div>
              </div>
              {/* Charge Tax Toggle */}
              <div className="mb-6 flex items-center gap-3">
                <span className="font-medium">Charge Tax?</span>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    chargeTax ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  onClick={() => setChargeTax((v) => !v)}
                  aria-pressed={chargeTax}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      chargeTax ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-sm ${
                    mode === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {chargeTax ? "Yes" : "No"}
                </span>
              </div>
              {/* Tax fields, only if chargeTax is true */}
              {chargeTax && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block mb-1 font-medium">
                      Tax Type<span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full border rounded px-3 py-2 ${
                        mode === "dark"
                          ? "border-gray-600 bg-gray-800 text-gray-100"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      value={taxType}
                      onChange={(e) => setTaxType(e.target.value)}
                      disabled={loading}
                    >
                      <option value="exclusive">
                        Exclusive (Tax added on top)
                      </option>
                      <option value="inclusive">
                        Inclusive (Tax included in price)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Tax Percentage (%)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className={`w-full border rounded px-3 py-2 ${
                        mode === "dark"
                          ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400"
                          : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                      }`}
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                      disabled={loading}
                      placeholder="0.00"
                    />
                    <div
                      className={`text-xs mt-1 ${
                        mode === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {taxType === "exclusive"
                        ? "Tax will be added on top of the selling price (e.g., GHS 100 + 15% = GHS 115)"
                        : "Tax is included in the selling price (e.g., GHS 115 includes 15% tax = GHS 100 + GHS 15)"}
                    </div>
                    {price && taxPercentage && Number(taxPercentage) > 0 && (
                      <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                        <div className="font-medium text-blue-800 mb-1">
                          Tax Calculation for "{productName || "Product"}":
                        </div>
                        {taxType === "exclusive" ? (
                          <div className="text-blue-700">
                            <div>Price: GHS {Number(price).toFixed(2)}</div>
                            <div>
                              Tax ({taxPercentage}%): GHS{" "}
                              {(
                                (Number(price) * Number(taxPercentage)) /
                                100
                              ).toFixed(2)}
                            </div>
                            <div className="font-medium">
                              Total: GHS{" "}
                              {(
                                Number(price) *
                                (1 + Number(taxPercentage) / 100)
                              ).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-blue-700">
                            <div>
                              Total Price: GHS {Number(price).toFixed(2)}
                            </div>
                            <div>
                              Price without tax: GHS{" "}
                              {(
                                Number(price) /
                                (1 + Number(taxPercentage) / 100)
                              ).toFixed(2)}
                            </div>
                            <div className="font-medium">
                              Tax included: GHS{" "}
                              {(
                                Number(price) -
                                Number(price) /
                                  (1 + Number(taxPercentage) / 100)
                              ).toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="mb-6">
                <div>
                  <label className="block mb-1 font-medium">SKU</label>
                  <div className="flex gap-2">
                    <input
                      className={`w-full border rounded px-3 py-2 font-mono ${
                        !skuValidation.isValid
                          ? "border-red-500 bg-red-50"
                          : skuValidation.message === "SKU is available."
                          ? "border-green-500 bg-green-50"
                          : ""
                      }`}
                      value={sku}
                      onChange={(e) => {
                        setSku(e.target.value);
                        setSkuManuallyEdited(true);
                        // Use optimized validation with built-in debouncing
                        validateSKU(e.target.value);
                      }}
                      disabled={loading}
                      placeholder="Auto-generated or enter custom SKU"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        console.log("Manual SKU generation clicked");
                        const newSku = await generateSKU(
                          Object.keys(selectedVariantAttributes).length > 0
                        );
                        console.log("Manual generated SKU:", newSku);
                        setSku(newSku);
                        setSkuManuallyEdited(false);
                        validateSKU(newSku);
                      }}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm whitespace-nowrap"
                      disabled={loading}
                    >
                      Generate
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      Format: STORE-CATEGORY-BRAND-PRODUCT-VARIANT-NUMBER
                    </p>
                    {skuValidation.message && (
                      <p
                        className={`text-xs ${
                          skuValidation.isValid
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {skuValidation.message}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Example: MS-CLO-NI-TSHI-BL-1001
                    (MainStore-Clothing-Nike-TShirt-Black/Large-1001)
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">
                    Category<span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Select a category</option>
                      {localCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="w-40 px-2 py-1 bg-blue-500 text-white rounded-lg"
                      onClick={() => setShowAddCategory(true)}
                      disabled={loading}
                    >
                      Add New
                    </button>
                  </div>
                  {showAddCategory && (
                    <div className="mt-2 flex gap-2">
                      <input
                        className="w-full border rounded px-3 py-2"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name"
                      />
                      <button
                        type="button"
                        className="px-2 py-1 bg-green-500 text-white rounded-lg"
                        onClick={handleAddCategory}
                        disabled={loading}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 bg-gray-300 text-black rounded-lg"
                        onClick={() => setShowAddCategory(false)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block mb-1 font-medium">Brand</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select a brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Variant Attributes Toggle */}
              {variantAttributes.length > 0 && (
                <div className="mb-6 flex items-center gap-3">
                  <span className="font-medium">
                    Add Product Specifications?
                  </span>
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      showVariantAttributes ? "bg-blue-600" : "bg-gray-300"
                    }`}
                    onClick={() => setShowVariantAttributes((v) => !v)}
                    aria-pressed={showVariantAttributes}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        showVariantAttributes
                          ? "translate-x-5"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-500">
                    {showVariantAttributes ? "Yes" : "No"}
                  </span>
                </div>
              )}

              {/* Variant Attributes Section */}
              {variantAttributes.length > 0 && showVariantAttributes && (
                <div className="mb-6">
                  <label className="block mb-2 font-medium">
                    Product Specifications
                  </label>
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
                            onChange={(e) =>
                              setSelectedVariantAttributes((prev) => ({
                                ...prev,
                                [attr.id]: e.target.value,
                              }))
                            }
                            disabled={loading}
                          >
                            <option value="">Select {attr.name}</option>
                            {attr.values &&
                              attr.values.split(",").map((value, index) => (
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
                    Select variant attributes to create product variations
                    (e.g., Size, Color, etc.)
                  </p>
                </div>
              )}

              {/* Barcode Toggle */}
              <div className="mb-6 flex items-center gap-3">
                <span className="font-medium">Barcode Settings</span>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    showBarcode ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  onClick={() => setShowBarcode((v) => !v)}
                  aria-pressed={showBarcode}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      showBarcode ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-500">
                  {showBarcode ? "Hide" : "Show"} barcode section
                </span>
                {barcode && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Generated: {barcode}
                  </span>
                )}
              </div>

              {/* Barcode Section */}
              {showBarcode && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Barcode Input */}
                    <div>
                      <label className="block mb-2 font-medium">
                        Item Barcode
                      </label>
                      <div className="flex gap-2">
                        <input
                          className="w-full border rounded px-3 py-2 font-mono"
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                          disabled={loading}
                          placeholder="Enter or scan barcode"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setBarcode(
                              "BC" +
                                Math.floor(
                                  100000000 + Math.random() * 900000000
                                )
                            )
                          }
                          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          disabled={loading}
                        >
                          Generate
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-generated or enter custom barcode
                      </p>
                    </div>

                    {/* Barcode Preview */}
                    {barcode && (
                      <div>
                        <label className="block mb-2 font-medium text-center">
                          Barcode Preview
                        </label>
                        <div className="flex justify-center items-center">
                          <div className="border rounded p-3 bg-white">
                            <Barcode
                              value={barcode}
                              height={60}
                              width={2}
                              displayValue={true}
                              fontSize={14}
                              textMargin={5}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="mb-6">
                <label className="block mb-1 font-medium">Image</label>
                <CategoryImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  folder="ProductImages"
                  userName={productName}
                  referralCode={sku}
                />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={loading}
                />
                <span className="text-sm">Active</span>
              </div>
              {error && (
                <div className="text-red-600 mb-2 text-sm">{error}</div>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg ${
                    mode === "dark"
                      ? "bg-gray-700 text-gray-100 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                  disabled={loading}
                >
                  Save
                </button>
              </div>
            </>
          ) : type === "expenses" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Title<span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. Office Supplies, Rent Payment"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1 font-medium">
                    Amount (GHS)<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    disabled={loading}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">
                    Date<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
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
                    onChange={(e) => setExpenseCategoryId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select a category</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">
                    Payment Method<span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={loading}
                  >
                    <option value="cash">Cash</option>
                    <option value="momo">Mobile Money</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Status<span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={expenseStatus}
                  onChange={(e) => setExpenseStatus(e.target.value)}
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
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  disabled={loading}
                  placeholder="Enter expense description"
                  rows={3}
                />
              </div>
              {error && (
                <div className="text-red-600 mb-2 text-sm">{error}</div>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading && (
                    <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
                  )}{" "}
                  Save
                </button>
              </div>
            </>
          ) : type === "expense-categories" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Name<span className="text-red-500">*</span>
                </label>
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
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
              {error && (
                <div className="text-red-600 mb-2 text-sm">{error}</div>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading && (
                    <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
                  )}{" "}
                  Save
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
              <div className="text-xs text-gray-400 mt-1">
                Short, unique code for this category (e.g. TSHIR, FS, DJ, ACC)
              </div>
            </div>
          )}
          {type === "categories" && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Description</label>
              <textarea
                className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                onChange={(e) => setIsActive(e.target.checked)}
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
                onChange={(e) => setCategoryId(e.target.value)}
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
          {type !== "variant_attributes" &&
            type !== "units" &&
            type !== "stores" &&
            type !== "warehouses" &&
            type !== "customers" &&
            type !== "discounts" &&
            type !== "plans" &&
            type !== "products" &&
            type !== "expenses" &&
            type !== "expense-categories" && (
              <div className="mb-4">
                <label className="block mb-1 font-medium">Image</label>
                <CategoryImageUpload value={imageUrl} onChange={setImageUrl} />
              </div>
            )}
          {type !== "products" &&
            type !== "expenses" &&
            type !== "expense-categories" && (
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading && (
                    <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
                  )}{" "}
                  Save
                </button>
              </div>
            )}
        </form>
      </SimpleModal>
    </>
  );
}

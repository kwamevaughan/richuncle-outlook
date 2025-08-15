import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { AddEditModal } from "./AddEditModal";
import SimpleModal from "./SimpleModal";
import PaymentForm from "./PaymentForm";
import PrintReceipt from "./PrintReceipt";
import ReceiptPreviewModal from "./ReceiptPreviewModal";
import { playBellBeep } from "../utils/posSounds";
import { getPaymentTypeLabel } from "./payment/utils/paymentHelpers";
import useUsers from "../hooks/useUsers";
import Select, { components } from "react-select";
import { paymentMethods } from "@/constants/paymentMethods";
import TooltipIconButton from "./TooltipIconButton";
import CameraBarcodeScanner from "./CameraBarcodeScanner";

const dummyOrder = {
  id: "ORD123",
  customer: {
    name: "James Anderson",
    type: "Walk in Customer",
  },
  items: [
    { id: 1, name: "iPhone 14 64GB", qty: 1, cost: 15800 },
    { id: 2, name: "Red Nike Angelo", qty: 4, cost: 398 },
    { id: 3, name: "Tablet 1.02 inch", qty: 4, cost: 3000 },
    { id: 4, name: "IdeaPad Slim 3i", qty: 4, cost: 3000 },
  ],
  discount: {
    label: "Discount 5%",
    desc: "For GHS20 Minimum Purchase, all Items",
    value: 15.21,
  },
  summary: {
    tax: 0,
    discount: 0,
    roundoff: 0,
    subtotal: 0,
    total: 0,
  },
};

const PosOrderList = ({
  selectedProducts = [],
  quantities = {},
  products = [],
  setSelectedProducts,
  setQuantities,
  discounts = [],
  setDiscounts,
  selectedDiscountId,
  setSelectedDiscountId,
  roundoffEnabled,
  setRoundoffEnabled,
  customers = [],
  setCustomers,
  onOrderComplete,
  user,
  paymentData,
  setPaymentData,
  selectedPayment,
  setSelectedPayment,
  selectedPaymentType,
  setSelectedPaymentType,
  showPaymentModal,
  setShowPaymentModal,
  handlePaymentComplete,
  handleCustomerChange,
  paymentMethods: propPaymentMethods,
  paymentSummary,
  setPaymentSummary,
  showReceiptModal,
  setShowReceiptModal,
  receiptData,
  setReceiptData,
  isOnlinePurchase,
  setIsOnlinePurchase,
  onlineEmail,
  setOnlineEmail,
  onlineOrderRef,
  setOnlineOrderRef,
  allUsers,
  orderId,
  selectedCustomerId,
  setSelectedCustomerId,
  className = "",
  mode = "light",
}) => {
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [barcodeError, setBarcodeError] = useState("");
  const [barcodeQty, setBarcodeQty] = useState(1);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showAddDiscountModal, setShowAddDiscountModal] = useState(false);
  const [discountPlans, setDiscountPlans] = useState([]);
  const [discountValue, setDiscountValue] = useState("");
  const [newDiscountType, setNewDiscountType] = useState("percentage");
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [scannerMode, setScannerMode] = useState("manual"); // "manual" or "camera"

  // Enhanced barcode detection state
  const [searchInput, setSearchInput] = useState("");
  const [isBarcodeMode, setIsBarcodeMode] = useState(false);
  const [barcodeTimeout, setBarcodeTimeout] = useState(null);
  
  // Always-on barcode detection
  const [alwaysOnBarcode, setAlwaysOnBarcode] = useState("");
  const [barcodeInputRef, setBarcodeInputRef] = useState(null);
  const alwaysOnTimeoutRef = useRef(null);

  // Detect if user is on Chrome
  const isChrome =
    typeof window !== "undefined" &&
    /Chrome/.test(navigator.userAgent) &&
    /Google Inc/.test(navigator.vendor);

  // Detect operating system for keyboard shortcuts
  const isMac =
    typeof window !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const keyboardShortcut = isMac ? "Cmd+B" : "Ctrl+B";

  // Always-on barcode detection - this runs constantly without needing activation
  const handleAlwaysOnBarcodeInput = (value) => {
    setAlwaysOnBarcode(value);

    // Clear any existing timeout
    if (alwaysOnTimeoutRef.current) {
      clearTimeout(alwaysOnTimeoutRef.current);
    }

    // If input is empty, just clear
    if (!value.trim()) {
      setBarcodeError("");
      return;
    }

    // Immediate barcode detection - no mode activation needed
    const isLikelyBarcode =
      /^\d{6,14}$/.test(value.trim()) || // Standard EAN/UPC formats
      /^[A-Z0-9]{6,20}$/.test(value.trim()) || // Alphanumeric codes
      (value.length >= 6 && /^[0-9A-Z]+$/.test(value.trim())); // General barcode pattern

    if (isLikelyBarcode && value.length >= 6) {
      // Very fast processing for instant response
      const timeout = setTimeout(() => {
        processBarcodeInput(value.trim());
        setAlwaysOnBarcode(""); // Clear immediately after processing
      }, 30); // Even faster - 30ms for instant feel

      alwaysOnTimeoutRef.current = timeout;
    }
  };

  // Legacy search input handler for manual product search
  const handleSearchInputChange = (value) => {
    setSearchInput(value);

    // Clear any existing timeout
    if (barcodeTimeout) {
      clearTimeout(barcodeTimeout);
    }

    // If input is empty, reset barcode mode
    if (!value.trim()) {
      setIsBarcodeMode(false);
      setBarcodeError("");
      return;
    }

    // More aggressive barcode detection for faster processing
    const isLikelyBarcode =
      /^\d{6,14}$/.test(value.trim()) || // Standard EAN/UPC formats (reduced min length)
      /^[A-Z0-9]{6,20}$/.test(value.trim()) || // Alphanumeric codes
      (value.length >= 6 && /^[0-9A-Z]+$/.test(value.trim())); // General barcode pattern

    if (isLikelyBarcode && value.length >= 6) {
      setIsBarcodeMode(true);

      // Much faster processing for immediate response
      const timeout = setTimeout(() => {
        processBarcodeInput(value.trim());
      }, 50); // Faster response time for better UX

      setBarcodeTimeout(timeout);
    } else {
      setIsBarcodeMode(false);
    }
  };

  const processBarcodeInput = (barcode) => {
    // Immediate feedback with beep sound for professional POS feel
    playBellBeep();
    
    const found = products.find(
      (p) => p.barcode === barcode || p.sku === barcode,
    );

    if (!found) {
      // Barcode not found - show error but keep scanning active
      setBarcodeError(`No product found: ${barcode}`);
      toast.error(`❌ Product not found: ${barcode}`, { duration: 2000 });
      
      // Clear input immediately and stay ready for next scan
      setSearchInput("");
      setIsBarcodeMode(false);
      
      // Auto-focus back for continuous scanning
      setTimeout(() => {
        const searchField = document.querySelector('[data-testid="search-input"] input');
        if (searchField) {
          searchField.focus();
        }
      }, 100);
      return;
    }

    // Barcode found - add product to order immediately
    const qty = 1; // Always add 1 unit per scan for faster checkout

    // Check stock availability
    if (qty > found.quantity) {
      toast.error(
        user?.role === "cashier"
          ? "❌ Insufficient stock!"
          : `❌ Insufficient stock! Only ${found.quantity} units available.`,
        { duration: 2000 }
      );
      
      // Clear and stay ready for next scan
      setSearchInput("");
      setIsBarcodeMode(false);
      setTimeout(() => {
        const searchField = document.querySelector('[data-testid="search-input"] input');
        if (searchField) {
          searchField.focus();
        }
      }, 100);
      return;
    }

    // Add product to order if not already selected
    if (!selectedProducts.includes(found.id)) {
      setSelectedProducts([...selectedProducts, found.id]);
      setQuantities((q) => ({ ...q, [found.id]: qty }));

      // Success feedback
      toast.success(`✅ Added: ${found.name}`, { 
        duration: 1500,
        icon: '🛒'
      });
    } else {
      // Product already in order - increment quantity
      const currentQty = quantities[found.id] || 1;
      const newQty = currentQty + qty;
      
      if (newQty > found.quantity) {
        toast.error(
          `❌ Cannot add more! Stock limit: ${found.quantity} units`,
          { duration: 2000 }
        );
        
        // Clear and continue scanning
        setSearchInput("");
        setIsBarcodeMode(false);
        setTimeout(() => {
          const searchField = document.querySelector('[data-testid="search-input"] input');
          if (searchField) {
            searchField.focus();
          }
        }, 100);
        return;
      }

      setQuantities((q) => ({ ...q, [found.id]: newQty }));
      toast.success(`✅ Updated: ${found.name} (${newQty})`, { 
        duration: 1500,
        icon: '📦'
      });
    }

    // Immediate clear and ready for next scan - this is key for modern POS
    setSearchInput("");
    setIsBarcodeMode(false);
    setBarcodeError("");

    // Auto-focus back to search field for continuous scanning
    setTimeout(() => {
      const searchField = document.querySelector('[data-testid="search-input"] input');
      if (searchField) {
        searchField.focus();
        searchField.placeholder = "Ready for next scan...";
      }
    }, 50); // Very fast refocus for continuous scanning
  };

  // Check for camera support on component mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasCamera = devices.some(
            (device) => device.kind === "videoinput",
          );
          setCameraSupported(hasCamera);
        }
      } catch (error) {
        console.log("Camera not supported:", error);
        setCameraSupported(false);
      }
    };

    checkCameraSupport();
  }, []);

  // Enhanced scan button handler - handles both camera and manual modes
  const handleScanButtonClick = async () => {
    if (isBarcodeMode) {
      // Exit barcode mode
      setIsBarcodeMode(false);
      setShowCameraScanner(false);
      setScannerMode("manual");
      setSearchInput("");
      setBarcodeError("");
      toast("Scanner deactivated");
      return;
    }

    // Check camera availability first
    if (cameraSupported) {
      try {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // Prefer back camera
        });
        stream.getTracks().forEach((track) => track.stop()); // Stop the stream immediately

        // Camera is available, offer choice or go directly to camera
        setShowCameraScanner(true);
        setScannerMode("camera");
        setIsBarcodeMode(true);
        toast.success("Camera scanner activated - point at barcode");
      } catch (error) {
        // Camera permission denied or not available, fall back to manual
        console.log("Camera access denied, falling back to manual:", error);
        setIsBarcodeMode(true);
        setScannerMode("manual");
        setSearchInput("");
        setBarcodeError("");
        toast.success("Manual scanner activated - enter barcode");

        // Auto-focus the search input
        setTimeout(() => {
          const searchInput = document.querySelector(
            '[data-testid="search-input"] input',
          );
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }
    } else {
      // No camera support, use manual mode
      setIsBarcodeMode(true);
      setScannerMode("manual");
      setSearchInput("");
      setBarcodeError("");
      toast.success("Manual scanner activated - enter barcode");

      // Auto-focus the search input
      setTimeout(() => {
        const searchInput = document.querySelector(
          '[data-testid="search-input"] input',
        );
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };

  // Handle successful barcode scan from camera - automatic processing
  const handleCameraScanSuccess = (barcode) => {
    console.log("Camera scan success:", barcode);

    // Validate barcode format
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode || cleanBarcode.length < 4) {
      setBarcodeError("Invalid barcode format - too short");
      toast.error("❌ Invalid barcode format");
      return;
    }

    // Process the barcode immediately - no button press needed
    processBarcodeInput(cleanBarcode);

    // Keep camera scanner open for continuous scanning (modern POS behavior)
    // Don't close the camera - let user scan multiple items
    toast.success("📷 Ready for next scan!", { duration: 1000 });

    // Reset error state but keep scanner active
    setBarcodeError("");
    
    // Brief pause then ready for next scan
    setTimeout(() => {
      setIsBarcodeMode(true); // Keep in barcode mode for continuous scanning
    }, 500);
  };

  // Handle camera scan error or close
  const handleCameraScanClose = () => {
    setShowCameraScanner(false);
    setScannerMode("manual");
    // Keep barcode mode active so user can switch to manual input
    toast("Camera closed - switch to manual input or try again");
  };

  // Keyboard shortcuts for barcode mode
  // Always-on barcode scanner focus management
  useEffect(() => {
    const maintainFocus = () => {
      // Keep the hidden barcode input focused for instant scanning
      if (barcodeInputRef && document.activeElement !== barcodeInputRef) {
        // Only refocus if no other input is actively being used
        const activeElement = document.activeElement;
        const isInputActive = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.tagName === 'SELECT' ||
          activeElement.contentEditable === 'true'
        );
        
        if (!isInputActive) {
          setTimeout(() => {
            if (barcodeInputRef) {
              barcodeInputRef.focus();
            }
          }, 100);
        }
      }
    };

    // Set up focus maintenance
    const focusInterval = setInterval(maintainFocus, 2000); // Check every 2 seconds
    
    // Also maintain focus on various events
    const handleClick = () => setTimeout(maintainFocus, 100);
    const handleKeyDown = (e) => {
      // If user presses any key and no input is focused, ensure barcode scanner gets it
      if (!document.activeElement || document.activeElement === document.body) {
        if (barcodeInputRef) {
          barcodeInputRef.focus();
        }
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(focusInterval);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [barcodeInputRef]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (barcodeTimeout) clearTimeout(barcodeTimeout);
      if (alwaysOnTimeoutRef.current) clearTimeout(alwaysOnTimeoutRef.current);
    };
  }, [barcodeTimeout]);

  // Global keyboard event listener for barcode scanners
  useEffect(() => {
    let barcodeBuffer = "";
    let barcodeTimer = null;

    const handleGlobalKeyDown = (e) => {
      // Toggle scanner mode with Ctrl+B or Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        handleScanButtonClick();
        return;
      }

      // Exit scanner mode with Escape
      if (e.key === "Escape" && (isBarcodeMode || showCameraScanner)) {
        setIsBarcodeMode(false);
        setShowCameraScanner(false);
        setScannerMode("manual");
        setSearchInput("");
        setBarcodeError("");
        toast("Scanner deactivated");
        return;
      }

      // Global barcode detection - capture rapid key sequences from barcode scanners
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'SELECT' ||
        activeElement.contentEditable === 'true'
      );

      // Only capture if no input is focused or if it's our hidden barcode input
      if (!isInputFocused || activeElement === barcodeInputRef) {
        // Clear previous timer
        if (barcodeTimer) {
          clearTimeout(barcodeTimer);
        }

        // Handle Enter key - process accumulated barcode
        if (e.key === "Enter" && barcodeBuffer.trim()) {
          e.preventDefault();
          const barcode = barcodeBuffer.trim();
          
          // Check if it looks like a barcode
          const isLikelyBarcode =
            /^\d{6,14}$/.test(barcode) || 
            /^[A-Z0-9]{6,20}$/.test(barcode) || 
            (barcode.length >= 6 && /^[0-9A-Z]+$/.test(barcode));

          if (isLikelyBarcode) {
            processBarcodeInput(barcode);
          }
          
          barcodeBuffer = "";
          return;
        }

        // Accumulate characters for barcode (alphanumeric only)
        if (/^[a-zA-Z0-9]$/.test(e.key)) {
          barcodeBuffer += e.key.toUpperCase();
          
          // Set timer to clear buffer if no more input (barcode scanners are fast)
          barcodeTimer = setTimeout(() => {
            // If buffer looks like a complete barcode, process it
            const barcode = barcodeBuffer.trim();
            const isLikelyBarcode =
              /^\d{6,14}$/.test(barcode) || 
              /^[A-Z0-9]{6,20}$/.test(barcode) || 
              (barcode.length >= 6 && /^[0-9A-Z]+$/.test(barcode));

            if (isLikelyBarcode && barcode.length >= 6) {
              processBarcodeInput(barcode);
            }
            
            barcodeBuffer = "";
          }, 100); // 100ms timeout - barcode scanners type very fast
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      if (barcodeTimer) clearTimeout(barcodeTimer);
    };
  }, [barcodeInputRef, processBarcodeInput]);

  // Generate a unique order ID when component mounts
  useEffect(() => {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 100); // 0-99
    // setOrderId(`RUO${timestamp}${random.toString().padStart(2, '0')}`); // This line is removed as orderId is now a prop
  }, []);

  // Fetch discount plans
  useEffect(() => {
    fetch("/api/discount-plans")
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          setDiscountPlans(result.data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch discount plans:", err);
      });
  }, []);

  const handleQty = (id, delta) => {
    if (!products.length) return;
    const product = products.find((p) => p.id === id);
    const qty = Math.max(1, (quantities[id] || 1) + delta);

    // Validate against stock
    if (product && qty > product.quantity) {
      toast.error(
        user?.role === "cashier"
          ? "Cannot exceed available stock."
          : `Cannot exceed available stock of ${product.quantity} units.`,
      );
      return;
    }

    setQuantities((prev) => ({ ...prev, [id]: qty }));
  };

  const handleRemove = (id) => {
    setSelectedProducts((prev) => prev.filter((pid) => pid !== id));
    setQuantities((prev) => {
      const q = { ...prev };
      delete q[id];
      return q;
    });
  };

  const handleClearAll = () => {
    setSelectedProducts([]);
    setQuantities({});
  };

  const handleAddCustomer = () => {
    setShowCustomerModal(true);
  };

  const productOptions = React.useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: product.name,
        product,
      })),
    [products],
  );

  const ProductOption = (props) => {
    const { product } = props.data;
    return (
      <components.Option {...props}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{product.name}</div>
            <div className="text-xs text-gray-500">GHS {product.price}</div>
          </div>
          {user?.role !== "cashier" && (
            <div className="text-xs text-gray-400">
              Stock: {product.quantity}
            </div>
          )}
        </div>
      </components.Option>
    );
  };

  const toggleProductSelect = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Check if product is already selected
    if (selectedProducts.includes(productId)) {
      // Remove from selection
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
      return;
    }

    // Check stock before adding
    const currentQty = quantities[productId] || 1;
    if (product.quantity < currentQty) {
      toast.error(
        user?.role === "cashier"
          ? "Insufficient stock!"
          : `Insufficient stock! Only ${product.quantity} units available.`,
      );
      return;
    }

    // Add to selection
    setSelectedProducts((prev) => [...prev, productId]);
  };

  const handlePrintOrder = () => {
    const printReceipt = PrintReceipt({
      orderId: orderId, // Use the passed orderId
      selectedProducts,
      quantities,
      products,
      subtotal,
      tax,
      discount,
      total,
      selectedCustomerId,
      customers,
      paymentData,
    });

    const success = printReceipt.printOrder();
    if (success) {
      toast.success("Print dialog should open shortly...");
    } else {
      toast.error("No products to print");
    }
  };

  // Calculate summary
  const subtotal = selectedProducts.reduce((sum, id) => {
    const product = products.find((p) => p.id === id);
    const qty = quantities[id] || 1;
    return product ? sum + product.price * qty : sum;
  }, 0);

  const totalCost = selectedProducts.reduce((sum, id) => {
    const product = products.find((p) => p.id === id);
    const qty = quantities[id] || 1;
    return product ? sum + (product.cost_price || 0) * qty : sum;
  }, 0);

  const totalProfit = subtotal - totalCost;

  // Calculate tax based on product tax configuration
  const tax = selectedProducts.reduce((sum, id) => {
    const product = products.find((p) => p.id === id);
    const qty = quantities[id] || 1;
    if (!product || !product.tax_percentage || product.tax_percentage <= 0)
      return sum;

    const taxPercentage = Number(product.tax_percentage);
    let itemTax = 0;

    if (product.tax_type === "exclusive") {
      // Tax is added on top of the price
      itemTax = ((product.price * taxPercentage) / 100) * qty;
    } else if (product.tax_type === "inclusive") {
      // Tax is included in the price, so we need to extract it
      const priceWithoutTax = product.price / (1 + taxPercentage / 100);
      itemTax = (product.price - priceWithoutTax) * qty;
    }

    return sum + itemTax;
  }, 0);

  let discount = 0;
  let discountLabel = "No discount";
  let discountType = "";
  if (selectedDiscountId) {
    const discountObj = discounts.find((d) => d.id === selectedDiscountId);
    if (discountObj) {
      discountLabel = discountObj.name || discountObj.label || "Discount";
      discountType =
        discountObj.discount_type || discountObj.type || "percentage";
      if (discountType === "percentage") {
        discount = Math.round(subtotal * (Number(discountObj.value) / 100));
      } else {
        discount = Number(discountObj.value);
      }
    }
  }
  const roundoff = roundoffEnabled ? 0 : 0;
  const total = subtotal + tax - discount + roundoff;

  // Find the selected customer object if selectedCustomerId starts with 'db_'
  const selectedDbCustomer = selectedCustomerId.startsWith("db_")
    ? customers.find((c) => c.id === selectedCustomerId.replace("db_", ""))
    : null;

  return (
    <div
      className={`p-2 sm:p-4 gap-4 sm:gap-6 flex flex-col ${
        mode === "dark" ? "bg-gray-800" : "bg-gray-200"
      } rounded-lg overflow-auto mt-20 sm:mt-20 lg:mt-0 ${className}`}
    >
      <div
        className={`${
          mode === "dark" ? "bg-gray-900" : "bg-white"
        } rounded-lg p-3 sm:p-6`}
      >
        {/* Header */}

        {/* Always-On Barcode Scanner - Hidden but always listening */}
        <input
          ref={(el) => {
            setBarcodeInputRef(el);
            // Auto-focus this field when component mounts
            if (el && !isBarcodeMode) {
              setTimeout(() => el.focus(), 100);
            }
          }}
          type="text"
          value={alwaysOnBarcode}
          onChange={(e) => handleAlwaysOnBarcodeInput(e.target.value)}
          onKeyDown={(e) => {
            // Handle Enter key for immediate processing
            if (e.key === "Enter" && alwaysOnBarcode.trim()) {
              e.preventDefault();
              processBarcodeInput(alwaysOnBarcode.trim());
              setAlwaysOnBarcode("");
            }
            // Prevent other keys from interfering with normal UI
            if (e.key === "Tab" || e.key === "Escape") {
              e.preventDefault();
              // Focus the visible search field instead
              const searchField = document.querySelector('[data-testid="search-input"] input');
              if (searchField) {
                searchField.focus();
              }
            }
          }}
          placeholder="Always-on barcode scanner (hidden)"
          className="absolute -top-96 left-0 opacity-0 pointer-events-none"
          style={{ 
            position: 'absolute',
            top: '-1000px',
            left: '-1000px',
            width: '1px',
            height: '1px',
            opacity: 0,
            zIndex: -1
          }}
          autoComplete="off"
          tabIndex={-1}
        />

        {/* Always-On Scanner Status */}
        {/* <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">
                🔍 Auto-Scanner Ready
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Just scan any barcode - adds instantly!
            </div>
          </div>
        </div> */}

        {/* Customer Info */}

        <div className="flex flex-col sm:flex-row justify-start mb-2 gap-2 sm:gap-6">
          {/* Customer Selection Container - Fixed height */}
          <div className="flex gap-2 rounded-full border px-2 sm:px-4 w-full sm:w-auto h-10 items-center relative">
            <TooltipIconButton
              label="Add Customer"
              mode="light"
              className="rounded-full text-green-500 p-2 hover:text-green-600"
              onClick={handleAddCustomer}
            >
              <Icon icon="mdi:account-plus" className="w-5 h-5" />
            </TooltipIconButton>
            <select
              className={`px-3 w-full bg-transparent border-none outline-none ${
                mode === "dark" ? "text-white" : "text-black"
              }`}
              value={
                selectedCustomerId === "__online__"
                  ? "__online__"
                  : selectedCustomerId.startsWith("db_")
                    ? "customer_db"
                    : selectedCustomerId || ""
              }
              onChange={(e) => {
                console.log("Customer selection changed:", e.target.value);
                if (e.target.value === "__online__") {
                  if (typeof setIsOnlinePurchase === "function")
                    setIsOnlinePurchase(true);
                  setSelectedCustomerId("__online__");
                } else if (e.target.value === "customer_db") {
                  if (typeof setIsOnlinePurchase === "function")
                    setIsOnlinePurchase(false);
                  setSelectedCustomerId("customer_db");
                } else {
                  if (typeof setIsOnlinePurchase === "function")
                    setIsOnlinePurchase(false);
                  setSelectedCustomerId(e.target.value);
                }
              }}
            >
              <option value="">Walk In Customer</option>
              <option value="__online__">Online Purchase</option>
              <option value="customer_db">
                {selectedCustomerId.startsWith("db_")
                  ? customers.find(
                      (c) => c.id === selectedCustomerId.replace("db_", ""),
                    )?.name || "Customer Database"
                  : "Customer Database"}
              </option>
            </select>
            {selectedCustomerId && selectedCustomerId !== "" && (
              <TooltipIconButton
                label="Clear Customer Selection"
                mode="light"
                className="rounded-full text-red-500 p-2 hover:text-red-600"
                onClick={() => {
                  setSelectedCustomerId("");
                  if (typeof setIsOnlinePurchase === "function") {
                    setIsOnlinePurchase(false);
                  }
                  toast.success("Customer selection cleared");
                }}
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </TooltipIconButton>
            )}

            {/* Customer Database Dropdown - Positioned below the customer container */}
            {selectedCustomerId === "customer_db" && (
              <div className="absolute top-full left-0 right-0 mt-1 z-[100]">
                <Select
                  options={customers.map((c) => ({
                    value: c.id,
                    label: `${c.name} - ${c.phone}`,
                  }))}
                  onChange={(option) => {
                    setSelectedCustomerId(
                      option ? `db_${option.value}` : "customer_db",
                    );
                  }}
                  isClearable
                  placeholder="Search customer..."
                  classNamePrefix="react-select"
                  autoFocus
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "40px",
                      borderRadius: "1rem",
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                      maxHeight: 200,
                    }),
                  }}
                />
              </div>
            )}
          </div>

          {/* Search Field Container */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-[2] min-w-0 sm:min-w-[450px] mb-8 z-10">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon
                  icon={
                    isBarcodeMode
                      ? "tabler:barcode"
                      : "material-symbols:search-rounded"
                  }
                  className={`w-5 h-5 ${isBarcodeMode ? "text-green-500" : ""}`}
                />
              </span>

              <div className="w-full relative" data-testid="search-input">
                {/* Unified Scan Button - Handles both camera and manual scanning */}
                <button
                  type="button"
                  onClick={handleScanButtonClick}
                  className={`group absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                    isBarcodeMode
                      ? scannerMode === "camera"
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200"
                        : "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-200"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md"
                  }`}
                  title={
                    isBarcodeMode
                      ? `Exit scanner mode (Press ${keyboardShortcut})`
                      : cameraSupported
                        ? `Activate scanner - Camera or Manual (Press ${keyboardShortcut})`
                        : `Activate manual scanner (Press ${keyboardShortcut})`
                  }
                >
                  <Icon
                    icon={
                      isBarcodeMode
                        ? scannerMode === "camera"
                          ? "material-symbols:camera-alt-rounded"
                          : "material-symbols:qr-code-scanner"
                        : cameraSupported
                          ? "material-symbols:qr-code-scanner-rounded"
                          : "material-symbols:qr-code-scanner-rounded"
                    }
                    className={`w-4 h-4 ${isBarcodeMode ? "animate-pulse" : ""}`}
                  />
                  <span className="text-xs font-medium hidden sm:inline">
                    {isBarcodeMode
                      ? scannerMode === "camera"
                        ? "Camera..."
                        : "Manual..."
                      : "Scan"}
                  </span>
                  {!isBarcodeMode && (
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {cameraSupported
                        ? "📷 Camera or ⌨️ Manual"
                        : keyboardShortcut}
                    </span>
                  )}
                </button>
                <Select
                  options={productOptions}
                  components={{ Option: ProductOption }}
                  placeholder={
                    isBarcodeMode
                      ? "🔍 Auto-scanning... Scan barcode to add instantly"
                      : "Search product or scan barcode"
                  }
                  isClearable
                  isSearchable
                  value={
                    searchInput
                      ? { value: searchInput, label: searchInput }
                      : null
                  }
                  onInputChange={(inputValue, { action }) => {
                    if (action === "input-change") {
                      handleSearchInputChange(inputValue);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle Enter key for barcode input
                    if (
                      e.key === "Enter" &&
                      searchInput.trim() &&
                      isBarcodeMode
                    ) {
                      e.preventDefault();
                      processBarcodeInput(searchInput.trim());
                    }
                  }}
                  onChange={(option) => {
                    if (option && option.product) {
                      toggleProductSelect(option.product.id);
                      setSearchInput(""); // Clear input after selection
                    }
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "1rem",
                      minHeight: "38px",
                      paddingLeft: "2.5rem",
                      paddingRight: "5rem",
                      fontSize: "1rem",
                      boxShadow: "none",
                      borderColor: isBarcodeMode
                        ? "#10b981"
                        : mode === "dark"
                          ? "#4b5563"
                          : "#cbd5e1",
                      border: isBarcodeMode
                        ? "2px solid #10b981"
                        : barcodeError
                          ? "2px solid #ef4444"
                          : base.border,
                      boxShadow: isBarcodeMode
                        ? "0 0 0 3px rgba(16, 185, 129, 0.1)"
                        : barcodeError
                          ? "0 0 0 3px rgba(239, 68, 68, 0.1)"
                          : "none",
                      backgroundColor: mode === "dark" ? "transparent" : "#fff",
                      color: mode === "dark" ? "#f9fafb" : "#222",
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 100,
                      maxHeight: 320,
                      backgroundColor: mode === "dark" ? "#374151" : "#fff",
                      border:
                        mode === "dark"
                          ? "1px solid #4b5563"
                          : "1px solid #e5e7eb",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused
                        ? mode === "dark"
                          ? "#4b5563"
                          : "#e0f2fe"
                        : mode === "dark"
                          ? "#374151"
                          : "#fff",
                      color: mode === "dark" ? "#f9fafb" : "#222",
                      cursor: "pointer",
                      padding: "12px 16px",
                      fontSize: "1rem",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: mode === "dark" ? "#f9fafb" : "#222",
                    }),
                    input: (base) => ({
                      ...base,
                      color: mode === "dark" ? "#f9fafb" : "#222",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: mode === "dark" ? "#9ca3af" : "#6b7280",
                    }),
                  }}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Icon
                    icon="material-symbols:search-rounded"
                    className="w-5 h-5"
                  />
                </span>
              </div>

              {/* Enhanced Scanner status indicator with mode-specific styling */}
              {isBarcodeMode && (
                <div
                  className={`flex items-center gap-2 absolute -bottom-6 left-0 text-xs font-medium animate-fade-in ${
                    scannerMode === "camera"
                      ? "text-purple-600"
                      : "text-green-600"
                  }`}
                >
                  <div className="relative">
                    <Icon
                      icon={
                        scannerMode === "camera"
                          ? "material-symbols:camera-alt-rounded"
                          : "material-symbols:qr-code-scanner-rounded"
                      }
                      className="w-5 h-5 animate-pulse"
                    />
                    <div
                      className={`absolute inset-0 rounded-full opacity-25 animate-ping ${
                        scannerMode === "camera"
                          ? "bg-purple-400"
                          : "bg-green-400"
                      }`}
                    ></div>
                  </div>
                  <span className="animate-pulse">
                    {scannerMode === "camera"
                      ? "📷 Auto-scan active - point at barcode to add instantly"
                      : "⌨️ Auto-scan active - enter barcode to add instantly"}
                  </span>
                  <div className="flex space-x-1">
                    <div
                      className={`w-1 h-1 rounded-full animate-bounce ${
                        scannerMode === "camera"
                          ? "bg-purple-500"
                          : "bg-green-500"
                      }`}
                    ></div>
                    <div
                      className={`w-1 h-1 rounded-full animate-bounce ${
                        scannerMode === "camera"
                          ? "bg-purple-500"
                          : "bg-green-500"
                      }`}
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className={`w-1 h-1 rounded-full animate-bounce ${
                        scannerMode === "camera"
                          ? "bg-purple-500"
                          : "bg-green-500"
                      }`}
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Barcode Error State */}
              {barcodeError && (
                <div className="flex items-center gap-2 absolute -bottom-6 left-0 text-xs text-red-600 font-medium animate-fade-in">
                  <Icon
                    icon="material-symbols:error-outline"
                    className="w-4 h-4"
                  />
                  <span>{barcodeError}</span>
                  <button
                    onClick={() => setBarcodeError("")}
                    className="ml-2 text-red-400 hover:text-red-600"
                  >
                    <Icon icon="material-symbols:close" className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Help text - positioned below scanner indicators */}
              <div
                className={`absolute text-xs text-gray-500 flex items-center gap-2 ${
                  isBarcodeMode || barcodeError ? "-bottom-12" : "-bottom-6"
                } left-0`}
              >
                <Icon icon="mdi:information-outline" className="w-4 h-4" />
                <span>
                  ⚡ Auto-scan: Barcode! Click "Scan" for{" "}
                  {cameraSupported ? "camera/manual" : "manual"} or press {keyboardShortcut}.
                </span>
              </div>

              {/* Manual barcode input when in barcode mode */}
              {isBarcodeMode && (
                <div
                  className={`absolute left-0 right-0 ${
                    barcodeError ? "-bottom-20" : "-bottom-16"
                  }`}
                >
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Or manually enter barcode..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchInput.trim()) {
                          processBarcodeInput(searchInput.trim());
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <button
                      onClick={() => {
                        if (searchInput.trim()) {
                          processBarcodeInput(searchInput.trim());
                        }
                      }}
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* <TooltipIconButton
              label="Open Barcode Scanner"
              mode={mode}
              className={`ml-2 p-3 rounded-2xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 touch-manipulation active:scale-95 ${
                mode === "dark"
                  ? "bg-gray-800 hover:bg-gray-700 border-gray-600"
                  : "bg-white hover:bg-blue-50 border-gray-300"
              }`}
              onClick={() => setShowBarcodeModal(true)}
            >
              <Icon icon="tabler:barcode" className="w-6 h-6" />
            </TooltipIconButton> */}

            {/* <TooltipIconButton
              label="Refresh Product List"
              mode={mode}
              className={`ml-2 p-3 rounded-2xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 touch-manipulation active:scale-95 ${
                mode === "dark"
                  ? "bg-gray-800 hover:bg-gray-700 border-gray-600"
                  : "bg-white hover:bg-blue-50 border-gray-300"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.loading("Refreshing products...", {
                  id: "reload-products",
                });
                setReloadFlag((f) => f + 1);
              }}
            >
              <Icon
                icon="material-symbols:refresh"
                className={`w-6 h-6 ${
                  mode === "dark" ? "text-blue-400" : "text-blue-800"
                }`}
              />
            </TooltipIconButton> */}
          </div>
        </div>

        {/* Order Details */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {/* <div
              className={`font-bold ${
                mode === "dark" ? "text-white" : "text-black"
              }`}
            >
              Order Details
            </div> */}
          </div>
          <div
            className={`border rounded-lg overflow-hidden max-h-[500px] h-[350px] overflow-y-auto ${
              mode === "dark" ? "border-gray-600" : "border-gray-300"
            }`}
          >
            <div
              className={`grid grid-cols-4 items-center text-sm font-bold px-4 py-2 ${
                mode === "dark"
                  ? "bg-gray-800 text-gray-300"
                  : "bg-gray-50 text-gray-600"
              }`}
            >
              <div>Item</div>
              <div className="text-center">Quantity</div>
              <div className="text-right">Sub Total</div>
              <div
                className="text-center flex items-center justify-center cursor-pointer"
                onClick={handleClearAll}
              >
                <Icon
                  icon="ic:baseline-clear"
                  className={`w-8 h-8 ${
                    mode === "dark" ? "text-gray-300" : ""
                  }`}
                />
              </div>
            </div>
            {selectedProducts.length === 0 && (
              <div
                className={`text-center py-6 ${
                  mode === "dark" ? "text-gray-500" : "text-gray-400"
                }`}
              >
                No products selected.
              </div>
            )}
            {selectedProducts.map((id, index) => {
              const product = products.find((p) => p.id === id);
              if (!product) return null;
              const qty = quantities[id] || 1;
              return (
                <div
                  key={id}
                  className={`grid grid-cols-4 items-center px-4 py-2 border-t text-sm ${
                    mode === "dark" ? "border-gray-600" : "border-gray-200"
                  } ${
                    index % 2 === 0
                      ? mode === "dark"
                        ? "bg-gray-800"
                        : "bg-white"
                      : mode === "dark"
                        ? "bg-gray-750"
                        : "bg-blue-50"
                  } hover:${
                    mode === "dark" ? "bg-gray-700" : "bg-blue-100"
                  } transition-colors`}
                >
                  <div className="flex items-center gap-2 uppercase">
                    <span
                      className={mode === "dark" ? "text-white" : "text-black"}
                    >
                      {product.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleQty(id, -1)}
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-base font-bold transition ${
                        mode === "dark"
                          ? "text-gray-400 bg-gray-700 hover:bg-blue-600 hover:text-white"
                          : "text-gray-500 bg-gray-100 hover:bg-blue-100 hover:text-blue-700"
                      }`}
                    >
                      -
                    </button>
                    <span
                      className={`w-6 text-center ${
                        mode === "dark" ? "text-white" : "text-black"
                      }`}
                    >
                      {qty}
                    </span>
                    <button
                      onClick={() => handleQty(id, 1)}
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-base font-bold transition ${
                        mode === "dark"
                          ? "text-gray-400 bg-gray-700 hover:bg-blue-600 hover:text-white"
                          : "text-gray-500 bg-gray-100 hover:bg-blue-100 hover:text-blue-700"
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <div
                    className={`text-right font-semibold ${
                      mode === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    GHS {(product.price * qty).toLocaleString()}
                  </div>
                  <div className="flex items-center justify-center">
                    <Icon
                      icon="ic:baseline-clear"
                      className={`w-8 h-8 cursor-pointer ${
                        mode === "dark"
                          ? "text-gray-500 hover:text-red-400"
                          : "text-red-600 hover:text-red-500"
                      }`}
                      onClick={() => handleRemove(id)}
                    />
                  </div>

                  <div
                    className={`text-xs mt-1 col-span-4 ${
                      mode === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {user?.role !== "cashier" && (
                      <>Stock: {product.quantity} |</>
                    )}
                    {/* Ordered: {qty} */}
                    {qty > product.quantity && user?.role !== "cashier" && (
                      <span className="text-red-500 ml-1">
                        ⚠️ Exceeds stock
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Discount Selector */}

          {/* Add Discount Modal */}
          {showAddDiscountModal && (
            <SimpleModal
              isOpen={true}
              onClose={() => setShowAddDiscountModal(false)}
              title="Quick Discount"
              mode="light"
              width="max-w-md"
            >
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                      newDiscountType === "percentage"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setNewDiscountType("percentage")}
                  >
                    Percentage
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                      newDiscountType === "fixed"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setNewDiscountType("fixed")}
                  >
                    Fixed Amount
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold">
                    {newDiscountType === "percentage"
                      ? "Discount Percentage"
                      : "Discount Amount (GHS)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={newDiscountType === "percentage" ? "100" : "999999"}
                    step={newDiscountType === "percentage" ? "0.1" : "0.01"}
                    className="w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder={
                      newDiscountType === "percentage" ? "e.g., 10" : "e.g., 50"
                    }
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    autoFocus
                  />
                </div>

                {discountValue && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      {newDiscountType === "percentage" ? (
                        <>
                          <span className="font-semibold">
                            {discountValue}%
                          </span>{" "}
                          off =
                          <span className="font-semibold text-red-600">
                            {" "}
                            -GHS{" "}
                            {((subtotal * Number(discountValue)) / 100).toFixed(
                              2,
                            )}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            New total: GHS{" "}
                            {(
                              subtotal -
                              (subtotal * Number(discountValue)) / 100
                            ).toFixed(2)}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">
                            GHS {discountValue}
                          </span>{" "}
                          off =
                          <span className="font-semibold text-red-600">
                            {" "}
                            -GHS {Number(discountValue).toFixed(2)}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            New total: GHS{" "}
                            {Math.max(
                              0,
                              subtotal - Number(discountValue),
                            ).toFixed(2)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    onClick={() => setShowAddDiscountModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!discountValue || Number(discountValue) <= 0}
                    onClick={async () => {
                      try {
                        // First, fetch all discounts from database to check for existing ones
                        const fetchRes = await fetch("/api/discounts");
                        const fetchJson = await fetchRes.json();
                        const allDiscounts = fetchJson.success
                          ? fetchJson.data
                          : [];

                        // Look for existing discount with same value and type
                        const existing = allDiscounts.find((d) => {
                          const valueMatch =
                            Number(d.value) === Number(discountValue);
                          const typeMatch =
                            (d.discount_type || d.type || "").toLowerCase() ===
                            newDiscountType.toLowerCase();
                          const storeMatch =
                            !user?.store_id || // If user has no store, match any
                            !d.store_id || // If discount is global, match any
                            d.store_id === user.store_id; // Otherwise, must match
                          return valueMatch && typeMatch && storeMatch;
                        });

                        if (existing) {
                          // Use existing discount
                          setSelectedDiscountId(existing.id);
                          setShowAddDiscountModal(false);
                          setDiscountValue("");
                          setNewDiscountType("percentage");
                          // Update local discounts array if needed
                          if (typeof setDiscounts === "function") {
                            setDiscounts(allDiscounts);
                          }
                          toast.success("Existing discount applied!");
                          return;
                        }

                        // Create new discount only if none exists
                        const discountData = {
                          name: `${
                            newDiscountType === "percentage"
                              ? discountValue + "%"
                              : "GHS " + discountValue
                          } Discount`,
                          value: Number(discountValue),
                          discount_type: newDiscountType,
                          store_id: user?.store_id || null,
                        };

                        const response = await fetch("/api/discounts", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(discountData),
                        });
                        const result = await response.json();

                        if (response.ok && result.success && result.data) {
                          setShowAddDiscountModal(false);
                          setDiscountValue("");
                          setNewDiscountType("percentage");
                          if (typeof setDiscounts === "function") {
                            setDiscounts((prev) => [result.data, ...prev]);
                          }
                          if (typeof setSelectedDiscountId === "function") {
                            setSelectedDiscountId(result.data.id);
                          }
                          toast.success("New discount created and applied!");
                        } else {
                          toast.error(
                            result.error ||
                              result.message ||
                              "Failed to create discount",
                          );
                        }
                      } catch (err) {
                        console.error("Discount creation error:", err);
                        toast.error(err.message || "Failed to apply discount");
                      }
                    }}
                  >
                    Apply Discount
                  </button>
                </div>
              </div>
            </SimpleModal>
          )}
        </div>
        {/* Payment Summary */}
        <div className="mb-2">
          {/* <div
            className={`font-bold mb-2 ${
              mode === "dark" ? "text-white" : "text-black"
            }`}
          >
            Payment Summary
          </div> */}

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-20 items-center">
            <div
              className={`flex justify-between items-center text-lg font-semibold ${
                mode === "dark" ? "text-gray-400" : "text-black"
              }`}
            >
              <span>Items: {selectedProducts.length}</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span
                  className={
                    mode === "dark"
                      ? "text-white"
                      : "flex items-center justify-center text-black"
                  }
                >
                  Discount: [
                  {selectedDiscountId ? (
                    <Icon
                      icon="ic:baseline-minus"
                      className="w-5 h-5 cursor-pointer text-black hover:text-red-700"
                      onClick={() => {
                        setSelectedDiscountId("");
                        toast.success("Discount removed!");
                      }}
                    />
                  ) : (
                    <Icon
                      icon="ic:baseline-plus"
                      className="w-5 h-5 cursor-pointer"
                      onClick={() => setShowAddDiscountModal(true)}
                    />
                  )}
                  ]{""}
                </span>
                <span className="ml-2 text-red-500">
                  - GHS {discount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className={mode === "dark" ? "text-white" : "text-black"}>
                Total: {""}
              </span>
              <span className="ml-2 text-blue-900">
                GHS {total.toLocaleString()}
              </span>
            </div>

            {/* {totalProfit > 0 && user?.role !== "cashier" && (
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-medium">
                  Estimated Profit
                </span>
                <span className="text-green-600 font-medium">
                  GHS {totalProfit.toLocaleString()}
                </span>
              </div>
            )} */}
          </div>
        </div>
        <div
          className={`border-t my-2 ${
            mode === "dark" ? "border-gray-600" : "border-gray-200"
          }`}
        ></div>
      </div>

      {/* Payment Section */}

      <div className="grid grid-cols-3 gap-3">
        {paymentMethods.map((pm) => {
          const getButtonStyle = () => {
            if (selectedProducts.length === 0) {
              return "bg-gray-300 text-gray-500 cursor-not-allowed";
            }

            switch (pm.key) {
              case "cash":
                return "bg-green-500 border border-green-600 text-white hover:bg-green-600";
              case "momo":
                return "bg-blue-500 border border-blue-600 text-white hover:bg-blue-600";
              case "split":
                return "bg-orange-400 border border-orange-600 text-white hover:bg-orange-500";
              default:
                return "bg-blue-500 border border-blue-600 text-white hover:bg-blue-600";
            }
          };

          return (
            <button
              key={pm.key}
              onClick={() => {
                if (selectedProducts.length > 0) {
                  setSelectedPaymentType(pm.key);
                  setShowPaymentModal(true);
                }
              }}
              disabled={selectedProducts.length === 0}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg py-4 font-semibold transition ${getButtonStyle()}`}
            >
              <Icon icon={pm.icon} className="w-8 h-8" />
              <span className="text-sm font-bold">{pm.label}</span>
            </button>
          );
        })}
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <AddEditModal
          type="customers"
          mode="light"
          item={null}
          categories={[]}
          onClose={() => setShowCustomerModal(false)}
          onSave={async (customerData) => {
            try {
              const response = await fetch("/api/customers", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(customerData),
              });
              const { data, error } = await response.json();
              if (error) throw error;
              setCustomers((prev) => [data[0], ...prev]);
              toast.success("Customer added successfully!");
              setShowCustomerModal(false);
              setSelectedCustomerId(data[0].id); // auto-select new customer
            } catch (err) {
              toast.error(err.message || "Failed to add customer");
            }
          }}
        />
      )}

      {showBarcodeModal && (
        <SimpleModal
          isOpen={true}
          onClose={() => {
            setShowBarcodeModal(false);
            setBarcodeInput("");
            setBarcodeProduct(null);
            setBarcodeError("");
            setBarcodeQty(1);
          }}
          title="Add Product by Barcode"
          mode="light"
          width="max-w-md"
        >
          <div className="space-y-4">
            <label className="block font-semibold">Enter Barcode</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={barcodeInput}
              onChange={(e) => {
                const value = e.target.value;
                setBarcodeInput(value);
                setBarcodeError("");
                if (!value.trim()) {
                  setBarcodeProduct(null);
                  setBarcodeError("");
                  return;
                }
                const found = products.find((p) => p.barcode === value.trim());
                if (!found) {
                  setBarcodeProduct(null);
                  setBarcodeError("No product found with this barcode.");
                } else {
                  setBarcodeProduct(found);
                  setBarcodeQty(quantities[found.id] || 1);
                  setBarcodeError("");

                  // Auto-add product to order list
                  const qty = quantities[found.id] || 1;
                  if (qty > found.quantity) {
                    toast.error(
                      user?.role === "cashier"
                        ? "Cannot add items. Insufficient stock."
                        : `Cannot add ${qty} units. Only ${found.quantity} units available in stock.`,
                    );
                    return;
                  }

                  if (!selectedProducts.includes(found.id)) {
                    setSelectedProducts([...selectedProducts, found.id]);
                    setQuantities((q) => ({ ...q, [found.id]: qty }));
                  } else {
                    setQuantities((currentQuantities) => {
                      const newQty = (currentQuantities[found.id] || 1) + qty;
                      if (newQty > found.quantity) {
                        toast.error(
                          user?.role === "cashier"
                            ? "Cannot add more items. Insufficient stock."
                            : `Cannot add ${qty} more units. Total would exceed available stock of ${found.quantity} units.`,
                        );
                        return currentQuantities; // Return unchanged quantities
                      }
                      return { ...currentQuantities, [found.id]: newQty };
                    });
                    return; // Exit early to prevent the success toast and modal close
                  }

                  // Play beep sound and show success message
                  playBellBeep();
                  toast.success(`Added ${found.name} to order list!`);
                  setShowBarcodeModal(false);
                  setBarcodeInput("");
                  setBarcodeProduct(null);
                  setBarcodeError("");
                  setBarcodeQty(1);
                }
              }}
              placeholder="Scan or enter barcode"
              autoFocus
            />
            {barcodeError && (
              <div className="text-red-500 text-sm">{barcodeError}</div>
            )}
          </div>
          {barcodeProduct && (
            <div className="mt-6 p-4 border rounded bg-gray-50">
              <div className="font-bold mb-2">{barcodeProduct.name}</div>
              <div className="mb-2">
                Price: GHS {barcodeProduct.price?.toLocaleString()}
              </div>
              {user?.role !== "cashier" && (
                <div className="mb-2">Stock: {barcodeProduct.quantity}</div>
              )}
              <div className="mb-2 flex items-center gap-2">
                <span>Quantity:</span>
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 rounded"
                  onClick={() => setBarcodeQty((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={barcodeProduct.quantity}
                  value={barcodeQty}
                  onChange={(e) => setBarcodeQty(Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1"
                />
                <button
                  type="button"
                  className="px-2 py-1 bg-gray-200 rounded"
                  onClick={() =>
                    setBarcodeQty((q) =>
                      Math.min(barcodeProduct.quantity, q + 1),
                    )
                  }
                >
                  +
                </button>
              </div>
              <button
                className="w-full bg-green-600 text-white rounded py-2 font-semibold mt-2"
                onClick={() => {
                  if (barcodeQty > barcodeProduct.quantity) {
                    toast.error(
                      user?.role === "cashier"
                        ? "Cannot add items. Insufficient stock."
                        : `Cannot add ${barcodeQty} units. Only ${barcodeProduct.quantity} units available in stock.`,
                    );
                    return;
                  }

                  if (!selectedProducts.includes(barcodeProduct.id)) {
                    setSelectedProducts([
                      ...selectedProducts,
                      barcodeProduct.id,
                    ]);
                    setQuantities((q) => ({
                      ...q,
                      [barcodeProduct.id]: barcodeQty,
                    }));
                  } else {
                    const newQty = (q[barcodeProduct.id] || 1) + barcodeQty;
                    if (newQty > barcodeProduct.quantity) {
                      toast.error(
                        `Cannot add ${barcodeQty} more units. Total would exceed available stock of ${barcodeProduct.quantity} units.`,
                      );
                      return;
                    }
                    setQuantities((q) => ({
                      ...q,
                      [barcodeProduct.id]: newQty,
                    }));
                  }
                  // Play beep sound and show success message
                  playBellBeep();
                  setShowBarcodeModal(false);
                  setBarcodeInput("");
                  setBarcodeProduct(null);
                  setBarcodeError("");
                  setBarcodeQty(1);
                  toast.success("Product added to order list!");
                }}
              >
                Add to Order List
              </button>
            </div>
          )}
        </SimpleModal>
      )}

      {/* Payment Form Modal */}
      <PaymentForm
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayment("");
        }}
        paymentType={selectedPaymentType}
        total={total}
        orderId={orderId}
        onPaymentComplete={handlePaymentComplete}
        customer={(() => {
          const customerInfo =
            selectedCustomerId === "__online__"
              ? { id: "__online__", name: "Online Purchase" }
              : selectedCustomerId.startsWith("db_")
                ? customers.find(
                    (c) => c.id === selectedCustomerId.replace("db_", ""),
                  )
                : selectedCustomerId
                  ? { id: selectedCustomerId, name: selectedCustomerId }
                  : null;
          console.log("PaymentForm customer prop:", {
            selectedCustomerId,
            customerInfo,
            isOnlinePurchase,
          });
          return customerInfo;
        })()}
        customers={customers}
        onCustomerChange={handleCustomerChange}
        user={allUsers.find((u) => u.id === user?.id) || user}
        allUsers={allUsers}
        isOnlinePurchase={isOnlinePurchase}
        products={products.filter((p) => selectedProducts.includes(p.id))}
        quantities={quantities}
      />

      {/* Receipt Preview Modal */}
      <ReceiptPreviewModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setReceiptData(null);
        }}
        receiptData={receiptData}
      />

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScanner
        isOpen={showCameraScanner}
        onClose={handleCameraScanClose}
        onScanSuccess={handleCameraScanSuccess}
        mode={mode}
      />
    </div>
  );
};

export default PosOrderList;

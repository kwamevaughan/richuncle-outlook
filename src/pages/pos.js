import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import PosHeader from "@/layouts/posHeader";
import { useState, useEffect, useCallback, useMemo } from "react";
import PosProductList from "@/components/PosProductList";
import PosOrderList from "@/components/PosOrderList";
import { Icon } from "@iconify/react";
import PosFooterActions from "@/components/PosFooterActions";
import ModernOrderReceipt from "@/components/ModernOrderReceipt";



import PrintReceipt from "@/components/PrintReceipt";
import OrderHistoryModal from "@/components/OrderHistoryModal";
import { ModalProvider, useModal } from "@/components/ModalContext";
import SimpleModal from "@/components/SimpleModal";
import ReactDOM from "react-dom";
import CashRegisterModal from "@/components/CashRegisterModal";
import PaymentForm from "@/components/PaymentForm";
import useUsers from "../hooks/useUsers";
import ReceiptPreviewModal from "@/components/ReceiptPreviewModal";
import Select from 'react-select';
import SalesReturnModals from "@/components/SalesReturnModals";
import SalesReturnItemsEditor from "@/components/SalesReturnItemsEditor";
import { useRouter } from "next/router";

export default function POS({ mode = "light", toggleMode, ...props }) {
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState("");
  const [roundoffEnabled, setRoundoffEnabled] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [reloadProducts, setReloadProducts] = useState(0);
  const [lastOrderData, setLastOrderData] = useState(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showRecentTransactions, setShowRecentTransactions] = useState(false);
  const [showNoOrderModal, setShowNoOrderModal] = useState(false);
  const [showCashRegister, setShowCashRegister] = useState(false);
  const [showModernReceipt, setShowModernReceipt] = useState(false);
  const [modernReceiptData, setModernReceiptData] = useState(null);
  const [selectedRegister, setSelectedRegister] = useState(null);

  // Check for open cash register session for all users
  const [hasOpenSession, setHasOpenSession] = useState(true);
  const [sessionCheckLoading, setSessionCheckLoading] = useState(false);
  const [autoShowRegister, setAutoShowRegister] = useState(false);
  const checkSession = async () => {
    setSessionCheckLoading(true);
    // Check for open session for all users (cashiers, managers, admins)
    const res = await fetch('/api/cash-register-sessions?status=open');
    const data = await res.json();
    setHasOpenSession(data.success && data.data && data.data.length > 0);
    if (!(data.success && data.data && data.data.length > 0)) {
      import('react-hot-toast').then(({ toast }) => toast.error('You must open a cash register before making sales.'));
      setAutoShowRegister(true);
    } else {
      setAutoShowRegister(false);
    }
    setSessionCheckLoading(false);
  };
  useEffect(() => { checkSession(); }, [user]);

  useEffect(() => {
    async function fetchDiscounts() {
      try {
        const response = await fetch('/api/discounts');
        const result = await response.json();
        if (result.success) {
          const activeDiscounts = (result.data || []).filter(d => d.is_active);
          setDiscounts(activeDiscounts);
        }
      } catch (err) {
        console.error("Failed to fetch discounts:", err);
      }
    }
    fetchDiscounts();
  }, []);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch('/api/customers');
        const result = await response.json();
        if (result.success) {
          const activeCustomers = (result.data || []).filter(c => c.is_active).sort((a, b) => a.name.localeCompare(b.name));
          setCustomers(activeCustomers);
        }
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      }
    }
    fetchCustomers();
  }, []);

  // Calculate total for footer
  const calculateTotal = () => {
    const subtotal = selectedProducts.reduce((sum, id) => {
      const product = products.find(p => p.id === id);
      const qty = quantities[id] || 1;
      return product ? sum + (product.price * qty) : sum;
    }, 0);
    
    // Calculate discount
    let discount = 0;
    if (selectedDiscountId) {
      const discountObj = discounts.find(d => d.id === selectedDiscountId);
      if (discountObj) {
        const discountType = discountObj.discount_type || discountObj.type || "percentage";
        if (discountType === "percentage") {
          discount = Math.round(subtotal * (Number(discountObj.value) / 100));
        } else {
          discount = Number(discountObj.value);
        }
      }
    }
    
    // Calculate tax based on product tax configuration
    const tax = selectedProducts.reduce((sum, id) => {
      const product = products.find(p => p.id === id);
      const qty = quantities[id] || 1;
      if (!product || !product.tax_percentage || product.tax_percentage <= 0) return sum;
      
      const taxPercentage = Number(product.tax_percentage);
      let itemTax = 0;
      
      if (product.tax_type === 'exclusive') {
        // Tax is added on top of the price
        itemTax = (product.price * taxPercentage / 100) * qty;
      } else if (product.tax_type === 'inclusive') {
        // Tax is included in the price, so we need to extract it
        const priceWithoutTax = product.price / (1 + taxPercentage / 100);
        itemTax = (product.price - priceWithoutTax) * qty;
      }
      
      return sum + itemTax;
    }, 0);
    
    const roundoff = roundoffEnabled ? 0 : 0; // For now, roundoff is 0
    
    // Calculate total
    const total = subtotal + tax - discount + roundoff;
    return total;
  };

  const totalPayable = calculateTotal();

  // Handler to print last receipt
  const handlePrintLastReceipt = useCallback(() => {
    if (!lastOrderData) {
      setShowNoOrderModal(true);
      return;
    }
    
    console.log('Printing last receipt with data:', lastOrderData);
    
    // Prepare data for PrintReceipt
    const printReceipt = PrintReceipt({
      orderId: lastOrderData.id,
      selectedProducts: lastOrderData.items?.map(item => item.productId) || [],
      quantities: lastOrderData.items?.reduce((acc, item) => {
        acc[item.productId] = item.quantity;
        return acc;
      }, {}) || {},
      products: lastOrderData.items?.map(item => ({
        id: item.productId,
        name: item.name,
        price: item.price
      })) || [],
      subtotal: lastOrderData.subtotal || 0,
      tax: lastOrderData.tax || 0,
      discount: lastOrderData.discount || 0,
      total: lastOrderData.total || 0,
      selectedCustomerId: lastOrderData.customer_id || lastOrderData.customerId || '',
      customers: customers,
      paymentData: lastOrderData.payment || lastOrderData.payment_data || {},
      order: lastOrderData,
      originalTimestamp: lastOrderData.timestamp
    });
    printReceipt.printOrder();
  }, [lastOrderData, customers]);

  // Add at the top of the POS component, after other state:
  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [lastPaymentData, setLastPaymentData] = useState(null);

  // Handler to open payment modal with selected type
  const handlePaymentSelection = (paymentMethod) => {
    if (paymentData && paymentData.paymentType !== paymentMethod) {
      setPaymentData(null);
    }
    setSelectedPayment(paymentMethod);
    setSelectedPaymentType(paymentMethod);
    setShowPaymentModal(true);
  };

  // Handler for when payment is completed
  const handlePaymentComplete = (paymentInfo) => {
    setPaymentData(paymentInfo);
    setShowPaymentModal(false);
    // Optionally show a toast here if needed
  };

  // Add orderId state at the top of POS:
  const [orderId, setOrderId] = useState("");
  // Generate a unique order ID when POS mounts or when an order is finalized:
  useEffect(() => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100);
    setOrderId(`RUO${timestamp}${random.toString().padStart(2, '0')}`);
  }, []);

  // On POS page load, restore lastOrderData from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('lastOrderData');
    if (saved) {
      const parsedData = JSON.parse(saved);
      console.log('Loaded lastOrderData from localStorage:', parsedData);
      setLastOrderData(parsedData);
    }
  }, []);

  // Sales Return modal state (move above all useEffects that use it)
  const [showSalesReturnModal, setShowSalesReturnModal] = useState(false);
  const [salesReturnReference, setSalesReturnReference] = useState("");
  const [salesReturnLineItems, setSalesReturnLineItems] = useState([]);
  const [salesReturnProducts, setSalesReturnProducts] = useState([]);
  const [salesReturnReferenceOrderProducts, setSalesReturnReferenceOrderProducts] = useState([]);

  // Memoize the header component to prevent unnecessary re-renders
  const headerComponent = useMemo(() => {
    return (headerProps) => (
      <PosHeader
        {...headerProps}
        printLastReceipt={handlePrintLastReceipt}
        lastOrderData={lastOrderData}
        onOpenOrderHistory={() => setShowOrderHistory(true)}
        showCashRegister={showCashRegister}
        setShowCashRegister={setShowCashRegister}
        showSalesReturnModal={showSalesReturnModal}
        setShowSalesReturnModal={setShowSalesReturnModal}
      />
    );
  }, [handlePrintLastReceipt, lastOrderData, setShowOrderHistory, showCashRegister, setShowCashRegister, showSalesReturnModal, setShowSalesReturnModal]);

  // Memoize the onOrderComplete callback
  // When an order is finalized (in handleOrderComplete), generate a new orderId for the next order:
  const handleOrderComplete = useCallback((orderData) => {
    setReloadProducts(r => r + 1);
    setLastOrderData(orderData);
    localStorage.setItem('lastOrderData', JSON.stringify(orderData));
    // Generate new orderId for next order
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100);
    setOrderId(`RUO${timestamp}${random.toString().padStart(2, '0')}`);
  }, []);

  const { users: allUsers } = useUsers();

  // Add state at the top:
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Update processCompleteTransaction to accept paymentInfo
  const processCompleteTransaction = async (paymentInfo) => {
    if (!paymentInfo) {
      import('react-hot-toast').then(({ toast }) => toast.error('Please complete payment details first'));
      return;
    }
    if (selectedProducts.length === 0) {
      import('react-hot-toast').then(({ toast }) => toast.error('Please add products to the order'));
      return;
    }
    let orderData = null;
    let paymentResult = null;
    let processingToast = null;
    try {
      const { toast } = await import('react-hot-toast');
      processingToast = toast.loading('Processing order...');
      if (paymentInfo.paymentType === 'split') {
        paymentResult = {
          success: true,
          method: 'split',
          paymentType: 'split',
          totalPaid: paymentInfo.total - paymentInfo.remainingAmount,
          payments: paymentInfo.splitPayments,
          splitPayments: paymentInfo.splitPayments,
          total: paymentInfo.total,
          remainingAmount: paymentInfo.remainingAmount,
          payingAmount: paymentInfo.payingAmount,
          receivedAmount: paymentInfo.receivedAmount,
          change: paymentInfo.change || 0
        };
      } else {
        paymentResult = {
          success: true,
          method: paymentInfo.paymentType,
          paymentType: paymentInfo.paymentType,
          amount: parseFloat(paymentInfo.payingAmount),
          payingAmount: paymentInfo.payingAmount,
          receivedAmount: paymentInfo.receivedAmount,
          change: paymentInfo.change,
          reference: paymentInfo.referenceNumber || null
        };
      }
      let paymentReceiverName = 'Unknown';
      if (paymentInfo.paymentReceiver && allUsers && allUsers.length > 0) {
        const receiverUser = allUsers.find(u => u.id === paymentInfo.paymentReceiver);
        paymentReceiverName = receiverUser?.full_name || receiverUser?.name || receiverUser?.email || paymentInfo.paymentReceiver;
      } else {
        paymentReceiverName = user?.full_name || user?.email || 'Unknown';
      }
      // Find selected customer
      let selectedCustomerId = '';
      let selectedCustomerName = '';
      if (paymentInfo.customerId) {
        selectedCustomerId = paymentInfo.customerId;
        selectedCustomerName = customers.find(c => c.id === paymentInfo.customerId)?.name || 'Walk In Customer';
      } else if (paymentInfo.customer && paymentInfo.customer.id) {
        selectedCustomerId = paymentInfo.customer.id;
        selectedCustomerName = paymentInfo.customer.name || 'Walk In Customer';
      }
      // Debug logs for product selection and order item building
      console.log('selectedProducts:', selectedProducts);
      console.log('products:', products);

      const items = selectedProducts.map(id => {
        const product = products.find(p => p.id === id);
        console.log('Building order item for:', id, product);
        const qty = quantities[id] || 1;
        const itemSubtotal = product.price * qty;
        let itemTax = 0;
        if (product && product.tax_percentage && product.tax_percentage > 0) {
          const taxPercentage = Number(product.tax_percentage);
          if (product.tax_type === 'exclusive') {
            itemTax = (product.price * taxPercentage / 100) * qty;
          } else if (product.tax_type === 'inclusive') {
            const priceWithoutTax = product.price / (1 + taxPercentage / 100);
            itemTax = (product.price - priceWithoutTax) * qty;
          }
        }
        return {
          productId: id,
          name: product.name,
          quantity: qty,
          price: product.price,
          costPrice: product.cost_price || 0,
          taxType: product.tax_type || 'exclusive',
          taxPercentage: product.tax_percentage || 0,
          itemTax: itemTax,
          total: itemSubtotal
        };
      });
      console.log('Order items being built:', items);
      // Find the selected register's store_id
      const selectedRegisterObj = registers.find(r => r.id === selectedRegister);
      const storeId = selectedRegisterObj ? selectedRegisterObj.store_id : undefined;
      orderData = {
        id: orderId,
        customer_id: selectedCustomerId || '',
        customer_name: selectedCustomerName || 'Walk In Customer',
        subtotal: 0, // You may want to calculate this
        tax: 0, // You may want to calculate this
        discount: 0, // You may want to calculate this
        total: totalPayable,
        payment_method: paymentResult.method,
        payment_data: paymentResult,
        payment_receiver: paymentInfo.paymentReceiver,
        payment_note: paymentInfo.paymentNote,
        sale_note: paymentInfo.saleNote,
        staff_note: paymentInfo.staffNote,
        timestamp: new Date().toISOString(),
        payment_receiver_name: paymentReceiverName,
        order_type: 'pos',
        status: 'Completed',
        register_id: selectedRegister,
        session_id: currentSessionId,
        store_id: storeId,
        // Add other columns as needed
      };
      // Insert order into 'orders' table
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const orderResJson = await response.json();
      if (orderResJson.error) throw orderResJson.error;
      // Insert order items into 'order_items' table
      const itemsToInsert = items.map(item => ({
        order_id: orderData.id,
        product_id: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        unit_price: item.price, // ensure unit_price is set
        cost_price: item.costPrice,
        tax_type: item.taxType,
        tax_percentage: item.taxPercentage,
        item_tax: item.itemTax,
        total: item.total
      }));
      const itemsResponse = await fetch('/api/order-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemsToInsert),
      });
      const itemsResJson = await itemsResponse.json();
      if (itemsResJson.error) throw itemsResJson.error;
      // Update stock quantities for each product
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        const newQty = (product?.quantity || 0) - item.quantity;
        const updateResponse = await fetch(`/api/products/${item.productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: newQty }),
        });
        const updateResJson = await updateResponse.json();
        if (updateResJson.error) {
          console.error(`Failed to update stock for product ${item.productId}:`, updateResJson.error.message);
        }
      }
      // Play success sound
      const { playBellBeep } = await import('../utils/posSounds');
      playBellBeep();
      // Dismiss processing toast
      toast.dismiss(processingToast);
      
      // Auto-print receipt instead of showing preview modal
      const printReceipt = PrintReceipt({
        orderId: orderData.id,
        selectedProducts: selectedProducts,
        quantities: quantities,
        products: products,
        subtotal: calculateTotal() - (selectedDiscountId ? discounts.find(d => d.id === selectedDiscountId)?.value || 0 : 0),
        tax: 0, // Calculate if needed
        discount: selectedDiscountId ? discounts.find(d => d.id === selectedDiscountId)?.value || 0 : 0,
        total: totalPayable,
        selectedCustomerId: selectedCustomerId || '',
        customers: customers,
        paymentData: paymentResult,
        order: { ...orderData, items },
      });
      
      const printSuccess = printReceipt.printOrder();
      if (printSuccess) {
        toast.success("Order completed and receipt printed!");
      } else {
        toast.success("Order completed successfully!");
      }
      
      setShowSuccessModal(false);
      setSuccessOrderData(null);
      setReloadProducts(r => r + 1);
      // Set lastOrderData for Print Last Receipt
      const paymentInfoWithName = {
        ...paymentInfo,
        paymentReceiverName,
      };
      handleOrderComplete({
        ...orderData,
        items,
        payment: paymentInfoWithName,
        customerId: selectedCustomerId || '',
      });
      // Reset order state
      setSelectedProducts([]);
      setQuantities({});
      setSelectedDiscountId("");
      setPaymentData(null);
      setSelectedPayment("");
      setLastPaymentData(paymentResult);
      // Generate new order ID
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 100);
      setOrderId(`RUO${timestamp}${random.toString().padStart(2, '0')}`);
    } catch (error) {
      if (processingToast) {
        import('react-hot-toast').then(({ toast }) => toast.dismiss(processingToast));
      }
      import('react-hot-toast').then(({ toast }) => toast.error('Transaction failed. Please try again.'));
      console.error('Transaction failed:', error);
    }
  };

  // In pos.js, add handlePrintOrder:
  const handlePrintOrder = () => {
    if (selectedProducts.length === 0) return;
    // Block printing if no payment info
    const payment = lastPaymentData || paymentData;
    if (!payment || !payment.paymentType || isNaN(payment.payingAmount) || payment.payingAmount === undefined) {
      import('react-hot-toast').then(({ toast }) => toast.error('Complete payment before printing the receipt.'));
      return;
    }
    const subtotal = selectedProducts.reduce((sum, id) => {
      const product = products.find(p => p.id === id);
      const qty = quantities[id] || 1;
      return product ? sum + (product.price * qty) : sum;
    }, 0);
    const printReceipt = PrintReceipt({
      orderId,
      selectedProducts,
      quantities,
      products,
      subtotal,
      tax: 0,
      discount: 0,
      total: totalPayable,
      selectedCustomerId: '', // You may want to get the current customer
      customers,
      paymentData: payment,
      order: lastOrderData,
    });
    printReceipt.printOrder();
  };

  // Add handleResetOrder to clear the current order
  const handleResetOrder = () => {
    setSelectedProducts([]);
    setQuantities({});
    setSelectedDiscountId("");
    setPaymentData(null);
    setSelectedPayment("");
    setSelectedPaymentType("");
    // Optionally reset other order-related state
  };

  const [showHoldLayawayModal, setShowHoldLayawayModal] = useState(false);
  const [holdLayawayType, setHoldLayawayType] = useState(null); // 'hold' or 'layaway'
  const [holdLayawayCustomer, setHoldLayawayCustomer] = useState(null);
  const [holdLayawayNote, setHoldLayawayNote] = useState("");
  const [layawayDeposit, setLayawayDeposit] = useState("");
  const [layawayPaymentMethod, setLayawayPaymentMethod] = useState("");
  const [layawayReference, setLayawayReference] = useState("");

  const [showRetrieveSales, setShowRetrieveSales] = useState(false);
  const [showRetrieveLayaways, setShowRetrieveLayaways] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [saleNote, setSaleNote] = useState("");
  const [showLayawayPaymentForm, setShowLayawayPaymentForm] = useState(false);
  const [layawayOutstanding, setLayawayOutstanding] = useState(0);
  const [layawayOrder, setLayawayOrder] = useState(null);

  // Build orderedProducts for the current order (quantity > 0)
  const orderedProducts = Array.isArray(products)
    ? products.filter(p => selectedProducts.includes(p.id))
    : [];

  // At the top of POS component, add:
  const [registers, setRegisters] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Fetch registers on mount
    (async () => {
      try {
        const response = await fetch("/api/registers");
        const result = await response.json();
        console.log('[POS] Registers fetched:', result.data);
        if (result.success) {
          setRegisters(result.data || []);
        }
      } catch (err) {
        console.error('[POS] Failed to fetch registers:', err);
      }
    })();
  }, []);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(({ data }) => setOrders(data || []));
  }, []);

  // After fetching registers (wherever you load them in pos.js):
  useEffect(() => {
    if (registers && registers.length > 0 && !selectedRegister) {
      setSelectedRegister(registers[0].id);
    }
  }, [registers]);

  // Add this effect in pos.js:
  useEffect(() => {
    if ((showCashRegister || autoShowRegister) && !selectedRegister && registers && registers.length > 0) {
      setSelectedRegister(registers[0].id);
    }
  }, [showCashRegister, autoShowRegister, selectedRegister, registers]);

  // Fetch products from referenced order when reference changes
  useEffect(() => {
    if (salesReturnReference) {
      fetch(`/api/order-items?order_id=${salesReturnReference}`)
        .then((res) => res.json())
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setSalesReturnReferenceOrderProducts(data);
          } else {
            setSalesReturnReferenceOrderProducts([]);
          }
        });
    } else {
      setSalesReturnReferenceOrderProducts([]);
    }
  }, [salesReturnReference]);

  useEffect(() => {
    function handleLayaways() { setShowRetrieveLayaways(true); }
    function handleOrders() { setShowRetrieveSales(true); }
    window.addEventListener('open-retrieve-layaways-modal', handleLayaways);
    window.addEventListener('open-retrieve-orders-modal', handleOrders);
    return () => {
      window.removeEventListener('open-retrieve-layaways-modal', handleLayaways);
      window.removeEventListener('open-retrieve-orders-modal', handleOrders);
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.open === "layaways") {
      setShowRetrieveLayaways(true);
      router.replace({ pathname: router.pathname, query: { ...router.query, open: undefined } }, undefined, { shallow: true });
    } else if (router.query.open === "orders") {
      setShowRetrieveSales(true);
      router.replace({ pathname: router.pathname, query: { ...router.query, open: undefined } }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query.open]);

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  return (
    <ModalProvider>
      <MainLayout
        mode={mode}
        user={user}
        toggleMode={toggleMode}
        onLogout={handleLogout}
        HeaderComponent={headerComponent}
        showSidebar={false}
        {...props}
      >
        <div className="h-[72px]" aria-hidden="true"></div>
        <CashRegisterModal
          isOpen={showCashRegister || autoShowRegister}
          onClose={() => {
            setShowCashRegister(false);
            setAutoShowRegister(false);
            checkSession(); // Refresh session state after modal closes
          }}
          user={user}
          onSessionChanged={checkSession}
          selectedRegister={selectedRegister}
          setSelectedRegister={setSelectedRegister}
          setCurrentSessionId={setCurrentSessionId}
          registers={registers}
          setRegisters={setRegisters}
        />
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 lg:gap-8 flex-1 min-h-0 overflow-hidden">
          <PosOrderList
            className="w-full lg:w-3/5 min-h-0 overflow-auto order-2 lg:order-1"
            selectedProducts={selectedProducts}
            quantities={quantities}
            products={products}
            setSelectedProducts={setSelectedProducts}
            setQuantities={setQuantities}
            discounts={discounts}
            setDiscounts={setDiscounts}
            selectedDiscountId={selectedDiscountId}
            setSelectedDiscountId={setSelectedDiscountId}
            roundoffEnabled={roundoffEnabled}
            setRoundoffEnabled={setRoundoffEnabled}
            customers={customers}
            setCustomers={setCustomers}
            onOrderComplete={handleOrderComplete}
            user={user}
            hasOpenSession={hasOpenSession}
            sessionCheckLoading={sessionCheckLoading}
            selectedPayment={selectedPayment}
            selectedPaymentType={selectedPaymentType}
            showPaymentModal={showPaymentModal}
            setShowPaymentModal={setShowPaymentModal}
            setSelectedPaymentType={setSelectedPaymentType}
            handlePaymentSelection={handlePaymentSelection}
            handlePaymentComplete={handlePaymentComplete}
            allUsers={allUsers}
            orderId={orderId}
            setOrderId={setOrderId}
            mode={mode}
          />
          
          <PosProductList
            user={user}
            className="w-full lg:w-2/5 min-h-0 overflow-auto order-1 lg:order-2"
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            quantities={quantities}
            setQuantities={setQuantities}
            setProducts={setProducts}
            reloadProducts={reloadProducts}
            hasOpenSession={hasOpenSession}
            sessionCheckLoading={sessionCheckLoading}
            mode={mode}
          />
        </div>
        <OrderHistoryModal
          isOpen={showOrderHistory}
          onClose={() => setShowOrderHistory(false)}
          customers={customers}
        />
        <OrderHistoryModal
          isOpen={showRecentTransactions}
          onClose={() => setShowRecentTransactions(false)}
          customers={customers}
          statusFilter={["Completed"]}
        />
        <OrderHistoryModal
          isOpen={showRetrieveSales}
          onClose={() => setShowRetrieveSales(false)}
          customers={customers}
          statusFilter={["Hold"]}
          onResume={async (order) => {
            // Fetch order items
            const res = await fetch(`/api/order-items?order_id=${order.id}`);
            const result = await res.json();
            if (!result.success) return;
            const items = result.data || [];
            setSelectedProducts(items.map((item) => item.product_id));
            setQuantities(
              items.reduce((acc, item) => {
                acc[item.product_id] = item.quantity;
                return acc;
              }, {})
            );
            setOrderId(order.id);
            setSelectedCustomerId(order.customer_id || "");
            setSelectedDiscountId(order.discount_id || "");
            setSaleNote(order.sale_note || "");
            setPaymentData(order.payment_data || {});
            setShowRetrieveSales(false);
          }}
        />
        <OrderHistoryModal
          isOpen={showRetrieveLayaways}
          onClose={() => setShowRetrieveLayaways(false)}
          customers={customers}
          statusFilter={["Layaway"]}
          onResume={async (order) => {
            if (order.status === "Completed") {
              const { toast } = await import("react-hot-toast");
              toast.error("This layaway has already been finalized.");
              return;
            }
            // Fetch order items
            const res = await fetch(`/api/order-items?order_id=${order.id}`);
            const result = await res.json();
            if (!result.success) return;
            const items = result.data || [];
            setSelectedProducts(items.map((item) => item.product_id));
            setQuantities(
              items.reduce((acc, item) => {
                acc[item.product_id] = item.quantity;
                return acc;
              }, {})
            );
            setOrderId(order.id);
            setSelectedCustomerId(order.customer_id || "");
            setSelectedDiscountId(order.discount_id || "");
            setSaleNote(order.sale_note || "");
            // Normalize payment_data to always have payments array
            let paymentData = order.payment_data || {};
            if (
              paymentData &&
              !Array.isArray(paymentData.payments) &&
              paymentData.amount
            ) {
              paymentData = {
                payments: [
                  {
                    amount: paymentData.amount,
                    method: paymentData.method,
                    reference: paymentData.reference,
                    date:
                      paymentData.date ||
                      paymentData.timestamp ||
                      order.timestamp ||
                      new Date().toISOString(),
                    user: paymentData.user || order.payment_receiver || null,
                  },
                ],
              };
            }
            setPaymentData(paymentData);
            // Build filtered product list for this order
            const layawayOrderProducts = items.map((item) => {
              // Try to find full product details from the catalog
              const fullProduct =
                products.find((p) => p.id === item.product_id) || {};
              return {
                id: item.product_id,
                name: item.name || fullProduct.name || "",
                price: item.price || fullProduct.price || 0,
                ...fullProduct,
              };
            });
            // Open PaymentForm directly for outstanding balance
            const outstanding =
              Number(order.total) -
              (Array.isArray(paymentData?.payments)
                ? paymentData.payments.reduce(
                    (sum, p) => sum + Number(p.amount || 0),
                    0
                  )
                : Number(paymentData?.amount || 0));
            setLayawayOutstanding(outstanding);
            setLayawayOrder({
              ...order,
              payment_data: paymentData,
              layawayOrderProducts,
            });
            setShowLayawayPaymentForm(true);
            setShowRetrieveLayaways(false);
          }}
        />
        {(() => {
          if (showLayawayPaymentForm && layawayOrder) {
            console.log(
              "PaymentForm layawayOrderProducts:",
              layawayOrder.layawayOrderProducts
            );
          }
          return null;
        })()}
        {showLayawayPaymentForm && layawayOrder && (
          <PaymentForm
            isOpen={showLayawayPaymentForm}
            onClose={() => {
              setShowLayawayPaymentForm(false);
              setLayawayOrder(null);
              setLayawayOutstanding(0);
            }}
            paymentType={"cash"}
            total={layawayOutstanding}
            layawayTotal={layawayOrder.total}
            orderId={layawayOrder.id}
            onPaymentComplete={async (paymentInfo) => {
              // Add payment to payment_data.payments
              const prevPayments = Array.isArray(
                layawayOrder.payment_data?.payments
              )
                ? layawayOrder.payment_data.payments
                : layawayOrder.payment_data && layawayOrder.payment_data.amount
                ? [layawayOrder.payment_data]
                : [];
              const newPayments = [
                ...prevPayments,
                {
                  amount: paymentInfo.payingAmount,
                  method: paymentInfo.paymentType,
                  reference: paymentInfo.referenceNumber,
                  date: new Date().toISOString(),
                  user: user?.id,
                },
              ];
              // Update order in DB
              await fetch("/api/orders", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: layawayOrder.id,
                  payment_data: { payments: newPayments },
                  status: "Completed",
                  finalized_by: user?.id,
                  finalized_at: new Date().toISOString(),
                }),
              });
              const { toast } = await import("react-hot-toast");
              toast.success("Layaway finalized!");
              setShowLayawayPaymentForm(false);
              setLayawayOrder(null);
              setLayawayOutstanding(0);
              // Set lastOrderData for Print Last Receipt
              const finalizedOrderData = {
                ...layawayOrder,
                status: "Completed",
                payment_data: { payments: newPayments },
                items: layawayOrder.layawayOrderProducts.map((p) => ({
                  productId: p.id,
                  name: p.name,
                  quantity: quantities[p.id] || 1,
                  price: p.price,
                })),
                total: layawayOrder.total,
                customerId: layawayOrder.customer_id,
                payment: { payments: newPayments },
                // Add any other fields needed for PrintReceipt
              };
              handleOrderComplete(finalizedOrderData);
              // Optionally reset POS state
            }}
            customer={customers.find((c) => c.id === layawayOrder.customer_id)}
            customers={customers}
            user={user}
            allUsers={allUsers}
            processCompleteTransaction={null}
            paymentData={layawayOrder.payment_data}
            products={layawayOrder.layawayOrderProducts}
            quantities={quantities}
          />
        )}
        <PosFooterActions
          totalPayable={totalPayable}
          hasProducts={selectedProducts.length > 0}
          onSelectPayment={handlePaymentSelection}
          onPrintOrder={handlePrintOrder}
          onResetOrder={handleResetOrder}
          onHoldSale={() => {
            setHoldLayawayType("hold");
            setShowHoldLayawayModal(true);
          }}
          onLayaway={() => {
            setHoldLayawayType("layaway");
            setShowHoldLayawayModal(true);
          }}
          onRetrieveSales={() => setShowRetrieveSales(true)}
          onRetrieveLayaways={() => setShowRetrieveLayaways(true)}
          onRecentTransactions={() => setShowRecentTransactions(true)}
          hasOpenSession={hasOpenSession}
          sessionCheckLoading={sessionCheckLoading}
          user={user}
          mode={mode}
        />
        {(() => {
          if (showPaymentModal) {
            console.log("PaymentForm products (full):", products);
            console.log("PaymentForm selectedProducts:", selectedProducts);
            console.log(
              "PaymentForm filtered products:",
              products.filter((p) => selectedProducts.includes(p.id))
            );
            console.log("PaymentForm quantities:", quantities);
          }
          return null;
        })()}
        <PaymentForm
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPayment("");
          }}
          paymentType={selectedPaymentType}
          total={totalPayable}
          orderId={orderId}
          onPaymentComplete={handlePaymentComplete}
          customer={
            lastOrderData?.customerId
              ? customers.find((c) => c.id === lastOrderData.customerId)
              : null
          }
          customers={customers}
          user={user}
          allUsers={allUsers}
          processCompleteTransaction={processCompleteTransaction}
          products={products.filter((p) => selectedProducts.includes(p.id))}
          quantities={quantities}
        />
        <SimpleModal
          isOpen={showNoOrderModal}
          onClose={() => setShowNoOrderModal(false)}
          title="No Order Completed"
          width="max-w-md"
        >
          <div className="mb-4">No order has been completed yet.</div>
          <div className="flex justify-end">
            <button
              className="bg-blue-700 text-white rounded px-6 py-2"
              onClick={() => setShowNoOrderModal(false)}
            >
              OK
            </button>
          </div>
        </SimpleModal>
        <ModernOrderReceipt
          isOpen={showModernReceipt}
          onClose={() => {
            setShowModernReceipt(false);
            setModernReceiptData(null);
          }}
          orderData={modernReceiptData}
          items={modernReceiptData?.items || []}
          products={products}
          customers={customers}
          onPrint={() => {
            if (modernReceiptData) {
              const items = modernReceiptData.items || [];
              const selectedProducts = items.map((item) => item.productId);
              const quantities = {};
              items.forEach((item) => {
                quantities[item.productId] = item.quantity;
              });
              // Calculate subtotal from items if not present
              const subtotal =
                modernReceiptData.subtotal !== undefined
                  ? modernReceiptData.subtotal
                  : items.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    );
              const paymentData = modernReceiptData.payment_data || {};
              // Map method/amount to paymentType/payingAmount for PrintReceipt compatibility
              const mappedPaymentData = {
                ...paymentData,
                paymentType: paymentData.paymentType || paymentData.method,
                payingAmount: paymentData.payingAmount || paymentData.amount,
                splitPayments: paymentData.splitPayments || [],
                total: paymentData.total || modernReceiptData.total,
                remainingAmount: paymentData.remainingAmount || 0,
                receivedAmount: paymentData.receivedAmount || paymentData.amount || modernReceiptData.total,
                change: paymentData.change || 0,
              };
              const printReceipt = PrintReceipt({
                orderId: modernReceiptData.id,
                selectedProducts,
                quantities,
                products,
                subtotal,
                tax: modernReceiptData.tax || 0,
                discount: modernReceiptData.discount || 0,
                total: modernReceiptData.total,
                selectedCustomerId: modernReceiptData.customer_id,
                customers,
                paymentData: mappedPaymentData,
                order: modernReceiptData,
              });
              printReceipt.printOrder();
            }
          }}
        />
        <ReceiptPreviewModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setReceiptData(null);
          }}
          receiptData={receiptData}
        />
        <SimpleModal
          isOpen={showHoldLayawayModal}
          onClose={() => setShowHoldLayawayModal(false)}
          title={
            holdLayawayType === "layaway"
              ? "Layaway Details"
              : "Hold Sale Details"
          }
          width="max-w-lg"
        >
          <div className="space-y-6">
            <div>
              <label className="block font-semibold mb-1">
                Customer{" "}
                {holdLayawayType === "layaway" && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <Select
                options={customers.map((c) => ({
                  value: c.id,
                  label: `${c.name} - ${c.phone}`,
                }))}
                value={
                  holdLayawayCustomer
                    ? customers
                        .filter((c) => c.id === holdLayawayCustomer)
                        .map((c) => ({
                          value: c.id,
                          label: `${c.name} - ${c.phone}`,
                        }))[0]
                    : null
                }
                onChange={(option) =>
                  setHoldLayawayCustomer(option ? option.value : null)
                }
                isClearable
                placeholder="Search customer..."
                classNamePrefix="react-select"
              />
              {holdLayawayType === "layaway" && !holdLayawayCustomer && (
                <div className="text-red-500 text-xs mt-1">
                  Customer is required for layaway.
                </div>
              )}
            </div>
            <div>
              <label className="block font-semibold mb-1">Sale Note</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={2}
                value={holdLayawayNote}
                onChange={(e) => setHoldLayawayNote(e.target.value)}
                placeholder="Type your message"
              />
            </div>
            {holdLayawayType === "layaway" && (
              <>
                <div>
                  <label className="block font-semibold mb-1">
                    Deposit Amount{" "}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border rounded px-3 py-2"
                    value={layawayDeposit}
                    onChange={(e) => setLayawayDeposit(e.target.value)}
                    placeholder="Enter deposit amount"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Payment Method{" "}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={layawayPaymentMethod}
                    onChange={(e) => setLayawayPaymentMethod(e.target.value)}
                  >
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="momo">Mobile Money</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Reference <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={layawayReference}
                    onChange={(e) => setLayawayReference(e.target.value)}
                    placeholder="Enter transaction reference"
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                onClick={() => setShowHoldLayawayModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded bg-blue-700 text-white font-semibold"
                onClick={async () => {
                  if (holdLayawayType === "layaway" && !holdLayawayCustomer)
                    return;
                  if (selectedProducts.length === 0) {
                    const { toast } = await import("react-hot-toast");
                    toast.error("Add products before continuing.");
                    return;
                  }
                  const items = selectedProducts.map((id) => {
                    const product = products.find((p) => p.id === id);
                    const qty = quantities[id] || 1;
                    return {
                      productId: id,
                      name: product.name,
                      quantity: qty,
                      price: product.price,
                      costPrice: product.cost_price || 0,
                      total: product.price * qty,
                    };
                  });
                  // Find the selected register's store_id
                  const selectedRegisterObj = registers.find(
                    (r) => r.id === selectedRegister
                  );
                  const storeId = selectedRegisterObj
                    ? selectedRegisterObj.store_id
                    : undefined;
                  const orderData = {
                    id: orderId,
                    customer_id: holdLayawayCustomer || "",
                    customer_name: holdLayawayCustomer
                      ? customers.find((c) => c.id === holdLayawayCustomer)
                          ?.name || ""
                      : "Walk In Customer",
                    subtotal: 0,
                    tax: 0,
                    discount: 0,
                    total: totalPayable,
                    payment_method:
                      holdLayawayType === "layaway" && layawayDeposit
                        ? layawayPaymentMethod
                        : "",
                    payment_data:
                      holdLayawayType === "layaway" && layawayDeposit
                        ? {
                            amount: layawayDeposit,
                            method: layawayPaymentMethod,
                            reference: layawayReference,
                          }
                        : {},
                    payment_receiver: user?.id,
                    payment_note: "",
                    sale_note: holdLayawayNote,
                    staff_note: "",
                    timestamp: new Date().toISOString(),
                    payment_receiver_name:
                      user?.full_name || user?.email || "Unknown",
                    order_type: holdLayawayType,
                    status: holdLayawayType === "layaway" ? "Layaway" : "Hold",
                    register_id: selectedRegister,
                    session_id: currentSessionId,
                    store_id: storeId,
                  };
                  try {
                    const { toast } = await import("react-hot-toast");
                    const res = await fetch("/api/orders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(orderData),
                    });
                    const orderResJson = await res.json();
                    if (orderResJson.error) throw orderResJson.error;
                    // Insert order items
                    const itemsToInsert = items.map((item) => ({
                      order_id: orderData.id,
                      product_id: item.productId,
                      name: item.name,
                      quantity: item.quantity,
                      price: item.price,
                      unit_price: item.price, // ensure unit_price is set
                      cost_price: item.costPrice,
                      total: item.total,
                    }));
                    await fetch("/api/order-items", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(itemsToInsert),
                    });
                    toast.success(
                      holdLayawayType === "layaway"
                        ? "Layaway created successfully!"
                        : "Sale held successfully!"
                    );
                    setSelectedProducts([]);
                    setQuantities({});
                    setSelectedDiscountId("");
                    const timestamp = Date.now().toString().slice(-6);
                    const random = Math.floor(Math.random() * 100);
                    setOrderId(
                      `RUO${timestamp}${random.toString().padStart(2, "0")}`
                    );
                  } catch (error) {
                    if (toast) {
                      toast.dismiss(processingToast);
                    }
                    import("react-hot-toast").then(({ toast }) =>
                      toast.error("Transaction failed. Please try again.")
                    );
                    console.error("Transaction failed:", error);
                  }
                }}
              >
                {holdLayawayType === "layaway"
                  ? "Finalize Layaway"
                  : "Hold Sale"}
              </button>
            </div>
          </div>
        </SimpleModal>
        {/* Sales Return Modal (renders SalesReturnModals directly) */}
        <SalesReturnModals
          show={showSalesReturnModal}
          onClose={() => setShowSalesReturnModal(false)}
          onSave={async (values, items) => {
            try {
              const { toast } = await import("react-hot-toast");
              // Clean up values: convert "" to null for UUID fields
              const cleanedValues = {
                ...values,
                customer_id: values.customer_id || null,
                store_id: values.store_id || null,
                reference: values.reference || null,
              };
              // 1. Save the sales return main record
              const res = await fetch("/api/sales-returns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cleanedValues),
              });
              const result = await res.json();
              if (!result.success || !result.data)
                throw new Error(result.error || "Failed to save sales return");
              const salesReturnId = result.data.id;

              // 2. Save the line items
              const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
              const lineItemsToSend = (items || [])
                .filter((item) => uuidRegex.test(item.product_id))
                .map((item) => ({
                  ...item,
                  sales_return_id: salesReturnId,
                  total:
                    (Number(item.quantity) || 0) *
                    (Number(item.unit_price) || 0),
                }));
              console.log("Line items to send:", lineItemsToSend);

              const lineItemsRes = await fetch("/api/sales-return-items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(lineItemsToSend),
              });
              const lineItemsResult = await lineItemsRes.json();
              if (!lineItemsResult.success)
                throw new Error(
                  lineItemsResult.error || "Failed to save sales return items"
                );

              toast.success("Sales return added successfully!");
              setShowSalesReturnModal(false);
              setSalesReturnLineItems([]);
              setSalesReturnReference("");
              // Optionally refresh sales returns list here
            } catch (err) {
              const { toast } = await import("react-hot-toast");
              toast.error(err.message || "Failed to save sales return");
            }
          }}
          onDelete={() => setShowSalesReturnModal(false)}
          mode={mode}
          selectedReference={salesReturnReference}
          onReferenceChange={setSalesReturnReference}
          user={user}
          orders={orders}
        >
          <SalesReturnItemsEditor
            lineItems={salesReturnLineItems}
            setLineItems={setSalesReturnLineItems}
            products={salesReturnProducts}
            referenceOrderProducts={salesReturnReferenceOrderProducts}
            reference={salesReturnReference}
          />
        </SalesReturnModals>
      </MainLayout>
    </ModalProvider>
  );
}
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

export default function POS({ mode = "light", toggleMode, ...props }) {
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
  const [showNoOrderModal, setShowNoOrderModal] = useState(false);
  const [showCashRegister, setShowCashRegister] = useState(false);
  const [showModernReceipt, setShowModernReceipt] = useState(false);
  const [modernReceiptData, setModernReceiptData] = useState(null);



  // Check for open cash register session for cashiers
  const [hasOpenSession, setHasOpenSession] = useState(true);
  const [sessionCheckLoading, setSessionCheckLoading] = useState(false);
  const [autoShowRegister, setAutoShowRegister] = useState(false);
  const checkSession = async () => {
    setSessionCheckLoading(true);
    if (user?.role === 'cashier') {
      const res = await fetch('/api/cash-register-sessions?status=open');
      const data = await res.json();
      setHasOpenSession(data.success && data.data && data.data.length > 0);
      if (!(data.success && data.data && data.data.length > 0)) {
        import('react-hot-toast').then(({ toast }) => toast.error('You must open a cash register before making sales.'));
        setAutoShowRegister(true);
      } else {
        setAutoShowRegister(false);
      }
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
        const discountType = discountObj.type || "percent";
        if (discountType === "percent") {
          discount = Math.round(subtotal * (Number(discountObj.value) / 100));
        } else {
          discount = Number(discountObj.value);
        }
      }
    }
    
    // Calculate tax and roundoff
    const tax = 0; // For now, tax is 0
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
    // Prepare data for PrintReceipt
    const printReceipt = PrintReceipt({
      orderId: lastOrderData.id,
      selectedProducts: lastOrderData.items.map(item => item.productId),
      quantities: lastOrderData.items.reduce((acc, item) => {
        acc[item.productId] = item.quantity;
        return acc;
      }, {}),
      products: lastOrderData.items.map(item => ({
        id: item.productId,
        name: item.name,
        price: item.price
      })),
      subtotal: lastOrderData.subtotal,
      tax: lastOrderData.tax,
      discount: lastOrderData.discount,
      total: lastOrderData.total,
      selectedCustomerId: lastOrderData.customerId,
      customers: customers,
      paymentData: lastOrderData.payment
    });
    printReceipt.printOrder();
  }, [lastOrderData, customers]);

  // Add at the top of the POS component, after other state:
  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

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

  // Memoize the header component to prevent unnecessary re-renders
  const headerComponent = useMemo(() => {
    return (headerProps) => (
      <PosHeader
        {...headerProps}
        printLastReceipt={handlePrintLastReceipt}
        lastOrderData={lastOrderData}
        onOpenOrderHistory={() => setShowOrderHistory(true)}
      />
    );
  }, [handlePrintLastReceipt, lastOrderData, setShowOrderHistory]);

  // Memoize the onOrderComplete callback
  // When an order is finalized (in handleOrderComplete), generate a new orderId for the next order:
  const handleOrderComplete = useCallback((orderData) => {
    setReloadProducts(r => r + 1);
    setLastOrderData(orderData);
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
      processingToast = toast.loading('Processing payment and creating order...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (paymentInfo.paymentType === 'split') {
        paymentResult = {
          success: true,
          method: 'split',
          totalPaid: paymentInfo.total - paymentInfo.remainingAmount,
          payments: paymentInfo.splitPayments
        };
      } else {
        paymentResult = {
          success: true,
          method: paymentInfo.paymentType,
          amount: parseFloat(paymentInfo.payingAmount),
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
      const items = selectedProducts.map(id => {
        const product = products.find(p => p.id === id);
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
      // Show success modal
      setModernReceiptData({ ...orderData, items });
      setShowModernReceipt(true);
      setShowSuccessModal(false);
      setSuccessOrderData(null);
      setReloadProducts(r => r + 1);
      // Reset order state
      setSelectedProducts([]);
      setQuantities({});
      setSelectedDiscountId("");
      setPaymentData(null);
      setSelectedPayment("");
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
    const printReceipt = PrintReceipt({
      orderId,
      selectedProducts,
      quantities,
      products,
      subtotal: 0, // You may want to calculate this
      tax: 0, // You may want to calculate this
      discount: 0, // You may want to calculate this
      total: totalPayable,
      selectedCustomerId: '', // You may want to get the current customer
      customers,
      paymentData: paymentData || {},
    });
    printReceipt.printOrder();
  };

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  return (
    <ModalProvider>
      <GlobalConfirmModal />
      <MainLayout
        mode={mode}
        user={user}
        toggleMode={toggleMode}
        onLogout={handleLogout}
        HeaderComponent={headerComponent}
        showSidebar={false}
        {...props}
      >
        <CashRegisterModal
          isOpen={showCashRegister || autoShowRegister}
          onClose={() => {
            setShowCashRegister(false);
            setAutoShowRegister(false);
          }}
          user={user}
          onSessionChanged={checkSession}
        />
        <div className="flex gap-8 flex-1 min-h-0 overflow-hidden">
          <PosProductList
            user={user}
            className="flex-1 min-h-0 overflow-auto"
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            quantities={quantities}
            setQuantities={setQuantities}
            setProducts={setProducts}
            reloadProducts={reloadProducts}
            hasOpenSession={hasOpenSession}
            sessionCheckLoading={sessionCheckLoading}
          />
          <PosOrderList
            className="flex-1 min-h-0 overflow-auto"
            selectedProducts={selectedProducts}
            quantities={quantities}
            products={products}
            setSelectedProducts={setSelectedProducts}
            setQuantities={setQuantities}
            discounts={discounts}
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
            handlePaymentSelection={handlePaymentSelection}
            handlePaymentComplete={handlePaymentComplete}
            allUsers={allUsers}
            orderId={orderId}
            setOrderId={setOrderId}
          />
        </div>
        <OrderHistoryModal
          isOpen={showOrderHistory}
          onClose={() => setShowOrderHistory(false)}
          customers={customers}
        />
        <PosFooterActions
          totalPayable={totalPayable}
          hasProducts={selectedProducts.length > 0}
          onSelectPayment={handlePaymentSelection}
          onPrintOrder={handlePrintOrder}
        />
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
              const selectedProducts = items.map(item => item.productId);
              const quantities = {};
              items.forEach(item => {
                quantities[item.productId] = item.quantity;
              });
              const printReceipt = PrintReceipt({
                orderId: modernReceiptData.id,
                selectedProducts,
                quantities,
                products,
                subtotal: modernReceiptData.subtotal,
                tax: modernReceiptData.tax,
                discount: modernReceiptData.discount,
                total: modernReceiptData.total,
                selectedCustomerId: modernReceiptData.customer_id,
                customers,
                paymentData: modernReceiptData.payment_data || {},
              });
              console.log('About to print receipt:', printReceipt, selectedProducts, quantities);
              const result = printReceipt.printOrder();
              console.log('Print result:', result);
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
      </MainLayout>
    </ModalProvider>
  );
}

function GlobalConfirmModal() {
  const { showConfirm, setShowConfirm, confirmMessage, onConfirm } = useModal();
  if (!showConfirm) return null;
  return ReactDOM.createPortal(
    <SimpleModal
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      title="Confirm"
      width="max-w-md"
    >
      <div className="mb-4">{confirmMessage}</div>
      <div className="flex gap-3">
        <button className="flex-1 bg-gray-200 rounded py-2" onClick={() => setShowConfirm(false)}>Cancel</button>
        <button className="flex-1 bg-blue-700 text-white rounded py-2" onClick={() => { setShowConfirm(false); onConfirm(); }}>Yes</button>
      </div>
    </SimpleModal>,
    typeof window !== 'undefined' ? document.body : null
  );
}

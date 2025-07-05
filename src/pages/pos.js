import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import PosHeader from "@/layouts/posHeader";
import { useState, useEffect } from "react";
import PosProductList from "@/components/PosProductList";
import PosOrderList from "@/components/PosOrderList";
import { Icon } from "@iconify/react";
import PosFooterActions from "@/components/PosFooterActions";
import { supabaseClient } from "../lib/supabase";
import PrintReceipt from "@/components/PrintReceipt";
import OrderHistoryModal from "@/components/OrderHistoryModal";
import { ModalProvider, useModal } from "@/components/ModalContext";
import SimpleModal from "@/components/SimpleModal";
import ReactDOM from "react-dom";

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

  useEffect(() => {
    async function fetchDiscounts() {
      const { data, error } = await supabaseClient
        .from("discounts")
        .select("*")
        .eq("is_active", true);
      if (!error) setDiscounts(data || []);
    }
    fetchDiscounts();
  }, []);

  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabaseClient
        .from("customers")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (!error) setCustomers(data || []);
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
  const handlePrintLastReceipt = () => {
    if (!lastOrderData) {
      alert("No order has been completed yet.");
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
        HeaderComponent={(headerProps) => (
          <PosHeader
            {...headerProps}
            printLastReceipt={handlePrintLastReceipt}
            lastOrderData={lastOrderData}
            onOpenOrderHistory={() => setShowOrderHistory(true)}
          />
        )}
        showSidebar={false}
        {...props}
      >
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
            onOrderComplete={(orderData) => {
              setReloadProducts(r => r + 1);
              setLastOrderData(orderData);
            }}
            user={user}
          />
        </div>
        <OrderHistoryModal
          isOpen={showOrderHistory}
          onClose={() => setShowOrderHistory(false)}
          customers={customers}
        />
        {/* <PosFooterActions totalPayable={totalPayable} hasProducts={selectedProducts.length > 0} /> */}
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

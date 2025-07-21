export const getPaymentTypeLabel = (type) => {
  const labels = {
    cash: "Cash",
    momo: "Mobile Money",
    card: "Card",
    bank_transfer: "Bank Transfer",
    split: "Split Payment"
  };
  return labels[type] || type;
};

export const getPaymentTypeIcon = (type) => {
  const icons = {
    cash: "mdi:cash",
    momo: "mdi:wallet-outline",
    card: "mdi:credit-card-outline",
    bank_transfer: "mdi:bank",
    split: "mdi:call-split"
  };
  return icons[type] || "mdi:cash";
};

export const validatePaymentData = (paymentData, paymentType, total, toast) => {
  // Skip received/paying amount validation for split payments
  if (paymentType !== "split") {
    const received = parseFloat(paymentData.receivedAmount);
    const paying = parseFloat(paymentData.payingAmount);
    
    if (received < paying) {
      toast.error("Received amount must be greater than or equal to paying amount");
      return false;
    }
  }
  
  // Validate MoMo-specific fields
  if (paymentType === "momo") {
    if (!paymentData.momoProvider) {
      toast.error("Please select a mobile money provider");
      return false;
    }
    if (!paymentData.customerPhone) {
      toast.error("Please enter customer phone number");
      return false;
    }
    if (!paymentData.referenceNumber) {
      toast.error("Please enter transaction reference number");
      return false;
    }
  }

  // Validate Split Payment-specific fields
  if (paymentType === "split") {
    if (paymentData.splitPayments.length === 0) {
      toast.error("Please add at least one payment method");
      return false;
    }
    
    if (paymentData.remainingAmount > 0) {
      toast.error(`Payment incomplete. Remaining amount: GHS ${paymentData.remainingAmount.toLocaleString()}`);
      return false;
    }
    
    // Validate each split payment has required fields
    for (let i = 0; i < paymentData.splitPayments.length; i++) {
      const payment = paymentData.splitPayments[i];
      
      if (payment.method === "momo") {
        if (!payment.momoProvider) {
          toast.error(`Please select mobile money provider for payment ${i + 1}`);
          return false;
        }
        if (!payment.customerPhone) {
          toast.error(`Please enter customer phone for payment ${i + 1}`);
          return false;
        }
        if (!payment.referenceNumber) {
          toast.error(`Please enter transaction reference for payment ${i + 1}`);
          return false;
        }
      }
      
    }
  }

  return true;
}; 
export const getPaymentTypeLabel = (type) => {
  const labels = {
    cash: "Cash",
    momo: "Mobile Money",
    card: "Card",
    cheque: "Cheque",
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
    cheque: "mdi:checkbook",
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

  // Validate Cheque-specific fields
  if (paymentType === "cheque") {
    if (!paymentData.chequeNumber) {
      toast.error("Please enter cheque number");
      return false;
    }
    if (!paymentData.bankName) {
      toast.error("Please select bank name");
      return false;
    }
    if (!paymentData.accountHolderName) {
      toast.error("Please enter account holder name");
      return false;
    }
    if (!paymentData.chequeDate) {
      toast.error("Please enter cheque date");
      return false;
    }
    if (!paymentData.chequeAmount) {
      toast.error("Please enter cheque amount");
      return false;
    }
    
    // Validate cheque amount matches order total
    const chequeAmount = parseFloat(paymentData.chequeAmount);
    if (chequeAmount !== total) {
      toast.error(`Cheque amount (GHS ${chequeAmount}) must match order total (GHS ${total})`);
      return false;
    }
    
    // Validate cheque date is not post-dated
    const chequeDate = new Date(paymentData.chequeDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (chequeDate > today) {
      toast.error("Post-dated cheques are not accepted");
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
      
      if (payment.method === "cheque") {
        if (!payment.chequeNumber) {
          toast.error(`Please enter cheque number for payment ${i + 1}`);
          return false;
        }
        if (!payment.bankName) {
          toast.error(`Please select bank for payment ${i + 1}`);
          return false;
        }
        if (!payment.chequeDate) {
          toast.error(`Please enter cheque date for payment ${i + 1}`);
          return false;
        }
      }
    }
  }

  return true;
}; 
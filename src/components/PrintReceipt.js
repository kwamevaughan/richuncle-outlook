import React from 'react';

const PrintReceipt = ({ 
  orderId, 
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
  order,
  originalTimestamp
}) => {
  const printOrder = () => {
    // Ensure all required props exist with safe defaults
    const safeSelectedProducts = selectedProducts || [];
    const safeQuantities = quantities || {};
    const safeProducts = products || [];
    const safeCustomers = customers || [];
    const safeOrder = order || {};
    const safeSubtotal = subtotal || 0;
    const safeTax = tax || 0;
    const safeDiscount = discount || 0;
    const safeTotal = total || 0;
    
    if (safeSelectedProducts.length === 0) {
      return false;
    }

    // Ensure paymentData exists and has safe defaults
    const safePaymentData = paymentData || {
      paymentType: "cash",
      payingAmount: safeTotal,
      receivedAmount: safeTotal,
      change: 0,
      total: safeTotal,
      remainingAmount: 0,
      splitPayments: []
    };

    // Extract possible cashier fields from paymentData
    const paymentDataReceiver = safePaymentData?.paymentReceiverName || safePaymentData?.payment_receiver_name || safePaymentData?.paymentReceiver || safePaymentData?.payment_receiver;
    // Extract possible cashier fields from order prop
    const orderReceiver = safeOrder?.payment_receiver_name || safeOrder?.payment_receiver || safeOrder?.paymentReceiverName || safeOrder?.paymentReceiver;
    const cashierName = paymentDataReceiver || orderReceiver || 'Unknown';

    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Receipt - ${orderId}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; font-family: 'Courier New', monospace; }
            .receipt { width: 80mm; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .store-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .store-info { font-size: 12px; margin-bottom: 5px; }
            .order-info { margin-bottom: 15px; }
            .order-id { font-weight: bold; font-size: 14px; }
            .customer-info { margin-bottom: 15px; font-size: 12px; }
            .items-table { width: 100%; margin-bottom: 15px; }
            .items-table th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; font-size: 12px; }
            .items-table td { padding: 3px 0; font-size: 11px; }
            .item-name { width: 50%; }
            .item-qty { width: 15%; text-align: center; }
            .item-price { width: 35%; text-align: right; }
            .summary { border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; }
            .total-row { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
            .payment-info { margin-bottom: 15px; font-size: 12px; }
            .footer { text-align: center; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
            .thank-you { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
            .timestamp { font-size: 10px; }
            @page { margin: 10mm; }
          }
          body { font-family: 'Courier New', monospace; }
          .receipt { width: 80mm; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
          .store-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .store-info { font-size: 12px; margin-bottom: 5px; }
          .order-info { margin-bottom: 15px; }
          .order-id { font-weight: bold; font-size: 14px; }
          .customer-info { margin-bottom: 15px; font-size: 12px; }
          .items-table { width: 100%; margin-bottom: 15px; }
          .items-table th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; font-size: 12px; }
          .items-table td { padding: 3px 0; font-size: 11px; }
          .item-name { width: 50%; }
          .item-qty { width: 15%; text-align: center; }
          .item-price { width: 35%; text-align: right; }
          .summary { border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; }
          .total-row { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
          .payment-info { margin-bottom: 15px; font-size: 12px; }
          .footer { text-align: center; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          .thank-you { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
          .timestamp { font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="store-name">RICHUNCLE OUTLOOK</div>
            <div class="store-info">Accra, Ghana</div>
            <div class="store-info">Tel: +233 059 861 2130</div>
          </div>
          
          <div class="order-info">
            <div class="order-id">Order ID: ${orderId}</div>
            <div>Date: ${originalTimestamp ? new Date(originalTimestamp).toLocaleDateString("en-GH") : new Date().toLocaleDateString("en-GH")}</div>
            <div>Time: ${originalTimestamp ? new Date(originalTimestamp).toLocaleTimeString("en-GH") : new Date().toLocaleTimeString("en-GH")}</div>
          </div>
          
          <div class="customer-info">
            <div>Customer: ${
              customers.find((c) => c.id === selectedCustomerId)?.name ||
              "Walk In Customer"
            }</div>
            ${
              customers.find((c) => c.id === selectedCustomerId)?.phone
                ? `<div>Phone: ${
                    customers.find((c) => c.id === selectedCustomerId)?.phone
                  }</div>`
                : ""
            }
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th class="item-name">Item</th>
                <th class="item-qty">Qty</th>
                <th class="item-price">Price</th>
              </tr>
            </thead>
            <tbody>
              ${selectedProducts
                .map((id) => {
                  const product = products.find((p) => p.id === id);
                  const qty = quantities[id] || 1;
                  return `
                  <tr>
                    <td class="item-name">${
                      product?.name || "Unknown Product"
                    }</td>
                    <td class="item-qty">${qty}</td>
                    <td class="item-price">GHS ${(
                      product?.price * qty
                    ).toLocaleString()}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>GHS ${safeSubtotal.toLocaleString()}</span>
            </div>
            ${
              safeDiscount > 0
                ? `
              <div class="summary-row">
                <span>Discount:</span>
                <span>-GHS ${safeDiscount.toLocaleString()}</span>
              </div>
            `
                : ""
            }
            <div class="summary-row total">
              <span>Total:</span>
              <span>GHS ${safeTotal.toLocaleString()}</span>
            </div>
          </div>
          
          ${
            safePaymentData
              ? `
            <div class="payment-info">
              <div><strong>Payment Method:</strong> ${
                safePaymentData?.paymentType === "momo"
                  ? "Mobile Money"
                  : safePaymentData?.paymentType === "cash"
                  ? "Cash"
                  : safePaymentData?.paymentType === "split"
                  ? "Split Payment"
                  : safePaymentData?.paymentType || "Unknown"
              }</div>
              ${
                safePaymentData?.paymentType === "split"
                  ? `
                <div>Total Paid: GHS ${(
                  (safePaymentData?.total || 0) - (safePaymentData?.remainingAmount || 0)
                ).toLocaleString()}</div>
                ${
                  safePaymentData?.splitPayments && safePaymentData.splitPayments.length > 0
                    ? safePaymentData.splitPayments.map((payment, index) => `
                      <div>${payment.method || payment.paymentType || 'Payment'}: GHS ${parseFloat(payment.amount || 0).toLocaleString()}</div>
                    `).join('')
                    : '<div>Payment Methods: Split Payment</div>'
                }
              `
                  : `
                <div>Amount Paid: GHS ${parseFloat(
                  safePaymentData?.payingAmount || 0
                ).toLocaleString()}</div>
                ${
                  (safePaymentData?.change || 0) > 0
                    ? `<div>Change: GHS ${(safePaymentData?.change || 0).toFixed(2)}</div>`
                    : ""
                }
              `
              }
              <div><strong>Payment received by:</strong> ${cashierName}</div>
            </div>
          `
              : `
            <div class="payment-info">
              <div><strong>Payment:</strong> Pending</div>
            </div>
          `
          }
          
          <div class="footer">
            <div class="thank-you">Thank You!</div>
            <div>Please come again</div>
            <div class="timestamp">Printed: ${originalTimestamp ? new Date(originalTimestamp).toLocaleString("en-GH") : new Date().toLocaleString("en-GH")}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Create a minimal popup window
      const printWindow = window.open('', 'PrintWindow', 'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no');
      
      if (printWindow) {
        // Write content to the new window
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load, then print and close
        printWindow.onload = function() {
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => {
              printWindow.close();
            }, 1000);
          }, 500);
        };
        
        // Fallback: if onload doesn't fire, try printing anyway
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.print();
            setTimeout(() => {
              printWindow.close();
            }, 1000);
          }
        }, 1500);
      } else {
        // Fallback to iframe method if popup is blocked
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        
        document.body.appendChild(iframe);
        
        iframe.contentDocument.write(printContent);
        iframe.contentDocument.close();
        
        iframe.onload = function() {
          setTimeout(() => {
            iframe.contentWindow.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          }, 500);
        };
      }
      
      return true;
    } catch (error) {
      console.error('Print error:', error);
      return false;
    }
  };

  // New method to get receipt content for modal display
  const getReceiptContent = () => {
    if (selectedProducts.length === 0) {
      return null;
    }

    return {
      orderId,
      customer: customers.find(c => c.id === selectedCustomerId)?.name || "Walk In Customer",
      customerPhone: customers.find(c => c.id === selectedCustomerId)?.phone,
      date: new Date().toLocaleDateString('en-GH'),
      time: new Date().toLocaleTimeString('en-GH'),
      items: selectedProducts.map(id => {
        const product = products.find(p => p.id === id);
        const qty = quantities[id] || 1;
        return {
          name: product?.name || 'Unknown Product',
          qty,
          price: product?.price * qty,
          taxInfo: product?.tax_percentage && product?.tax_percentage > 0 ? 
            `${product.tax_percentage}% (${product.tax_type === 'inclusive' ? 'Included' : 'Added'})` : null
        };
      }),
      subtotal,
      tax,
      discount,
      total,
      paymentData: {
        ...paymentData,
        paymentReceiverName: paymentData?.paymentReceiverName || paymentData?.payment_receiver_name || paymentData?.paymentReceiver || paymentData?.payment_receiver
      }
    };
  };

  return { printOrder, getReceiptContent };
};

export default PrintReceipt; 
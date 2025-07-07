import React from 'react';
import { Icon } from "@iconify/react";
import SimpleModal from './SimpleModal';

const ReceiptPreviewModal = ({ 
  isOpen, 
  onClose, 
  receiptData 
}) => {
  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Receipt - ${receiptData.orderId}</title>
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
            <div class="store-name">RICH UNCLE OUTLOOK</div>
            <div class="store-info">Accra, Ghana</div>
            <div class="store-info">Tel: +233 059 861 2130</div>
          </div>
          
          <div class="order-info">
            <div class="order-id">Order ID: ${receiptData.orderId}</div>
            <div>Date: ${receiptData.date}</div>
            <div>Time: ${receiptData.time}</div>
          </div>
          
          <div class="customer-info">
            <div>Customer: ${receiptData.customer}</div>
            ${
              receiptData.customerPhone
                ? `<div>Phone: ${receiptData.customerPhone}</div>`
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
              ${receiptData.items
                .map(
                  (item) => `
                <tr>
                  <td class="item-name">${item.name}</td>
                  <td class="item-qty">${item.qty}</td>
                  <td class="item-price">GHS ${item.price.toLocaleString()}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>GHS ${receiptData.subtotal.toLocaleString()}</span>
            </div>
            <div class="summary-row">
              <span>Tax:</span>
              <span>GHS ${receiptData.tax.toLocaleString()}</span>
            </div>
            ${
              receiptData.discount > 0
                ? `
              <div class="summary-row">
                <span>Discount:</span>
                <span>-GHS ${receiptData.discount.toLocaleString()}</span>
              </div>
            `
                : ""
            }
            <div class="summary-row total-row">
              <span>TOTAL:</span>
              <span>GHS ${receiptData.total.toLocaleString()}</span>
            </div>
          </div>
          
          ${
            receiptData.paymentData
              ? `
            <div class="payment-info">
              <div><strong>Payment Method:</strong> ${
                receiptData.paymentData.paymentType === "momo"
                  ? "Mobile Money"
                  : receiptData.paymentData.paymentType === "cash"
                  ? "Cash"
                  : receiptData.paymentData.paymentType === "split"
                  ? "Split Payment"
                  : receiptData.paymentData.paymentType
              }</div>
              ${
                receiptData.paymentData.paymentType === "split"
                  ? `
                <div>Total Paid: GHS ${(
                  receiptData.paymentData.total -
                  receiptData.paymentData.remainingAmount
                ).toLocaleString()}</div>
                <div>Payment Methods: ${
                  receiptData.paymentData.splitPayments.length
                }</div>
              `
                  : `
                <div>Amount Paid: GHS ${parseFloat(
                  receiptData.paymentData.payingAmount
                ).toLocaleString()}</div>
                ${
                  receiptData.paymentData.change > 0
                    ? `<div>Change: GHS ${receiptData.paymentData.change.toFixed(
                        2
                      )}</div>`
                    : ""
                }
              `
              }
              ${
                receiptData.paymentData.paymentReceiver
                  ? `<div>Receiver: ${
                      receiptData.paymentData.paymentReceiverName ||
                      receiptData.paymentData.payment_receiver_name ||
                      receiptData.paymentData.paymentReceiver ||
                      receiptData.paymentData.payment_receiver
                    }</div>`
                  : ""
              }
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
            <div class="timestamp">Printed: ${new Date().toLocaleString(
              "en-GH"
            )}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create a temporary div with the print content
    const printDiv = document.createElement('div');
    printDiv.innerHTML = printContent;
    printDiv.style.position = 'absolute';
    printDiv.style.left = '-9999px';
    printDiv.style.top = '-9999px';
    
    // Add to document temporarily
    document.body.appendChild(printDiv);
    
    // Store current page content
    const originalContent = document.body.innerHTML;
    const originalTitle = document.title;
    
    // Replace page content with print content
    document.body.innerHTML = printDiv.innerHTML;
    document.title = `Order Receipt - ${receiptData.orderId}`;
    
    // Print
    window.print();
    
    // Restore original content
    document.body.innerHTML = originalContent;
    document.title = originalTitle;
    
    // Remove temporary div
    document.body.removeChild(printDiv);
    
    // Close the modal
    onClose();
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Receipt Preview"
      mode="light"
      width="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Receipt Preview */}
        <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm">
          <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-4">
            <div className="text-lg font-bold">RICH UNCLE OUTLOOK</div>
            <div className="text-xs">Accra, Ghana</div>
            <div className="text-xs">Tel: +233 059 861 2130</div>
          </div>

          <div className="mb-4">
            <div className="font-bold">Order ID: {receiptData.orderId}</div>
            <div>Date: {receiptData.date}</div>
            <div>Time: {receiptData.time}</div>
          </div>

          <div className="mb-4">
            <div>Customer: {receiptData.customer}</div>
            {receiptData.customerPhone && (
              <div>Phone: {receiptData.customerPhone}</div>
            )}
          </div>

          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left w-1/2">Item</th>
                <th className="text-center w-1/6">Qty</th>
                <th className="text-right w-1/3">Price</th>
              </tr>
            </thead>
            <tbody>
              {receiptData.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-1">{item.name}</td>
                  <td className="text-center py-1">{item.qty}</td>
                  <td className="text-right py-1">
                    GHS {item.price.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-400 pt-3 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>GHS {receiptData.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>GHS {receiptData.tax.toLocaleString()}</span>
            </div>
            {receiptData.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-GHS {receiptData.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-gray-400 pt-2 mt-2">
              <span>TOTAL:</span>
              <span>GHS {receiptData.total.toLocaleString()}</span>
            </div>
          </div>

          {receiptData.paymentData && (
            <div className="mb-4">
              <div>
                <strong>Payment Method:</strong>{" "}
                {receiptData.paymentData.paymentType === "momo"
                  ? "Mobile Money"
                  : receiptData.paymentData.paymentType === "cash"
                  ? "Cash"
                  : receiptData.paymentData.paymentType === "split"
                  ? "Split Payment"
                  : receiptData.paymentData.paymentType}
              </div>
              {receiptData.paymentData.paymentType === "split" ? (
                <>
                  <div>
                    Total Paid: GHS{" "}
                    {(
                      receiptData.paymentData.total -
                      receiptData.paymentData.remainingAmount
                    ).toLocaleString()}
                  </div>
                  <div>
                    Payment Methods:{" "}
                    {receiptData.paymentData.splitPayments.length}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    Amount Paid: GHS{" "}
                    {parseFloat(
                      receiptData.paymentData.payingAmount
                    ).toLocaleString()}
                  </div>
                  {receiptData.paymentData.change > 0 && (
                    <div>
                      Change: GHS {receiptData.paymentData.change.toFixed(2)}
                    </div>
                  )}
                </>
              )}
              {receiptData.paymentData.paymentReceiver ? (
                <div>
                  Receiver:{" "}
                  {receiptData.paymentData.paymentReceiverName ||
                    receiptData.paymentData.payment_receiver_name ||
                    receiptData.paymentData.paymentReceiver ||
                    receiptData.paymentData.payment_receiver}
                </div>
              ) : (
                ""
              )}
            </div>
          )}

          <div className="text-center border-t border-dashed border-gray-400 pt-3">
            <div className="font-bold">Thank You!</div>
            <div className="text-xs">Please come again</div>
            <div className="text-xs mt-2">
              Printed: {new Date().toLocaleString("en-GH")}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:printer" className="w-5 h-5" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white rounded-lg py-3 font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
            Close
          </button>
        </div>
      </div>
    </SimpleModal>
  );
};

export default ReceiptPreviewModal; 
import React from "react";

const PaymentSummary = ({
  orderId,
  customer,
  total,
  paymentType,
  paymentData,
  users = [],
  mode = "light",
}) => {
  const getPaymentTypeLabel = (method) => {
    // Implement your logic to get a label based on the payment method
    return method;
  };

  // Debug logs
  const paymentReceiverUser = users.find(u => u.id === paymentData?.paymentReceiver);

  return (
    <div className="rounded-lg p-4 mb-6 bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-600">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <span className="text-gray-600 dark:text-gray-300">Order ID:</span>
            <span className="font-semibold ml-2 text-gray-900 dark:text-white">#{orderId}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">Customer:</span>
            <span className="font-semibold ml-2 text-gray-900 dark:text-white">
              {customer
                ? customer.id === "__online__"
                  ? "Online Purchase"
                  : customer.name
                : "Walk In Customer"}
            </span>
          </div>
          {/* Payment Type and Cashier on same row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600 dark:text-gray-300">Payment Type:</span>
              <span className="font-semibold ml-2 text-gray-900 dark:text-white">
                {paymentType === "momo" ? "Mobile Money" : 
                 paymentType === "cash" ? "Cash" : 
                 paymentType === "card" ? "Card" : 
                 paymentType === "split" ? "Split Payment" : 
                 paymentType}
              </span>
            </div>
            {paymentData && paymentData.paymentReceiver && users && (
              <div>
                <span className="text-gray-600 dark:text-gray-300">Cashier:</span>
                <span className="font-semibold ml-2 text-gray-900 dark:text-white">
                  {(() => {
                    const receiver = users.find(u => u.id === paymentData.paymentReceiver);
                    return receiver?.full_name || receiver?.name || receiver?.email || paymentData.paymentReceiver;
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-gray-600 dark:text-gray-300">Total Amount:</span>
            <span className="font-semibold ml-2 text-lg text-blue-700 dark:text-blue-300">
              GHS {total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      {paymentType === "split" &&
        paymentData &&
        paymentData.splitPayments &&
        paymentData.splitPayments.length > 0 && (
          <div className="text-sm mt-1 text-gray-700 dark:text-gray-300">
            Payments:{" "}
            {paymentData.splitPayments
              .map(
                (p) =>
                  `${getPaymentTypeLabel(p.method)} (GHS ${(
                    parseFloat(p.amount) || 0
                  ).toLocaleString()})`
              )
              .join(", ")}
          </div>
        )}
    </div>
  );
};

export default PaymentSummary;

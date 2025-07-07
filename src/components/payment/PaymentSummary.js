import React from "react";

const PaymentSummary = ({
  orderId,
  customer,
  total,
  paymentType,
  paymentData,
  users = [],
}) => {
  const getPaymentTypeLabel = (method) => {
    // Implement your logic to get a label based on the payment method
    return method;
  };

  // Debug logs
  console.log('PaymentSummary users:', users);
  console.log('PaymentSummary paymentReceiver:', paymentData?.paymentReceiver);
  const paymentReceiverUser = users.find(u => u.id === paymentData?.paymentReceiver);
  console.log('PaymentSummary paymentReceiverUser:', paymentReceiverUser);

  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <span className="text-gray-600">Order ID:</span>
            <span className="font-semibold ml-2">#{orderId}</span>
          </div>
          <div>
            <span className="text-gray-600">Customer:</span>
            <span className="font-semibold ml-2">
              {customer
                ? customer.id === "__online__"
                  ? "Online Purchase"
                  : customer.name
                : "Walk In Customer"}
            </span>
          </div>
          {customer && customer.id !== "__online__" && (
            <div>
              <span className="text-gray-600">Phone:</span>
              <span className="font-semibold ml-2">{customer.phone}</span>
            </div>
          )}
          {paymentData && paymentData.paymentReceiver && users && (
            <div>
              <span className="text-gray-600">Payment Receiver:</span>
              <span className="font-semibold ml-2">
                {paymentReceiverUser?.full_name || paymentReceiverUser?.name || paymentReceiverUser?.email || paymentData.paymentReceiver}
              </span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-semibold ml-2 text-lg text-blue-700">
              GHS {total.toLocaleString()}
            </span>
          </div>
          {customer && customer.id !== "__online__" && (
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="font-semibold ml-2">{customer.email}</span>
            </div>
          )}
        </div>
      </div>
      {paymentType === "split" &&
        paymentData &&
        paymentData.splitPayments &&
        paymentData.splitPayments.length > 0 && (
          <div className="text-sm text-gray-700 mt-1">
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

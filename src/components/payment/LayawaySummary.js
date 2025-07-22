import React from "react";
import OrderItems from "../OrderItems";

const LayawaySummary = ({
  orderId,
  customer,
  total,
  paymentType,
  paymentData,
  users = [],
  isLayaway,
  layawayTotalValue,
  layawayPaid,
  layawayOutstanding,
  layawayPayments,
  products,
  quantities,
}) => {
  const getPaymentTypeLabel = (method) => {
    // Implement your logic to get a label based on the payment method
    return method;
  };

  // Debug logs
  const paymentReceiverUser = users.find(u => u.id === paymentData?.paymentReceiver);

  return (
    <div className=" rounded-lg p-4 mb-6 bg-white">
      <div className="mb-2 font-bold text-lg">Layaway Summary</div>

      {/* Order/Customer/Cashier Info */}
      <div className="bg-blue-50 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 p-4 rounded-lg">
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
              <span className="text-gray-600">Cashier:</span>
              <span className="font-semibold ml-2">
                {(() => {
                  const receiver = users.find(
                    (u) => u.id === paymentData.paymentReceiver
                  );
                  return (
                    receiver?.full_name ||
                    receiver?.name ||
                    receiver?.email ||
                    paymentData.paymentReceiver
                  );
                })()}
              </span>
            </div>
          )}
        </div>
        <div className="">
          <div>
            <span className="text-gray-600">Total Layaway:</span>
            <span className="font-semibold ml-2 text-lg text-blue-700">
              GHS {Number(layawayTotalValue).toLocaleString()}
            </span>
          </div>
          <div>
            <div className="flex items-center ">
              <span className="text-gray-600">Deposit Paid:</span>
              <span className="font-semibold ml-2 text-lg text-green-700">
                {Array.isArray(layawayPayments) &&
                layawayPayments.length > 0 ? (
                  layawayPayments.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center border-b last:border-b-0 py-1 text-right"
                    >
                      <span>GHS {Number(p.amount).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 italic">No payments yet.</div>
                )}
              </span>
            </div>
          </div>
          <div>
            <span className="text-gray-600">Outstanding Balance:</span>
            <span className="font-semibold ml-2 text-lg text-red-600">
              GHS {Number(layawayOutstanding).toLocaleString()}
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

      <div className="mb-2 font-bold text-lg">Order Items</div>

      <div className="bg-blue-50 gap-4 text-sm  p-4 rounded-lg">
        <OrderItems products={products} quantities={quantities} />
        
      </div>
    </div>
  );
};

export default LayawaySummary;

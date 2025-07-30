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
  mode = "light",
}) => {
  const getPaymentTypeLabel = (method) => {
    // Implement your logic to get a label based on the payment method
    return method;
  };

  // Debug logs
  const paymentReceiverUser = users.find(u => u.id === paymentData?.paymentReceiver);

  return (
    <div className="rounded-lg p-4 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
      <div className="mb-2 font-bold text-lg text-gray-900 dark:text-white">Layaway Summary</div>

      {/* Order/Customer/Cashier Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 p-4 rounded-lg bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-600">
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
          {customer && customer.id !== "__online__" && (
            <div>
              <span className="text-gray-600 dark:text-gray-300">Phone:</span>
              <span className="font-semibold ml-2 text-gray-900 dark:text-white">{customer.phone}</span>
            </div>
          )}
          {paymentData && paymentData.paymentReceiver && users && (
            <div>
              <span className="text-gray-600 dark:text-gray-300">Cashier:</span>
              <span className="font-semibold ml-2 text-gray-900 dark:text-white">
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
            <span className="text-gray-600 dark:text-gray-300">Total Layaway:</span>
            <span className="font-semibold ml-2 text-lg text-blue-700 dark:text-blue-300">
              GHS {Number(layawayTotalValue).toLocaleString()}
            </span>
          </div>
          <div>
            <div className="flex items-center ">
              <span className="text-gray-600 dark:text-gray-300">Deposit Paid:</span>
              <span className="font-semibold ml-2 text-lg text-green-700 dark:text-green-400">
                {Array.isArray(layawayPayments) &&
                layawayPayments.length > 0 ? (
                  layawayPayments.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center border-b last:border-b-0 py-1 text-right border-gray-200 dark:border-gray-600"
                    >
                      <span>GHS {Number(p.amount).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="italic text-gray-400">No payments yet.</div>
                )}
              </span>
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">Outstanding Balance:</span>
            <span className="font-semibold ml-2 text-lg text-red-600 dark:text-red-400">
              GHS {Number(layawayOutstanding).toLocaleString()}
            </span>
          </div>
          {customer && customer.id !== "__online__" && (
            <div>
              <span className="text-gray-600 dark:text-gray-300">Email:</span>
              <span className="font-semibold ml-2 text-gray-900 dark:text-white">{customer.email}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-2 font-bold text-lg text-gray-900 dark:text-white">Order Items</div>

      <div className="gap-4 text-sm p-4 rounded-lg bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-600">
        <OrderItems products={products} quantities={quantities} />
        
      </div>
    </div>
  );
};

export default LayawaySummary;

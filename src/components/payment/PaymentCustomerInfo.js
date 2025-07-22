import React, { useState, useEffect } from 'react';

const PaymentCustomerInfo = ({ customer, customers, onCustomerChange, paymentData, setPaymentData, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const result = await response.json();
        if (result.success) {
          // Filter only active users and sort by full_name
          const activeUsers = (result.data || [])
            .filter(user => user.is_active)
            .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
          setUsers(activeUsers);
          // Set current user as default payment receiver if not already set
          if (currentUser && paymentData.paymentReceiver !== currentUser.id) {
            setPaymentData(prev => ({
              ...prev,
              paymentReceiver: currentUser.id
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [currentUser, paymentData.paymentReceiver, setPaymentData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer
        </label>
        <select
          value={customer?.id || ""}
          onChange={(e) => {
            let selectedCustomer;
            if (e.target.value === "__online__") {
              selectedCustomer = { id: "__online__", name: "Online Purchase" };
            } else {
              selectedCustomer = customers.find(c => c.id === e.target.value);
            }
            if (onCustomerChange) {
              onCustomerChange(selectedCustomer);
            }
          }}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Walk In Customer</option>
          <option value="__online__">Online Purchase</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} - {c.phone}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cashier <span className="text-red-500">*</span>
        </label>
        {loadingUsers ? (
          <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-500">
            Loading users...
          </div>
        ) : (
          <input
            type="text"
            value={currentUser?.full_name || currentUser?.email || "No user"}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 text-gray-700 cursor-not-allowed"
            readOnly
          />
        )}
      </div>
    </div>
  );
};

export default PaymentCustomerInfo; 
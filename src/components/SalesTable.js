import React from "react";
import { Icon } from "@iconify/react";
import { GenericTable } from "./GenericTable";
import StatusPill from "./StatusPill";

export default function SalesTable({ sales, loading, error, onViewDetails }) {
  return (
    <GenericTable
      data={sales}
      columns={[
        { header: "Date", accessor: "timestamp", sortable: true, render: row => row.timestamp ? row.timestamp.split("T")[0] : "-" },
        { header: "Sale #", accessor: "id", sortable: true },
        { header: "Customer", accessor: "customer_name", sortable: true, render: row => row.customer_name || "Walk In Customer" },
        { header: "Total", accessor: "total", sortable: true, render: row => `GHS ${Number(row.total).toFixed(2)}` },
        { header: "Status", accessor: "status", sortable: true, render: row => <StatusPill status={row.status} /> },
        { header: "Payment", accessor: "payment_method", sortable: true, render: row => row.payment_method || "-" },
        { header: "Staff", accessor: "payment_receiver_name", sortable: true, render: row => row.payment_receiver_name || "-" },
      ]}
      actions={[
        {
          label: "View",
          icon: "mdi:eye-outline",
          onClick: onViewDetails,
        }
      ]}
      loading={loading}
      error={error}
      emptyMessage="No sales found."
      searchable={true}
      enableDateFilter={true}
      selectable={false}
    />
  );
} 
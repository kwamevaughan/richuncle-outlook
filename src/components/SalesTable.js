import React from "react";
import { Icon } from "@iconify/react";
import { GenericTable } from "./GenericTable";
import StatusPill from "./StatusPill";

export default function SalesTable({ sales, loading, error, onViewDetails, onExport }) {
  return (
    <GenericTable
      data={sales}
      columns={[
        { Header: "Date", accessor: "timestamp", sortable: true, render: row => row.timestamp ? row.timestamp.split("T")[0] : "-" },
        { Header: "Sale #", accessor: "id", sortable: true },
        { Header: "Customer", accessor: "customer_name", sortable: true, render: row => row.customer_name || "Walk In Customer" },
        { Header: "Total", accessor: "total", sortable: true, render: row => `GHS ${Number(row.total).toFixed(2)}` },
        { Header: "Status", accessor: "status", sortable: true, render: row => <StatusPill status={row.status} /> },
        { Header: "Payment", accessor: "payment_method", sortable: true, render: row => row.payment_method || "-" },
        { Header: "Staff", accessor: "payment_receiver_name", sortable: true, render: row => row.payment_receiver_name || "-" },
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
      onExport={onExport}
    />
  );
} 
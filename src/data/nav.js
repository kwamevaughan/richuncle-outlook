export const sidebarNav = [
  {
    href: "/dashboard",
    icon: "mdi:home-outline",
    label: "Home",
    isStandalone: true,
  },
  {
    category: "Inventory",
    icon: "mdi:package-variant-closed",
    items: [
      {
        href: "/products",
        icon: "mdi:view-list-outline",
        label: "Products",
      },
      {
        href: "/category",
        icon: "mdi:folder-outline",
        label: "Category",
      },
      {
        href: "/brands",
        icon: "mdi:tag-outline",
        label: "Brands",
      },
      {
        href: "/units",
        icon: "solar:box-broken",
        label: "Units",
      },
      {
        href: "/variant-attributes",
        icon: "mdi:format-list-bulleted",
        label: "Variant Attributes",
      },
    ],
  },
  {
    category: "Stock",
    icon: "mdi:warehouse",
    items: [
      {
        href: "/inventory-overview",
        icon: "mdi:view-dashboard",
        label: "Inventory Overview",
      },
      {
        href: "/stock-operations",
        icon: "mdi:tools",
        label: "Stock Operations",
      },
      {
        href: "/stock-history",
        icon: "mdi:history",
        label: "Stock History",
      },
    ],
  },
  {
    category: "Sales",
    icon: "mdi:cart-outline",
    items: [
      {
        href: "/sales",
        icon: "mdi:bullhorn-outline",
        label: "Sales",
      },
      {
        href: "/sales-return",
        icon: "prime:undo",
        label: "Sales Return",
      },
      {
        href: "/pos",
        icon: "akar-icons:laptop-device",
        label: "POS",
      },
      {
        href: "/registers",
        icon: "mdi:cash-register",
        label: "Registers",
      },
      {
        href: "",
        icon: "",
        label: "Retrieve Layaways",
      },
      {
        href: "",
        icon: "",
        label: "Retrieve Orders",
      },
    ],
  },
  {
    category: "Purchases",
    icon: "mdi:cart-arrow-down",
    items: [
      {
        href: "/purchase-hub",
        icon: "mdi:view-dashboard",
        label: "Purchase Hub",
      },
      {
        href: "/purchase-order",
        icon: "mdi:clipboard-text",
        label: "Purchase Orders",
      },
      {
        href: "/purchases",
        icon: "mdi:cart-check",
        label: "Direct Purchases",
      },
      {
        href: "/purchase-return",
        icon: "mdi:undo-variant",
        label: "Purchase Returns",
      },
    ],
  },
  {
    category: "Promo",
    icon: "mdi:tag-outline",
    items: [
      {
        href: "/discount?tab=discounts",
        icon: "mdi:percent-outline",
        label: "Discount",
      },
      {
        href: "/discount?tab=plans",
        icon: "mdi:file-document-outline",
        label: "Discount Plan",
      },
    ],
  },
  {
    category: "Finance & Accounts",
    icon: "mdi:currency-usd",
    items: [
      {
        href: "/expenses",
        icon: "mdi:file-document-outline",
        label: "Expenses",
        subItems: [
          {
            href: "/expenses",
            icon: "jam:document",
            label: "Expenses",
          },
          {
            href: "/expense-category",
            icon: "mdi:folder-outline",
            label: "Expense Category",
          },
        ],
      },
    ],
  },
  {
    category: "Contacts",
    icon: "tabler:users",
    items: [
      {
        href: "/customers",
        icon: "mdi:account-group-outline",
        label: "Customers",
      },
      {
        href: "/suppliers",
        icon: "mdi:truck-outline",
        label: "Suppliers",
      },
    ],
  },
  {
    category: "Reports",
    icon: "streamline-plump:file-report",
    items: [
      {
        href: "/reports?tab=sales",
        icon: "mdi:chart-line",
        label: "Sales Report",
      },
      {
        href: "/reports?tab=inventory",
        icon: "mdi:package-variant",
        label: "Inventory Report",
      },
      {
        href: "/reports?tab=purchases",
        icon: "mdi:cart-outline",
        label: "Purchases Report",
      },
      {
        href: "/reports?tab=customers",
        icon: "mdi:account-group",
        label: "Customers Report",
      },
      {
        href: "/reports?tab=suppliers",
        icon: "mdi:truck-delivery",
        label: "Suppliers Report",
      },
      {
        href: "/reports?tab=products",
        icon: "mdi:cube-outline",
        label: "Products Report",
      },
      {
        href: "/reports?tab=expenses",
        icon: "mdi:file-document-outline",
        label: "Expenses Report",
      },
      {
        href: "/reports?tab=profit-loss",
        icon: "mdi:chart-areaspline",
        label: "Profit & Loss",
      },
      {
        href: "/reports?tab=tax",
        icon: "mdi:calculator",
        label: "Tax Report",
      },
      {
        href: "/reports?tab=annual",
        icon: "mdi:calendar-year",
        label: "Annual Report",
      },
      {
        href: "/reports?tab=z-report",
        icon: "mdi:receipt-long",
        label: "Z-Report (Register)",
      },
    ],
  },
  {
    category: "User Management",
    icon: "mdi:account-cog-outline",
    items: [
      {
        href: "/users",
        icon: "mdi:account-multiple-outline",
        label: "Users",
      },
      {
        href: "/roles-permissions",
        icon: "mdi:shield-account-outline",
        label: "Roles & Permissions",
      },
    ],
  },
  {
    category: "Settings",
    icon: "solar:settings-linear",
    items: [
      {
        href: "/profile",
        icon: "mdi:account-outline",
        label: "Profile",
      },
      {
        href: "/business-locations",
        icon: "mdi:map-marker-multiple",
        label: "Business Locations",
      },
    ],
  },
];

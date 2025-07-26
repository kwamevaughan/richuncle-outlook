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
            href: "/discount?tab=plans",
            icon: "mdi:file-document-outline",
            label: "Discount Plan",
          },
          {
            href: "/discount",
            icon: "mdi:percent-outline",
            label: "Discount",
          },
    ],
  },
  {
    category: "Finance & Accounts",
    icon: "mdi:currency-usd",
    items: [
      {
        href: "/expenses",
        icon: "jam:document",
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
      {
        href: "/income",
        icon: "jam:document",
        label: "Income",
        subItems: [
          {
            href: "/income",
            icon: "jam:document",
            label: "Income",
          },
          {
            href: "/income-category",
            icon: "mdi:folder-outline",
            label: "Income Category",
          },
        ],
      },
    ],
  },
  {
    category: "Contacts",
    icon: "mdi:account-group-outline",
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
  // {
  //   category: "Reports",
  //   items: [
  //     {
  //       href: "/sales-report",
  //       icon: "mdi:cart-sale",
  //       label: "Sales Report",
  //       subItems: [
  //         {
  //           href: "/sales-report",
  //           icon: "mdi:cart-sale",
  //           label: "Sales Report",
  //         },
  //         {
  //           href: "/best-seller",
  //           icon: "mdi:trophy-outline",
  //           label: "Best Seller",
  //         },
  //       ],
  //     },
  //     {
  //       href: "/purchase-report",
  //       icon: "bx:purchase-tag",
  //       label: "Purchase Report",
  //     },
  //     {
  //       href: "/inventory-report",
  //       icon: "material-symbols:inventory-sharp",
  //       label: "Inventory Report",
  //       subItems: [
  //         {
  //           href: "/inventory-report",
  //           icon: "mdi:package-variant-closed-outline",
  //           label: "Inventory Report",
  //         },
  //         {
  //           href: "/stock-history",
  //           icon: "mdi:history",
  //           label: "Stock History",
  //         },
  //         {
  //           href: "/sold-stock",
  //           icon: "mdi:package-variant-remove",
  //           label: "Sold Stock",
  //         },
  //       ],
  //     },
  //     {
  //       href: "/supplier-report",
  //       icon: "mdi:truck-delivery-outline",
  //       label: "Supplier Report",
  //       subItems: [
  //         {
  //           href: "/supplier-report",
  //           icon: "mdi:truck-delivery-outline",
  //           label: "Supplier Report",
  //         },
  //         {
  //           href: "/supplier-due-report",
  //           icon: "mdi:alert-circle-outline",
  //           label: "Supplier Due Report",
  //         },
  //       ],
  //     },
  //     {
  //       href: "/customer-report",
  //       icon: "mdi:account-group-outline",
  //       label: "Customer Report",
  //       subItems: [
  //         {
  //           href: "/customer-report",
  //           icon: "mdi:account-group-outline",
  //           label: "Customer Report",
  //         },
  //         {
  //           href: "/customer-due-report",
  //           icon: "mdi:alert-circle-outline",
  //           label: "Customer Due Report",
  //         },
  //       ],
  //     },
  //     {
  //       href: "/product-report",
  //       icon: "mdi:package-outline",
  //       label: "Product Report",
  //       subItems: [
  //         {
  //           href: "/product-report",
  //           icon: "mdi:package-outline",
  //           label: "Product Report",
  //         },
  //         {
  //           href: "/product-expiry-report",
  //           icon: "mdi:clock-alert-outline",
  //           label: "Product Expiry Report",
  //         },
  //         {
  //           href: "/product-quantity-alert",
  //           icon: "mdi:alert-outline",
  //           label: "Product Quantity Alert",
  //         },
  //       ],
  //     },
  //     {
  //       href: "/expense-report",
  //       icon: "carbon:document",
  //       label: "Expense Report",
  //     },
  //     {
  //       href: "/income-report",
  //       icon: "entypo:line-graph",
  //       label: "Income Report",
  //     },
  //     {
  //       href: "/tax-report",
  //       icon: "mdi:receipt-outline",
  //       label: "Tax Report",
  //     },
  //     {
  //       href: "/profit-loss",
  //       icon: "mdi:chart-pie-outline",
  //       label: "Profit & Loss",
  //     },
  //     {
  //       href: "/annual-report",
  //       icon: "mdi:calendar-year-outline",
  //       label: "Annual Report",
  //     },
  //   ],
  // },
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
        href: "/general-settings",
        icon: "mdi:cog-outline",
        label: "General Settings",
        subItems: [
          {
            href: "/general-settings",
            icon: "mdi:cog-outline",
            label: "General Settings",
          },
          {
            href: "/profile",
            icon: "mdi:account-outline",
            label: "Profile",
          },
          {
            href: "/security",
            icon: "mdi:shield-outline",
            label: "Security",
          },
          {
            href: "/notifications",
            icon: "mdi:bell-outline",
            label: "Notifications",
          },
          {
            href: "/connected-apps",
            icon: "mdi:link-variant-outline",
            label: "Connected Apps",
          },
        ],
      },
      {
        href: "/app-settings",
        icon: "mdi:cellphone-cog-outline",
        label: "App Settings",
        subItems: [
          {
            href: "/app-settings",
            icon: "mdi:cellphone-cog-outline",
            label: "App Settings",
          },
          {
            href: "/printer",
            icon: "mdi:printer-outline",
            label: "Printer",
          },
          {
            href: "/pos",
            icon: "mdi:point-of-sale-outline",
            label: "POS",
          },
        ],
      },
      {
        href: "/business-locations",
        icon: "mdi:map-marker-multiple",
        label: "Business Locations",
      },
      {
        href: "/website-settings",
        icon: "mdi:web-outline",
        label: "Website Settings",
      },
      {
        href: "/system-settings",
        icon: "mdi:desktop-classic-outline",
        label: "System Settings",
      },
      {
        href: "/financial-settings",
        icon: "mdi:cash-register-outline",
        label: "Financial Settings",
      },
      {
        href: "/other-settings",
        icon: "mdi:dots-horizontal",
        label: "Other Settings",
      },
    ],
  },
];

// Filter navigation for freelancers
export const getFilteredNav = (jobType) => {
  if (jobType?.toLowerCase() === "freelancer") {
    return sidebarNav.filter((item) =>
      ["Dashboard", "Inventory", "Sales", "Promo"].includes(item.category)
    );
  }
  return sidebarNav;
};

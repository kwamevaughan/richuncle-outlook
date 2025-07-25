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
        href: "/low-stocks",
        icon: "mdi:alert-circle-outline",
        label: "Low Stocks",
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
        href: "/manage-stock",
        icon: "material-symbols-light:stockpot-outline",
        label: "Manage Stock",
      },
      {
        href: "/stock-adjustment",
        icon: "mdi:adjust",
        label: "Stock Adjustment",
      },
      {
        href: "/stock-transfer",
        icon: "mdi:truck-delivery-outline",
        label: "Stock Transfer",
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
        label: "Retrive Orders",
      },
    ],
  },
  {
    category: "Promo",
    icon: "mdi:tag-outline",
    items: [
      {
        href: "/coupons",
        icon: "mdi:tag-outline",
        label: "Coupons",
      },
      {
        href: "/gift-cards",
        icon: "mdi:gift-outline",
        label: "Gift Cards",
      },
      {
        href: "/discount",
        icon: "mdi:percent-outline",
        label: "Discount",
        subItems: [
          {
            href: "/discount-plan",
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
    ],
  },
  {
    category: "Purchases",
    icon: "mdi:cart-arrow-down",
    items: [
      {
        href: "/purchases",
        icon: "mdi:cart-outline",
        label: "Purchases",
      },
      {
        href: "/purchase-order",
        icon: "solar:copy-broken",
        label: "Purchase Order",
      },
      {
        href: "/purchase-return",
        icon: "prime:undo",
        label: "Purchase Return",
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
    category: "Peoples",
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
      {
        href: "/stores",
        icon: "mdi:store-outline",
        label: "Stores",
      },
      {
        href: "/warehouses",
        icon: "material-symbols-light:warehouse-outline",
        label: "Warehouses",
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
      {
        href: "/delete-account-request",
        icon: "mdi:account-remove-outline",
        label: "Delete Account Request",
      },
    ],
  },
  // {
  //   category: "Settings",
  //   items: [
  //     {
  //       href: "/general-settings",
  //       icon: "mdi:cog-outline",
  //       label: "General Settings",
  //       subItems: [
  //         {
  //           href: "/general-settings",
  //           icon: "mdi:cog-outline",
  //           label: "General Settings",
  //         },
  //         {
  //           href: "/profile",
  //           icon: "mdi:account-outline",
  //           label: "Profile",
  //         },
  //         {
  //           href: "/security",
  //           icon: "mdi:shield-outline",
  //           label: "Security",
  //         },
  //         {
  //           href: "/notifications",
  //           icon: "mdi:bell-outline",
  //           label: "Notifications",
  //         },
  //         {
  //           href: "/connected-apps",
  //           icon: "mdi:link-variant-outline",
  //           label: "Connected Apps",
  //         },
  //       ],
  //     },
  //     {
  //       href: "/app-settings",
  //       icon: "mdi:cellphone-cog-outline",
  //       label: "App Settings",
  //       subItems: [
  //         {
  //           href: "/app-settings",
  //           icon: "mdi:cellphone-cog-outline",
  //           label: "App Settings",
  //         },
  //         {
  //           href: "/printer",
  //           icon: "mdi:printer-outline",
  //           label: "Printer",
  //         },
  //         {
  //           href: "/pos",
  //           icon: "mdi:point-of-sale-outline",
  //           label: "POS",
  //         },
  //       ],
  //     },
  //     {
  //       href: "/website-settings",
  //       icon: "mdi:web-outline",
  //       label: "Website Settings",
  //     },
  //     {
  //       href: "/system-settings",
  //       icon: "mdi:desktop-classic-outline",
  //       label: "System Settings",
  //     },
  //     {
  //       href: "/financial-settings",
  //       icon: "mdi:cash-register-outline",
  //       label: "Financial Settings",
  //     },
  //     {
  //       href: "/other-settings",
  //       icon: "mdi:dots-horizontal",
  //       label: "Other Settings",
  //     },
  //   ],
  // },
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

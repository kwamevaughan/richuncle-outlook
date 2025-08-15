# GenericTable Enhancement: Automatic Status Pill Rendering

## Overview

The GenericTable component has been enhanced with automatic status pill rendering capabilities, making it easy to create professional-looking tables with consistent status styling across the entire application.

## New Features

### 1. Automatic Status Column Detection
- Automatically identifies status columns based on name patterns
- Supports 18+ common status column patterns
- Checks both `accessor` and `Header` properties

### 2. Smart Context Detection
- Automatically determines the best status context based on:
  - Column name patterns (e.g., "stock_status" → "inventory")
  - Data value patterns (e.g., "completed" → "sales")
  - Header text patterns

### 3. Flexible Configuration
- Custom status contexts for specific columns
- Configurable pill sizes and variants
- Backward compatible with existing implementations

## New Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableStatusPills` | boolean | `false` | Enables automatic status pill rendering |
| `statusContext` | string | `"default"` | Default status context for pills |
| `statusColumnPatterns` | array | Comprehensive list | Patterns to identify status columns |
| `statusPillSize` | string | `"sm"` | Size of status pills: "sm", "md", "lg" |
| `statusPillVariant` | string | `"default"` | Style variant: "default", "solid" |
| `customStatusContexts` | object | `{}` | Custom mapping of column names to contexts |

## Usage Examples

### Basic Usage

```javascript
import { GenericTable } from "@/components/GenericTable";

// Simple table with status pills enabled
<GenericTable
  data={salesData}
  columns={columns}
  enableStatusPills={true}
  statusContext="sales"
/>
```

### Advanced Configuration

```javascript
// Advanced table with custom status configurations
<GenericTable
  data={inventoryData}
  columns={columns}
  enableStatusPills={true}
  statusContext="inventory"
  statusPillSize="md"
  statusPillVariant="solid"
  customStatusContexts={{
    'product_status': 'inventory',
    'user_status': 'user',
    'payment_status': 'payment'
  }}
/>
```

## Supported Status Contexts

### 1. Sales Context (`"sales"`)
- **Statuses**: completed, pending, cancelled, refunded, processing
- **Use Case**: Order management, sales reports
- **Example**: `{ accessor: "status", Header: "Status" }`

### 2. Inventory Context (`"inventory"`)
- **Statuses**: in stock, low stock, out of stock, discontinued
- **Use Case**: Product management, stock reports
- **Example**: `{ accessor: "stock_status", Header: "Stock Status" }`

### 3. User Context (`"user"`)
- **Statuses**: active, inactive, suspended, pending
- **Use Case**: User management, account status
- **Example**: `{ accessor: "is_active", Header: "Status" }`

### 4. Payment Context (`"payment"`)
- **Statuses**: paid, unpaid, partially paid, overdue
- **Use Case**: Payment tracking, financial reports
- **Example**: `{ accessor: "payment_status", Header: "Payment" }`

### 5. Delivery Context (`"delivery"`)
- **Statuses**: shipped, delivered, in transit, delayed
- **Use Case**: Shipping tracking, delivery management
- **Example**: `{ accessor: "shipping_status", Header: "Shipping" }`

## Automatic Column Detection

The component automatically detects status columns using these patterns:

```javascript
const defaultPatterns = [
  "status", "state", "condition", "health",
  "stock_status", "payment_status", "order_status",
  "delivery_status", "shipping_status", "inventory_status",
  "product_status", "user_status", "account_status",
  "subscription_status", "approval_status", "verification_status",
  "completion_status", "progress_status"
];
```

## Real-World Examples

### Sales Report Table
```javascript
// Before: Manual StatusPill implementation
{
  Header: "Status",
  accessor: "status",
  render: (row, value) => <StatusPill status={value} context="sales" />
}

// After: Automatic detection
{
  Header: "Status",
  accessor: "status"
}
// Just add: enableStatusPills={true}, statusContext="sales"
```

### Inventory Table
```javascript
// Before: Custom status rendering
{
  accessor: "stock_status",
  Header: "Status",
  render: (row) => {
    const stockStatus = getStockStatus(row.quantity);
    return (
      <span className={`px-3 py-1 rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
        {stockStatus.status}
      </span>
    );
  }
}

// After: Automatic status pills
{
  accessor: "stock_status",
  Header: "Status"
}
// Just add: enableStatusPills={true}, statusContext="inventory"
```

### Users Table
```javascript
// Before: Manual status styling
{
  accessor: "is_active",
  Header: "Status",
  render: (row) => (
    <span className={`px-2.5 py-0.5 rounded-full ${
      row.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    }`}>
      {row.is_active ? "Active" : "Inactive"}
    </span>
  )
}

// After: Automatic status pills
{
  accessor: "is_active",
  Header: "Status"
}
// Just add: enableStatusPills={true}, statusContext="user"
```

## Migration Guide

### Step 1: Enable Status Pills
```javascript
// Add this prop to your GenericTable
enableStatusPills={true}
```

### Step 2: Set Context
```javascript
// Choose the appropriate context
statusContext="sales"        // For sales/orders
statusContext="inventory"    // For products/stock
statusContext="user"         // For users/accounts
statusContext="payment"      // For payments/financial
statusContext="delivery"     // For shipping/delivery
```

### Step 3: Remove Manual Status Rendering
```javascript
// Remove custom render functions for status columns
// The component will automatically handle them

// Before
{
  accessor: "status",
  Header: "Status",
  render: (row, value) => <StatusPill status={value} context="sales" />
}

// After
{
  accessor: "status",
  Header: "Status"
}
```

### Step 4: Customize if Needed
```javascript
// Add custom configurations for specific columns
customStatusContexts={{
  'product_status': 'inventory',
  'user_status': 'user'
}}

// Adjust pill appearance
statusPillSize="md"
statusPillVariant="solid"
```

## Benefits

### 1. **Consistency**
- All status columns automatically get consistent styling
- Color-coded based on context and status value
- Professional appearance across the application

### 2. **Developer Experience**
- Simple boolean flag to enable status pills
- Automatic context detection reduces configuration
- No need to manually implement StatusPill for each status column

### 3. **Maintainability**
- Centralized status styling logic
- Easy to update status pill appearance globally
- Consistent behavior across all tables

### 4. **Performance**
- Efficient column enhancement using useMemo
- Automatic detection only runs when needed
- Minimal impact on existing functionality

## Backward Compatibility

- All existing functionality preserved
- New props are optional with sensible defaults
- Existing custom render functions take precedence
- No breaking changes to existing implementations

## Troubleshooting

### Status Pills Not Showing
1. Ensure `enableStatusPills={true}` is set
2. Check if column names match status patterns
3. Verify `statusContext` is set correctly

### Wrong Context Detected
1. Use `customStatusContexts` to override auto-detection
2. Check column naming conventions
3. Verify data patterns in the status column

### Custom Rendering Override
1. Keep existing `render` functions for custom styling
2. Status pills only enhance columns without custom renders
3. Use `customStatusContexts` for specific overrides

## Future Enhancements

- Support for more status contexts
- Custom status pill themes
- Advanced pattern matching
- Status pill animations
- Accessibility improvements

---

This enhancement makes GenericTable significantly more powerful and user-friendly while maintaining full backward compatibility. Start using it today to create more professional and consistent tables across your application! 
-- Add cost_price column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0.00;

-- Add tax configuration fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_type VARCHAR(20) DEFAULT 'exclusive';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0.00;

-- Add cost_price column to order_items table to store historical cost at time of sale
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0.00;

-- Add tax fields to order_items table to store historical tax at time of sale
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_type VARCHAR(20) DEFAULT 'exclusive';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_tax DECIMAL(10,2) DEFAULT 0.00;

-- Update existing products to have a default cost_price if they don't have one
UPDATE products SET cost_price = 0.00 WHERE cost_price IS NULL;

-- Update existing products to have default tax configuration if they don't have one
UPDATE products SET tax_type = 'exclusive' WHERE tax_type IS NULL;
UPDATE products SET tax_percentage = 0.00 WHERE tax_percentage IS NULL;

-- Update existing order_items to have a default cost_price if they don't have one
UPDATE order_items SET cost_price = 0.00 WHERE cost_price IS NULL;

-- Update existing order_items to have default tax configuration if they don't have one
UPDATE order_items SET tax_type = 'exclusive' WHERE tax_type IS NULL;
UPDATE order_items SET tax_percentage = 0.00 WHERE tax_percentage IS NULL;
UPDATE order_items SET item_tax = 0.00 WHERE item_tax IS NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN products.cost_price IS 'The cost price of the product for profit calculation';
COMMENT ON COLUMN products.tax_type IS 'Tax type: exclusive (tax added on top) or inclusive (tax included in price)';
COMMENT ON COLUMN products.tax_percentage IS 'Tax percentage rate (0-100)';
COMMENT ON COLUMN order_items.cost_price IS 'The cost price of the product at the time of sale for historical profit calculation';
COMMENT ON COLUMN order_items.tax_type IS 'The tax type at the time of sale for historical accuracy';
COMMENT ON COLUMN order_items.tax_percentage IS 'The tax percentage at the time of sale for historical accuracy';
COMMENT ON COLUMN order_items.item_tax IS 'The calculated tax amount for this item at the time of sale'; 
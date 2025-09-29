# Complete Supabase Database Setup for LejGoPro

This document provides the complete database schema needed for the LejGoPro rental system, including both the basic setup and the advanced inventory management.

## Environment Setup

First, create a `.env` file in your frontend directory with your Supabase credentials:

```
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Tables

### 1. Product Table (Updated Schema)

```sql
CREATE TABLE "Product" (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  features TEXT, -- Comma-separated features
  "dailyPrice" DECIMAL(10,2) NOT NULL,
  "weeklyPrice" DECIMAL(10,2),
  "twoWeekPrice" DECIMAL(10,2),
  popular BOOLEAN DEFAULT false,
  "imageUrl" TEXT,
  quantity INTEGER DEFAULT 1, -- Total quantity available
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Accessory Table

```sql
CREATE TABLE "Accessory" (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1, -- Total quantity available
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. AccessoryInstance Table (For Inventory Management)

```sql
CREATE TABLE "AccessoryInstance" (
  id BIGSERIAL PRIMARY KEY,
  "accessoryId" INTEGER REFERENCES "Accessory"(id) ON DELETE CASCADE,
  "serialNumber" TEXT NOT NULL, -- e.g., "Grip #1", "Battery #2"
  "isAvailable" BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Camera Table (For Product Variants)

```sql
CREATE TABLE "Camera" (
  id BIGSERIAL PRIMARY KEY,
  "productId" INTEGER REFERENCES "Product"(id) ON DELETE CASCADE,
  "dailyPrice" DECIMAL(10,2) NOT NULL,
  "weeklyPrice" DECIMAL(10,2),
  "twoWeekPrice" DECIMAL(10,2),
  "serialNumber" TEXT,
  "isAvailable" BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Booking Table (Complete Schema)

```sql
CREATE TABLE "Booking" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cameraId" INTEGER, -- Legacy field for compatibility
  "cameraName" TEXT,
  "productName" TEXT,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  address TEXT,
  apartment TEXT,
  email TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  phone TEXT,
  "totalPrice" DECIMAL(10,2),
  city TEXT,
  -- New JSONB fields for flexible data storage
  "selectedModels" JSONB, -- Store selected products with quantities
  "selectedAccessories" JSONB, -- Store selected accessories with quantities
  -- Legacy field for backward compatibility
  "accessoryInstanceIds" INTEGER[], -- Array of AccessoryInstance IDs
  -- Booking status
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Sample Data

### Products
```sql
INSERT INTO "Product" (name, description, features, "dailyPrice", "weeklyPrice", "twoWeekPrice", popular) VALUES
('GoPro HERO12 Black', 'Latest model with advanced image quality', '📷 5.3K Video,⚡ HyperSmooth 6.0,🕑 Waterproof', 49.00, 159.00, 299.00, true),
('GoPro HERO11 Black', 'Excellent all-around camera', '📷 5.3K Video,🌙 Nightlapse,⚡ HyperSmooth 5.0', 39.00, 129.00, 249.00, false);
```

### Accessories
```sql
INSERT INTO "Accessory" (name, description, price, quantity) VALUES
('Grip', 'Stable handle for action shots', 70.00, 10),
('Extra Battery', 'Extended power for longer recording', 50.00, 15),
('Head Strap', 'Mount camera on head for POV shots', 60.00, 8),
('Chest Mount', 'Perfect for sports activities', 80.00, 6),
('Protective Case', 'Robust protection against impact', 40.00, 12),
('Suction Cup', 'Attach to windows and smooth surfaces', 90.00, 5);
```

### AccessoryInstances (Auto-generated based on quantities)
```sql
-- This would typically be populated by your application
-- Example for Grip accessories (assuming Accessory id=1)
INSERT INTO "AccessoryInstance" ("accessoryId", "serialNumber", "isAvailable") VALUES
(1, 'Grip #1', true),
(1, 'Grip #2', true),
(1, 'Grip #3', true);
-- Repeat for other accessories...
```

## Row Level Security (Optional)

```sql
-- Enable RLS
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Accessory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccessoryInstance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Camera" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products and accessories
CREATE POLICY "Allow public read access" ON "Product" FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access" ON "Accessory" FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access" ON "AccessoryInstance" FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access" ON "Camera" FOR SELECT TO public USING (true);

-- Allow public insert for bookings (customers can create bookings)
CREATE POLICY "Allow public insert" ON "Booking" FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public read own bookings" ON "Booking" FOR SELECT TO public USING (true);
```

## Data Flow Explanation

### How Accessories Work:

1. **Admin Panel**: 
   - Manages `Accessory` records (name, price, quantity)
   - Auto-generates `AccessoryInstance` records for inventory tracking
   - Each instance has a serial number and availability status

2. **Checkout Process**:
   - Users select accessories by name and quantity
   - System stores selection in `selectedAccessories` JSONB field
   - For inventory management, specific instances could be assigned to `accessoryInstanceIds`

3. **Booking Storage**:
   - **Modern approach**: Store complete selection data in `selectedModels` and `selectedAccessories` JSONB fields
   - **Legacy approach**: Reference specific instances via `accessoryInstanceIds` array
   - Both approaches are supported for flexibility

### Example Booking Data:

```json
{
  "selectedModels": [
    {
      "name": "GoPro HERO12 Black",
      "price": 49.00,
      "quantity": 1,
      "productId": 1
    }
  ],
  "selectedAccessories": [
    {
      "name": "Grip", 
      "price": 70.00,
      "quantity": 2
    },
    {
      "name": "Extra Battery",
      "price": 50.00, 
      "quantity": 1
    }
  ]
}
```

## Troubleshooting

### Common Issues:

1. **"Cannot read properties of undefined (reading 'from')"**
   - Solution: Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env file
   - Restart your development server after setting environment variables

2. **"AccessoryInstance table not found"**
   - Solution: Create the AccessoryInstance table using the SQL above
   - Or the admin will create mock instances automatically

3. **Accessories not being saved in bookings**
   - Solution: The checkout store now properly saves selectedAccessories to the Booking table
   - Check that the selectedAccessories JSONB field exists in your Booking table

### Verification Steps:

1. Visit `/admin` to test Supabase connection
2. Check that products and accessories load properly
3. Create a test booking in checkout to verify data saving
4. Check the Booking table in Supabase to see saved accessory data

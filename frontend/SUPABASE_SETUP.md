# Supabase Tables Setup for LejGoPro

To complete the integration, you'll need to create the following tables in your Supabase database. You can create these using the Supabase Table Editor or SQL.

## 1. Products Table

```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  features TEXT, -- Comma-separated features or JSON array
  daily_price DECIMAL(10,2) NOT NULL,
  weekly_price DECIMAL(10,2),
  two_week_price DECIMAL(10,2),
  popular BOOLEAN DEFAULT false,
  image_url TEXT,
  category TEXT,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Sample Products Data:
```sql
INSERT INTO products (name, description, features, daily_price, weekly_price, two_week_price, popular, image_url) VALUES
('GoPro HERO12 Black', 'Seneste model med avanceret billedkvalitet og forbedret stabilisering.', '📷 5.3K Video,⚡ HyperSmooth 6.0,🕑 Vandtæt,🔋 Forbedret batteri', 49.00, 159.00, 299.00, true, 'https://static.gopro.com/assets/blta2b8522e5372af40/blt86b2d5c67d4f1ed5/64d0e286369276296caf7a71/02-pdp-h12b-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale'),
('GoPro HERO11 Black', 'Fremragende allround kamera med 5.3K video og forbedret natoptagelse.', '📷 5.3K Video,🌙 Nightlapse,⚡ HyperSmooth 5.0,🕑 Vandtæt til 10m', 39.00, 129.00, 249.00, false, 'https://static.gopro.com/assets/blta2b8522e5372af40/bltb0e158820591a2a1/645147b2d5d03c0794f168cd/pdp-h11b-SA-image02-1920-2x.png?width=3840&quality=80&auto=webp&disable=upscale'),
('GoPro HERO10 Black', 'Kraftfuld performance med GP2 processor og glimrende stabilisering.', '📷 5.3K Video,🖥️ GP2 Processor,⚡ HyperSmooth 4.0,🕑 Vandtæt', 29.00, 109.00, 199.00, false, 'https://static.gopro.com/assets/blta2b8522e5372af40/blt2c7d09c3f92e1c63/643ee1005f834b59633e106f/pdp-h10-image02-1920-2x.png?width=1920&quality=80&auto=webp&disable=upscale'),
('GoPro HERO9 Black', 'Pålidelig og prisvenlig mulighed med fremskærm og 5K video.', '📷 5K Video,🖥️ Fremskærm,⚡ HyperSmooth 3.0,⏩ TimeWarp 3.0', 25.00, 89.00, 169.00, false, 'https://static.gopro.com/assets/blta2b8522e5372af40/blt2c7d09c3f92e1c63/643ee1005f834b59633e106f/pdp-h10-image02-1920-2x.png?width=1920&quality=80&auto=webp&disable=upscale');
```

## 2. Accessories Table

```sql
CREATE TABLE accessories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Sample Accessories Data:
```sql
INSERT INTO accessories (name, description, price, image_url) VALUES
('Grip', 'Stabilt håndtag til actionoptagelser og nem håndtering af kameraet.', 70.00, 'https://static.gopro.com/assets/blta2b8522e5372af40/blt4a6b3e1087b3473f/663a841c2a72d93452178ba2/01-pdp-h12b-handler-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale'),
('Ekstra batteri', 'Sørger for ekstra strøm, så du kan optage længere tid uden afbrydelser.', 50.00, 'https://static.gopro.com/assets/blta2b8522e5372af40/blt4a3f356761a12e6d/6465f1c79cb8cadbd353f013/pdp-max-enduro-battery-image01-1920-2x.png?width=1920&quality=80&auto=webp&disable=upscale'),
('Headstrap', 'Monter kameraet på hovedet for hands-free POV-optagelser.', 60.00, 'https://static.gopro.com/assets/blta2b8522e5372af40/blt5028e412643854ae/65cbdc3afcd8646428eec8a5/01-pdp-h12b-headstrap-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale'),
('Brystmount', 'Perfekt til sport og aktiviteter, hvor du vil have kameraet tæt på kroppen.', 80.00, 'https://static.gopro.com/assets/blta2b8522e5372af40/bltbc6b778286c13383/64ccd3c131eb6a3cbbd4c86f/01-pdp-h12b-chesty-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale'),
('Beskyttelsescase', 'Robust etui der beskytter kameraet mod stød, vand og snavs.', 40.00, 'https://static.gopro.com/assets/blta2b8522e5372af40/blt412da0ad3ddaa0f6/64835bbbcc30bb258ab04e57/pdp-protective-housing-image03-1920-2x.png?width=1920&quality=80&auto=webp&disable=upscale'),
('Sugekop til ruder', 'Fastgør kameraet sikkert til bilruder og glatte overflader for unikke vinkler.', 90.00, 'https://static.gopro.com/assets/blta2b8522e5372af40/blt865a9a20edc4b79b/663a899c8447cbcee89cb5a8/01-pdp-h12b-suction-cup-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale');
```

## 3. Bookings Table

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT,
  delivery_apartment TEXT,
  delivery_postal_code TEXT,
  delivery_city TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  has_insurance BOOLEAN DEFAULT false,
  total_amount DECIMAL(10,2),
  selected_products JSONB, -- Store selected products as JSON
  selected_accessories JSONB, -- Store selected accessories as JSON
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. Enable Row Level Security (Optional but Recommended)

You may want to enable RLS on these tables for security:

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products and accessories
CREATE POLICY "Allow public read access" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access" ON accessories FOR SELECT TO public USING (true);

-- Allow public insert for bookings (customers can create bookings)
CREATE POLICY "Allow public insert" ON bookings FOR INSERT TO public WITH CHECK (true);
```

## What's Working Now:

✅ **Products Page**: Fetches products from Supabase and displays them
✅ **ProductCard**: Links to checkout with specific product ID
✅ **Checkout Flow**: Pre-selects products from URL parameters
✅ **Booking Store**: Can save/load booking data to/from Supabase
✅ **Real-time Data**: All data comes from your Supabase database

## To Test:

1. Create the tables in Supabase using the SQL above
2. Run your dev server: `npm run dev`
3. Visit `/products` to see products from Supabase
4. Click "Lej Nu" on any product to go to checkout with pre-selected item
5. Visit `/test-supabase` to verify connection status

## Next Steps:

- Set up payment processing integration
- Implement booking confirmation emails
- Add inventory management
- Deploy to Vercel with environment variables
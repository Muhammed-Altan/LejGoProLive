// Utility to fetch product and accessory prices from DB
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function enrichModelsWithPrices(models: Array<{ name: string; productId: number; quantity: number }>) {
  if (!models.length) return [];
  const ids = models.map(m => m.productId);
  const { data, error } = await supabase
    .from('Product')
    .select('id, name, dailyPrice, weeklyPrice, twoWeekPrice')
    .in('id', ids);
  if (error) throw error;
  return models.map(m => {
    const dbProduct = data.find((p: any) => p.id === m.productId);
    return {
      ...m,
      price: dbProduct?.dailyPrice ?? 0,
      weeklyPrice: dbProduct?.weeklyPrice ?? undefined,
      twoWeekPrice: dbProduct?.twoWeekPrice ?? undefined,
    };
  });
}

export async function enrichAccessoriesWithPrices(accessories: Array<{ name: string; quantity: number }>) {
  if (!accessories.length) return [];
  const names = accessories.map(a => a.name);
  const { data, error } = await supabase
    .from('Accessory')
    .select('name, price')
    .in('name', names);
  if (error) throw error;
  return accessories.map(a => {
    const dbAcc = data.find((acc: any) => acc.name === a.name);
    return {
      ...a,
      price: dbAcc?.price ?? 0,
    };
  });
}

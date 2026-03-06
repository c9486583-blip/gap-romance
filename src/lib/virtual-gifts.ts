export interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  price: number;
  product_id: string;
  price_id: string;
}

export const VIRTUAL_GIFTS: VirtualGift[] = [
  { id: "red-rose", name: "Red Rose", emoji: "🌹", price: 1, product_id: "prod_U6KasmQrE0Qc3t", price_id: "price_1T87vhKKKR3maVmCLVl2sSTf" },
  { id: "heart", name: "Heart", emoji: "❤️", price: 1, product_id: "prod_U6Kb4aFGY9gypN", price_id: "price_1T87wjKKKR3maVmCaH4f2ETC" },
  { id: "flame", name: "Flame", emoji: "🔥", price: 1, product_id: "prod_U6Kcm1DFV4IoLN", price_id: "price_1T87x5KKKR3maVmCc0gA0maT" },
  { id: "chocolate-box", name: "Chocolate Box", emoji: "🍫", price: 2, product_id: "prod_U6Kd9W52R6NjYj", price_id: "price_1T87xpKKKR3maVmCEOOyTR8F" },
  { id: "champagne", name: "Champagne", emoji: "🥂", price: 2, product_id: "prod_U6Kbnk0ha0XZuA", price_id: "price_1T87w4KKKR3maVmCmWXkVS5f" },
  { id: "mystery-box", name: "Mystery Box", emoji: "🎁", price: 2, product_id: "prod_U6KemBrZxcID6f", price_id: "price_1T87ytKKKR3maVmCF61NtON6" },
  { id: "diamond-ring", name: "Diamond Ring", emoji: "💍", price: 3, product_id: "prod_U6KbAsoRl96HRu", price_id: "price_1T87wNKKKR3maVmCnAt2fjin" },
  { id: "gold-crown", name: "Gold Crown", emoji: "👑", price: 3, product_id: "prod_U6Kc6k3GBsx0Mu", price_id: "price_1T87xRKKKR3maVmC20SvPZjF" },
  { id: "yacht", name: "Yacht", emoji: "🛥️", price: 5, product_id: "prod_U6Kd6LVYwPzOdn", price_id: "price_1T87yEKKKR3maVmCUClvLhK5" },
  { id: "private-jet", name: "Private Jet", emoji: "✈️", price: 5, product_id: "prod_U6KdXMcdlKG3kU", price_id: "price_1T87yYKKKR3maVmCSnifGzus" },
];

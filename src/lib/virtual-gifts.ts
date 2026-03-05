export interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  price: number;
}

export const VIRTUAL_GIFTS: VirtualGift[] = [
  { id: "red-rose", name: "Red Rose", emoji: "🌹", price: 1 },
  { id: "heart", name: "Heart", emoji: "❤️", price: 1 },
  { id: "flame", name: "Flame", emoji: "🔥", price: 1 },
  { id: "chocolate-box", name: "Chocolate Box", emoji: "🍫", price: 2 },
  { id: "champagne", name: "Champagne", emoji: "🥂", price: 2 },
  { id: "mystery-box", name: "Mystery Box", emoji: "🎁", price: 2 },
  { id: "diamond-ring", name: "Diamond Ring", emoji: "💍", price: 3 },
  { id: "gold-crown", name: "Gold Crown", emoji: "👑", price: 3 },
  { id: "yacht", name: "Yacht", emoji: "🛥️", price: 5 },
  { id: "private-jet", name: "Private Jet", emoji: "✈️", price: 5 },
];

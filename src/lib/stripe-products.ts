export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

export const STRIPE_PRODUCTS = {
  premium: {
    product_id: "prod_U5g9XMxRsS0LVp",
    price_id: "price_1T7UnE30RgnjoIxN9Dj2eevl",
    name: "Premium",
    price: 19.99,
  },
  elite: {
    product_id: "prod_U5g9c98SqspkzJ",
    price_id: "price_1T7UnX30RgnjoIxNy85Kf3Io",
    name: "Elite",
    price: 34.99,
  },
} as const;

export const STRIPE_ADDONS = {
  boost: {
    product_id: "prod_U5gA258zZMT0xO",
    price_id: "price_1T7Unt30RgnjoIxN9g62E01V",
    name: "Profile Boost",
    price: 5,
  },
  superLike: {
    product_id: "prod_U5gBZ9HIDoDZVR",
    price_id: "price_1T7UpJ30RgnjoIxN5MZLSPBo",
    name: "Super Like",
    price: 2,
  },
  spotlight: {
    product_id: "prod_U5gCtQWNRtufj4",
    price_id: "price_1T7Uph30RgnjoIxNtPEBU8Q5",
    name: "Spotlight Badge",
    price: 7,
  },
} as const;

export const STRIPE_TIME_CREDITS = {
  thirtyMin: {
    product_id: "prod_U5zq04PHrIkLY9",
    price_id: "price_1T7nqT30RgnjoIxNAYkcHxwq",
    name: "30 Minutes Extra",
    seconds: 1800,
    price: 0.99,
  },
  twoHours: {
    product_id: "prod_U5zqXPmEXJEODu",
    price_id: "price_1T7nqq30RgnjoIxNKmciHQaY",
    name: "2 Hours Extra",
    seconds: 7200,
    price: 2.99,
  },
  unlimitedDay: {
    product_id: "prod_U5zq0I05x3tFuj",
    price_id: "price_1T7nr530RgnjoIxN8sAVrQ0Y",
    name: "Unlimited Today",
    seconds: -1, // -1 means unlimited
    price: 4.99,
  },
} as const;

export const STRIPE_COUPON_WELCOME = "WDc9sQwp";

// Legacy credit packs - kept for reference, no longer sold
export const STRIPE_CREDIT_PACKS = {
  credits20: {
    product_id: "prod_U5hXkLER7CXGJn",
    price_id: "price_1T7W8830RgnjoIxNOyWjKzfV",
    name: "20 Message Credits",
    credits: 20,
    price: 2.99,
  },
  credits50: {
    product_id: "prod_U5hXLqOlLWo7Tb",
    price_id: "price_1T7W8X30RgnjoIxN5EgPqrhN",
    name: "50 Message Credits",
    credits: 50,
    price: 5.99,
  },
  credits100: {
    product_id: "prod_U5hY76J4vz5ZcK",
    price_id: "price_1T7W9030RgnjoIxNK6G5pLS4",
    name: "100 Message Credits",
    credits: 100,
    price: 9.99,
  },
} as const;

export function getTimeSecondsFromProductId(productId: string): { seconds: number; unlimited: boolean } | null {
  for (const pack of Object.values(STRIPE_TIME_CREDITS)) {
    if (pack.product_id === productId) {
      return { seconds: pack.seconds, unlimited: pack.seconds === -1 };
    }
  }
  return null;
}

export function getCreditsFromProductId(productId: string): number | null {
  for (const pack of Object.values(STRIPE_CREDIT_PACKS)) {
    if (pack.product_id === productId) return pack.credits;
  }
  return null;
}

export function getTierFromProductId(productId: string | null): "free" | "premium" | "elite" {
  if (productId === STRIPE_PRODUCTS.premium.product_id) return "premium";
  if (productId === STRIPE_PRODUCTS.elite.product_id) return "elite";
  return "free";
}

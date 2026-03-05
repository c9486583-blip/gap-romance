export const STRIPE_PUBLISHABLE_KEY = "pk_test_51T7UMW30RgnjoIxNuHXfSxtfbtwjQ3drlizGP4n6Ox9KnhdqHdbxwIi4t338M276ctQtR0qN0DGDOCZidw2PbmAk006kh0AnTd";

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

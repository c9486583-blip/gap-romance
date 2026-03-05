export const STRIPE_PUBLISHABLE_KEY = "pk_test_51T7UMW30RgnjoIxNuHXfSxtfbtwjQ3drlizGP4n6Ox9KnhdqHdbxwIi4t338M276ctQtR0qN0DGDOCZidw2PbmAk006kh0AnTd";

export const STRIPE_PRODUCTS = {
  premium: {
    product_id: "prod_U5g9XMxRsS0LVp",
    price_id: "price_1T7UnE30RgnjoIxN9Dj2eevl",
    name: "Premium",
    price: 39,
  },
  elite: {
    product_id: "prod_U5g9c98SqspkzJ",
    price_id: "price_1T7UnX30RgnjoIxNy85Kf3Io",
    name: "Elite",
    price: 69,
  },
} as const;

export const STRIPE_ADDONS = {
  boost: {
    product_id: "prod_U5gA258zZMT0xO",
    price_id: "price_1T7Unt30RgnjoIxN9g62E01V",
    name: "Profile Boost",
    price: 7,
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
    price: 12,
  },
} as const;

export function getTierFromProductId(productId: string | null): "free" | "premium" | "elite" {
  if (productId === STRIPE_PRODUCTS.premium.product_id) return "premium";
  if (productId === STRIPE_PRODUCTS.elite.product_id) return "elite";
  return "free";
}

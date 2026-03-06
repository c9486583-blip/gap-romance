export const STRIPE_PUBLISHABLE_KEY = "pk_test_51T7UMW30RgnjoIxNuHXfSxtfbtwjQ3drlizGP4n6Ox9KnhdqHdbxwIi4t338M276ctQtR0qN0DGDOCZidw2PbmAk006kh0AnTd";

export const STRIPE_PRODUCTS = {
  premium: {
    product_id: "prod_U61w6SFz6fxpXF",
    price_id: "price_1T7psPKKKR3maVmC7Yvb5q4F",
    name: "Premium",
    price: 19.99,
  },
  elite: {
    product_id: "prod_U61wIicHFsQSf2",
    price_id: "price_1T7psiKKKR3maVmCZLdZ0eq1",
    name: "Elite",
    price: 34.99,
  },
} as const;

export const STRIPE_ADDONS = {
  boost: {
    product_id: "prod_U61wjf6FtTsN5Q",
    price_id: "price_1T7pszKKKR3maVmCWqRNelMa",
    name: "Profile Boost",
    price: 5,
  },
  superLike: {
    product_id: "prod_U61xO1BEt66ADE",
    price_id: "price_1T7ptJKKKR3maVmCk3u2PyxS",
    name: "Super Like",
    price: 2,
  },
  spotlight: {
    product_id: "prod_U61xQelJ1BhQW8",
    price_id: "price_1T7ptcKKKR3maVmCZlojviO0",
    name: "Spotlight Badge",
    price: 7,
  },
} as const;

export const STRIPE_TIME_CREDITS = {
  thirtyMin: {
    product_id: "prod_U61xFBK1RoVx3t",
    price_id: "price_1T7ptuKKKR3maVmC4QAr74HP",
    name: "30 Minutes Extra",
    seconds: 1800,
    price: 0.99,
  },
  twoHours: {
    product_id: "prod_U61yAWrXnRjvV7",
    price_id: "price_1T7puBKKKR3maVmCMPneBSp4",
    name: "2 Hours Extra",
    seconds: 7200,
    price: 2.99,
  },
  unlimitedDay: {
    product_id: "prod_U61yLNwgjmuZFr",
    price_id: "price_1T7puSKKKR3maVmCQMovMa3M",
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

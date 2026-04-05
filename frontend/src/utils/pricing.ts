import type { MenuItem, MenuSelectionCourse, PricingSummary } from "../types";

const SERVICE_CHARGE_RATE = 0.18;
const TAX_RATE = 0.05;

export function computePricing(
  courses: MenuSelectionCourse[],
  allItems: MenuItem[],
  guestCount: number,
  isBuyout?: boolean,
  buyoutAmount?: number
): PricingSummary {
  if (isBuyout && buyoutAmount) {
    return {
      estimatedPricePerPerson: guestCount > 0 ? buyoutAmount / guestCount : buyoutAmount,
      estimatedSubtotal: buyoutAmount,
      estimatedServiceCharge: 0,
      estimatedTax: 0,
      estimatedTotal: buyoutAmount,
    };
  }

  const itemMap = new Map(allItems.map((i) => [i._id, i]));

  const estimatedPricePerPerson = courses.reduce((sum, course) => {
    const courseItems = course.itemIds
      .map((id) => itemMap.get(id))
      .filter((item): item is MenuItem => !!item);
    if (courseItems.length === 0) return sum;
    const avg = courseItems.reduce((s, i) => s + i.pricePerPerson, 0) / courseItems.length;
    return sum + avg;
  }, 0);

  const estimatedSubtotal = estimatedPricePerPerson * guestCount;
  const estimatedServiceCharge = estimatedSubtotal * SERVICE_CHARGE_RATE;
  const estimatedTax = (estimatedSubtotal + estimatedServiceCharge) * TAX_RATE;
  const estimatedTotal = estimatedSubtotal + estimatedServiceCharge + estimatedTax;

  return {
    estimatedPricePerPerson,
    estimatedSubtotal,
    estimatedServiceCharge,
    estimatedTax,
    estimatedTotal,
  };
}

export const DEPOSIT_TIERS = [
  { minGuests: 10, maxGuests: 15, amount: 200 },
  { minGuests: 16, maxGuests: 30, amount: 500 },
  { minGuests: 31, maxGuests: Infinity, amount: 1000 },
] as const;

export function getDepositAmount(guestCount: number): number | null {
  const tier = DEPOSIT_TIERS.find((t) => guestCount >= t.minGuests && guestCount <= t.maxGuests);
  return tier ? tier.amount : null;
}

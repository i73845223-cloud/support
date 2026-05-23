import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatter = {
  format: (amount: number) => {
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      currencyDisplay: "symbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return formattedAmount.replace("$", "$ ");
  },
};
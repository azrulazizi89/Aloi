import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TP_LEVELS = [1, 2, 3, 4, 5, 6];

export const LANGUAGE_SKILLS = ["Reading", "Writing", "Listening", "Speaking"];

export const TP_COLORS: Record<number, string> = {
  1: "bg-red-100 text-red-700 border-red-200",
  2: "bg-orange-100 text-orange-700 border-orange-200",
  3: "bg-yellow-100 text-yellow-700 border-yellow-200",
  4: "bg-blue-100 text-blue-700 border-blue-200",
  5: "bg-indigo-100 text-indigo-700 border-indigo-200",
  6: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

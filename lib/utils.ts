import { clsx, type ClassValue } from "clsx";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getLocalMidnightDate = (dateString: string | undefined): Date => {
  if (!dateString) dateString = format(Date.now(), "yyyy-MM-dd");
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const utcDate = parseISO(dateString);
  return toZonedTime(utcDate, localTimezone);
};

export const colorShade = (col: string, amt: number) => {
  // Remove leading '#' if present
  col = col.replace(/^#/, "");

  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  if (col.length === 3) {
    col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2];
  }

  // Match each pair of hex digits
  const colorParts = col.match(/.{2}/g);
  if (!colorParts) {
    throw new Error("Invalid color format");
  }
  const [rHex, gHex, bHex] = colorParts;

  // Parse each part and add the amount
  const rNum = parseInt(rHex, 16) + amt;
  const gNum = parseInt(gHex, 16) + amt;
  const bNum = parseInt(bHex, 16) + amt;

  // Clamp the values between 0 and 255 and convert back to hex
  const r = Math.max(0, Math.min(255, rNum)).toString(16).padStart(2, "0");
  const g = Math.max(0, Math.min(255, gNum)).toString(16).padStart(2, "0");
  const b = Math.max(0, Math.min(255, bNum)).toString(16).padStart(2, "0");

  return `#${r}${g}${b}`;
};
export function generateColorByIndex(
  index: number,
  colorPalette: string[],
): string {
  // Ensure index is within bounds by wrapping around the array length
  const wrappedIndex = index % colorPalette.length;
  return colorPalette[wrappedIndex];
}

export const expenseColors = [
  "#6A040F",
  "#9D0208",
  "#DC2F02",
  "#E85D04",
  "#F48C06",
  "#FAA307",
  "#FFBA08",
];

export const incomeColors = [
  "#d8f3dc",
  "#b7e4c7",
  "#95d5b2",
  "#74c69d",
  "#52b788",
  "#40916c",
  "#2d6a4f",
  "#1b4332",
  "#081c15",
];

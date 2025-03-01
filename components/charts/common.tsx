import { generateColorByIndex } from "@/lib/colors";
import { scaleLinear, scaleOrdinal } from "@visx/scale";

export class ChartDimensions {
  axisLeftWidth: number;
  axisBottomHeight: number;
  chartLeft: number;
  chartRight: number;
  chartTop: number;
  chartBottom: number;
  chartWidth: number;
  chartHeight: number;
  legendButtonLeft: number;
  legendButtonTop: number;

  constructor(width: number, height: number) {
    this.axisLeftWidth = 40;
    this.axisBottomHeight = 23;

    this.chartLeft = this.axisLeftWidth;
    this.chartRight = 0;
    this.chartTop = 10;
    this.chartBottom = this.axisBottomHeight;

    this.chartWidth = width - this.chartLeft - this.chartRight;
    this.chartHeight = height - this.chartTop - this.chartBottom;

    this.legendButtonLeft = this.chartLeft + 5;
    this.legendButtonTop = this.chartTop + 5;
  }
}

export type StackedAreasProps = {
  width: number;
  height: number;
  data: StackedDataPoint[];
  // The index at which after this is projection values
  projectionDateIdx: number;
  colorPalette: string[];
};

export const keys = (data: StackedDataPoint[]) =>
  data[0].categories.map((e) => e.category) as string[];

export const getYDollarScale = (
  chartHeight: number,
  chartTop: number,
  data: StackedDataPoint[],
) => {
  return scaleLinear<number>({
    range: [chartHeight + chartTop, chartTop],
    domain: [
      Math.min(
        ...data.map((d) => d.categories.reduce((sum, e) => sum + e.value, 0)),
        0,
      ),
      Math.max(
        ...data.map((d) => d.categories.reduce((sum, e) => sum + e.value, 0)),
      ),
    ],
    nice: true,
  });
};

export const getColorScale = (
  data: StackedDataPoint[],
  colorPalette: string[],
) => {
  return scaleOrdinal({
    // Maps categories to a color for the legend (e.g., groceries => blue)
    domain: data.length === 0 ? [""] : keys(data),
    range:
      data.length === 0
        ? ["#000"]
        : keys(data).map((_, i) => generateColorByIndex(i, colorPalette)),
  });
};

export type ChartTransaction = {
  date: Date;
  amount: number;
  category: string;
};

export interface CategoryValue {
  category: string;
  value: number;
}
export interface StackedDataPoint {
  date: Date;
  categories: CategoryValue[];
}
export function capitalizeWords(str: string): string {
  if (!str) {
    return "";
  }

  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

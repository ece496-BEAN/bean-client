import React, { useCallback } from "react";
import { AreaStack, Bar, Line } from "@visx/shape";
import { scaleTime, scaleLinear, scaleOrdinal } from "@visx/scale";
import { StackedDataPoint } from "./expense-chart";
import { SeriesPoint } from "@visx/shape/lib/types";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { LegendOrdinal } from "@visx/legend";
import { Tooltip, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { max, extent, bisector } from "@visx/vendor/d3-array";

export type StackedAreasProps = {
  width: number;
  height: number;
  data: StackedDataPoint[];
  margin?: { top: number; right: number; bottom: number; left: number };
};

const getDate = (d: StackedDataPoint) => new Date(d.date).valueOf();
const keys = (data: StackedDataPoint[]) =>
  data[0].categories.map((e) => e.category) as string[];
const getY0 = (d: SeriesPoint<StackedDataPoint>) => d[0];
const getY1 = (d: SeriesPoint<StackedDataPoint>) => {
  return d[1];
};
const bisectDate = bisector<StackedDataPoint, Date>(
  (d) => new Date(d.date),
).left;

export default function StackedAreaChart({
  width,
  height,
  data,
  margin = { top: 20, right: 20, bottom: 50, left: 20 },
}: StackedAreasProps) {
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } =
    useTooltip<StackedDataPoint>();

  // bounds
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // scales
  const xScale = scaleTime<number>({
    range: [margin.left, innerWidth + margin.left],
    domain: [Math.min(...data.map(getDate)), Math.max(...data.map(getDate))],
  });
  const yScale = scaleLinear<number>({
    range: [innerHeight + margin.top, margin.top],
    domain: [
      0,
      Math.max(
        ...data.map((d) => d.categories.reduce((sum, e) => sum + e.value, 0)),
      ),
    ],
    nice: true,
  });
  const colorScale = scaleOrdinal({
    // Maps categories to a color for the legend (e.g., groceries => blue)
    domain: data.length === 0 ? ["a"] : keys(data),
    range:
      data.length === 0
        ? ["#000"]
        : keys(data).map((_, i) => generateColorByIndex(i)),
  });

  // tooltip handler
  const handleTooltip = useCallback(
    (
      event:
        | React.TouchEvent<SVGRectElement>
        | React.MouseEvent<SVGRectElement>,
    ) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x);
      const index = bisectDate(data, x0, 1);
      const d0 = data[index - 1];
      const d1 = data[index];
      let d = d0;
      if (d1 && getDate(d1)) {
        d =
          x0.valueOf() - getDate(d0).valueOf() >
          getDate(d1).valueOf() - x0.valueOf()
            ? d1
            : d0;
      }
      showTooltip({
        tooltipData: d,
        tooltipLeft: x,
        tooltipTop: yScale(
          d?.categories?.reduce((sum, e) => sum + e.value, 0) ?? 0,
        ),
      });
    },
    [showTooltip, xScale, yScale],
  );

  return (
    // relative is important for the tooltip to be positioned correctly
    // https://airbnb.io/visx/docs/tooltip#:~:text=If%20you%20would,the%20useTooltip()%20hook.
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <AreaStack<StackedDataPoint>
            data={data}
            keys={data.length != 0 ? keys(data) : []}
            value={(d, key) =>
              d.categories.find((e) => e.category === key)?.value ?? 0
            }
            x={(d) => xScale(getDate(d.data)) ?? 0}
            y0={(d) => yScale(getY0(d) ?? 0)}
            y1={(d) => yScale(getY1(d) ?? 0)}
            color={(_, index) => generateColorByIndex(index)}
          >
            {({ stacks, path }) =>
              stacks.map((stack, i) => {
                // console.log("stack: ", stack);
                const splitIndex = stack.length / 2 + 1;
                const firstHalf = stack.slice(0, splitIndex + 1);
                const secondHalf = stack.slice(splitIndex);
                return (
                  <g key={`group-stack-${stack.key}`}>
                    <path
                      key={`stack1-${stack.key}`}
                      d={path(firstHalf) || ""}
                      stroke="transparent"
                      fill={generateColorByIndex(i)}
                    />
                    <path
                      key={`stack2-${stack.key}`}
                      d={path(secondHalf) || ""}
                      stroke="transparent"
                      fill={colorShade(generateColorByIndex(i), 40)}
                    />
                  </g>
                );
              })
            }
          </AreaStack>
          <AxisLeft left={margin.left} scale={yScale} numTicks={5} />
          <AxisBottom
            top={innerHeight + margin.top}
            scale={xScale}
            numTicks={width > 520 ? 8 : 5}
          />
          <Tooltip />
          {/* Rectangle that handles the tooltip events */}
          <Bar
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
          {tooltipData && (
            <g>
              <Line
                from={{ x: (tooltipLeft ?? 0) - margin.left, y: margin.top }}
                to={{
                  x: (tooltipLeft ?? 0) - margin.left,
                  y: innerHeight + margin.top,
                }}
                stroke={"black"}
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
            </g>
          )}
        </Group>
      </svg>
      {tooltipData && (
        <TooltipWithBounds top={tooltipTop} left={(tooltipLeft ?? 0) + 12}>
          <div>
            <strong>{new Date(tooltipData.date).toLocaleDateString()}</strong>
            <br />
            {tooltipData.categories.map((category, i) => (
              <div key={i} style={{ color: generateColorByIndex(i) }}>
                {category.category}: ${category.value.toFixed(2)}
              </div>
            ))}
          </div>
        </TooltipWithBounds>
      )}
      <LegendOrdinal
        scale={colorScale}
        labelFormat={(label) => label}
        direction="row"
      />
    </div>
  );
}

const colorShade = (col: string, amt: number) => {
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

function generateColorByIndex(index: number): string {
  const colors = [
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#800080", // Purple
    "#A0522D", // Sienna
    "#ADD8E6", // Light Blue
    "#FF69B4", // Hot Pink
    "#90EE90", // Light Green
    "#D3D3D3", // Light Gray
    "#EEE8AA", // Pale Goldenrod
    "#AFEEEE", // Pale Turquoise
    "#FFB6C1", // Light Pink
    "#F08080", // Light Coral
    "#E6E6FA", // Lavender
    "#FFFFE0", // Light Yellow
    "#FFD700", // Gold
    "#808080", // Gray
    "#BC8F8F", // Rosy Brown
    "#CD5C5C", // Indian Red
    "#F4A460", // Sandy Brown
    "#DAA520", // Goldenrod
    "#B8860B", // Dark Goldenrod
    "#A9A9A9", // Dark Gray
    "#BDB76B", // Dark Khaki
    "#FF7F50", // Coral
    "#FF6347", // Tomato
    "#FF4500", // Orange Red
    "#DC143C", // Crimson
    "#C71585", // Medium Violet Red
    "#DB7093", // Pale Violet Red
    "#FF1493", // Deep Pink
    "#FF00FF", // Magenta
    "#9400D3", // Dark Violet
    "#9932CC", // Dark Orchid
    "#8A2BE2", // Blue Violet
    "#4B0082", // Indigo
    "#483D8B", // Dark Slate Blue
    "#6A5ACD", // Slate Blue
    "#7B68EE", // Medium Slate Blue
    "#708090", // Slate Gray
    "#008080", // Teal
    "#008B8B", // Dark Cyan
    "#00CED1", // Dark Turquoise
    "#00BFFF", // Deep Sky Blue
    "#1E90FF", // Dodger Blue
    "#4682B4", // Steel Blue
    "#87CEFA", // Light Sky Blue
    "#87CEEB", // Sky Blue
    "#ADD8E6", // Light Blue
    "#B0E0E6", // Powder Blue
    "#5F9EA0", // Cadet Blue
    "#00FFFF", // Cyan
    "#E0FFFF", // Light Cyan
    "#0000FF", // Blue
    "#4169E1", // Royal Blue
    "#291290", // Midnight Blue
    "#191970", // Midnight Blue (alt)
    "#00008B", // Dark Blue
    "#000080", // Navy
    "#001F3F", // Navy (alt)
    "#006400", // Dark Green
    "#228B22", // Forest Green
    "#2E8B57", // Sea Green
    "#32CD32", // Lime Green
    "#3CB371", // Medium Sea Green
    "#90EE90", // Light Green
    "#98FB98", // Pale Green
    "#ADFF2F", // Green Yellow
    "#7FFF00", // Chartreuse
    "#7CFC00", // Lawn Green
    "#00FF00", // Lime
    "#00FA9A", // Medium Spring Green
    "#00FF7F", // Spring Green
    "#66B366", // Olive Green
    "#808000", // Olive
    "#A0522D", // Sienna
    "#A52A2A", // Brown
    "#CD853F", // Peru
    "#D2691E", // Chocolate
    "#D2B48C", // Tan
    "#F0E68C", // Khaki
    "#F4A460", // Sandy Brown
    "#F5F5DC", // Beige
    "#FFD700", // Gold
    "#FFA07A", // Light Salmon
    "#FFB347", // BurlyWood
    "#FFC0CB", // Pink
    "#FFE4E1", // Seashell
    "#FFF0F5", // Lavender Blush
    "#FFF5EE", // Floral White
    "#FFFF00", // Yellow
    "#FFFFE0", // Light Yellow
    "#FFFFFF", // White
  ];

  // Ensure index is within bounds by wrapping around the array length
  const wrappedIndex = index % colors.length;
  return colors[wrappedIndex];
}

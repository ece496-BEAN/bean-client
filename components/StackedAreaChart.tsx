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
import { generateColorByIndex, colorShade } from "@/lib/colors";
import { color } from "d3";

export type StackedAreasProps = {
  width: number;
  height: number;
  data: StackedDataPoint[];
  // The index at which after this is projection values
  projectionDateIdx: number;
  colorPalette: string[];
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
  projectionDateIdx,
  colorPalette,
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
        : keys(data).map((_, i) => generateColorByIndex(i, colorPalette)),
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
            color={(_, index) => generateColorByIndex(index, colorPalette)}
          >
            {({ stacks, path }) =>
              stacks.map((stack, i) => {
                const splitIndex = projectionDateIdx;
                const firstHalf = stack.slice(0, splitIndex + 1);
                const secondHalf = stack.slice(splitIndex);
                return (
                  <g key={`group-stack-${stack.key}`}>
                    <path
                      key={`stack1-${stack.key}`}
                      d={path(firstHalf) || ""}
                      stroke="transparent"
                      fill={generateColorByIndex(i, colorPalette)}
                    />
                    <path
                      key={`stack2-${stack.key}`}
                      d={path(secondHalf) || ""}
                      stroke="transparent"
                      fill={colorShade(
                        generateColorByIndex(i, colorPalette),
                        60,
                      )}
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
          {tooltipData && <Tooltip />}
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
              <div
                key={i}
                style={{ color: generateColorByIndex(i, colorPalette) }}
              >
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

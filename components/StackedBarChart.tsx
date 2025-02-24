import React, { useCallback } from "react";
import { AreaStack, Bar, BarStack, Line } from "@visx/shape";
import { scaleTime, scaleLinear, scaleOrdinal, scaleBand } from "@visx/scale";
import { capitalizeWords, StackedDataPoint } from "./expense-chart";
import { SeriesPoint } from "@visx/shape/lib/types";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { LegendOrdinal } from "@visx/legend";
import { Tooltip, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { max, extent, bisector } from "@visx/vendor/d3-array";
import { generateColorByIndex, colorShade } from "@/lib/colors";
import { color } from "d3";
import { StackedAreasProps } from "./StackedAreaChart";

const keys = (data: StackedDataPoint[]) =>
  data[0].categories.map((e) => e.category) as string[];

export default function StackedBarChart({
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
  const xScale = scaleBand<Date>({
    range: [margin.left, innerWidth + margin.left],
    domain: data.map((d) => d.date),
    padding: 0.2,
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

  return (
    // relative is important for the tooltip to be positioned correctly
    // https://airbnb.io/visx/docs/tooltip#:~:text=If%20you%20would,the%20useTooltip()%20hook.
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <BarStack<StackedDataPoint, string>
            data={data}
            keys={data.length != 0 ? keys(data) : []}
            value={(d, key) =>
              d.categories.find((e) => e.category === key)?.value ?? 0
            }
            x={(d) => d.date}
            xScale={xScale}
            yScale={yScale}
            color={(d) => colorScale(d)}
          >
            {(barStacks) =>
              barStacks.map((barStack) =>
                barStack.bars.map((bar) => (
                  <rect
                    key={`bar-stack-${barStack.index}-${bar.index}`}
                    x={bar.x}
                    y={bar.y}
                    height={bar.height}
                    width={bar.width}
                    fill={bar.color}
                    onMouseLeave={() => {
                      hideTooltip();
                    }}
                    onMouseMove={(event) => {
                      const eventSvgCoords = localPoint(event);
                      const left = bar.x + bar.width / 2;
                      showTooltip({
                        tooltipData: bar.bar.data,
                        tooltipTop: eventSvgCoords?.y,
                        tooltipLeft: left,
                      });
                    }}
                  />
                )),
              )
            }
          </BarStack>
          <AxisLeft left={margin.left} scale={yScale} numTicks={5} />
          <AxisBottom
            top={innerHeight + margin.top}
            scale={xScale}
            tickFormat={(date) => date.toLocaleDateString()}
            numTicks={width > 520 ? 8 : 5}
          />
          {tooltipData && <Tooltip />}
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
                {capitalizeWords(category.category)}: $
                {category.value.toFixed(2)}
              </div>
            ))}
          </div>
        </TooltipWithBounds>
      )}
      <LegendOrdinal
        scale={colorScale}
        labelFormat={(label) => capitalizeWords(label)}
        direction="row"
      />
    </div>
  );
}

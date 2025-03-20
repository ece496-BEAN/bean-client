import React, { useCallback, useState } from "react";
import { AreaStack, Bar, Line } from "@visx/shape";
import { scaleTime } from "@visx/scale";
import { capitalizeWords } from "./common";
import { StackedDataPoint } from "./common";
import { SeriesPoint } from "@visx/shape/lib/types";
import { AxisBottom } from "@visx/axis";
import { Tooltip, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { bisector } from "@visx/vendor/d3-array";
import { generateColorByIndex, colorShade } from "@/lib/colors";
import { Grid } from "@visx/grid";
import {
  ChartDimensions,
  getColorScale,
  getYDollarScale,
  keys,
  StackedAreasProps,
} from "./common";
import DollarAxisLeft from "./DollarAxisLeft"; // Import the new component
import LegendToggle from "./LegendToggle"; // Import the new component

const getDate = (d: StackedDataPoint) => new Date(d.date).valueOf();
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
}: StackedAreasProps) {
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } =
    useTooltip<StackedDataPoint>();
  const [isLegendVisible, setIsLegendVisible] = useState(false);

  const dimensions = new ChartDimensions(width, height);
  const {
    axisLeftWidth,
    chartLeft,
    chartTop,
    chartWidth,
    chartHeight,
    legendButtonLeft,
    legendButtonTop,
  } = dimensions;

  // scales
  const xScale = scaleTime<number>({
    range: [chartLeft, chartLeft + chartWidth],
    domain: [Math.min(...data.map(getDate)), Math.max(...data.map(getDate))],
  });
  const yScale = getYDollarScale(chartHeight, chartTop, data);
  const colorScale = getColorScale(data, colorPalette);

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
    [showTooltip, xScale, yScale, data],
  );

  return (
    // relative is important for the tooltip to be positioned correctly
    // https://airbnb.io/visx/docs/tooltip#:~:text=If%20you%20would,the%20useTooltip()%20hook.
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
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
                    // stroke="transparent"
                    fill={colorShade(generateColorByIndex(i, colorPalette), 60)}
                  />
                </g>
              );
            })
          }
        </AreaStack>
        {tooltipData && <Tooltip />}
        {/* Rectangle that handles the tooltip events */}
        <Bar
          x={chartLeft} // Position relative to the Group
          y={chartTop} // Position relative to the Group
          width={chartWidth}
          height={chartHeight}
          fill="transparent"
          onTouchStart={handleTooltip}
          onTouchMove={handleTooltip}
          onMouseMove={handleTooltip}
          onMouseLeave={() => hideTooltip()}
        />
        <Grid
          xScale={xScale}
          yScale={yScale}
          left={chartLeft}
          top={chartTop}
          width={chartWidth}
          height={chartHeight}
          stroke={"#0000000F"}
        />
        {tooltipData && tooltipLeft && (
          <g>
            <Line
              from={{ x: tooltipLeft, y: chartTop }} // Position relative to the Group
              to={{
                x: tooltipLeft,
                y: chartHeight,
              }} // Position relative to the Group
              stroke={"#0000005E"}
              strokeWidth={1}
              pointerEvents="none"
              // strokeDasharray="5,2"
            />
          </g>
        )}

        <DollarAxisLeft left={axisLeftWidth} scale={yScale} numTicks={5} />
        <AxisBottom
          top={chartHeight + chartTop}
          scale={xScale}
          numTicks={width > 520 ? 8 : 5}
        />
      </svg>
      {tooltipData && tooltipLeft && (
        <TooltipWithBounds top={tooltipTop} left={tooltipLeft + 12}>
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
      <LegendToggle
        isLegendVisible={isLegendVisible}
        setIsLegendVisible={setIsLegendVisible}
        colorScale={colorScale}
        legendButtonTop={legendButtonTop}
        legendButtonLeft={legendButtonLeft}
      />
    </div>
  );
}

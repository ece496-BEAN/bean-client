import React, { useCallback, useState } from "react";
import { AreaStack, Bar } from "@visx/shape";
import { scaleTime } from "@visx/scale";
import { capitalizeWords } from "./common";
import { StackedDataPoint } from "./common";
import { SeriesPoint } from "@visx/shape/lib/types";
import { AxisBottom } from "@visx/axis";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
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
import DollarAxisLeft from "./DollarAxisLeft";
import LegendToggle from "./LegendToggle";
import TooltipLine from "./TooltipLine";
import DateRangeSlider from "./DateRangeSlider";

const getDate = (d: StackedDataPoint) => new Date(d.date).valueOf();
const getY0 = (d: SeriesPoint<StackedDataPoint>) => d[0];
const getY1 = (d: SeriesPoint<StackedDataPoint>) => d[1];
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
  const [selectedIndices, setSelectedIndices] = useState([0, data.length - 1]);

  const chartRegionHeight = height - 30;
  const dimensions = new ChartDimensions(width, chartRegionHeight);
  const {
    axisLeftWidth,
    chartLeft,
    chartTop,
    chartWidth,
    chartHeight,
    legendButtonLeft,
    legendButtonTop,
  } = dimensions;

  // Sort data by date to ensure chronological order
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Get the selected date range based on slider indices
  const selectedMinIndex = Math.min(...selectedIndices);
  const selectedMaxIndex = Math.max(...selectedIndices);
  const selectedMinDate = new Date(
    sortedData[selectedMinIndex]?.date ?? new Date(),
  );
  const selectedMaxDate = new Date(
    sortedData[selectedMaxIndex]?.date ?? new Date(),
  );

  // Filter visible data based on selected date range
  const visibleData = sortedData.filter(
    (d) =>
      new Date(d.date) >= selectedMinDate &&
      new Date(d.date) <= selectedMaxDate,
  );

  // Adjust projectionDateIdx based on the filtered data range
  const adjustedProjectionDateIdx = Math.max(
    0,
    Math.min(projectionDateIdx - selectedMinIndex, visibleData.length - 1),
  );

  // Scales
  const xScale = scaleTime<number>({
    range: [chartLeft, chartLeft + chartWidth],
    domain: [selectedMinDate, selectedMaxDate],
  });
  const yScale = getYDollarScale(chartHeight, chartTop, visibleData);
  const colorScale = getColorScale(visibleData, colorPalette);

  // Calculate the x-position for the projection start
  const projectionDate = new Date(
    visibleData.length != 0 ? visibleData[adjustedProjectionDateIdx].date : 0,
  );
  const projectionX = xScale(projectionDate);

  // Tooltip handler
  const handleTooltip = useCallback(
    (
      event:
        | React.TouchEvent<SVGRectElement>
        | React.MouseEvent<SVGRectElement>,
    ) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x);
      const index = bisectDate(visibleData, x0, 1);
      const d0 = visibleData[index - 1];
      const d1 = visibleData[index];
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
    [showTooltip, xScale, yScale, visibleData],
  );

  // Handle slider changes
  const handleSliderChange = (selectedIndices: number[]) => {
    setSelectedIndices(selectedIndices);
  };

  return (
    <div style={{ position: "relative" }}>
      <svg width={width} height={chartRegionHeight}>
        <AreaStack<StackedDataPoint>
          data={visibleData}
          keys={visibleData.length !== 0 ? keys(visibleData) : []}
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
              const splitIndex = adjustedProjectionDateIdx;
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
                    fill={colorShade(generateColorByIndex(i, colorPalette), 60)}
                  />
                </g>
              );
            })
          }
        </AreaStack>

        {/* Vertical dotted line and label */}
        <g>
          <line
            x1={projectionX}
            y1={chartTop}
            x2={projectionX}
            y2={chartTop + chartHeight}
            stroke="black"
            strokeWidth={1}
            strokeDasharray="5,5"
          />
          <text
            x={projectionX + 5}
            y={chartTop + 20}
            fontSize="12"
            fill="black"
          >
            Projection Data
          </text>
        </g>

        {/* Rectangle that handles the tooltip events */}
        <Bar
          x={chartLeft}
          y={chartTop}
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
          <TooltipLine
            tooltipLeft={tooltipLeft}
            chartTop={chartTop}
            chartHeight={chartHeight}
          />
        )}

        <DollarAxisLeft left={axisLeftWidth} scale={yScale} numTicks={5} />
        <AxisBottom
          top={chartHeight + chartTop}
          scale={xScale}
          numTicks={width > 520 ? 8 : 5}
        />
      </svg>
      <div style={{ width: chartWidth - 10, marginLeft: chartLeft }}>
        <DateRangeSlider data={sortedData} onChange={handleSliderChange} />
      </div>
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

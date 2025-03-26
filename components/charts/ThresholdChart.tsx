import React, { useCallback } from "react";
import { Bar } from "@visx/shape";
import { scaleTime } from "@visx/scale";
import { AxisBottom } from "@visx/axis";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { bisector } from "@visx/vendor/d3-array";
import { Threshold } from "@visx/threshold";
import { ChartDimensions, getYDollarScale } from "./common";
import DollarAxisLeft from "./DollarAxisLeft";
import { Grid } from "@visx/grid";
import { curveMonotoneX } from "d3";
import TooltipLine from "./TooltipLine";
import DateRangeSlider from "./DateRangeSlider";

export type DataPoint = {
  date: Date;
  value: number;
};

export type ThresholdProps = {
  width: number;
  height: number;
  data: DataPoint[];
  projectionDateIdx: number;
  colorPalette: string[];
};

const getDate = (d: DataPoint) => d.date.getTime();
const getValue = (d: DataPoint) => d.value;

const bisectDate = bisector<DataPoint, Date>((d) => d.date).left;

export default function ThresholdChart({
  width,
  height,
  data,
  projectionDateIdx,
  colorPalette,
}: ThresholdProps) {
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } =
    useTooltip<DataPoint>();

  // Slider state: indices of the selected range
  const [selectedIndices, setSelectedIndices] = React.useState<number[]>([
    0,
    data.length - 1,
  ]);

  const chartRegionHeight = height - 30;
  const dimensions = new ChartDimensions(width, chartRegionHeight);
  const { axisLeftWidth, chartLeft, chartTop, chartWidth, chartHeight } =
    dimensions;

  // Handle slider changes
  const handleSliderChange = (selectedIndices: number[]) => {
    setSelectedIndices(selectedIndices);
  };

  // Sort data by date to ensure chronological order
  const sortedData = [...data].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Get the selected date range based on slider indices
  const selectedMinIndex = Math.min(...selectedIndices);
  const selectedMaxIndex = Math.max(...selectedIndices);
  const selectedMinDate = sortedData[selectedMinIndex]?.date ?? new Date();
  const selectedMaxDate = sortedData[selectedMaxIndex]?.date ?? new Date();

  // Filter visible data based on selected date range
  const visibleData = sortedData.filter(
    (d) => d.date >= selectedMinDate && d.date <= selectedMaxDate,
  );

  // Scales
  const xScale = scaleTime<number>({
    range: [chartLeft, chartLeft + chartWidth],
    domain: [selectedMinDate, selectedMaxDate],
  });
  const yScale = getYDollarScale(
    chartHeight,
    chartTop,
    visibleData.map((d) => ({
      date: d.date,
      categories: [{ category: "value", value: d.value }],
    })),
  );

  // Tooltip handler
  const handleTooltip = useCallback(
    (
      event:
        | React.TouchEvent<SVGRectElement>
        | React.MouseEvent<SVGRectElement>,
    ) => {
      if (visibleData.length === 0) {
        hideTooltip();
        return;
      }
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
        tooltipTop: yScale(d.value ?? 0),
      });
    },
    [showTooltip, xScale, yScale, visibleData, hideTooltip],
  );

  return (
    <div style={{ position: "relative" }}>
      <svg width={width} height={chartRegionHeight}>
        <Threshold<DataPoint>
          data={sortedData}
          x={(d) => xScale(getDate(d)) ?? 0}
          y0={(d) => yScale(getValue(d)) ?? 0}
          y1={() => yScale(0)}
          clipAboveTo={0}
          clipBelowTo={chartHeight + chartTop}
          curve={curveMonotoneX}
          belowAreaProps={{
            fill: "violet",
            fillOpacity: 0.7,
          }}
          aboveAreaProps={{
            fill: "green",
            fillOpacity: 0.6,
          }}
          id={"threshold"}
        />
        <DollarAxisLeft left={axisLeftWidth} scale={yScale} numTicks={5} />
        <AxisBottom
          top={chartHeight + chartTop}
          scale={xScale}
          numTicks={width > 520 ? 8 : 5}
        />
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
      </svg>
      <div style={{ width: chartWidth - 10, marginLeft: chartLeft }}>
        <DateRangeSlider data={sortedData} onChange={handleSliderChange} />
      </div>
      {tooltipData && tooltipLeft && (
        <TooltipWithBounds top={tooltipTop} left={tooltipLeft + 12}>
          <div>
            <strong>{tooltipData.date.toLocaleDateString()}</strong>
            <br />
            {`\$${tooltipData.value.toFixed(2)}`}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

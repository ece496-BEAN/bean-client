import React, { useMemo, useCallback } from "react";
import { AreaClosed, Line, Bar } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import {
  withTooltip,
  Tooltip,
  TooltipWithBounds,
  defaultStyles,
} from "@visx/tooltip";
import { WithTooltipProvidedProps } from "@visx/tooltip/lib/enhancers/withTooltip";
import { localPoint } from "@visx/event";
import { curveMonotoneX } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { max, extent, bisector } from "d3-array";
import { timeFormat } from "d3-time-format";
import { EventType } from "@visx/event/lib/types";
import { AxisLeft, AxisBottom, AxisTop, AxisRight } from "@visx/axis";
import { Group } from "@visx/group";

// Define constants for styling
const background = "#3b6978";
const background2 = "#204051";
const accentColor = "#edffea";
const accentColorDark = "#75daad";
const tooltipStyles = {
  ...defaultStyles,
  background,
  border: "1px solid white",
  color: "white",
};

// Axis styling constants
const axisColor = "#fff";
const axisHorizTickLabelProps = {
  textAnchor: "middle" as const,
  fontFamily: "Arial",
  fontSize: 10,
  fill: axisColor,
};
const axisVertTickLabelProps = {
  fontFamily: "Arial",
  fontSize: 10,
  textAnchor: "start" as const,
  fill: axisColor,
};

// Format date for tooltip
const formatDate = timeFormat("%b %d, '%y");

// Accessor functions for data
const getDate = (d: { date: Date; value: number }): Date => new Date(d.date);
const getValue = (d: { date: Date; value: number }): number => d.value;
const bisectDate = bisector<{ date: Date; value: number }, Date>(
  (d) => new Date(d.date),
).left;

// Define the props for the LineChart component
interface LineChartProps {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  data: { date: Date; value: number }[];
}

interface TooltipData {
  date: Date;
  value: number;
}

// Extracted Tooltip Components
const TooltipLine: React.FC<{
  tooltipLeft: number;
  margin: { top: number; right: number; bottom: number; left: number };
  innerHeight: number;
}> = ({ tooltipLeft, margin, innerHeight }) => (
  <Line
    from={{ x: tooltipLeft, y: margin.top }}
    to={{ x: tooltipLeft, y: innerHeight + margin.top }}
    stroke={accentColorDark}
    strokeWidth={2}
    pointerEvents="none"
    strokeDasharray="5,2"
  />
);

const TooltipCircle = ({
  tooltipLeft,
  tooltipTop,
}: {
  tooltipLeft: number;
  tooltipTop: number;
}) => (
  <>
    <circle
      cx={tooltipLeft}
      cy={tooltipTop + 1}
      r={4}
      fill="black"
      fillOpacity={0.1}
      stroke="black"
      strokeOpacity={0.1}
      strokeWidth={2}
      pointerEvents="none"
    />
    <circle
      cx={tooltipLeft}
      cy={tooltipTop}
      r={4}
      fill={accentColorDark}
      stroke="white"
      strokeWidth={2}
      pointerEvents="none"
    />
  </>
);

const LineChart: React.FC<LineChartProps & WithTooltipProvidedProps<any>> = ({
  width,
  height,
  margin = { top: 0, right: 0, bottom: 0, left: 0 },
  showTooltip,
  hideTooltip,
  tooltipData,
  tooltipTop = 0,
  tooltipLeft = 0,
  data,
}) => {
  // Calculate inner dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create scales
  const xScale = useMemo(
    () =>
      scaleTime({
        range: [0, innerWidth],
        domain: extent(data, getDate) as [Date, Date],
      }),
    [innerWidth, data],
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight, 0],
        domain: [0, (max(data, getValue) || 0) + innerHeight / 3],
        nice: true,
      }),
    [innerHeight, data],
  );

  // Handle tooltip
  const handleTooltip = useCallback(
    (event: Element | EventType) => {
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
        tooltipTop: yScale(getValue(d)),
      });
    },
    [showTooltip, yScale, xScale, data],
  );

  return (
    <div>
      <svg width={width} height={height}>
        {/* Background */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="url(#area-background-gradient)"
          rx={14}
        />
        <LinearGradient
          id="area-background-gradient"
          from={background}
          to={background2}
        />
        <LinearGradient
          id="area-gradient"
          from={accentColor}
          to={accentColor}
          toOpacity={0.1}
        />
        <Group left={margin.left} top={margin.top}>
          {/* Area chart */}
          <AreaClosed
            data={data}
            x={(d) => xScale(getDate(d)) ?? 0}
            y={(d) => yScale(getValue(d)) ?? 0}
            yScale={yScale}
            strokeWidth={1}
            stroke="url(#area-gradient)"
            fill="url(#area-gradient)"
            curve={curveMonotoneX}
          />
          {/* Tooltip interaction area */}
          <Bar
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            rx={14}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
          {/* Tooltip elements */}
          {tooltipData && (
            <g>
              <TooltipLine
                tooltipLeft={tooltipLeft}
                margin={margin}
                innerHeight={innerHeight}
              />
              <TooltipCircle
                tooltipLeft={tooltipLeft}
                tooltipTop={tooltipTop}
              />
            </g>
          )}
          {/* Axes */}
          <AxisTop
            top={innerHeight}
            scale={xScale}
            numTicks={width > 520 ? 10 : 5}
            stroke={axisColor}
            tickStroke={axisColor}
            tickLabelProps={axisHorizTickLabelProps}
          />
          <AxisRight
            left={0}
            scale={yScale}
            numTicks={5}
            stroke={axisColor}
            tickStroke={axisColor}
            tickLabelProps={axisVertTickLabelProps}
          />
        </Group>
      </svg>
      {/* Tooltip display */}
      {tooltipData && (
        <div>
          <TooltipWithBounds
            key={Math.random()}
            top={tooltipTop - 12}
            left={tooltipLeft + 12}
            style={tooltipStyles}
          >
            {`$${getValue(tooltipData)}`}
          </TooltipWithBounds>
          <Tooltip
            top={innerHeight - 14}
            left={tooltipLeft}
            style={{
              ...defaultStyles,
              minWidth: 72,
              textAlign: "center",
              transform: "translateX(-50%)",
            }}
          >
            {formatDate(getDate(tooltipData))}
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default withTooltip<LineChartProps, TooltipData>(LineChart);

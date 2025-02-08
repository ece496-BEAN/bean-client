import React, { useMemo, useCallback, useRef, useState } from "react";
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
import { curveBasis, curveMonotoneX, curveNatural } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { max, extent, bisector, min } from "d3-array";
import { timeFormat } from "d3-time-format";
import { EventType } from "@visx/event/lib/types";
import { AxisLeft, AxisBottom, AxisTop, AxisRight } from "@visx/axis";
import { Threshold } from "@visx/threshold";
import { Group } from "@visx/group";
import { Brush } from "@visx/brush";
import { Bounds } from "@visx/brush/lib/types";
import BaseBrush from "@visx/brush/lib/BaseBrush";
import { PatternLines } from "@visx/pattern";
import { BrushHandleRenderProps } from "@visx/brush/lib/BrushHandle";

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
const axisColor = "#0";
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

// Define Datum interface
interface Datum {
  date: Date;
  value: number;
}

// Define the props for the LineChart component
interface LineChartProps {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  data: Datum[];
}

interface TooltipData extends Datum {}

// Accessor functions for data
const getDate = (d: Datum): Date => new Date(d.date);
const getValue = (d: Datum): number => d.value;
const bisectDate = bisector<Datum, Date>((d) => new Date(d.date)).left;

// Define the props for the LineChart component
interface LineChartProps {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  data: Datum[];
}

interface TooltipData {
  date: Date;
  value: number;
}

// const defaultMargin = { top: 0, right: 0, bottom: 0, left: 0};
const defaultMargin = { top: 5, right: 10, bottom: 25, left: 40 };

// Brush styling
const brushMargin = { top: 10, bottom: 10, left: 10, right: 10 }; // Adjust as needed
const PATTERN_ID = "brush_pattern";
const selectedBrushStyle = {
  fill: `url(#${PATTERN_ID})`,
  stroke: "white",
};

const LineChart: React.FC<
  LineChartProps & WithTooltipProvidedProps<TooltipData>
> = ({
  width,
  height,
  margin = defaultMargin,
  showTooltip,
  hideTooltip,
  tooltipData,
  tooltipTop = 0,
  tooltipLeft = 0,
  data,
}) => {
  const brushRef = useRef<BaseBrush | null>(null);
  const [brushDomain, setBrushDomain] = useState<Bounds | null>(null);

  // Calculate inner dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const brushWidth = innerWidth - brushMargin.left - brushMargin.right;
  const brushHeight = 50; // Fixed height for the brush area, adjust as needed

  // **Updated xScale definition to respond to brushDomain**
  const xScale = useMemo(
    () => {
      if (brushDomain) {
        // Use brushed domain if available
        return scaleTime({
          range: [0, innerWidth],
          domain: [
            brushDomain.x0 as unknown as Date,
            brushDomain.x1 as unknown as Date,
          ],
        });
      } else {
        // Otherwise, use the full data extent
        return scaleTime({
          range: [0, innerWidth],
          domain: extent(data, getDate) as [Date, Date],
        });
      }
    },
    [innerWidth, data, brushDomain], // brushDomain is now a dependency
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight, 0],
        domain: [
          (min(data, getValue) || 0) - innerHeight / 3,
          (max(data, getValue) || 0) + innerHeight / 3,
        ],
        nice: true,
      }),
    [innerHeight, data],
  );

  // Create scales for the brush (using same domain as main chart for simplicity)
  const brushDateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, brushWidth],
        domain: extent(data, getDate) as [Date, Date],
      }),
    [brushWidth, data],
  );

  const brushStockScale = useMemo(
    () =>
      scaleLinear({
        range: [brushHeight, 0], // Adjust range as needed for brush height
        domain: yScale.domain(), // Use the same Y domain as the main chart or adjust
        nice: true,
      }),
    [brushHeight, yScale.domain()],
  );

  const initialBrushPosition = useMemo(
    () => ({
      start: { x: 0 },
      end: { x: 10 },
    }),
    [], // Removed dependencies as it should be constant on initial render
  );

  // Brush change handler
  const onBrushChange = useCallback(
    (domain: Bounds | null) => {
      setBrushDomain(domain); // Update brushDomain state, which triggers xScale recalculation
    },
    [setBrushDomain],
  );

  // Function to clear the brush and reset the zoom
  const handleClearBrush = useCallback(() => {
    setBrushDomain(null); // Clear the brush domain, resetting xScale to full extent
    if (brushRef.current) {
      brushRef.current.reset(); // Programmatically reset the brush visually
    }
  }, [setBrushDomain, brushRef]);

  // Handle tooltip
  const handleTooltip = useCallback(
    (event: Element | EventType) => {
      const { x } = localPoint(event) || { x: 0 };
      const x_ = x - margin.left;
      const x0 = xScale.invert(x_);
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
        tooltipLeft: x_,
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
        <Group left={margin.left} top={margin.top}>
          {/* Threshold chart */}
          <Threshold<Datum>
            id="threshold"
            data={data}
            clipAboveTo={0}
            clipBelowTo={innerHeight}
            // **Use the updated xScale**
            x={(d) => xScale(getDate(d)) ?? 0}
            y0={(d) => yScale(getValue(d)) ?? 0}
            y1={(_) => yScale(0) ?? 0}
            belowAreaProps={{
              fill: "violet",
              fillOpacity: 0.4,
            }}
            aboveAreaProps={{
              fill: "green",
              fillOpacity: 0.4,
            }}
            curve={curveNatural}
          ></Threshold>

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
              <Line
                from={{ x: tooltipLeft, y: margin.top }}
                to={{ x: tooltipLeft, y: innerHeight + margin.top }}
                stroke={accentColorDark}
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
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
            </g>
          )}
          {/* Axes */}
          <AxisBottom
            top={innerHeight}
            // **Use the updated xScale**
            scale={xScale}
            numTicks={width > 520 ? 10 : 5}
          />
          <AxisLeft scale={yScale} numTicks={5} />

          {/* Brush Area */}
          <Group top={0} left={brushMargin.left}>
            <rect width={brushWidth} height={brushHeight} fill="#f0f2f5" />
            <Line
              from={{ x: 0, y: brushHeight }}
              to={{ x: brushWidth, y: brushHeight }}
              stroke="#ccc"
              strokeWidth={1}
            />
            <PatternLines
              id={PATTERN_ID}
              height={6}
              width={6}
              stroke={accentColorDark}
              strokeWidth={1}
              orientation={["diagonal"]}
            />
            <Brush
              xScale={brushDateScale}
              yScale={brushStockScale}
              width={brushWidth}
              height={brushHeight}
              margin={brushMargin}
              handleSize={8}
              innerRef={brushRef}
              resizeTriggerAreas={["left", "right"]}
              brushDirection="horizontal"
              initialBrushPosition={initialBrushPosition}
              onChange={onBrushChange}
              onClick={() => console.log("Brush Clicked")}
              selectedBoxStyle={selectedBrushStyle}
              useWindowMoveEvents
              renderBrushHandle={(props) => <BrushHandle {...props} />}
            />
          </Group>
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
      <LinearGradient
        id="area-background-gradient"
        from={background}
        to={background2}
        rotate={45}
      />
      {/* Button to clear brush */}
      <button onClick={handleClearBrush}>Clear Brush</button>
    </div>
  );
};

// We need to manually offset the handles for them to be rendered at the right position
function BrushHandle({ x, height, isBrushActive }: BrushHandleRenderProps) {
  const pathWidth = 8;
  const pathHeight = 15;
  if (!isBrushActive) {
    return null;
  }
  return (
    <Group left={x + pathWidth / 2} top={(height - pathHeight) / 2}>
      <path
        fill="#f2f2f2"
        d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
        stroke="#999999"
        strokeWidth="1"
        style={{ cursor: "ew-resize" }}
      />
    </Group>
  );
}

export default withTooltip<LineChartProps, TooltipData>(LineChart);

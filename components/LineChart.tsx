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
import { curveNatural } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { max, extent, bisector, min } from "d3-array";
import { timeFormat } from "d3-time-format";
import { EventType } from "@visx/event/lib/types";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { Threshold } from "@visx/threshold";
import { Group } from "@visx/group";
import { Brush } from "@visx/brush";
import { Bounds } from "@visx/brush/lib/types";
import BaseBrush from "@visx/brush/lib/BaseBrush";
import { PatternLines } from "@visx/pattern";
import { BrushHandleRenderProps } from "@visx/brush/lib/BrushHandle";

// ============================== Constants ==============================
const CHART_COLORS = {
  background: "#3b6978",
  backgroundSecondary: "#204051",
  accent: "#edffea",
  accentDark: "#75daad",
  axis: "#0",
  brushPattern: "brush_pattern",
};

const MARGINS = {
  chart: { top: 5, right: 10, bottom: 25, left: 40 },
  brush: { top: 10, bottom: 10, left: 10, right: 10 },
};

const TOOLTIP_STYLES = {
  ...defaultStyles,
  background: CHART_COLORS.background,
  border: "1px solid white",
  color: "white",
};

const AXIS_PROPS = {
  horizontal: {
    textAnchor: "middle" as const,
    fontFamily: "Arial",
    fontSize: 10,
    fill: CHART_COLORS.axis,
  },
  vertical: {
    fontFamily: "Arial",
    fontSize: 10,
    textAnchor: "start" as const,
    fill: CHART_COLORS.axis,
  },
};

const BRUSH_STYLES = {
  selected: {
    fill: `url(#${CHART_COLORS.brushPattern})`,
    stroke: "white",
  },
  height: 50,
};

const DATE_FORMAT = timeFormat("%b %d, '%y");

// ============================== Interfaces ==============================
interface DataPoint {
  date: Date;
  value: number;
}

interface LineChartProps {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  data: DataPoint[];
}

interface TooltipData extends DataPoint {}

// ============================== Utility Functions ==============================
const getDate = (d: DataPoint) => new Date(d.date);
const getValue = (d: DataPoint) => d.value;
const bisectDate = bisector<DataPoint, Date>((d) => new Date(d.date)).left;

// ============================== Main Component ==============================
const LineChart: React.FC<
  LineChartProps & WithTooltipProvidedProps<TooltipData>
> = ({
  width,
  height,
  margin = MARGINS.chart,
  showTooltip,
  hideTooltip,
  tooltipData,
  tooltipTop = 0,
  tooltipLeft = 0,
  data,
}) => {
  // ============================== Refs & State ==============================
  const brushRef = useRef<BaseBrush | null>(null);
  const [brushDomain, setBrushDomain] = useState<Bounds | null>(null);

  // ============================== Dimensions ==============================
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const brushWidth = innerWidth - MARGINS.brush.left - MARGINS.brush.right;

  // ============================== Scales ==============================
  const xScale = useMemo(
    () =>
      scaleTime({
        range: [0, innerWidth],
        domain: brushDomain
          ? [
              brushDomain.x0 as unknown as Date,
              brushDomain.x1 as unknown as Date,
            ]
          : (extent(data, getDate) as [Date, Date]),
      }),
    [innerWidth, data, brushDomain],
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

  const brushXScale = useMemo(
    () =>
      scaleTime({
        range: [0, brushWidth],
        domain: extent(data, getDate) as [Date, Date],
      }),
    [brushWidth, data],
  );

  const brushYScale = useMemo(
    () =>
      scaleLinear({
        range: [BRUSH_STYLES.height, 0],
        domain: yScale.domain(),
        nice: true,
      }),
    [BRUSH_STYLES.height, yScale.domain()],
  );

  // ============================== Event Handlers ==============================
  const handleBrushChange = useCallback(
    (domain: Bounds | null) => setBrushDomain(domain),
    [],
  );

  const handleClearBrush = useCallback(() => {
    setBrushDomain(null);
    brushRef.current?.reset();
  }, []);

  const handleTooltip = useCallback(
    (event: Element | EventType) => {
      const { x } = localPoint(event) || { x: 0 };
      const xCoord = x - margin.left;
      const date = xScale.invert(xCoord);
      const index = bisectDate(data, date, 1);

      const [prevPoint, nextPoint] = [data[index - 1], data[index]];
      const closestPoint =
        nextPoint?.date.valueOf() - date.valueOf() <
        date.valueOf() - prevPoint?.date.valueOf()
          ? nextPoint
          : prevPoint;

      if (closestPoint) {
        showTooltip({
          tooltipData: closestPoint,
          tooltipLeft: xCoord,
          tooltipTop: yScale(getValue(closestPoint)),
        });
      }
    },
    [showTooltip, yScale, xScale, data, margin.left],
  );

  return (
    <div>
      <svg width={width} height={height}>
        <rect
          width={width}
          height={height}
          fill="url(#area-background-gradient)"
          rx={14}
        />

        <Group left={margin.left} top={margin.top}>
          {/* ========================= Chart Area ========================= */}
          <Threshold<DataPoint>
            data={data}
            x={(d) => xScale(getDate(d)) ?? 0}
            y0={(d) => yScale(getValue(d)) ?? 0}
            y1={() => yScale(0)}
            clipAboveTo={0}
            clipBelowTo={innerHeight}
            curve={curveNatural}
            belowAreaProps={{
              fill: "violet",
              fillOpacity: 0.4,
            }}
            aboveAreaProps={{
              fill: "green",
              fillOpacity: 0.4,
            }}
            id={""}
          />

          {/* ====================== Tooltip Interaction ====================== */}
          <Bar
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            rx={14}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={hideTooltip}
          />

          {/* ============================ Axes ============================ */}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            numTicks={width > 520 ? 10 : 5}
          />
          <AxisLeft scale={yScale} numTicks={5} />

          {/* ============================ Brush ============================ */}
          <Group top={0} left={MARGINS.brush.left}>
            <rect
              width={brushWidth}
              height={BRUSH_STYLES.height}
              fill="#f0f2f5"
            />
            <PatternLines
              id={CHART_COLORS.brushPattern}
              height={6}
              width={6}
              stroke={CHART_COLORS.accentDark}
              strokeWidth={1}
              orientation={["diagonal"]}
            />
            <Brush
              xScale={brushXScale}
              yScale={brushYScale}
              width={brushWidth}
              height={BRUSH_STYLES.height}
              margin={MARGINS.brush}
              handleSize={8}
              brushDirection="horizontal"
              selectedBoxStyle={BRUSH_STYLES.selected}
              innerRef={brushRef}
              onChange={handleBrushChange}
              renderBrushHandle={(props) => <BrushHandle {...props} />}
            />
          </Group>

          {/* =========================== Tooltip =========================== */}
          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft, y: margin.top }}
                to={{ x: tooltipLeft, y: innerHeight + margin.top }}
                stroke={CHART_COLORS.accentDark}
                strokeWidth={2}
                strokeDasharray="5,2"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={4}
                fill={CHART_COLORS.accentDark}
                stroke="white"
                strokeWidth={2}
              />
            </g>
          )}
        </Group>
      </svg>

      {/* ============================ Tooltip Content ============================ */}
      {tooltipData && (
        <div>
          <TooltipWithBounds
            top={tooltipTop - 12}
            left={tooltipLeft + 12}
            style={TOOLTIP_STYLES}
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
            {DATE_FORMAT(getDate(tooltipData))}
          </Tooltip>
        </div>
      )}

      <LinearGradient
        id="area-background-gradient"
        from={CHART_COLORS.background}
        to={CHART_COLORS.backgroundSecondary}
        rotate={45}
      />
      <button onClick={handleClearBrush}>Clear Brush</button>
    </div>
  );
};

// ============================== Brush Handle ==============================
const BrushHandle = ({ x, height, isBrushActive }: BrushHandleRenderProps) => {
  if (!isBrushActive) return null;

  return (
    <Group left={x + 4} top={(height - 15) / 2}>
      <path
        fill="#f2f2f2"
        d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
        stroke="#999999"
        strokeWidth="1"
        style={{ cursor: "ew-resize" }}
      />
    </Group>
  );
};

export default withTooltip<LineChartProps, TooltipData>(LineChart);

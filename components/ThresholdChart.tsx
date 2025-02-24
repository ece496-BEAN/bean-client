import React, { useCallback } from "react";
import { Bar, Line } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { Tooltip, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { bisector } from "@visx/vendor/d3-array";
import { Threshold } from "@visx/threshold";
import { curveBasis, curveNatural } from "@visx/curve";

export type DataPoint = {
  date: Date;
  value: number;
};

export type ThresholdProps = {
  width: number;
  height: number;
  data: DataPoint[];
  // The index at which after this is projection values
  projectionDateIdx: number;
  colorPalette: string[];
  margin?: { top: number; right: number; bottom: number; left: number };
};

const getDate = (d: DataPoint) => new Date(d.date).valueOf();
const getValue = (d: DataPoint) => d.value;

const bisectDate = bisector<DataPoint, Date>((d) => new Date(d.date)).left;

export default function ThresholdChart({
  width,
  height,
  data,
  projectionDateIdx,
  colorPalette,
  margin = { top: 20, right: 20, bottom: 50, left: 20 },
}: ThresholdProps) {
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } =
    useTooltip<DataPoint>();

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
      Math.min(...data.map((d) => d.value), 0),
      Math.max(...data.map((d) => d.value)),
    ],
    nice: true,
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
        tooltipTop: yScale(d.value ?? 0),
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
          <Threshold<DataPoint>
            data={data}
            x={(d) => xScale(getDate(d)) ?? 0}
            y0={(d) => yScale(getValue(d)) ?? 0}
            y1={() => yScale(0)}
            clipAboveTo={0}
            clipBelowTo={innerHeight + margin.top}
            curve={curveBasis}
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
            {`\$${tooltipData.value.toFixed(2)}`}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

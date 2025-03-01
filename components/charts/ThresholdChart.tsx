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
import { ChartDimensions, getYDollarScale } from "./common";
import DollarAxisLeft from "./DollarAxisLeft";
import { Grid } from "@visx/grid";

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
}: ThresholdProps) {
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } =
    useTooltip<DataPoint>();
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
  const yScale = getYDollarScale(
    chartHeight,
    chartTop,
    data.map((data) => ({
      date: data.date,
      categories: [{ category: "value", value: data.value }],
    })),
  );

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
        <Threshold<DataPoint>
          data={data}
          x={(d) => xScale(getDate(d)) ?? 0}
          y0={(d) => yScale(getValue(d)) ?? 0}
          y1={() => yScale(0)}
          clipAboveTo={0}
          clipBelowTo={chartHeight + chartTop}
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
        <DollarAxisLeft left={axisLeftWidth} scale={yScale} numTicks={5} />
        <AxisBottom
          top={chartHeight + chartTop}
          scale={xScale}
          numTicks={width > 520 ? 8 : 5}
        />

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
      </svg>
      {tooltipData && tooltipLeft && (
        <TooltipWithBounds top={tooltipTop} left={tooltipLeft + 12}>
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

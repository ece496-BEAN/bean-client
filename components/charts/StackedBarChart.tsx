import React, { useState } from "react";
import { BarStack } from "@visx/shape";
import { scaleLinear, scaleOrdinal, scaleBand } from "@visx/scale";
import { capitalizeWords } from "./common";
import { StackedDataPoint } from "./common";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { LegendOrdinal } from "@visx/legend";
import { Tooltip, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { generateColorByIndex } from "@/lib/colors";
import {
  ChartDimensions,
  getColorScale,
  getYDollarScale,
  keys,
  StackedAreasProps,
} from "./common";
import { Grid } from "@visx/grid";
import DollarAxisLeft from "./DollarAxisLeft";
import LegendToggle from "./LegendToggle";

export default function StackedBarChart({
  width,
  height,
  data,
  projectionDateIdx,
  colorPalette,
}: StackedAreasProps) {
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } =
    useTooltip<StackedDataPoint>();
  const dimensions = new ChartDimensions(width, height);
  const [isLegendVisible, setIsLegendVisible] = useState(false);

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
  const xScale = scaleBand<Date>({
    range: [chartLeft, chartLeft + chartWidth],
    domain: data.map((d) => d.date),
    padding: 0.2,
  });
  const yScale = getYDollarScale(chartHeight, chartTop, data);
  const colorScale = getColorScale(data, colorPalette);

  return (
    // relative is important for the tooltip to be positioned correctly
    // https://airbnb.io/visx/docs/tooltip#:~:text=If%20you%20would,the%20useTooltip()%20hook.
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
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
        <Grid
          xScale={xScale}
          yScale={yScale}
          left={chartLeft}
          top={chartTop}
          width={chartWidth}
          height={chartHeight}
          stroke={"#0000000F"}
        />
        <DollarAxisLeft left={axisLeftWidth} scale={yScale} numTicks={5} />

        <AxisBottom
          top={chartHeight + chartTop}
          scale={xScale}
          tickFormat={(date) => date.toLocaleDateString()}
          numTicks={width > 520 ? 8 : 5}
        />
        {tooltipData && <Tooltip />}
      </svg>
      {tooltipData && tooltipTop && tooltipLeft && (
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

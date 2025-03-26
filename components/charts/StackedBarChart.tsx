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
import DateRangeSlider from "./DateRangeSlider";

export default function StackedBarChart({
  width,
  height,
  data,
  projectionDateIdx,
  colorPalette,
}: StackedAreasProps) {
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } =
    useTooltip<StackedDataPoint>();
  const [isLegendVisible, setIsLegendVisible] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([
    0,
    data.length - 1,
  ]);

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

  // Scales
  const xScale = scaleBand<Date>({
    range: [chartLeft, chartLeft + chartWidth],
    domain: visibleData.map((d) => d.date),
    padding: 0.2,
  });
  const yScale = getYDollarScale(chartHeight, chartTop, visibleData);
  const colorScale = getColorScale(visibleData, colorPalette);

  // Handle slider changes
  const handleSliderChange = (selectedIndices: number[]) => {
    setSelectedIndices(selectedIndices);
  };

  return (
    // relative is important for the tooltip to be positioned correctly
    // https://airbnb.io/visx/docs/tooltip#:~:text=If%20you%20would,the%20useTooltip()%20hook.
    <div style={{ position: "relative" }}>
      <svg width={width} height={chartRegionHeight}>
        <BarStack<StackedDataPoint, string>
          data={visibleData}
          keys={visibleData.length != 0 ? keys(visibleData) : []}
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
                  height={bar.height < 0 ? 0 : bar.height}
                  width={bar.width < 0 ? 0 : bar.width}
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
      <div style={{ width: chartWidth - 10, marginLeft: chartLeft }}>
        <DateRangeSlider data={sortedData} onChange={handleSliderChange} />
      </div>
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

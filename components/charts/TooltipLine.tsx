import React from "react";
import { Line } from "@visx/shape";

type TooltipLineProps = {
  tooltipLeft: number;
  chartTop: number;
  chartHeight: number;
};

const TooltipLine: React.FC<TooltipLineProps> = ({
  tooltipLeft,
  chartTop,
  chartHeight,
}) => (
  <g>
    <Line
      from={{ x: tooltipLeft, y: chartTop }}
      to={{ x: tooltipLeft, y: chartHeight + chartTop }}
      stroke={"#0000005E"}
      strokeWidth={1}
      pointerEvents="none"
    />
  </g>
);

export default TooltipLine;

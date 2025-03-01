import React from "react";
import { AxisLeft } from "@visx/axis";
import { NumberValue, ScaleLinear } from "d3";

type DollarAxisLeftProps = {
  left: number;
  scale: ScaleLinear<number, number>;
  numTicks: number;
};

const DollarAxisLeft: React.FC<DollarAxisLeftProps> = ({
  left,
  scale,
  numTicks,
}) => {
  return (
    <AxisLeft
      left={left}
      scale={scale}
      numTicks={numTicks}
      tickFormat={(n: NumberValue) => {
        const value = n.valueOf();
        if (value === 0) {
          return "$0";
        }

        const absValue = Math.abs(value);
        let formattedValue: string;
        let suffix = "";

        if (absValue >= 1e9) {
          formattedValue = (value / 1e9).toFixed(1);
          suffix = "B";
        } else if (absValue >= 1e6) {
          formattedValue = (value / 1e6).toFixed(1);
          suffix = "M";
        } else if (absValue >= 1e3) {
          formattedValue = (value / 1e3).toFixed(1);
          suffix = "K";
        } else {
          formattedValue = value.toFixed(2); // Keep 2 decimal places for smaller values
          return `$${formattedValue}`; // no suffix needed.
        }

        // Remove trailing zero if it exists.
        if (formattedValue.endsWith(".0")) {
          formattedValue = formattedValue.slice(0, -2);
        }

        return `$${formattedValue}${suffix}`;
      }}
    />
  );
};

export default DollarAxisLeft;

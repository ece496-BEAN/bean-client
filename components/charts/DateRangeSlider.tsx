import React from "react";
import { Slider } from "@mui/material";

export type DateRangeSliderProps = {
  data: { date: Date }[];
  onChange: (selectedIndices: number[]) => void;
  color?: "primary" | "secondary";
};

export default function DateRangeSlider({
  data,
  onChange,
  color = "secondary",
}: DateRangeSliderProps) {
  // Sort data by date to ensure chronological order
  const sortedData = [...data].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Generate marks for each date in the data
  const marks = sortedData.map((d, index) => ({
    value: index,
  }));

  // Slider state: indices of the selected range
  const [selectedIndices, setSelectedIndices] = React.useState<number[]>([
    0,
    sortedData.length - 1,
  ]);

  // Handle slider changes
  const handleChange = (event: Event, newValue: number | number[]) => {
    setSelectedIndices(newValue as number[]);
    onChange(newValue as number[]);
  };

  return (
    <Slider
      aria-label="Restricted date range"
      value={selectedIndices}
      onChange={handleChange}
      valueLabelDisplay="auto"
      valueLabelFormat={(value) =>
        sortedData[value]?.date.toLocaleDateString() ?? ""
      }
      min={0}
      max={sortedData.length - 1}
      step={null} // Restrict to marks only
      marks={marks}
      disableSwap
      color={color}
    />
  );
}

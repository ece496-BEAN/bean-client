import React from "react";
import { LegendOrdinal } from "@visx/legend";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { capitalizeWords } from "./common";

type LegendToggleProps = {
  isLegendVisible: boolean;
  setIsLegendVisible: (visible: boolean) => void;
  colorScale: any;
  legendButtonTop: number;
  legendButtonLeft: number;
};

const LegendToggle: React.FC<LegendToggleProps> = ({
  isLegendVisible,
  setIsLegendVisible,
  colorScale,
  legendButtonTop,
  legendButtonLeft,
}) => {
  return (
    <>
      <button
        style={{
          position: "absolute",
          top: legendButtonTop,
          left: legendButtonLeft,
          padding: "8px",
          cursor: "pointer",
          zIndex: 10,
          background: "white",
          border: "1px solid #ccc",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => setIsLegendVisible(!isLegendVisible)}
        aria-label={isLegendVisible ? "Hide Legend" : "Show Legend"}
      >
        {isLegendVisible ? <FiEyeOff size="13px" /> : <FiEye size="13px" />}
      </button>
      {isLegendVisible && (
        <LegendOrdinal
          scale={colorScale}
          labelFormat={(label) => capitalizeWords(String(label))}
          direction="column"
          style={{
            position: "absolute",
            top: legendButtonTop + 40,
            left: legendButtonLeft,
            zIndex: 10,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "10px",
          }}
        />
      )}
    </>
  );
};

export default LegendToggle;

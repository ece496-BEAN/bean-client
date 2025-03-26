import { darken, lighten } from "@mui/material"; // For color manipulation
import React, { useEffect, useRef } from "react";

export interface RingChartProps {
  percentage: number;
  color: string; // Assume color is always provided
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
  animationDuration?: number;
}

export const RingChart: React.FC<RingChartProps> = ({
  percentage,
  color,
  size = 100,
  strokeWidth = 10,
  animate = true,
  animationDuration = 1,
}) => {
  const cappedPercentage = Math.min(percentage, 100);
  const remainderPercentage = percentage % 100;
  const numRing = Math.floor(percentage / 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffsetInitial = circumference;
  const strokeDashoffsetFinal =
    circumference - (cappedPercentage / 100) * circumference;

  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (animate && circleRef.current) {
      circleRef.current.style.transition = `stroke-dashoffset ${animationDuration}s ease-out`;
      requestAnimationFrame(() => {
        if (circleRef.current) {
          circleRef.current.style.strokeDashoffset = `${strokeDashoffsetFinal}`;
        }
      });
    } else if (circleRef.current) {
      circleRef.current.style.transition = "none";
      circleRef.current.style.strokeDashoffset = `${strokeDashoffsetFinal}`;
    }
  }, [animate, animationDuration, strokeDashoffsetFinal]);

  const startColor = darken(color, 0.4); // Lighten base color for start
  const endColor = lighten(color, 0.4); // Darken base color for end

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient
            id={`gradient-${color}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>

        {/* Base circle (grey track) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${color})`} // Gradient stroke
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={
            animate ? strokeDashoffsetInitial : strokeDashoffsetFinal
          }
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-2xl font-bold ${percentage > 100 ? "text-red-500" : ""}`}
        >
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

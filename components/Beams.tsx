"use client";

import type { CSSProperties } from "react";
import "./Beams.css";

interface BeamsProps {
  beamWidth?: number;
  beamHeight?: number;
  beamNumber?: number;
  lightColor?: string;
  speed?: number;
  noiseIntensity?: number;
  scale?: number;
  rotation?: number;
}

export default function Beams({
  beamWidth = 3,
  beamHeight = 30,
  beamNumber = 20,
  lightColor = "#ffffff",
  speed = 2,
  noiseIntensity = 1.75,
  scale = 0.2,
  rotation = 30,
}: BeamsProps) {
  return (
    <div
      className="beams-container"
      style={
        {
          "--beam-width": `${beamWidth}px`,
          "--beam-height": `${beamHeight}%`,
          "--beam-color": lightColor,
          "--beam-speed": `${Math.max(0.5, 8 / speed)}s`,
          "--beam-noise": noiseIntensity,
          "--beam-scale": scale,
          "--beam-rotation": `${rotation}deg`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {Array.from({ length: beamNumber }).map((_, index) => (
        <span
          key={index}
          className="beam-line"
          style={
            {
              left: `${(index / Math.max(1, beamNumber - 1)) * 100}%`,
              animationDelay: `${index * -0.28}s`,
              opacity: 0.18 + (index % 5) * 0.045,
              height: `calc(var(--beam-height) + ${(index % 4) * 7}%)`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

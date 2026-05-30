"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Beams from "@/components/Beams";
import SoftAurora from "@/components/SoftAurora";

interface PageBackgroundProps {
  variant: "aurora" | "beams";
}

export function PageBackground({ variant }: PageBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  if (variant === "beams") {
    return (
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className={isDark ? "absolute inset-0 bg-slate-950" : "absolute inset-0 bg-slate-50"} />
        <Beams
          beamWidth={3}
          beamHeight={30}
          beamNumber={20}
          lightColor={isDark ? "#ffffff" : "#0f766e"}
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={30}
        />
        <div className={isDark ? "absolute inset-0 bg-slate-950/45" : "absolute inset-0 bg-white/62"} />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className={isDark ? "absolute inset-0 bg-slate-950" : "absolute inset-0 bg-white"} />
      <SoftAurora
        speed={0.6}
        scale={1.5}
        brightness={isDark ? 0.9 : 0.55}
        color1={isDark ? "#14b8a6" : "#f7f7f7"}
        color2={isDark ? "#e100ff" : "#14b8a6"}
        noiseFrequency={2.5}
        noiseAmplitude={1}
        bandHeight={0.5}
        bandSpread={1}
        octaveDecay={0.1}
        layerOffset={0}
        colorSpeed={1}
        enableMouseInteraction
        mouseInfluence={0.25}
      />
      <div className={isDark ? "absolute inset-0 bg-slate-950/35" : "absolute inset-0 bg-white/70"} />
    </div>
  );
}

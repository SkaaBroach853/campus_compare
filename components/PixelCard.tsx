"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import "./PixelCard.css";

type PixelAnimation = "appear" | "disappear";
type PixelVariant = "default" | "blue" | "yellow" | "pink";

interface PixelCardProps {
  variant?: PixelVariant;
  gap?: number;
  speed?: number;
  colors?: string;
  noFocus?: boolean;
  className?: string;
  children: ReactNode;
}

interface VariantConfig {
  activeColor: string | null;
  gap: number;
  speed: number;
  colors: string;
  noFocus: boolean;
}

const variants: Record<PixelVariant, VariantConfig> = {
  default: {
    activeColor: null,
    gap: 5,
    speed: 35,
    colors: "#f8fafc,#f1f5f9,#cbd5e1",
    noFocus: false,
  },
  blue: {
    activeColor: "#e0f2fe",
    gap: 10,
    speed: 25,
    colors: "#e0f2fe,#7dd3fc,#0ea5e9",
    noFocus: false,
  },
  yellow: {
    activeColor: "#fef08a",
    gap: 3,
    speed: 20,
    colors: "#fef08a,#fde047,#eab308",
    noFocus: false,
  },
  pink: {
    activeColor: "#fecdd3",
    gap: 6,
    speed: 80,
    colors: "#fecdd3,#fda4af,#e11d48",
    noFocus: true,
  },
};

class Pixel {
  private readonly width: number;
  private readonly height: number;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly x: number;
  private readonly y: number;
  private readonly color: string;
  private readonly speed: number;
  private size = 0;
  private readonly sizeStep = Math.random() * 0.4;
  private readonly minSize = 0.5;
  private readonly maxSizeInteger = 2;
  private readonly maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
  private readonly delay: number;
  private counter = 0;
  private readonly counterStep: number;
  isIdle = false;
  private isReverse = false;
  private isShimmer = false;

  constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, x: number, y: number, color: string, speed: number, delay: number) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.delay = delay;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
  }

  private getRandomValue(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  private draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }

  appear() {
    this.isIdle = false;

    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }

    if (this.size >= this.maxSize) {
      this.isShimmer = true;
    }

    if (this.isShimmer) {
      this.shimmer();
    } else {
      this.size += this.sizeStep;
    }

    this.draw();
  }

  disappear() {
    this.isShimmer = false;
    this.counter = 0;

    if (this.size <= 0) {
      this.isIdle = true;
      return;
    }

    this.size -= 0.1;
    this.draw();
  }

  private shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }

    this.size += this.isReverse ? -this.speed : this.speed;
  }
}

function getEffectiveSpeed(value: number, reducedMotion: boolean) {
  if (value <= 0 || reducedMotion) {
    return 0;
  }

  return Math.min(value, 100) * 0.001;
}

export default function PixelCard({ variant = "default", gap, speed, colors, noFocus, className = "", children }: PixelCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number | null>(null);
  const timePreviousRef = useRef(0);
  const reducedMotionRef = useRef(false);

  const variantConfig = variants[variant];
  const finalGap = gap ?? variantConfig.gap;
  const finalSpeed = speed ?? variantConfig.speed;
  const finalColors = colors ?? variantConfig.colors;
  const finalNoFocus = noFocus ?? variantConfig.noFocus;

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timePreviousRef.current = performance.now();

    const initPixels = () => {
      if (!containerRef.current || !canvasRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const context = canvasRef.current.getContext("2d");

      if (!context) {
        return;
      }

      canvasRef.current.width = width;
      canvasRef.current.height = height;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;

      const colorsArray = finalColors.split(",");
      const nextPixels: Pixel[] = [];

      for (let x = 0; x < width; x += finalGap) {
        for (let y = 0; y < height; y += finalGap) {
          const color = colorsArray[Math.floor(Math.random() * colorsArray.length)];
          const dx = x - width / 2;
          const dy = y - height / 2;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const delay = reducedMotionRef.current ? 0 : distance;

          nextPixels.push(
            new Pixel(canvasRef.current, context, x, y, color, getEffectiveSpeed(finalSpeed, reducedMotionRef.current), delay),
          );
        }
      }

      pixelsRef.current = nextPixels;
    };

    initPixels();

    const observer = new ResizeObserver(initPixels);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [finalColors, finalGap, finalSpeed]);

  const doAnimate = (animation: PixelAnimation) => {
    animationRef.current = requestAnimationFrame(() => doAnimate(animation));
    const timeNow = performance.now();
    const timePassed = timeNow - timePreviousRef.current;
    const timeInterval = 1000 / 60;

    if (timePassed < timeInterval) {
      return;
    }

    timePreviousRef.current = timeNow - (timePassed % timeInterval);

    const context = canvasRef.current?.getContext("2d");
    if (!context || !canvasRef.current) {
      return;
    }

    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let allIdle = true;
    pixelsRef.current.forEach((pixel) => {
      pixel[animation]();
      if (!pixel.isIdle) {
        allIdle = false;
      }
    });

    if (allIdle && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleAnimation = (animation: PixelAnimation) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(() => doAnimate(animation));
  };

  return (
    <div
      ref={containerRef}
      className={cn("pixel-card", className)}
      onMouseEnter={() => handleAnimation("appear")}
      onMouseLeave={() => handleAnimation("disappear")}
      onFocus={finalNoFocus ? undefined : () => handleAnimation("appear")}
      onBlur={finalNoFocus ? undefined : () => handleAnimation("disappear")}
      tabIndex={finalNoFocus ? -1 : 0}
    >
      <canvas className="pixel-canvas" ref={canvasRef} />
      {children}
    </div>
  );
}

import { useRef, useEffect, useCallback } from "react";
import "./grid.scss";

interface GridProps {
  w: number;
  h: number;
  selectedColor: string;
}

const PIXEL_SIZE = 8;

function Grid({ w, h, selectedColor }: GridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Record<string, string>>({});
  const isPainting = useRef(false);
  const selectedColorRef = useRef(selectedColor);

  // Sync selectedColor dans une ref pour éviter les closures périmées dans les handlers natifs
  useEffect(() => {
    selectedColorRef.current = selectedColor;
  }, [selectedColor]);

  // Dessin initial de la grille vide
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w * PIXEL_SIZE, h * PIXEL_SIZE);

    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        ctx.strokeRect(
          x * PIXEL_SIZE + 0.25,
          y * PIXEL_SIZE + 0.25,
          PIXEL_SIZE - 0.5,
          PIXEL_SIZE - 0.5
        );
      }
    }
  }, [w, h]);

  const drawPixel = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(
      x * PIXEL_SIZE + 0.25,
      y * PIXEL_SIZE + 0.25,
      PIXEL_SIZE - 0.5,
      PIXEL_SIZE - 0.5
    );
  };

  const getPixelCoords = (e: MouseEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
    if (x < 0 || x >= w || y < 0 || y >= h) return null;
    return { x, y };
  };

  const paint = (e: MouseEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const coords = getPixelCoords(e);
    if (!coords) return;
    const { x, y } = coords;
    const color = selectedColorRef.current;
    const key = `${x}-${y}`;
    if (pixelsRef.current[key] === color) return;
    pixelsRef.current[key] = color;
    drawPixel(ctx, x, y, color);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    isPainting.current = true;
    paint(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting.current) return;
    paint(e);
  };

  const stopPainting = () => {
    isPainting.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      width={w * PIXEL_SIZE}
      height={h * PIXEL_SIZE}
      className="grid-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopPainting}
      onMouseLeave={stopPainting}
    />
  );
}

export default Grid;
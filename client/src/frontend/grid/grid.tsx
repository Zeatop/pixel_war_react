import { useRef, useEffect } from "react";
import "./grid.scss";

type PixelColor = { x: number; y: number; color: string };

interface GridProps {
  w: number;
  h: number;
  // appelé quand l'utilisateur clique un pixel
  onPixelClick: (pixelX: number, pixelY: number, screenX: number, screenY: number) => void;
  pixels?: PixelColor[];
  disabled?: boolean;
}

const PIXEL_SIZE = 8;

function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x * PIXEL_SIZE + 0.25, y * PIXEL_SIZE + 0.25, PIXEL_SIZE - 0.5, PIXEL_SIZE - 0.5);
}

export function Grid({ w, h, onPixelClick, pixels = [], disabled = false }: GridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redessine le canvas complet a chaque mise a jour de l'etat de board.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f8f8f6";
    ctx.fillRect(0, 0, w * PIXEL_SIZE, h * PIXEL_SIZE);
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        ctx.strokeRect(x * PIXEL_SIZE + 0.25, y * PIXEL_SIZE + 0.25, PIXEL_SIZE - 0.5, PIXEL_SIZE - 0.5);
      }
    }

    for (const pixel of pixels) {
      drawPixel(ctx, pixel.x, pixel.y, pixel.color);
    }
  }, [w, h, pixels]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const py = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    if (disabled) return;
    onPixelClick(px, py, e.clientX, e.clientY);
  };

  return (
    <canvas
      ref={canvasRef}
      width={w * PIXEL_SIZE}
      height={h * PIXEL_SIZE}
      className="grid-canvas"
      onClick={handleClick}
    />
  );
}

export default Grid;
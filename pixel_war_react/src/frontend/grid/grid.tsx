import { useRef, useEffect } from "react";
import "./grid.scss";

interface GridProps {
  w: number;
  h: number;
  // appelé quand l'utilisateur clique un pixel
  onPixelClick: (pixelX: number, pixelY: number, screenX: number, screenY: number) => void;
  // appelé depuis l'extérieur pour peindre un pixel après sélection de couleur
  paintCommand?: { x: number; y: number; color: string } | null;
}

const PIXEL_SIZE = 8;

export function Grid({ w, h, onPixelClick, paintCommand }: GridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Record<string, string>>({});

  // Dessin initial
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
  }, [w, h]);

  // Appliquer une commande de peinture depuis le parent
  useEffect(() => {
    if (!paintCommand) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { x, y, color } = paintCommand;
    pixelsRef.current[`${x}-${y}`] = color;
    ctx.fillStyle = color;
    ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x * PIXEL_SIZE + 0.25, y * PIXEL_SIZE + 0.25, PIXEL_SIZE - 0.5, PIXEL_SIZE - 0.5);
  }, [paintCommand]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const py = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
    if (px < 0 || px >= w || py < 0 || py >= h) return;
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
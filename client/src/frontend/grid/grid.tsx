import {useCallback, useEffect, useRef, useState} from "react";
import "./grid.scss";

type PixelColor = { x: number; y: number; color: string };

export interface HoveredPixel {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
}

interface GridProps {
  w: number;
  h: number;
  onPixelClick: (pixelX: number, pixelY: number, screenX: number, screenY: number) => void;
  onPixelHover?: (pixel: HoveredPixel | null) => void;
  pixels?: PixelColor[];
  disabled?: boolean;
  tooltip?: React.ReactNode;
  tooltipPos?: { x: number; y: number } | null;
}

const BASE_PIXEL_SIZE = 24;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pixels: PixelColor[],
  zoom: number,
  offsetX: number,
  offsetY: number,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const ps = BASE_PIXEL_SIZE * zoom;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Background
  ctx.fillStyle = "#f8f8f6";
  ctx.fillRect(offsetX, offsetY, w * ps, h * ps);

  // Grid lines
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = Math.max(0.5, zoom * 0.5);
  for (let y = 0; y <= h; y++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + y * ps);
    ctx.lineTo(offsetX + w * ps, offsetY + y * ps);
    ctx.stroke();
  }
  for (let x = 0; x <= w; x++) {
    ctx.beginPath();
    ctx.moveTo(offsetX + x * ps, offsetY);
    ctx.lineTo(offsetX + x * ps, offsetY + h * ps);
    ctx.stroke();
  }

  // Pixels
  for (const pixel of pixels) {
    ctx.fillStyle = pixel.color;
    ctx.fillRect(offsetX + pixel.x * ps, offsetY + pixel.y * ps, ps, ps);
  }
}

export function Grid({ w, h, onPixelClick, onPixelHover, pixels = [], disabled = false, tooltip, tooltipPos }: GridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastHovered = useRef<string | null>(null);

  // Auto-fit zoom on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const fitZoom = Math.min(cw / (w * BASE_PIXEL_SIZE), ch / (h * BASE_PIXEL_SIZE), 1);
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitZoom));
    setZoom(clampedZoom);
    setOffset({
      x: (cw - w * BASE_PIXEL_SIZE * clampedZoom) / 2,
      y: (ch - h * BASE_PIXEL_SIZE * clampedZoom) / 2,
    });
  }, [w, h]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    drawGrid(ctx, w, h, pixels, zoom, offset.x, offset.y, cw, ch);
  }, [w, h, pixels, zoom, offset]);

  // Wheel zoom (centered on cursor)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setZoom((prev) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * zoomFactor));
        const scale = next / prev;
        setOffset((o) => ({
          x: mouseX - scale * (mouseX - o.x),
          y: mouseY - scale * (mouseY - o.y),
        }));
        return next;
      });
    },
    [],
  );

  // Pan (drag)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Middle mouse button or right-click drag, also allow left-click drag
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      dragOffset.current = { ...offset };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [offset],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffset({
        x: dragOffset.current.x + dx,
        y: dragOffset.current.y + dy,
      });
      return;
    }

    // Hover detection
    if (onPixelHover) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const ps = BASE_PIXEL_SIZE * zoom;
      const px = Math.floor((e.clientX - rect.left - offset.x) / ps);
      const py = Math.floor((e.clientY - rect.top - offset.y) / ps);
      const key = `${px}:${py}`;

      if (px >= 0 && px < w && py >= 0 && py < h) {
        if (lastHovered.current !== key) {
          lastHovered.current = key;
          onPixelHover({ x: px, y: py, screenX: e.clientX, screenY: e.clientY });
        }
      } else if (lastHovered.current !== null) {
        lastHovered.current = null;
        onPixelHover(null);
      }
    }
  }, [zoom, offset, w, h, onPixelHover]);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const dx = Math.abs(e.clientX - dragStart.current.x);
      const dy = Math.abs(e.clientY - dragStart.current.y);
      isDragging.current = false;

      // Only trigger click if this wasn't a drag (< 4px movement)
      if (dx < 4 && dy < 4 && !disabled) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ps = BASE_PIXEL_SIZE * zoom;
        const px = Math.floor((e.clientX - rect.left - offset.x) / ps);
        const py = Math.floor((e.clientY - rect.top - offset.y) / ps);
        if (px >= 0 && px < w && py >= 0 && py < h) {
          onPixelClick(px, py, e.clientX, e.clientY);
        }
      }
    },
    [zoom, offset, w, h, onPixelClick, disabled],
  );

  const handlePointerLeave = useCallback(() => {
    if (onPixelHover && lastHovered.current !== null) {
      lastHovered.current = null;
      onPixelHover(null);
    }
  }, [onPixelHover]);

  return (
    <div ref={containerRef} className="grid-container">
      <canvas
        ref={canvasRef}
        className="grid-canvas"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />
      {tooltip && tooltipPos && (
        <div
          className="grid-tooltip"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          {tooltip}
        </div>
      )}
      <div className="grid-zoom-info">{Math.round(zoom * 100)}%</div>
    </div>
  );
}

export default Grid;
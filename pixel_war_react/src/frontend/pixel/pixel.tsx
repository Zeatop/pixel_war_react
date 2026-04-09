import "./pixel.scss";

interface PixelProps {
  x: number;
  y: number;
  color: string;
  onPaint: (x: number, y: number) => void;
}

function Pixel({ x, y, color, onPaint }: PixelProps) {
  return (
    <div
      className="pixel"
      style={{ backgroundColor: color }}
      onClick={() => onPaint(x, y)}
      onMouseEnter={(e) => {
        if (e.buttons === 1) onPaint(x, y);
      }}
    />
  );
}

export default Pixel;
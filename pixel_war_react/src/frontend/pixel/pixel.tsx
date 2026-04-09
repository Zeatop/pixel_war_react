import "./pixel.scss";

function Pixel({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <div className="pixel" style={{ backgroundColor: color }}></div>
    );
}

export default Pixel;
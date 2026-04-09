import Pixel from "../pixel/pixel.tsx";
import "./grid.scss";

function grid({w, h}: {w: number, h: number}) {
    const pixels = [];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            pixels.push(<Pixel key={`${x}-${y}`} x={x} y={y} color="#ffffff" />);
        }
    }
    return (
                    <div
                        className="grid"
                        style={{
                            gridTemplateColumns: `repeat(${w}, 4px)`,
                            gridTemplateRows: `repeat(${h}, 4px)`,
                        }}
                    >
                        {pixels}
                    </div>
                );
    }

export default grid;
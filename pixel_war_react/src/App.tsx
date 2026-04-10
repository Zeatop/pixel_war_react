import { useState, useCallback } from "react";
import Grid from "./frontend/grid/grid";
import ColorModal from "./frontend/ColorModal/ColorModal";
import "./App.css";

interface PendingPixel {
  pixelX: number;
  pixelY: number;
  screenX: number;
  screenY: number;
}

interface PaintCommand {
  x: number;
  y: number;
  color: string;
}

function App() {
  const [pending, setPending] = useState<PendingPixel | null>(null);
  const [paintCommand, setPaintCommand] = useState<PaintCommand | null>(null);

  const handlePixelClick = useCallback(
    (pixelX: number, pixelY: number, screenX: number, screenY: number) => {
      setPending({ pixelX, pixelY, screenX, screenY });
    },
    []
  );

  const handleColorSelect = useCallback(
    (color: string) => {
      if (!pending) return;
      setPaintCommand({ x: pending.pixelX, y: pending.pixelY, color });
      setPending(null);
    },
    [pending]
  );

  const handleClose = useCallback(() => setPending(null), []);

  return (
    <div className="app">
      <header className="header">
        <span className="header__logo">▪</span>
        <h1 className="header__title">Pixel War</h1>
        <span className="header__hint">Cliquez sur un pixel pour le colorier</span>
      </header>

      <main className="canvas-area">
        <Grid
          w={100}
          h={100}
          onPixelClick={handlePixelClick}
          paintCommand={paintCommand}
        />
      </main>

      {pending && (
        <ColorModal
          x={pending.pixelX}
          y={pending.pixelY}
          screenX={pending.screenX}
          screenY={pending.screenY}
          onSelect={handleColorSelect}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

export default App;
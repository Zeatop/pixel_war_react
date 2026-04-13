import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Grid from "../../frontend/grid/grid";
import ColorModal from "../../frontend/ColorModal/ColorModal";
import "./Board.scss";

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

export default function Board() {
  const { id } = useParams<{ id: string }>();
  const [pending, setPending] = useState<PendingPixel | null>(null);
  const [paintCommand, setPaintCommand] = useState<PaintCommand | null>(null);

  // TODO: charger les données du board depuis l'API avec l'id
  const boardTitle = id ? `PixelBoard #${id}` : "PixelBoard";

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
    <div className="board-page">
      <div className="board-page__info">
        <h2 className="board-page__title">{boardTitle}</h2>
        <div className="board-page__meta">
          <span className="board-page__meta-item">100 × 100</span>
          <span className="board-page__meta-item">En cours</span>
        </div>
      </div>

      <div className="board-page__canvas-wrapper">
        <Grid
          w={100}
          h={100}
          onPixelClick={handlePixelClick}
          paintCommand={paintCommand}
        />
      </div>

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
import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import Grid from "../../frontend/grid/grid";
import ColorModal from "../../frontend/ColorModal/ColorModal";
import { fetchBoardState, placePixel, type PixelPlacedEvent } from "../../services/api";
import { getSocket, joinBoard, leaveBoard } from "../../services/socket";
import { useAuth } from "../../hooks/useAuth";
import "./Board.scss";

interface PendingPixel {
  pixelX: number;
  pixelY: number;
  screenX: number;
  screenY: number;
}

interface BoardMeta {
  id: number;
  name: string | null;
  width: number;
  height: number;
  status: "in_progress" | "finished";
  cooldownSeconds: number;
  endsAt: string | null;
}

interface PixelData {
  x: number;
  y: number;
  color: string;
}

export default function Board() {
  const { id } = useParams<{ id: string }>();
  const boardId = Number(id);
  const { isAuthenticated } = useAuth();
  const [pending, setPending] = useState<PendingPixel | null>(null);
  const [board, setBoard] = useState<BoardMeta | null>(null);
  const [pixels, setPixels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const pixelList = useMemo<PixelData[]>(() => {
    return Object.entries(pixels).map(([key, color]) => {
      const [x, y] = key.split(":").map(Number);
      return { x, y, color };
    });
  }, [pixels]);

  useEffect(() => {
    if (!Number.isInteger(boardId) || boardId <= 0) {
      setError("Identifiant de board invalide.");
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { grid, frames } = await fetchBoardState(boardId);
        if (!mounted) return;

        setBoard({
          id: grid.id,
          name: grid.name,
          width: grid.width,
          height: grid.height,
          status: grid.status,
          cooldownSeconds: grid.cooldownSeconds,
          endsAt: grid.endsAt,
        });

        const nextPixels: Record<string, string> = {};
        for (const frame of frames) {
          if (frame.color.toUpperCase() !== "#FFFFFF") {
            nextPixels[`${frame.x}:${frame.y}`] = frame.color;
          }
        }
        setPixels(nextPixels);
      } catch {
        if (mounted) {
          setError("Impossible de charger ce board.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [boardId]);

  useEffect(() => {
    if (!Number.isInteger(boardId) || boardId <= 0) return;

    const socket = getSocket();
    joinBoard(boardId);

    const onPixelPlaced = (event: PixelPlacedEvent) => {
      if (event.gridId !== boardId) return;
      setPixels((prev) => ({ ...prev, [`${event.x}:${event.y}`]: event.color }));
    };

    const onBoardEnded = (event: { gridId: number }) => {
      if (event.gridId !== boardId) return;
      setBoard((prev) => (prev ? { ...prev, status: "finished" } : prev));
      setActionMessage("Le board est termine.");
    };

    socket.on("pixel.placed", onPixelPlaced);
    socket.on("board.ended", onBoardEnded);

    return () => {
      socket.off("pixel.placed", onPixelPlaced);
      socket.off("board.ended", onBoardEnded);
      leaveBoard(boardId);
    };
  }, [boardId]);

  const handlePixelClick = useCallback(
    (pixelX: number, pixelY: number, screenX: number, screenY: number) => {
      setPending({ pixelX, pixelY, screenX, screenY });
    },
    []
  );

  const handleColorSelect = useCallback(
    (color: string) => {
      if (!pending) return;

      if (!board || board.status === "finished") {
        setActionMessage("Ce board est termine.");
        setPending(null);
        return;
      }

      if (!isAuthenticated) {
        setActionMessage("Connectez-vous pour placer un pixel.");
        setPending(null);
        return;
      }

      void placePixel(board.id, { x: pending.pixelX, y: pending.pixelY, color })
        .then(() => {
          setActionMessage(null);
        })
        .catch((requestError: unknown) => {
          const apiError = requestError as { response?: { data?: { error?: string; retryAfterSeconds?: number | null } } };
          const retryAfter = apiError.response?.data?.retryAfterSeconds;
          if (typeof retryAfter === "number") {
            setActionMessage(`Cooldown actif: reessaie dans ${retryAfter}s.`);
            return;
          }

          setActionMessage(apiError.response?.data?.error || "Placement impossible pour le moment.");
        });

      setPending(null);
    },
    [pending, board, isAuthenticated]
  );

  const handleClose = useCallback(() => setPending(null), []);

  if (loading) {
    return <div className="board-page">Chargement du board...</div>;
  }

  if (error || !board) {
    return <div className="board-page">{error || "Board introuvable."}</div>;
  }

  const boardTitle = board.name || `PixelBoard #${board.id}`;

  return (
    <div className="board-page">
      <div className="board-page__info">
        <h2 className="board-page__title">{boardTitle}</h2>
        <div className="board-page__meta">
          <span className="board-page__meta-item">{board.width} x {board.height}</span>
          <span className="board-page__meta-item">{board.status === "finished" ? "Termine" : "En cours"}</span>
          <span className="board-page__meta-item">Cooldown: {board.cooldownSeconds}s</span>
        </div>
        {actionMessage && <p className="board-page__hint">{actionMessage}</p>}
      </div>

      <div className="board-page__canvas-wrapper">
        <Grid
          w={board.width}
          h={board.height}
          onPixelClick={handlePixelClick}
          pixels={pixelList}
          disabled={board.status === "finished"}
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
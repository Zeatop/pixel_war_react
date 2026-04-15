import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import Grid, { type HoveredPixel } from "../../frontend/grid/grid";
import ColorModal from "../../frontend/ColorModal/ColorModal";
import api, { fetchBoardState, placePixel, type PixelPlacedEvent } from "../../services/api";
import { getSocket, joinBoard, leaveBoard } from "../../services/socket";
import { useAuth } from "../../hooks/useAuth";
import "./Board.scss";

function useCooldownTimer() {
  const [remaining, setRemaining] = useState(0);
  const endTimeRef = useRef(0);
  const rafRef = useRef(0);

  const start = useCallback((seconds: number) => {
    endTimeRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);

    const tick = () => {
      const left = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (left <= 0) {
        setRemaining(0);
        return;
      }
      setRemaining(left);
      rafRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { remaining, start };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

function renderTooltip(
  _pixel: { x: number; y: number },
  _pixelColor: string | undefined,
  info: { placed: boolean; userName?: string; placedAt?: string; cooldownSeconds: number },
  _cooldown: number,
) {
  if (!info.placed) {
    return <div>Vide — aucun placement</div>;
  }
  return (
    <>
      <div>Par : {info.userName}</div>
      <div>Il y a {formatTimeAgo(info.placedAt!)}</div>
    </>
  );
}

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
  const { remaining: cooldownRemaining, start: startCooldown } = useCooldownTimer();

  // Hover tooltip state
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode>(null);
  const pixelInfoCache = useRef<Record<string, { userName?: string; placedAt?: string; cooldownSeconds: number; placed: boolean }>>({});
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Also store recent placements from socket events for instant tooltip
  const recentPlacements = useRef<Record<string, { userName: string; placedAt: string }>>({});

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
      // Cache placement info for tooltip
      const key = `${boardId}:${event.x}:${event.y}`;
      recentPlacements.current[key] = { userName: event.user.name, placedAt: event.placedAt };
      // Invalidate API cache
      delete pixelInfoCache.current[key];
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

  const handlePixelHover = useCallback(
    (pixel: HoveredPixel | null) => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }

      if (!pixel || !board) {
        setTooltipPos(null);
        setTooltipContent(null);
        return;
      }

      setTooltipPos({ x: pixel.screenX, y: pixel.screenY });

      const key = `${boardId}:${pixel.x}:${pixel.y}`;
      const pixelColor = pixels[`${pixel.x}:${pixel.y}`];

      // Check recent placements first (from socket events)
      const recent = recentPlacements.current[key];
      if (recent) {
        const ago = formatTimeAgo(recent.placedAt);
        setTooltipContent(
          <>
            <div>Par : {recent.userName}</div>
            <div>Il y a {ago}</div>
          </>
        );
        return;
      }

      // Check cache
      const cached = pixelInfoCache.current[key];
      if (cached) {
        setTooltipContent(renderTooltip(pixel, pixelColor, cached, board.cooldownSeconds));
        return;
      }

      // Show loading state while fetching
      setTooltipContent(<div>…</div>);

      hoverTimeout.current = setTimeout(() => {
        api.get(`/boards/${boardId}/pixels/${pixel.x}/${pixel.y}/info`)
          .then(({ data }) => {
            pixelInfoCache.current[key] = data;
            setTooltipContent(renderTooltip(pixel, pixelColor, data, board.cooldownSeconds));
          })
          .catch(() => {});
      }, 150);
    },
    [boardId, board, pixels],
  );

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

      const { pixelX, pixelY } = pending;
      void placePixel(board.id, { x: pixelX, y: pixelY, color })
        .then(() => {
          setPixels((prev) => ({ ...prev, [`${pixelX}:${pixelY}`]: color }));
          setActionMessage(null);
          startCooldown(board.cooldownSeconds);
        })
        .catch((requestError: unknown) => {
          const apiError = requestError as { response?: { data?: { error?: string; retryAfterSeconds?: number | null } } };
          const retryAfter = apiError.response?.data?.retryAfterSeconds;
          if (typeof retryAfter === "number") {
            setActionMessage(`Cooldown actif: reessaie dans ${retryAfter}s.`);
            startCooldown(retryAfter);
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
        {cooldownRemaining > 0 && (
          <div className="board-page__cooldown">
            ⏳ {cooldownRemaining}s
          </div>
        )}
        {actionMessage && <p className="board-page__hint">{actionMessage}</p>}
      </div>

      <div className="board-page__canvas-wrapper">
        <Grid
          w={board.width}
          h={board.height}
          onPixelClick={handlePixelClick}
          onPixelHover={handlePixelHover}
          pixels={pixelList}
          disabled={board.status === "finished"}
          tooltip={tooltipContent}
          tooltipPos={tooltipPos}
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
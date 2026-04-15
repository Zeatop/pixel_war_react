import {useEffect, useRef} from "react";
import "./ColorModal.scss";

export const COLORS = [
  { hex: "#1a1a1a", name: "Charbon" },
  { hex: "#ffffff", name: "Blanc" },
  { hex: "#888888", name: "Gris" },
  { hex: "#e63946", name: "Rouge" },
  { hex: "#ff6b6b", name: "Corail" },
  { hex: "#ff006e", name: "Fuchsia" },
  { hex: "#f4a261", name: "Saumon" },
  { hex: "#ff9f1c", name: "Orange" },
  { hex: "#e9c46a", name: "Miel" },
  { hex: "#ffee32", name: "Jaune" },
  { hex: "#2a9d8f", name: "Sarcelle" },
  { hex: "#06d6a0", name: "Menthe" },
  { hex: "#38b000", name: "Vert" },
  { hex: "#606c38", name: "Olive" },
  { hex: "#457b9d", name: "Ardoise" },
  { hex: "#0077b6", name: "Bleu" },
  { hex: "#a8dadc", name: "Ciel" },
  { hex: "#7209b7", name: "Violet" },
  { hex: "#6d6875", name: "Mauve" },
  { hex: "#b5838d", name: "Rose" },
  { hex: "#8d5524", name: "Brun" },
  { hex: "#dda15e", name: "Terre" },
  { hex: "#ffc8dd", name: "Dragée" },
  { hex: "#cdb4db", name: "Lilas" },
];

interface ColorModalProps {
  x: number; // coord pixel sur la grille
  y: number;
  screenX: number; // position écran pour positionner la modale
  screenY: number;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export default function ColorModal({ x, y, screenX, screenY, onSelect, onClose }: ColorModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Fermer sur clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // léger délai pour ne pas capter le mousedown qui a ouvert la modale
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [onClose]);

  // Fermer sur Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Positionner la modale en évitant les bords
  const MODAL_W = 224;
  const MODAL_H = 300;
  const OFFSET = 10;
  let left = screenX + OFFSET;
  let top = screenY + OFFSET;
  if (left + MODAL_W > window.innerWidth - 8) left = screenX - MODAL_W - OFFSET;
  if (top + MODAL_H > window.innerHeight - 8) top = screenY - MODAL_H - OFFSET;

  return (
    <div
      ref={ref}
      className="color-modal"
      style={{ left, top }}
      role="dialog"
      aria-label="Choisir une couleur"
    >
      <div className="color-modal__header">
        <span className="color-modal__coords">
          ({x}, {y})
        </span>
        <button className="color-modal__close" onClick={onClose} aria-label="Fermer">✕</button>
      </div>
      <div className="color-modal__grid">
        {COLORS.map(({ hex, name }) => (
          <button
            key={hex}
            className="color-modal__swatch"
            style={{ backgroundColor: hex }}
            title={name}
            onClick={() => { onSelect(hex); onClose(); }}
          >
            <span className="color-modal__swatch-tooltip">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
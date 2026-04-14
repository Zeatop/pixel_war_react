import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import api from "../../services/api";
import "./Admin.scss";

interface Board {
  id: number;
  name: string | null;
  width: number;
  height: number;
  status: "in_progress" | "finished";
  createdAt: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(20);
  const [endsAt, setEndsAt] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(30);
  const [allowOverwrite, setAllowOverwrite] = useState(true);

  useEffect(() => {
    api.get("/boards").then(({ data }) => setBoards(data.boards ?? [])).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        width,
        height,
        allowOverwrite,
        cooldownSeconds,
      };
      if (name.trim()) payload.name = name.trim();
      if (endsAt) payload.endsAt = new Date(endsAt).toISOString();

      const { data } = await api.post("/createGrid", payload);
      setBoards((prev) => [data.grid, ...prev]);
      setShowForm(false);
      setName("");
      setWidth(20);
      setHeight(20);
      setEndsAt("");
      setCooldownSeconds(30);
      setAllowOverwrite(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin">
      <div className="admin__header">
        <h1 className="admin__title">Administration</h1>
        <button className="admin__create-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "+ Nouveau PixelBoard"}
        </button>
      </div>

      {showForm && (
        <form className="admin__form" onSubmit={handleCreate}>
          <label>
            Nom
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mon PixelBoard" />
          </label>
          <label>
            Largeur
            <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} min={1} max={200} required />
          </label>
          <label>
            Hauteur
            <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} min={1} max={200} required />
          </label>
          <label>
            Cooldown (secondes)
            <input type="number" value={cooldownSeconds} onChange={(e) => setCooldownSeconds(Number(e.target.value))} min={0} />
          </label>
          <label>
            Date de fin (optionnel)
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </label>
          <label className="admin__checkbox">
            <input type="checkbox" checked={allowOverwrite} onChange={(e) => setAllowOverwrite(e.target.checked)} />
            Autoriser l'écrasement de pixels
          </label>
          {error && <p className="admin__error">{error}</p>}
          <button type="submit" className="admin__create-btn" disabled={loading}>
            {loading ? "Création…" : "Créer le PixelBoard"}
          </button>
        </form>
      )}

      <section className="admin__section">
        <h2 className="admin__section-title">Tous les PixelBoards</h2>
        {boards.length === 0 ? (
          <p className="admin__empty">Aucun PixelBoard pour le moment.</p>
        ) : (
          <ul className="admin__board-list">
            {boards.map((b) => (
              <li key={b.id} className="admin__board-item" onClick={() => navigate(`/board/${b.id}`)}>
                <span className="admin__board-name">{b.name ?? `Board #${b.id}`}</span>
                <span className="admin__board-size">{b.width}×{b.height}</span>
                <span className={`admin__board-status admin__board-status--${b.status}`}>
                  {b.status === "in_progress" ? "En cours" : "Terminé"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
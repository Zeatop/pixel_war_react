import {Link, useNavigate} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../../contexts/auth-context";
import api, {type Board} from "../../services/api";
import "./Home.scss";

export default function Home() {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalBoards: 0 });
  const [activeBoards, setActiveBoards] = useState<Board[]>([]);
  const [finishedBoards, setFinishedBoards] = useState<Board[]>([]);

  useEffect(() => {
    api.get("/stats").then(({ data }) => setStats(data)).catch(() => {});
    api.get("/boards", { params: { status: "in_progress" } })
      .then(({ data }) => setActiveBoards(data.boards ?? []))
      .catch(() => {});
    api.get("/boards", { params: { status: "finished" } })
      .then(({ data }) => setFinishedBoards(data.boards ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="home">
      <section className="home__hero">
        <h1 className="home__title">Pixel War</h1>
        <p className="home__subtitle">
          Dessinez ensemble, un pixel à la fois.
        </p>
      </section>

      <section className="home__stats">
        <div className="home__stat">
          <span className="home__stat-value">{stats.totalUsers}</span>
          <span className="home__stat-label">Utilisateurs</span>
        </div>
        <div className="home__stat">
          <span className="home__stat-value">{stats.totalBoards}</span>
          <span className="home__stat-label">PixelBoards</span>
        </div>
      </section>

      <section className="home__boards">
        <h2 className="home__section-title">PixelBoards en cours</h2>
        <div className="home__board-grid">
          {activeBoards.length === 0 ? (
            <p className="home__empty">Aucun board en cours.</p>
          ) : (
            activeBoards.map((b) => (
              <div key={b.id} className="home__board-card" onClick={() => navigate(`/board/${b.id}`)}>
                <span className="home__board-name">{b.name ?? `Board #${b.id}`}</span>
                <span className="home__board-size">{b.width}×{b.height}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="home__boards">
        <h2 className="home__section-title">PixelBoards terminés</h2>
        <div className="home__board-grid">
          {finishedBoards.length === 0 ? (
            <p className="home__empty">Aucun board terminé.</p>
          ) : (
            finishedBoards.map((b) => (
              <div key={b.id} className="home__board-card home__board-card--finished" onClick={() => navigate(`/board/${b.id}`)}>
                <span className="home__board-name">{b.name ?? `Board #${b.id}`}</span>
                <span className="home__board-size">{b.width}×{b.height}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="home__cta">
        {isAuthenticated ? (
          <Link to="/admin" className="home__cta-btn">Créer un PixelBoard</Link>
        ) : (
          <Link to="/login" className="home__cta-btn">Se connecter pour participer</Link>
        )}
      </div>
    </div>
  );
}
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import "./Home.scss";

export default function Home() {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;

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
          <span className="home__stat-value">—</span>
          <span className="home__stat-label">Utilisateurs</span>
        </div>
        <div className="home__stat">
          <span className="home__stat-value">—</span>
          <span className="home__stat-label">PixelBoards</span>
        </div>
      </section>

      <section className="home__boards">
        <h2 className="home__section-title">PixelBoards en cours</h2>
        <div className="home__board-grid">
          <p className="home__empty">Aucun board pour le moment — connectez l'API pour les afficher.</p>
        </div>
      </section>

      <section className="home__boards">
        <h2 className="home__section-title">PixelBoards terminés</h2>
        <div className="home__board-grid">
          <p className="home__empty">Aucun board terminé.</p>
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
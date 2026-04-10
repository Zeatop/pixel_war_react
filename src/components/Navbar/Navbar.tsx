import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import "./Navbar.scss";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar__left">
        <Link to="/" className="navbar__brand">
          <span className="navbar__logo">▪</span>
          <span className="navbar__name">PixelWar</span>
        </Link>

        <div className="navbar__links">
          <Link to="/" className={`navbar__link ${isActive("/") ? "navbar__link--active" : ""}`}>
            Accueil
          </Link>
          {isAuthenticated && (
            <Link to="/profile" className={`navbar__link ${isActive("/profile") ? "navbar__link--active" : ""}`}>
              Profil
            </Link>
          )}
          {user?.isAdmin && (
            <Link to="/admin" className={`navbar__link ${isActive("/admin") ? "navbar__link--active" : ""}`}>
              Admin
            </Link>
          )}
        </div>
      </div>

      <div className="navbar__right">
        <button
          className="navbar__theme-toggle"
          onClick={toggleTheme}
          aria-label={`Passer en mode ${theme === "light" ? "sombre" : "clair"}`}
          title={theme === "light" ? "Mode sombre" : "Mode clair"}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {isAuthenticated ? (
          <div className="navbar__user">
            {user?.avatar && (
              <img src={user.avatar} alt="" className="navbar__avatar" referrerPolicy="no-referrer" />
            )}
            <span className="navbar__username">{user?.name}</span>
            <button className="navbar__logout" onClick={logout}>
              Déconnexion
            </button>
          </div>
        ) : (
          <Link to="/login" className="navbar__login-btn">
            Connexion
          </Link>
        )}
      </div>
    </nav>
  );
}
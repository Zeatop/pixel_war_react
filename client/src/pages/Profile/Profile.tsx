import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import "./Profile.scss";

interface Contribution {
  grid_id: number;
  board_name: string | null;
  width: number;
  height: number;
  status: "in_progress" | "finished";
  pixel_count: number;
  last_placed_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get(`/users/${user.id}/contributions`)
      .then(({ data }) => setContributions(data.contributions ?? []))
      .catch(() => {});
  }, [user]);

  const totalPixels = contributions.reduce((sum, c) => sum + c.pixel_count, 0);

  return (
    <div className="profile">
      <div className="profile__card">
        {user?.avatar && (
          <img src={user.avatar} alt="" className="profile__avatar" referrerPolicy="no-referrer" />
        )}
        <h1 className="profile__name">{user?.name ?? "Utilisateur"}</h1>
        <p className="profile__email">{user?.email}</p>
        <p className="profile__pixel-count">{totalPixels} pixel{totalPixels !== 1 ? "s" : ""} placé{totalPixels !== 1 ? "s" : ""}</p>
      </div>

      <section className="profile__section">
        <h2 className="profile__section-title">Mes contributions</h2>
        {contributions.length === 0 ? (
          <p className="profile__empty">
            Aucune contribution pour le moment. Rejoignez un PixelBoard !
          </p>
        ) : (
          <ul className="profile__contrib-list">
            {contributions.map((c) => (
              <li key={c.grid_id} className="profile__contrib-item" onClick={() => navigate(`/board/${c.grid_id}`)}>
                <span className="profile__contrib-name">{c.board_name ?? `Board #${c.grid_id}`}</span>
                <span className="profile__contrib-pixels">{c.pixel_count} pixel{c.pixel_count > 1 ? "s" : ""}</span>
                <span className={`profile__contrib-status profile__contrib-status--${c.status}`}>
                  {c.status === "in_progress" ? "En cours" : "Terminé"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
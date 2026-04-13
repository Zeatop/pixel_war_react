import { useAuth } from "../../contexts/AuthContext";
import "./Profile.scss";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="profile">
      <div className="profile__card">
        {user?.avatar && (
          <img src={user.avatar} alt="" className="profile__avatar" referrerPolicy="no-referrer" />
        )}
        <h1 className="profile__name">{user?.name ?? "Utilisateur"}</h1>
        <p className="profile__email">{user?.email}</p>
      </div>

      <section className="profile__section">
        <h2 className="profile__section-title">Mes contributions</h2>
        <p className="profile__empty">
          Connectez l'API pour afficher vos contributions.
        </p>
      </section>
    </div>
  );
}
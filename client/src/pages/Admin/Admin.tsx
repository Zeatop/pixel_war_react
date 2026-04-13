import "./Admin.scss";

export default function Admin() {
  return (
    <div className="admin">
      <div className="admin__header">
        <h1 className="admin__title">Administration</h1>
        <button className="admin__create-btn" disabled>
          + Nouveau PixelBoard
        </button>
      </div>

      <section className="admin__section">
        <h2 className="admin__section-title">Tous les PixelBoards</h2>
        <p className="admin__empty">
          Connectez l'API pour gérer les PixelBoards.
        </p>
      </section>
    </div>
  );
}
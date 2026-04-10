import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import "./Login.scss";

export default function Login() {
  const { loginWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  // Redirige si déjà connecté
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleSuccess = async (response: CredentialResponse) => {
    setError(null);
    if (!response.credential) {
      setError("Aucun credential reçu de Google.");
      return;
    }
    try {
      await loginWithGoogle(response.credential);
    } catch {
      setError("Échec de la connexion. Vérifiez que le serveur est démarré.");
    }
  };

  const handleError = () => {
    setError("La connexion Google a échoué. Réessayez.");
  };

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__header">
          <span className="login__logo">▪</span>
          <h1 className="login__title">Connexion</h1>
          <p className="login__subtitle">Connectez-vous pour participer aux PixelBoards</p>
        </div>

        <div className="login__actions">
          {loading ? (
            <div className="login__spinner">Connexion en cours…</div>
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="outline"
              size="large"
              width="320"
              text="signin_with"
              shape="rectangular"
            />
          )}

          {error && <p className="login__error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
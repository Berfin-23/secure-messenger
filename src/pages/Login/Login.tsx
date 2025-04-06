import React, { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo/Logo";
import backgroundImage from "../../assets/background.png";
import "./Login.css";

const Login: React.FC = () => {
  const { currentUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/chat");
    }
  }, [currentUser, navigate]);

  return (
    <div className="loginContainer">
      <div className="loginBackground">
        <img src={backgroundImage} alt="Secure Messaging" />
      </div>

      <div className="loginContent">
        <div className="loginCard">
          <div className="logoSection">
            <Logo
              className="loginLogo"
              fill="var(--primary-blue)"
              width={80}
              height={80}
            />
            <h1>Cypher Bee</h1>
          </div>
          <p className="tagline">Secure, end-to-end encrypted messaging</p>
          <div className="divider"></div>
          <p className="loginText">Sign in to continue</p>
          <button onClick={signInWithGoogle} className="googleSigninBtn">
            <i className="fab fa-google"></i>
            Continue with Google
          </button>
          <div className="securityInfo">
            <i className="fas fa-shield-alt"></i>
            <p>
              Your conversations are encrypted and can't be read by anyone else
            </p>
          </div>
        </div>
        <div className="loginFooter">
          <p>&copy; 2025 Cypher Bee • Secure Messenger</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

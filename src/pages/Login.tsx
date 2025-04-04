import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const { currentUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/chat");
    }
  }, [currentUser, navigate]);

  return (
    <div className="login-container">
      <h1>Secure Messenger</h1>
      <p>Login to start encrypted messaging</p>
      <button onClick={signInWithGoogle} className="google-signin-btn">
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;

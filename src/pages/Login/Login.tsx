import React, { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
      <h1>Secure Messenger</h1>
      <p>Login to start encrypted messaging</p>
      <button onClick={signInWithGoogle} className="googleSigninBtn">
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;

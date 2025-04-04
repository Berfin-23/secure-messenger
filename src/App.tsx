import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ConversationProvider } from "./contexts/ConversationContext";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import ProtectedRoute from "./components/ProtectedRoute";
import React, { useState, useEffect } from "react";
import "./App.css";

// New component to handle Firestore errors
const FirestoreErrorHandler: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [indexUrl, setIndexUrl] = useState<string | null>(null);

  // Global error handler for Firestore indexing errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check for Firestore index errors
      if (
        event.error &&
        (event.error.toString().includes("requires an index") ||
          event.error.toString().includes("code=failed-precondition"))
      ) {
        const errorMsg = event.error.toString();
        console.log("Captured Firestore error:", errorMsg);

        // More robust URL extraction
        const indexUrlMatch = errorMsg.match(
          /https:\/\/console\.firebase\.google\.com[^\s")]+/
        );

        if (indexUrlMatch) {
          const extractedUrl = indexUrlMatch[0].replace(/\\+/g, "");
          console.log("Extracted index URL:", extractedUrl);
          setError(
            `This application requires a Firestore index. Please click the button below to create it.`
          );
          setIndexUrl(extractedUrl);
          // Store URL in both state and session storage
          sessionStorage.setItem("firestoreIndexUrl", extractedUrl);
        }
      }
    };

    // Also listen for unhandled rejections which might contain the Firebase error
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        (event.reason.toString().includes("requires an index") ||
          event.reason.toString().includes("code=failed-precondition"))
      ) {
        const errorMsg = event.reason.toString();
        console.log("Captured Firestore rejection:", errorMsg);

        const indexUrlMatch = errorMsg.match(
          /https:\/\/console\.firebase\.google\.com[^\s")]+/
        );

        if (indexUrlMatch) {
          const extractedUrl = indexUrlMatch[0].replace(/\\+/g, "");
          console.log("Extracted index URL from rejection:", extractedUrl);
          setError(
            `This application requires a Firestore index. Please click the button below to create it.`
          );
          setIndexUrl(extractedUrl);
          sessionStorage.setItem("firestoreIndexUrl", extractedUrl);
        }
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  const openIndexCreationPage = () => {
    // Use state first, then fallback to session storage
    const url = indexUrl || sessionStorage.getItem("firestoreIndexUrl");
    if (url) {
      console.log("Opening index URL:", url);
      window.open(url, "_blank");
    } else {
      console.error("No index URL found");
    }
  };

  if (error) {
    return (
      <div className="index-error-container">
        <div className="index-error-box">
          <h3>Firestore Index Required</h3>
          <p>{error}</p>
          <button className="create-index-btn" onClick={openIndexCreationPage}>
            Create Required Index
          </button>
          <p className="error-hint">
            After creating the index, refresh this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <ConversationProvider>
        <FirestoreErrorHandler>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </FirestoreErrorHandler>
      </ConversationProvider>
    </AuthProvider>
  );
}

export default App;

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ConversationProvider } from "./contexts/ConversationContext";
import Login from "./pages/Login/Login";
import Chat from "./pages/Chat/Chat";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import DynamicFavicon from "./components/DynamicFavicon/DynamicFavicon";

function App() {
  return (
    <AuthProvider>
      <ConversationProvider>
        <DynamicFavicon />
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
      </ConversationProvider>
    </AuthProvider>
  );
}

export default App;

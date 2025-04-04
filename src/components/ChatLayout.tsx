import React, { useState } from "react";
import UserSearch from "./UserSearch";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ConversationList from "./ConversationList";
import DebugPanel from "./DebugPanel";
import { useAuth } from "../contexts/AuthContext";
import { useConversations } from "../contexts/ConversationContext";

interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

const ChatLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { startConversationWith, currentConversation } = useConversations();
  const [showSearch, setShowSearch] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const handleSelectUser = async (user: User) => {
    console.log("User selected:", user);
    await startConversationWith(user);
    setShowSearch(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="chat-container">
      <div className="debug-toggle">
        <button onClick={() => setShowDebug(!showDebug)}>
          {showDebug ? "Hide Debug" : "Show Debug"}
        </button>
      </div>

      {showDebug && <DebugPanel />}

      <div className="sidebar">
        <div className="header">
          <div className="user-profile">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || ""}
                className="avatar"
              />
            ) : (
              <div className="default-avatar">
                {(currentUser?.displayName ||
                  currentUser?.email ||
                  "?")[0].toUpperCase()}
              </div>
            )}
            <div className="user-info">
              <h3>{currentUser?.displayName || currentUser?.email}</h3>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="search-toggle">
          <button onClick={() => setShowSearch(!showSearch)}>
            {showSearch ? "Hide Search" : "Search Users"}
          </button>
        </div>

        {showSearch ? (
          <UserSearch onSelectUser={handleSelectUser} />
        ) : (
          <div className="conversations-wrapper">
            <h3 className="conversations-title">Conversations</h3>
            <ConversationList />
          </div>
        )}
      </div>

      <div className="chat-area">
        {currentConversation ? (
          <div className="chat-with-user">
            <div className="chat-header">
              {currentUser && (
                <h3>
                  {Object.values(currentConversation.participantProfiles).find(
                    (profile) => profile.uid !== currentUser.uid
                  )?.displayName || "Chat"}
                </h3>
              )}
              <div className="encryption-badge" title="End-to-end encrypted">
                🔒 Encrypted
              </div>
            </div>

            <MessageList />

            <div className="message-input-container">
              <MessageInput />
            </div>
          </div>
        ) : (
          <div className="no-chat-selected">
            <h2>Welcome to Secure Messenger</h2>
            <p>Search for a user to start an encrypted conversation</p>
            <p>or select an existing conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;

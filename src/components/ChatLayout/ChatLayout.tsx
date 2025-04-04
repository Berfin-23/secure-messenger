import React, { useState } from "react";
import UserSearch from "../UserSearch/UserSearch";
import MessageList from "../MessageList/MessageList";
import MessageInput from "../MessageInput/MessageInput";
import ConversationList from "../ConversationList/ConversationList";
import { useAuth } from "../../contexts/AuthContext";
import { useConversations } from "../../contexts/ConversationContext";
import "./ChatLayout.css";

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

  const handleSelectUser = async (user: User) => {
    console.log("User selected:", user);
    await startConversationWith(user);
    setShowSearch(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="chatContainer">
      <div className="sidebar">
        <div className="header">
          <div className="userProfile">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || ""}
                className="avatar"
              />
            ) : (
              <div className="defaultAvatar">
                {(currentUser?.displayName ||
                  currentUser?.email ||
                  "?")[0].toUpperCase()}
              </div>
            )}
            <div className="userInfo">
              <h3>{currentUser?.displayName || currentUser?.email}</h3>
            </div>
          </div>
          <button onClick={handleLogout} className="logoutBtn">
            Logout
          </button>
        </div>

        <div className="searchToggle">
          <button onClick={() => setShowSearch(!showSearch)}>
            {showSearch ? "Hide Search" : "Search Users"}
          </button>
        </div>

        {showSearch ? (
          <UserSearch onSelectUser={handleSelectUser} />
        ) : (
          <div className="conversationsWrapper">
            <h3 className="conversationsTitle">Conversations</h3>
            <ConversationList />
          </div>
        )}
      </div>

      <div className="chatArea">
        {currentConversation ? (
          <div className="chatWithUser">
            <div className="chatHeader">
              {currentUser && (
                <h3>
                  {Object.values(currentConversation.participantProfiles).find(
                    (profile) => profile.uid !== currentUser.uid
                  )?.displayName || "Chat"}
                </h3>
              )}
              <div className="encryptionBadge" title="End-to-end encrypted">
                🔒 Encrypted
              </div>
            </div>

            <MessageList />

            <div className="messageInputContainer">
              <MessageInput />
            </div>
          </div>
        ) : (
          <div className="noChatSelected">
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

import React, { useEffect } from "react";
import UserSearch from "../UserSearch/UserSearch";
import MessageList from "../MessageList/MessageList";
import MessageInput from "../MessageInput/MessageInput";
import ConversationList from "../ConversationList/ConversationList";
import Avatar from "../Avatar/Avatar";
import { useAuth } from "../../contexts/AuthContext";
import { useConversations } from "../../contexts/ConversationContext";
import Logo from "../Logo/Logo";
import "./ChatLayout.css";

interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

const ChatLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { startConversationWith, currentConversation, markConversationAsRead } =
    useConversations();

  const handleSelectUser = async (user: User) => {
    console.log("User selected:", user);
    await startConversationWith(user);
  };

  const handleLogout = async () => {
    await logout();
  };

  // Mark conversation as read whenever the current conversation changes
  useEffect(() => {
    if (currentConversation) {
      markConversationAsRead(currentConversation.id);
    }
  }, [currentConversation, markConversationAsRead]);

  return (
    <div className="chatContainer">
      <div className="sidebar">
        <div className="appHeader">
          <Logo className="appLogo" fill="var(--primary-blue)" />
          <h1 className="appTitle">Cypher Bee</h1>
        </div>

        <div className="sidebarContent">
          <h3 className="sectionTitle">Chats</h3>
          <UserSearch onSelectUser={handleSelectUser} />
          <div className="conversationsWrapper">
            <ConversationList />
          </div>
        </div>

        <div className="userProfileFooter">
          <div className="userProfileInfo">
            <Avatar
              photoURL={currentUser?.photoURL ?? null}
              displayName={
                currentUser?.displayName || currentUser?.email || "User"
              }
              size={36}
              className="userAvatar"
            />
            <div className="userInfo">
              <h3>{currentUser?.displayName || currentUser?.email}</h3>
            </div>
          </div>
          <button onClick={handleLogout} className="logoutBtn" title="Logout">
            <i className="fa-solid fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      <div className="chatArea">
        {currentConversation ? (
          <div className="chatWithUser">
            <div className="chatHeader">
              {currentUser && (
                <>
                  <div className="chatHeaderUserInfo">
                    {currentConversation && (
                      <Avatar
                        photoURL={
                          Object.values(
                            currentConversation.participantProfiles
                          ).find((profile) => profile.uid !== currentUser.uid)
                            ?.photoURL || null
                        }
                        displayName={
                          Object.values(
                            currentConversation.participantProfiles
                          ).find((profile) => profile.uid !== currentUser.uid)
                            ?.displayName || "Chat"
                        }
                        size={40}
                        className="chatHeaderAvatar"
                      />
                    )}
                    <h3>
                      {Object.values(
                        currentConversation.participantProfiles
                      ).find((profile) => profile.uid !== currentUser.uid)
                        ?.displayName || "Chat"}
                    </h3>
                  </div>
                </>
              )}
              <div className="encryptionBadge" title="End-to-end encrypted">
                <i className="fa fa-lock"></i> End-to-end encrypted
              </div>
            </div>

            <MessageList />

            <div className="messageInputContainer">
              <MessageInput />
            </div>
          </div>
        ) : (
          <div className="noChatSelected">
            <div className="welcomeContent">
              <Logo
                className="welcomeLogo logo-subtle"
                fill="var(--text-tertiary)"
                width={120}
                height={120}
              />
              <h2>Welcome to Cypher Bee</h2>
              <p>Search for a user to start an encrypted conversation</p>
              <p>or select an existing conversation</p>
              <div className="encryptionNotice">
                <i className="fa fa-shield-alt"></i>
                <span>End-to-end encrypted messaging</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;

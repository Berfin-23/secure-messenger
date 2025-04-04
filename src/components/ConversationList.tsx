import React from "react";
import { useConversations } from "../contexts/ConversationContext";
import { useAuth } from "../contexts/AuthContext";
import { Timestamp } from "firebase/firestore";

const ConversationList: React.FC = () => {
  const { conversations, selectConversation, currentConversation } =
    useConversations();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  // Format the last message time
  const formatLastMessageTime = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "";

    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today: show time
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      // Yesterday
      return "Yesterday";
    } else if (diffDays < 7) {
      // This week: show day name
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      // Older: show date
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Get the other participant in the conversation
  const getOtherParticipant = (conversation: any) => {
    const otherUserId = conversation.participants.find(
      (uid: string) => uid !== currentUser.uid
    );

    return (
      conversation.participantProfiles?.[otherUserId] || {
        displayName: "Unknown User",
      }
    );
  };

  if (conversations.length === 0) {
    return (
      <div className="no-conversations">
        <p>No conversations yet.</p>
        <p>Search for users to start chatting!</p>
      </div>
    );
  }

  return (
    <div className="conversations-list">
      {conversations.map((conversation) => {
        const otherUser = getOtherParticipant(conversation);
        const isActive = currentConversation?.id === conversation.id;

        return (
          <div
            key={conversation.id}
            className={`conversation-item ${isActive ? "active" : ""}`}
            onClick={() => selectConversation(conversation)}
          >
            <div className="conversation-avatar">
              {otherUser.photoURL ? (
                <img
                  src={otherUser.photoURL}
                  alt={otherUser.displayName || ""}
                />
              ) : (
                <div className="default-avatar">
                  {(otherUser.displayName ||
                    otherUser.email ||
                    "?")[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="conversation-details">
              <div className="conversation-header">
                <h4 className="conversation-name">
                  {otherUser.displayName || otherUser.email || "Unknown User"}
                </h4>
                <span className="conversation-time">
                  {formatLastMessageTime(conversation.lastMessageTimestamp)}
                </span>
              </div>

              <div className="conversation-last-message">
                {conversation.lastMessage || "No messages yet"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;

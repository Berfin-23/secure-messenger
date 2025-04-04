import React from "react";
import { Timestamp } from "firebase/firestore";
import Avatar from "../Avatar/Avatar";
import "./ConversationItem.css";

interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  participantProfiles: { [uid: string]: User };
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  currentUserId,
  onClick,
}) => {
  // Find the other participant in the conversation
  const otherParticipantId = conversation.participants.find(
    (id) => id !== currentUserId
  );

  const otherUser = otherParticipantId
    ? conversation.participantProfiles[otherParticipantId]
    : null;

  const formatTime = (timestamp?: Timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate();
    const now = new Date();

    // If the message is from today, just show the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If the message is from this year, show the month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }

    // Otherwise show the full date
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`conversationItem ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <div className="conversationAvatar">
        <Avatar
          photoURL={otherUser?.photoURL ?? null}
          displayName={otherUser?.displayName ?? null}
          size={50}
        />
      </div>
      <div className="conversationDetails">
        <div className="conversationHeader">
          <h4 className="conversationName">
            {otherUser?.displayName || otherUser?.email || "Unknown User"}
          </h4>
          {conversation.lastMessageTimestamp && (
            <span className="conversationTime">
              {formatTime(conversation.lastMessageTimestamp)}
            </span>
          )}
        </div>
        {conversation.lastMessage && (
          <p className="conversationLastMessage">
            {conversation.lastMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;
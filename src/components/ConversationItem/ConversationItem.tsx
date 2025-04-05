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
  unreadCount?: number; // Added unread count property
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

  const hasUnread = (conversation.unreadCount || 0) > 0;

  const formatTime = (timestamp?: Timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate();
    const now = new Date();

    // Check if the date is today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Check if the date is yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // Check if the date is within the past week
    const pastWeek = new Date(now);
    pastWeek.setDate(now.getDate() - 6);
    if (date >= pastWeek) {
      return date.toLocaleDateString([], { weekday: "short" });
    }

    // If the message is from this year, show the month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
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
      className={`conversationItem ${isActive ? "active" : ""} ${
        hasUnread ? "hasUnread" : ""
      }`}
      onClick={onClick}
    >
      <div className="conversationAvatar">
        <Avatar
          photoURL={otherUser?.photoURL ?? null}
          displayName={otherUser?.displayName ?? null}
          size={40}
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
        <div className="conversationFooter">
          <p className="conversationLastMessage">
            {conversation.lastMessage || "Start a new conversation"}
          </p>
          {hasUnread && <span className="unreadBadge">{conversation.unreadCount}</span>}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;

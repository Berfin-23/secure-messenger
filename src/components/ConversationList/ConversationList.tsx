import React from "react";
import { useConversations } from "../../contexts/ConversationContext";
import { useAuth } from "../../contexts/AuthContext";
import ConversationItem from "../ConversationItem/ConversationItem";
import "./ConversationList.css";

const ConversationList: React.FC = () => {
  const { conversations, selectConversation, currentConversation } =
    useConversations();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  if (conversations.length === 0) {
    return (
      <div className="noConversations">
        <p>No conversations yet.</p>
        <p>Search for users to start chatting!</p>
      </div>
    );
  }

  // Sort conversations by timestamp, newest first
  const sortedConversations = [...conversations].sort((a, b) => {
    // If either conversation doesn't have a timestamp, handle the edge case
    if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
    if (!a.lastMessageTimestamp) return 1; // a goes later (lower priority)
    if (!b.lastMessageTimestamp) return -1; // b goes later (higher priority for a)

    // Compare timestamps (newest first)
    return (
      b.lastMessageTimestamp.toMillis() - a.lastMessageTimestamp.toMillis()
    );
  });

  return (
    <div className="conversationsList">
      {sortedConversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={currentConversation?.id === conversation.id}
          currentUserId={currentUser.uid}
          onClick={() => selectConversation(conversation)}
        />
      ))}
    </div>
  );
};

export default ConversationList;

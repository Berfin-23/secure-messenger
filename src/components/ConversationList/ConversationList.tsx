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

  return (
    <div className="conversationsList">
      {conversations.map((conversation) => (
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

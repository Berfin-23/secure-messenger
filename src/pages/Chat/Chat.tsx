import React from "react";
import ChatLayout from "../../components/ChatLayout/ChatLayout";
import { ConversationProvider } from "../../contexts/ConversationContext";
import "./Chat.css";

const Chat: React.FC = () => {
  return (
    <div className="chatPage">
      <ConversationProvider>
        <ChatLayout />
      </ConversationProvider>
    </div>
  );
};

export default Chat;

import React from "react";
import ChatLayout from "../components/ChatLayout";
import { ConversationProvider } from "../contexts/ConversationContext";

const Chat: React.FC = () => {
  return (
    <ConversationProvider>
      <ChatLayout />
    </ConversationProvider>
  );
};

export default Chat;

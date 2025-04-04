import React, { useState } from "react";
import { useConversations } from "../contexts/ConversationContext";

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { sendMessage, currentConversation } = useConversations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !currentConversation || sending) return;

    try {
      setSending(true);
      await sendMessage(message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!currentConversation) return null;

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="message-input-textarea"
        disabled={sending}
      />
      <button
        type="submit"
        className="send-button"
        disabled={!message.trim() || sending}
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </form>
  );
};

export default MessageInput;

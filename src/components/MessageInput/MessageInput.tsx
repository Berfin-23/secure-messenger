import React, { useState, useRef, useEffect } from "react";
import { useConversations } from "../../contexts/ConversationContext";
import "./MessageInput.css";

const MessageInput: React.FC = () => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { sendMessage, currentConversation } = useConversations();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to check actual scrollHeight
      textareaRef.current.style.height = "40px";
      
      const newHeight = Math.min(
        textareaRef.current.scrollHeight,
        120 // Max height
      );
      
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !currentConversation || sending) return;

    try {
      setSending(true);
      await sendMessage(message);
      setMessage("");
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
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
    <form onSubmit={handleSubmit} className="messageInputForm">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="messageInputTextarea"
        disabled={sending}
      />
      <button
        type="submit"
        className="sendButton"
        disabled={!message.trim() || sending}
        aria-label="Send message"
      >
        {sending ? (
          <i className="fas fa-spinner fa-spin"></i>
        ) : (
          <i className="fas fa-paper-plane"></i>
        )}
      </button>
    </form>
  );
};

export default MessageInput;

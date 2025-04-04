import React, { useState, useRef, useEffect } from "react";
import { useConversations } from "../../contexts/ConversationContext";
import "./MessageForm.css";

const MessageForm: React.FC = () => {
  const [message, setMessage] = useState("");
  const { sendMessage, currentConversation } = useConversations();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !currentConversation) return;

    try {
      await sendMessage(message);
      setMessage("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="messageInputForm" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className="messageInputTextarea"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={!currentConversation}
      />
      <button
        type="submit"
        className="sendButton"
        disabled={!message.trim() || !currentConversation}
      >
        Send
      </button>
    </form>
  );
};

export default MessageForm;

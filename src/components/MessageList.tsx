import React, { useEffect, useRef } from "react";
import { useConversations } from "../contexts/ConversationContext";
import { useAuth } from "../contexts/AuthContext";
import { Timestamp } from "firebase/firestore";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp | null;
  decrypted?: boolean;
}

const MessageList: React.FC = () => {
  const { messages, loadingMessages, currentConversation } = useConversations();
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [prevMessagesLength, setPrevMessagesLength] = React.useState(0);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Only smooth scroll when new messages are added
    const shouldSmoothScroll = messages.length > prevMessagesLength;
    setPrevMessagesLength(messages.length);

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: shouldSmoothScroll ? "smooth" : "auto",
      });
    }
  }, [messages]);

  if (!currentConversation) {
    return <div className="no-conversation">Select a conversation</div>;
  }

  if (loadingMessages) {
    return <div className="loading-messages">Loading messages...</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="no-messages">
        No messages yet. Start the conversation!
      </div>
    );
  }

  // Format time from timestamp
  const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return "Sending...";
    return new Date(timestamp.toDate()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get sender name
  const getSenderName = (senderId: string) => {
    if (!currentConversation.participantProfiles) return "User";
    if (!currentConversation.participantProfiles[senderId])
      return "Unknown User";
    return (
      currentConversation.participantProfiles[senderId].displayName ||
      currentConversation.participantProfiles[senderId].email ||
      "Unknown User"
    );
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach((message) => {
      if (!message.timestamp) {
        if (currentDate === "pending") {
          groups[groups.length - 1].messages.push(message);
        } else {
          currentDate = "pending";
          groups.push({ date: "Sending...", messages: [message] });
        }
        return;
      }

      const messageDate = new Date(message.timestamp.toDate()).toDateString();

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="messages-container" ref={messagesContainerRef}>
      {messageGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          <div className="date-separator">{group.date}</div>
          {group.messages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.senderId === currentUser?.uid
                  ? "my-message"
                  : "their-message"
              }`}
            >
              <div className="message-content">
                {message.senderId !== currentUser?.uid && (
                  <div className="message-sender">
                    {getSenderName(message.senderId)}
                  </div>
                )}
                <div className="message-text">
                  {message.text}
                  {message.decrypted && (
                    <span
                      className="encrypted-message-indicator"
                      title="End-to-end encrypted"
                    >
                      🔒
                    </span>
                  )}
                </div>
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
                {!message.decrypted && (
                  <div className="decryption-error">
                    ⚠️ Could not decrypt message
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

import React, { useEffect, useRef } from "react";
import { useConversations } from "../../contexts/ConversationContext";
import { useAuth } from "../../contexts/AuthContext";
import { Timestamp } from "firebase/firestore";
import "./MessageList.css";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp | null;
  decrypted?: boolean;
}

const MessageList: React.FC = () => {
  const {
    messages,
    loadingMessages,
    currentConversation,
  } = useConversations();
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
  }, [messages, prevMessagesLength]);

  if (!currentConversation) {
    return <div className="noConversation">Select a conversation</div>;
  }

  if (loadingMessages) {
    return <div className="loadingMessages">Loading messages...</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="noMessages">No messages yet. Start the conversation!</div>
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

  // Format date for separator
  const formatDateSeparator = (dateString: string) => {
    if (dateString === "pending") return "Sending...";

    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
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
          groups.push({ date: "pending", messages: [message] });
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
    <>
      <div className="messagesContainer" ref={messagesContainerRef}>
        {messageGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="messageGroup">
            <div className="dateSeparator">
              {formatDateSeparator(group.date)}
            </div>
            {group.messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.senderId === currentUser?.uid
                    ? "myMessage"
                    : "theirMessage"
                }`}
              >
                <div className="messageContent">
                  {message.senderId !== currentUser?.uid && (
                    <div className="messageSender">
                      {getSenderName(message.senderId)}
                    </div>
                  )}
                  <div className="messageText">
                    {message.text}
                    {message.decrypted && (
                      <span
                        className="encryptedMessageIndicator"
                        title="End-to-end encrypted"
                      >
                        🔒
                      </span>
                    )}
                  </div>
                  <div className="messageTime">
                    {formatTime(message.timestamp)}
                  </div>
                  {message.text && !message.decrypted && (
                    <div className="decryptionError">
                      ⚠️ Could not decrypt message
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} className="messagesEnd" />
      </div>
    </>
  );
};

export default MessageList;

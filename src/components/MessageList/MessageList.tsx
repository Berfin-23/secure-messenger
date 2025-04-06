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

    // First, deduplicate messages by content for the same sender
    // This will prevent showing both the temporary "sending" message and the confirmed server message
    const uniqueMessages = messages.reduce<Message[]>((acc, current) => {
      // Check if we already have a message with the same content from the same sender
      const duplicateMessage = acc.find(
        (msg) =>
          msg.text === current.text &&
          msg.senderId === current.senderId &&
          // If one has a timestamp and the other doesn't, keep the one with the timestamp
          ((msg.timestamp && !current.timestamp) ||
            (!msg.timestamp && current.timestamp))
      );

      // If we found a duplicate message
      if (duplicateMessage) {
        // Keep the one with the timestamp (sent status) over the one without (sending status)
        if (current.timestamp && !duplicateMessage.timestamp) {
          // Replace the duplicate with the timestamped one
          const index = acc.indexOf(duplicateMessage);
          acc[index] = current;
        }
        // Don't add the current message to our accumulator
        return acc;
      }

      // No duplicate found, add this message
      return [...acc, current];
    }, []);

    // Process unique messages
    uniqueMessages.forEach((message) => {
      // For messages with timestamp, group by date
      if (message.timestamp) {
        const messageDate = new Date(message.timestamp.toDate()).toDateString();

        if (messageDate !== currentDate) {
          currentDate = messageDate;
          groups.push({ date: messageDate, messages: [message] });
        } else {
          groups[groups.length - 1].messages.push(message);
        }
      } else {
        // For pending messages, add them to the most recent date group
        // or create a new group if none exists
        if (groups.length === 0) {
          groups.push({ date: new Date().toDateString(), messages: [message] });
        } else {
          groups[groups.length - 1].messages.push(message);
        }
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
                  <div className="messageText">
                    {message.text}
                    {message.decrypted && (
                      <span
                        className="encryptedMessageIndicator"
                        title="End-to-end encrypted"
                      ></span>
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

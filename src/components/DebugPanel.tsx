import React from "react";
import { useConversations } from "../contexts/ConversationContext";
import { useAuth } from "../contexts/AuthContext";

const DebugPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const { conversations, messages, currentConversation, loadingMessages } =
    useConversations();

  return (
    <div className="debug-panel">
      <h3>Debug Information</h3>
      <div>
        <strong>Current User:</strong> {currentUser?.uid || "Not logged in"}
      </div>
      <div>
        <strong>Conversations:</strong> {conversations.length}
      </div>
      <div>
        <strong>Current Conversation:</strong>{" "}
        {currentConversation?.id || "None"}
      </div>
      <div>
        <strong>Messages:</strong> {messages.length}
      </div>
      <div>
        <strong>Loading Messages:</strong> {loadingMessages ? "Yes" : "No"}
      </div>

      <div className="debug-section">
        <h4>Conversations:</h4>
        <ul>
          {conversations.map((conv) => (
            <li key={conv.id}>
              {conv.id} - Participants: {conv.participants.join(", ")}
            </li>
          ))}
        </ul>
      </div>

      <div className="debug-section">
        <h4>Current Conversation Details:</h4>
        {currentConversation ? (
          <pre>{JSON.stringify(currentConversation, null, 2)}</pre>
        ) : (
          <div>No conversation selected</div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;

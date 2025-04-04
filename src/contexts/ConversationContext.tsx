import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import {
  generateEncryptionKey,
  exportKey,
  importKey,
  encryptMessage,
  decryptMessage,
} from "../utils/encryption";

// Types
interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  iv?: string; // Initialization vector for decryption
  timestamp: Timestamp | null;
  decrypted?: boolean;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  participantProfiles: { [uid: string]: User };
  encryptionKey?: string; // Stored encryption key
}

interface ConversationContextType {
  conversations: Conversation[];
  messages: Message[];
  currentConversation: Conversation | null;
  selectConversation: (conversation: Conversation) => void;
  startConversationWith: (otherUser: User) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  loadingMessages: boolean;
}

// Create the context
const ConversationContext = createContext<ConversationContextType | null>(null);

// Create the hook to use this context
export const useConversations = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "useConversations must be used within a ConversationProvider"
    );
  }
  return context;
};

// Provider component
export const ConversationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [encryptionKeys, setEncryptionKeys] = useState<{
    [conversationId: string]: CryptoKey;
  }>({});

  // Get or create a conversation with specific user
  const startConversationWith = async (otherUser: User) => {
    if (!currentUser) {
      console.error("No current user");
      return;
    }

    console.log("Starting conversation with:", otherUser);

    try {
      // Check if conversation already exists
      const conversationsRef = collection(db, "conversations");
      const q = query(
        conversationsRef,
        where("participants", "array-contains", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      let existingConversation: Conversation | null = null;

      querySnapshot.forEach((doc) => {
        const conv = { ...doc.data(), id: doc.id } as Conversation;
        if (conv.participants.includes(otherUser.uid)) {
          existingConversation = conv;
          console.log("Found existing conversation:", conv);
        }
      });

      if (existingConversation) {
        // If the conversation exists, load the encryption key
        const conversation = existingConversation as Conversation; // Explicit type assertion
        if (conversation.encryptionKey) {
          try {
            console.log("Importing existing encryption key");
            const key = await importKey(conversation.encryptionKey);
            setEncryptionKeys((prev) => ({
              ...prev,
              [conversation.id]: key,
            }));
          } catch (error) {
            console.error("Error importing encryption key:", error);
          }
        }
        selectConversation(existingConversation);
        return;
      }

      // If no existing conversation, create a new one
      console.log("Creating new conversation");

      // Create participant profiles object
      const participantProfiles: { [uid: string]: User } = {
        [currentUser.uid]: {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
        },
        [otherUser.uid]: {
          uid: otherUser.uid,
          displayName: otherUser.displayName,
          email: otherUser.email,
          photoURL: otherUser.photoURL,
        },
      };

      // Generate a new encryption key for this conversation
      console.log("Generating new encryption key");
      const encryptionKey = await generateEncryptionKey();
      const exportedKey = await exportKey(encryptionKey);

      // Create new conversation document
      const newConversationRef = doc(collection(db, "conversations"));
      const newConversation: Conversation = {
        id: newConversationRef.id,
        participants: [currentUser.uid, otherUser.uid],
        participantProfiles,
        encryptionKey: exportedKey, // Store the exported key in the conversation
      };

      console.log("Setting conversation doc:", newConversation);
      await setDoc(newConversationRef, newConversation);

      // Store the key in our state
      setEncryptionKeys((prev) => ({
        ...prev,
        [newConversationRef.id]: encryptionKey,
      }));

      console.log("Selecting new conversation");
      selectConversation({
        ...newConversation,
        id: newConversationRef.id,
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  // Select a conversation and load its messages
  const selectConversation = async (conversation: Conversation) => {
    console.log("Selecting conversation:", conversation);
    setCurrentConversation(conversation);
    setMessages([]);

    // If this conversation has an encryption key, import it
    if (conversation.encryptionKey && !encryptionKeys[conversation.id]) {
      try {
        console.log("Importing encryption key for selected conversation");
        const key = await importKey(conversation.encryptionKey);
        setEncryptionKeys((prev) => ({
          ...prev,
          [conversation.id]: key,
        }));
      } catch (error) {
        console.error("Error importing encryption key:", error);
      }
    }

    loadMessages(conversation.id);
  };

  // Load messages for a specific conversation
  const loadMessages = async (conversationId: string) => {
    if (!currentUser) {
      console.error("No current user when loading messages");
      return;
    }

    console.log("Loading messages for conversation:", conversationId);
    setLoadingMessages(true);

    try {
      // Set up real-time listener for messages
      const messagesRef = collection(db, "messages");

      // We need to create an index for this compound query
      // Wrap in try-catch to handle index errors
      try {
        const q = query(
          messagesRef,
          where("conversationId", "==", conversationId),
          orderBy("timestamp", "asc")
        );

        console.log("Setting up message listener");
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            console.log(
              "Message snapshot received, count:",
              snapshot.docs.length
            );

            // Process messages - don't make this function async
            const processMessages = () => {
              const messagesList: Message[] = [];
              const encryptionKey = encryptionKeys[conversationId];
              const promises: Promise<void>[] = [];

              snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const message: Message = {
                  id: doc.id,
                  senderId: data.senderId,
                  text: "Encrypted message", // Placeholder
                  iv: data.iv,
                  timestamp: data.timestamp,
                  decrypted: false,
                };

                messagesList.push(message);

                // Process decryption in separate promises
                if (encryptionKey && data.encrypted && data.iv) {
                  const promise = decryptMessage(
                    data.text,
                    encryptionKey,
                    data.iv
                  )
                    .then((decryptedText) => {
                      message.text = decryptedText;
                      message.decrypted = true;
                    })
                    .catch((error) => {
                      console.error("Failed to decrypt message:", error);
                      message.text = "[Encrypted message]";
                    });
                  promises.push(promise);
                } else if (!data.encrypted) {
                  message.text = data.text || "No message content";
                  message.decrypted = true;
                }
              });

              // Wait for all decryption operations to finish
              Promise.all(promises).then(() => {
                // Sort by timestamp (null timestamps at the end)
                messagesList.sort((a, b) => {
                  if (!a.timestamp) return 1;
                  if (!b.timestamp) return -1;
                  return a.timestamp.toMillis() - b.timestamp.toMillis();
                });

                console.log("Setting decrypted messages:", messagesList);
                setMessages([...messagesList]); // Create a new array to trigger state update
                setLoadingMessages(false);
              });
            };

            processMessages();
          },
          (error) => {
            console.error("Error in message listener:", error);
            if (
              error.code === "failed-precondition" &&
              error.message.includes("index")
            ) {
              throw error;
            }
            setLoadingMessages(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up messages query:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setLoadingMessages(false);
    }
  };

  // Send a message in the current conversation with encryption
  const sendMessage = async (text: string) => {
    if (!currentUser || !currentConversation || !text.trim()) {
      console.error(
        "Cannot send message: missing user, conversation, or message text"
      );
      return;
    }

    console.log("Preparing to send encrypted message");

    try {
      // Get the encryption key for this conversation
      const encryptionKey = encryptionKeys[currentConversation.id];

      if (!encryptionKey) {
        console.error("No encryption key available for this conversation");
        return;
      }

      // Encrypt the message
      const { encryptedText, iv } = await encryptMessage(text, encryptionKey);

      console.log("Message encrypted successfully");

      // Prepare the message data with the encrypted text and IV
      const messageData = {
        conversationId: currentConversation.id,
        senderId: currentUser.uid,
        text: encryptedText,
        iv: iv, // Store the IV for decryption
        encrypted: true, // Flag to indicate this message is encrypted
        timestamp: serverTimestamp(),
      };

      console.log("Adding encrypted message to Firestore");
      const messageRef = await addDoc(collection(db, "messages"), messageData);
      console.log("Encrypted message added with ID:", messageRef.id);

      // Update the conversation with a hint of the last message
      await setDoc(
        doc(db, "conversations", currentConversation.id),
        {
          lastMessage: "🔒 Encrypted message",
          lastMessageTimestamp: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("Encrypted message sent successfully");

      // Add a local message to the state for immediate feedback
      setMessages((prev) => [
        ...prev,
        {
          id: "temp-" + Date.now(),
          senderId: currentUser.uid,
          text: text, // Use the original text for display
          timestamp: null,
          decrypted: true,
        },
      ]);
    } catch (error) {
      console.error("Error sending encrypted message:", error);
    }
  };

  // Load all conversations for the current user
  useEffect(() => {
    if (!currentUser) {
      console.log("No current user for conversations");
      return;
    }

    console.log("Setting up conversations listener for user:", currentUser.uid);

    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(
        "Conversations snapshot received, count:",
        snapshot.docs.length
      );
      const conversationsList: Conversation[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as Conversation;
        conversationsList.push({
          ...data,
          id: doc.id,
        });
      });

      console.log("Setting conversations:", conversationsList);
      setConversations(conversationsList);

      // Import encryption keys for all conversations
      conversationsList.forEach(async (conv) => {
        if (conv.encryptionKey && !encryptionKeys[conv.id]) {
          try {
            const key = await importKey(conv.encryptionKey);
            setEncryptionKeys((prev) => ({
              ...prev,
              [conv.id]: key,
            }));
          } catch (error) {
            console.error(
              `Error importing key for conversation ${conv.id}:`,
              error
            );
          }
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  const value = {
    conversations,
    messages,
    currentConversation,
    selectConversation,
    startConversationWith,
    sendMessage,
    loadingMessages,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

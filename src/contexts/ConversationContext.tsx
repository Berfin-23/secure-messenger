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
  increment,
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
  lastMessageIv?: string; // Added IV for last message decryption
  lastMessageEncrypted?: boolean; // Flag to indicate if last message is encrypted
  participantProfiles: { [uid: string]: User };
  encryptionKey?: string; // Stored encryption key
  unreadCount?: number; // Number of unread messages
}

// Sort direction options
export type SortDirection = "asc" | "desc";

interface ConversationContextType {
  conversations: Conversation[];
  messages: Message[];
  currentConversation: Conversation | null;
  selectConversation: (conversation: Conversation) => void;
  startConversationWith: (otherUser: User) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  loadingMessages: boolean;
  messageSortDirection: SortDirection;
  toggleMessageSort: () => void;
  markConversationAsRead: (conversationId: string) => Promise<void>;
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
  const [messageSortDirection, setMessageSortDirection] =
    useState<SortDirection>("asc");

  const toggleMessageSort = () => {
    setMessageSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

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
    setCurrentConversation(conversation);
    setLoadingMessages(true);
    setMessages([]);

    try {
      // Mark the conversation as read when it's selected
      await markConversationAsRead(conversation.id);

      // Update the local conversations state to reflect the read status
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
        )
      );

      // Fetch messages as before
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
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
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
          orderBy("timestamp", messageSortDirection)
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
                // No need to re-sort as Firestore query already returns messages
                // in the requested sort order (messageSortDirection)
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

      // Get the other participant's ID to update their unread count
      const otherParticipantId = currentConversation.participants.find(
        (id) => id !== currentUser.uid
      );

      // Get the current conversation to check unread count
      const conversationRef = doc(db, "conversations", currentConversation.id);

      // Update the conversation with the encrypted last message, IV
      const updateData = {
        lastMessage: encryptedText,
        lastMessageIv: iv,
        lastMessageEncrypted: true,
        lastMessageTimestamp: serverTimestamp(),
      };

      // Only increment the unread count for the other participant and only if they aren't currently viewing this conversation
      await setDoc(conversationRef, updateData, { merge: true });

      // In a separate update, increment the unread count only for the other participant
      if (otherParticipantId) {
        await setDoc(
          conversationRef,
          {
            unreadCount: increment(1)
          }, 
          { merge: true }
        );
      }

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

  // Mark a conversation as read (set unreadCount to 0)
  const markConversationAsRead = async (conversationId: string) => {
    if (!currentUser) {
      console.error("No current user");
      return;
    }

    try {
      console.log("Marking conversation as read:", conversationId);
      await setDoc(
        doc(db, "conversations", conversationId),
        {
          unreadCount: 0,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error marking conversation as read:", error);
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

    const unsubscribe = onSnapshot(q, async (snapshot) => {
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

      // Import encryption keys for all conversations and decrypt last messages
      const processedConversations = [...conversationsList];

      // Process each conversation - import keys and decrypt last messages
      for (const conv of processedConversations) {
        if (conv.encryptionKey && !encryptionKeys[conv.id]) {
          try {
            // Import the encryption key
            const key = await importKey(conv.encryptionKey);
            setEncryptionKeys((prev) => ({
              ...prev,
              [conv.id]: key,
            }));

            // Try to decrypt the last message if we have the key and IV
            if (
              conv.lastMessageEncrypted &&
              conv.lastMessage &&
              conv.lastMessageIv
            ) {
              try {
                const decryptedLastMessage = await decryptMessage(
                  conv.lastMessage,
                  key,
                  conv.lastMessageIv
                );
                // Update the conversation with decrypted message
                conv.lastMessage = decryptedLastMessage;
                conv.lastMessageEncrypted = false;
              } catch (error) {
                console.error(
                  `Error decrypting last message for conversation ${conv.id}:`,
                  error
                );
                conv.lastMessage = "🔒 Encrypted message";
              }
            }
          } catch (error) {
            console.error(
              `Error importing key for conversation ${conv.id}:`,
              error
            );
          }
        }
        // Handle the case where we already have the key
        else if (
          conv.lastMessageEncrypted &&
          conv.lastMessage &&
          conv.lastMessageIv &&
          encryptionKeys[conv.id]
        ) {
          try {
            const decryptedLastMessage = await decryptMessage(
              conv.lastMessage,
              encryptionKeys[conv.id],
              conv.lastMessageIv
            );
            conv.lastMessage = decryptedLastMessage;
            conv.lastMessageEncrypted = false;
          } catch (error) {
            console.error(
              `Error decrypting last message for conversation ${conv.id}:`,
              error
            );
            conv.lastMessage = "🔒 Encrypted message";
          }
        }
        // If there's no key or iv available, show the message as encrypted
        else if (conv.lastMessageEncrypted) {
          conv.lastMessage = "🔒 Encrypted message";
        }
      }

      // Update state with processed conversations
      setConversations(processedConversations);
    });

    return () => unsubscribe();
  }, [currentUser, encryptionKeys]);

  const value = {
    conversations,
    messages,
    currentConversation,
    selectConversation,
    startConversationWith,
    sendMessage,
    loadingMessages,
    messageSortDirection,
    toggleMessageSort,
    markConversationAsRead,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

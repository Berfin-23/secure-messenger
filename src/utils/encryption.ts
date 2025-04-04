/**
 * Encryption utilities for end-to-end encryption
 */

// Generate a new encryption key
export const generateEncryptionKey = async (): Promise<CryptoKey> => {
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error("Error generating encryption key:", error);
    throw new Error("Failed to generate encryption key");
  }
};

// Export a key to a string format that can be stored
export const exportKey = async (key: CryptoKey): Promise<string> => {
  try {
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    return arrayBufferToBase64(exportedKey);
  } catch (error) {
    console.error("Error exporting key:", error);
    throw new Error("Failed to export encryption key");
  }
};

// Import a key from a string format
export const importKey = async (keyStr: string): Promise<CryptoKey> => {
  try {
    const keyData = base64ToArrayBuffer(keyStr);
    return await window.crypto.subtle.importKey(
      "raw",
      keyData,
      {
        name: "AES-GCM",
        length: 256,
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error("Error importing key:", error);
    throw new Error("Failed to import encryption key");
  }
};

// Encrypt a message
export const encryptMessage = async (
  message: string,
  key: CryptoKey
): Promise<{ encryptedText: string; iv: string }> => {
  try {
    // Generate a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Convert the message to an ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Encrypt the data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );

    // Convert the encrypted data to a base64 string
    const encryptedText = arrayBufferToBase64(encryptedBuffer);
    const ivString = arrayBufferToBase64(iv);

    return { encryptedText, iv: ivString };
  } catch (error) {
    console.error("Error encrypting message:", error);
    throw new Error("Failed to encrypt message");
  }
};

// Decrypt a message
export const decryptMessage = async (
  encryptedText: string,
  key: CryptoKey,
  ivString: string
): Promise<string> => {
  try {
    // Convert the base64 strings back to ArrayBuffers
    const encryptedData = base64ToArrayBuffer(encryptedText);
    const iv = base64ToArrayBuffer(ivString);

    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData
    );

    // Convert the decrypted data back to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Error decrypting message:", error);
    throw new Error("Failed to decrypt message");
  }
};

// Helper function to convert ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Helper function to convert Base64 string to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

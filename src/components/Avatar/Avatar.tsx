import React, { useState, useEffect } from "react";
import "./Avatar.css";

interface AvatarProps {
  photoURL: string | null;
  displayName: string | null;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  photoURL,
  displayName,
  size = 40,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const [avatarColor, setAvatarColor] = useState<string>("#4A55A2");

  // Generate a consistent color based on displayName
  useEffect(() => {
    if (!displayName) return;

    // Simple hash function to generate a consistent color from a string
    const stringToColor = (str: string): string => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }

      // Convert to a hex color with good saturation and lightness (avoid too dark/light colors)
      let color = "#";
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        // Ensure good contrast by limiting the range
        const adjustedValue = Math.max(80, Math.min(value, 200));
        color += adjustedValue.toString(16).padStart(2, "0");
      }
      return color;
    };

    setAvatarColor(stringToColor(displayName));
  }, [displayName]);

  // Get initials from display name
  const getInitials = () => {
    if (!displayName) return "?";
    return displayName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Style for the avatar container
  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size * 0.4}px`,
  };

  // Additional style for the fallback avatar to apply custom color
  const fallbackAvatarStyle = {
    ...avatarStyle,
    backgroundColor: avatarColor,
  };

  if (photoURL && !imageError) {
    return (
      <img
        src={photoURL}
        alt={displayName || "User"}
        className={`avatarImg ${className}`}
        style={avatarStyle}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={`defaultAvatar ${className} fallback-animation`}
      style={fallbackAvatarStyle}
    >
      {getInitials()}
    </div>
  );
};

export default Avatar;

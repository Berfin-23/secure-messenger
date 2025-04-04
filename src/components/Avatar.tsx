import React, { useState } from "react";

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

  if (photoURL && !imageError) {
    return (
      <img
        src={photoURL}
        alt={displayName || "User"}
        className={`avatar ${className}`}
        style={avatarStyle}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fall back to default avatar with initials
  return (
    <div className={`default-avatar ${className}`} style={avatarStyle}>
      {getInitials()}
    </div>
  );
};

export default Avatar;

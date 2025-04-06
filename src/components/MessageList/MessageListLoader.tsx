import React from "react";
import Logo from "../Logo/Logo";
import "./MessageListLoader.css";

const MessageListLoader: React.FC = () => {
  return (
    <div className="messageListLoader">
      <Logo
        className="messageLoaderLogo"
        fill="var(--text-tertiary)"
        width={50}
        height={50}
      />
      <div className="messageLoaderText">Loading messages...</div>
    </div>
  );
};

export default MessageListLoader;

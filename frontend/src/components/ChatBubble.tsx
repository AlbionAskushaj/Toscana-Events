import React from "react";

interface Props {
  role: "user" | "assistant";
  content: string;
}

const ChatBubble: React.FC<Props> = ({ role, content }) => {
  const isUser = role === "user";
  return (
    <div className={`chat-bubble-row ${isUser ? "chat-bubble-row--user" : "chat-bubble-row--assistant"}`}>
      {!isUser && (
        <div className="chat-avatar" aria-hidden="true">T</div>
      )}
      <div className={`chat-bubble ${isUser ? "chat-bubble--user" : "chat-bubble--assistant"}`}>
        {content.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < content.split("\n").length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ChatBubble;

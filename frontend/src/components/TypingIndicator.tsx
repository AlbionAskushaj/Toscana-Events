import React from "react";

const TypingIndicator: React.FC = () => (
  <div className="chat-bubble-row chat-bubble-row--assistant">
    <div className="chat-avatar" aria-hidden="true">T</div>
    <div className="chat-bubble chat-bubble--assistant chat-bubble--typing" aria-label="Typing">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  </div>
);

export default TypingIndicator;

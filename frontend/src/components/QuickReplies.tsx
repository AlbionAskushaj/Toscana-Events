import React from "react";

interface Props {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

const QuickReplies: React.FC<Props> = ({ replies, onSelect, disabled }) => {
  if (!replies.length) return null;
  return (
    <div className="quick-replies">
      {replies.map((reply) => (
        <button
          key={reply}
          type="button"
          className="btn btn-sm quick-reply-btn"
          onClick={() => onSelect(reply)}
          disabled={disabled}
        >
          {reply}
        </button>
      ))}
    </div>
  );
};

export default QuickReplies;

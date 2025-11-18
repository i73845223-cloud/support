import { Send } from "lucide-react";
import { useState } from "react";

interface SendWithHoverProps {
  isDisabled?: boolean;
}

const SendWithHover: React.FC<SendWithHoverProps> = ({ isDisabled = false }) => {
  const [hovered, setHovered] = useState(false);

  const strokeColor = isDisabled ? "#6B7280"
    : hovered ? "#E11D48" : "white";

  return (
    <div
      onMouseEnter={() => !isDisabled && setHovered(true)}
      onMouseLeave={() => !isDisabled && setHovered(false)}
      className={isDisabled ? "cursor-default" : "cursor-pointer"}
    >
      <Send
        stroke={strokeColor}
        size={24}
        className="transition-colors duration-300 ease-in-out"
      />
    </div>
  );
};

export default SendWithHover;

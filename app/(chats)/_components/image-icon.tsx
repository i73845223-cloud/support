import { Image } from "lucide-react";
import { useState } from "react";

interface IconWithHoverProps {
  isDisabled?: boolean;
}

const IconWithHover: React.FC<IconWithHoverProps> = ({ isDisabled = false }) => {
  const [hovered, setHovered] = useState(false);

  const strokeColor = isDisabled ? "#6B7280" : (hovered ? "#E11D48" : "white");

  return (
    <div
      onMouseEnter={() => !isDisabled && setHovered(true)}
      onMouseLeave={() => !isDisabled && setHovered(false)}
      className={`flex items-center ${isDisabled ? "cursor-default" : "cursor-pointer"}`}>
      <Image
        stroke={strokeColor}
        size={24}
        className="transition-colors duration-300 ease-in-out"
      />
    </div>
  );
};

export default IconWithHover;

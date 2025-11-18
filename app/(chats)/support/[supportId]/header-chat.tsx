"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface UserHeaderProps {
  name: string | null;
  userId: string;
}

const UserHeader: React.FC<UserHeaderProps> = ({ name, userId }) => {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(userId);
    setCopied(true);
    toast.success("User ID copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleBackClick = () => {
    router.back();
  };

  return (
    <header className="fixed flex justify-between items-center sm:px-8 px-3 py-3 text-xl border-b-2 border-red-600 w-full bg-black z-[20]">
        <button 
            onClick={handleBackClick}
            className="flex gap-1 items-center"
        >
            <ChevronLeft />Back
        </button>
      <button
        onClick={handleCopy}
        className="text-left cursor-pointer"
        title="Click to copy user ID"
      >
        <div className="text-lg font-semibold"><span className="text-xs text-gray-400 mr-3">{userId}</span>{name}</div>
      </button>
    </header>
  );
};

export default UserHeader;

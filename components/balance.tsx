"use client";

import { useBalance } from "@/hooks/use-balance";
import { Skeleton } from "@/components/ui/skeleton";

const Balance = () => {
  const { formattedBalance, isLoading } = useBalance();

  if (isLoading) {
    return <Skeleton className="h-6 w-32" />;
  }

  return (
      <span>{formattedBalance}</span>
  );
};

export default Balance;
import { useEffect, useState } from "react";

export function useSidebarState(tenantId?: string, userId?: string) {
  const storageKey = `${tenantId || "global"}:${userId || "user"}:sidebarExpanded`;

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isExpanded));
  }, [isExpanded, storageKey]);

  const toggleSidebar = () => setIsExpanded(prev => !prev);

  return { isExpanded, toggleSidebar };
}

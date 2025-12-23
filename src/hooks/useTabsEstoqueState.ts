import { useEffect, useState } from "react";

type Tab = "vendas" | "compras" | "produtos";

export function useTabsEstoqueState() {
  const [tab, setTab] = useState<Tab>(() => {
    const saved = localStorage.getItem("estoqueTab");
    return (saved as Tab) || "compras";
  });

  useEffect(() => {
    localStorage.setItem("estoqueTab", tab);
  }, [tab]);

  const handleSetTab = (value: string) => {
    setTab(value as Tab);
  };

  return { tab, setTab: handleSetTab };
}

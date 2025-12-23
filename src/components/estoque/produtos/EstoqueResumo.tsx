import { useEffect, useState } from "react";
import { obterSaldoEstoque } from "@/services/estoque";

export default function EstoqueResumo({ produtoId }: { produtoId: string }) {
  const [row, setRow] = useState<any>(null);
  
  useEffect(() => {
    (async () => {
      const { data } = await obterSaldoEstoque(produtoId);
      setRow(data ?? { total_comprado: 0, total_vendido: 0, estoque_atual: 0 });
    })();
  }, [produtoId]);

  if (!row) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 rounded-xl border bg-card">
        <div className="text-sm text-muted-foreground">Comprado</div>
        <div className="text-2xl font-semibold">{row.total_comprado ?? 0}</div>
      </div>
      <div className="p-4 rounded-xl border bg-card">
        <div className="text-sm text-muted-foreground">Vendido</div>
        <div className="text-2xl font-semibold">{row.total_vendido ?? 0}</div>
      </div>
      <div className="p-4 rounded-xl border bg-card">
        <div className="text-sm text-muted-foreground">Estoque Atual</div>
        <div className="text-2xl font-semibold">{row.estoque_atual ?? 0}</div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { listarReferenciasDoProduto, criarReferencia, excluirReferencia } from "@/services/produtosReferencia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function ReferenciaList({ produtoId }: { produtoId: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [novo, setNovo] = useState<any>({ codigo_externo: "", contato_id: "", unidade_externa: "UN", fator_conversao: 1 });

  async function refresh() {
    const { data } = await listarReferenciasDoProduto(produtoId);
    setRows(data ?? []);
  }

  useEffect(() => {
    refresh();
  }, [produtoId]);

  async function adicionar() {
    if (!novo.contato_id) {
      toast({ title: "Erro", description: "Selecione o contato.", variant: "destructive" });
      return;
    }
    if (!user) return;

    // ✅ tenant_id removido - gatilho no BD insere automaticamente
    const res = await criarReferencia({ ...novo, produto_id: produtoId } as any);
    if (res.error) {
      toast({ title: "Erro", description: res.error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Sucesso", description: "Referência cadastrada!" });
    setNovo({ codigo_externo: "", contato_id: "", unidade_externa: "UN", fator_conversao: 1 });
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-left">Contato</th>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-left">Unid.</th>
              <th className="p-2 text-left">Fator</th>
              <th className="p-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.contato_id}</td>
                <td className="p-2">{r.codigo_externo || "-"}</td>
                <td className="p-2">{r.descricao_externa || "-"}</td>
                <td className="p-2">{r.unidade_externa || "-"}</td>
                <td className="p-2">{r.fator_conversao ?? 1}</td>
                <td className="p-2 text-right">
                  <button
                    className="text-sm text-destructive hover:underline"
                    onClick={async () => {
                      await excluirReferencia(r.id);
                      refresh();
                    }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  Nenhuma referência cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-5 gap-2">
        <Input
          placeholder="Contato (ID)"
          value={novo.contato_id}
          onChange={(e) => setNovo((s: any) => ({ ...s, contato_id: e.target.value }))}
        />
        <Input
          placeholder="Código Externo"
          value={novo.codigo_externo}
          onChange={(e) => setNovo((s: any) => ({ ...s, codigo_externo: e.target.value }))}
        />
        <Input
          placeholder="Descrição Externa"
          value={novo.descricao_externa}
          onChange={(e) => setNovo((s: any) => ({ ...s, descricao_externa: e.target.value }))}
        />
        <Input
          placeholder="Unidade"
          value={novo.unidade_externa}
          onChange={(e) => setNovo((s: any) => ({ ...s, unidade_externa: e.target.value }))}
        />
        <Input
          placeholder="Fator"
          type="number"
          step="0.001"
          value={novo.fator_conversao}
          onChange={(e) => setNovo((s: any) => ({ ...s, fator_conversao: Number(e.target.value) }))}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={adicionar}>Salvar Referência</Button>
      </div>
    </div>
  );
}

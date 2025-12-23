import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import ProdutoForm from "@/components/estoque/produtos/ProdutoForm";
import ReferenciaList from "@/components/estoque/produtos/ReferenciaList";
import EstoqueResumo from "@/components/estoque/produtos/EstoqueResumo";
import HistoricoAuditoria from "@/components/estoque/produtos/HistoricoAuditoria";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export default function ProdutoDetalhe() {
  const { id } = useParams();
  const nav = useNavigate();
  const [produto, setProduto] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase.from("produtos").select("*").eq("id", id).single();
      setProduto(data);
    })();
  }, [id]);

  if (!produto) return <AppLayout><div className="p-4">Carregando...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-semibold">{produto.nome}</h1>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList>
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="referencias">Referências</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <ProdutoForm initial={produto} onSaved={(pid) => nav(`/produtos/${pid}`)} />
          </TabsContent>

          <TabsContent value="referencias">
            <ReferenciaList produtoId={produto.id} />
          </TabsContent>

          <TabsContent value="estoque">
            <EstoqueResumo produtoId={produto.id} />
          </TabsContent>

          <TabsContent value="historico">
            <HistoricoAuditoria targetId={produto.id} module="produtos" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

import { useState } from "react";
import { Produto } from "@/hooks/useProdutos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProdutoFormProps {
  initial?: Partial<Produto>;
  onSaved: (id: string) => void;
}

export default function ProdutoForm({ initial, onSaved }: ProdutoFormProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Produto>>(initial ?? { preco_base: 0, status: "rascunho" });

  const disabledCamposCriticos = form.status === "ativo" && Boolean(form.aprovado_em);

  async function salvar() {
    const payload = { ...form } as Produto;
    if (!payload.nome) {
      toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    try {
      let res;
      if (payload.id) {
        const patch: any = { ...payload };
        if (disabledCamposCriticos) {
          delete patch.sku;
          delete patch.unidade_id;
          delete patch.marca_id;
          delete patch.categoria_id;
          delete patch.codigo_barras;
        }
        res = await supabase.from("produtos").update(patch).eq("id", payload.id).select().single();
      } else {
        const insertPayload: any = { ...payload };
        res = await supabase.from("produtos").insert(insertPayload).select().single();
      }

      if (res.error) throw res.error;
      toast({ title: "Sucesso", description: "Produto salvo com sucesso!" });
      onSaved(res.data.id);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Nome do produto *"
        value={form.nome || ""}
        onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="SKU"
          value={form.sku || ""}
          onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
          disabled={disabledCamposCriticos}
        />
        <Input
          placeholder="Código de Barras"
          value={form.codigo_barras || ""}
          onChange={(e) => setForm((f) => ({ ...f, codigo_barras: e.target.value }))}
          disabled={disabledCamposCriticos}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input
          placeholder="Preço Base"
          type="number"
          step="0.01"
          value={form.preco_base ?? 0}
          onChange={(e) => setForm((f) => ({ ...f, preco_base: Number(e.target.value) }))}
        />
        <Input
          placeholder="NCM"
          value={form.ncm || ""}
          onChange={(e) => setForm((f) => ({ ...f, ncm: e.target.value }))}
        />
        <Input
          placeholder="Estoque Mínimo"
          type="number"
          step="0.001"
          value={form.estoque_minimo ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, estoque_minimo: Number(e.target.value) }))}
        />
      </div>
      <Textarea
        placeholder="Descrição"
        value={form.descricao || ""}
        onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
      />
      <div className="flex justify-end gap-2">
        <Button onClick={salvar}>Salvar</Button>
      </div>
    </div>
  );
}

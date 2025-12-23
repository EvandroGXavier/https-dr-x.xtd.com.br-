// src/components/biblioteca/EditorModeloV2.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useBibliotecaV2 } from "@/hooks/useBibliotecaV2";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import EditorCorePro from "./EditorCorePro";

type Props = {
  id?: string;
  onSaved?: (id: string) => void;
  etiquetasIniciais?: string[];
};

export default function EditorModeloV2({ id, onSaved, etiquetasIniciais = [] }: Props) {
  const { obter, criar, atualizar } = useBibliotecaV2();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [conteudoHtml, setConteudoHtml] = useState("<p><br/></p>");
  const [etiquetas, setEtiquetas] = useState<string[]>(etiquetasIniciais);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [tocHtml, setTocHtml] = useState("<div>—</div>");
  const isEditar = Boolean(id);
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  useEffect(() => {
    (async () => {
      if (isEditar && id) {
        const data = await obter(id);
        if (data) {
          setTitulo(data.titulo || "");
          setDescricao(data.descricao || "");
          setConteudoHtml(data.conteudo_html || "<p><br/></p>");
        }
      }
    })();
  }, [id, isEditar, obter]);

  const handleSalvar = async () => {
    if (!titulo?.trim()) return toast.error("Informe um título.");
    
    setSalvando(true);
    try {
      if (isEditar && id) {
        const saved = await atualizar(id, { titulo, descricao, conteudo_html: conteudoHtml }, etiquetas);
        if (saved?.id) {
          toast.success("Modelo atualizado com sucesso!");
          onSaved?.(saved.id);
        }
        return;
      }

      const created = await criar({ titulo, descricao, conteudo_html: conteudoHtml }, etiquetas);
      if (created?.id) {
        toast.success("Modelo criado com sucesso!");
        onSaved?.(created.id);
      }
    } finally {
      setSalvando(false);
    }
  };

  // Atalho Ctrl+S para salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSalvar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [titulo, descricao, conteudoHtml, etiquetas]);

  const addEtiqueta = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (e.key === "Enter" && target.value.trim()) {
      setEtiquetas((prev) => Array.from(new Set([...prev, target.value.trim()])));
      target.value = "";
    }
  };

  const removeEtiqueta = (v: string) => {
    setEtiquetas((prev) => prev.filter((x) => x !== v));
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full gap-2">
      {/* Sidebar retrátil com informações do modelo */}
      <Collapsible open={sidebarOpen} onOpenChange={setSidebarOpen} className="relative">
        <Card className={`h-full transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-12'}`}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10">
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardHeader>
              <CardTitle className="text-lg">{isEditar ? "Editar Modelo" : "Novo Modelo"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título *</label>
                <Input 
                  placeholder="Título do modelo" 
                  value={titulo} 
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea 
                  placeholder="Descrição breve do modelo" 
                  value={descricao} 
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Etiquetas</label>
                <div className="flex gap-2 flex-wrap min-h-[32px]">
                  {etiquetas.map((et) => (
                    <Badge 
                      key={et} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => removeEtiqueta(et)}
                    >
                      {et} ✕
                    </Badge>
                  ))}
                </div>
                <Input 
                  placeholder="Digite e pressione Enter" 
                  onKeyDown={addEtiqueta}
                  className="w-full"
                />
              </div>

              <div className="pt-4 space-y-2 border-t">
                <Button 
                  type="button" 
                  onClick={handleSalvar} 
                  disabled={salvando || !titulo.trim()}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? "Salvando..." : "Salvar (Ctrl+S)"}
                </Button>
                <Button 
                  variant="secondary" 
                  type="button" 
                  onClick={() => window.history.back()}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Área principal do editor */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{titulo || "Sem título"}</CardTitle>
            {!sidebarOpen && (
              <Button 
                type="button" 
                onClick={handleSalvar} 
                disabled={salvando || !titulo.trim()}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <EditorCorePro
            html={conteudoHtml}
            setHtml={setConteudoHtml}
            headerHtml={`<div style="display:flex;justify-content:space-between;gap:16px;"><div><strong>${titulo || 'Documento'}</strong></div><div>${dataAtual}</div></div>`}
            footerHtml={`<div style="display:flex;justify-content:space-between;gap:16px;"><div>Confidencial</div><div>Página {page}</div></div>`}
            theme="oficial"
            onTocChange={setTocHtml}
          />
        </CardContent>
      </Card>
    </div>
  );
}

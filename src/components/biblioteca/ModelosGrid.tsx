// src/components/biblioteca/ModelosGrid.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBibliotecaV2 } from "@/hooks/useBibliotecaV2";
import { useNavigate } from "react-router-dom";

export default function ModelosGrid() {
  const { listar, excluir } = useBibliotecaV2();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const navigate = useNavigate();

  const carregar = async () => {
    const data = await listar(q);
    setRows(data);
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    await carregar();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={buscar} className="flex gap-2">
        <Input placeholder="Buscar por título, descrição ou etiqueta..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit">Buscar</Button>
        <Button type="button" variant="secondary" onClick={() => navigate("/biblioteca/novo")}>
          Novo Modelo
        </Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((r) => (
          <Card key={r.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="line-clamp-1">{r.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">{r.descricao}</p>
              {r.etiquetas && <p className="text-xs mt-2">Etiquetas: {r.etiquetas}</p>}
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => navigate(`/biblioteca/editar/${r.id}`)}>Editar</Button>
                <Button size="sm" variant="outline" onClick={() => navigate(`/biblioteca/visualizar/${r.id}`)}>Visualizar</Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (confirm("Confirma excluir?")) {
                      await excluir(r.id);
                      await carregar();
                    }
                  }}
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// src/pages/Biblioteca.tsx
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import ModelosGrid from "@/components/biblioteca/ModelosGrid";
import EditorModeloV2 from "@/components/biblioteca/EditorModeloV2";
import { useEffect, useState } from "react";
import { useBibliotecaV2 } from "@/hooks/useBibliotecaV2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";

function Visualizar() {
  const { id } = useParams();
  const { obter } = useBibliotecaV2();
  const [html, setHtml] = useState("<p/>");
  const [titulo, setTitulo] = useState("");

  useEffect(() => {
    (async () => {
      if (!id) return;
      const data = await obter(id);
      if (data) {
        setTitulo(data.titulo || "");
        setHtml(data.conteudo_html || "<p/>");
      }
    })();
  }, [id, obter]);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </CardContent>
    </Card>
  );
}

function Novo() {
  const navigate = useNavigate();
  return <EditorModeloV2 onSaved={(id) => navigate(`/biblioteca/visualizar/${id}`)} />;
}

function Editar() {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return null;
  return <EditorModeloV2 id={id} onSaved={() => navigate(`/biblioteca/visualizar/${id}`)} />;
}

export default function Biblioteca() {
  return (
    <AppLayout>
      <Routes>
        <Route index element={<ModelosGrid />} />
        <Route path="novo" element={<Novo />} />
        <Route path="editar/:id" element={<Editar />} />
        <Route path="visualizar/:id" element={<Visualizar />} />
      </Routes>
    </AppLayout>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EXEMPLO_JSON = `{
  "versao": "1.0",
  "atualizado_em": "2025-08-27",
  "categorias": [
    {
      "id": "contatos",
      "titulo": "Contatos",
      "topicos": [
        {
          "slug": "cadastrar-contato",
          "titulo": "Cadastrar Novo Contato",
          "sumario": "Como criar um novo contato no sistema.",
          "passos_markdown": [
            "Acesse **Menu → Contatos → + Novo**.",
            "Preencha **Nome** (obrigatório) e **Email**.",
            "Configure **Endereço** e **Telefones**.",
            "Adicione **Etiquetas** para organização.",
            "Clique em **Salvar** para finalizar."
          ],
          "links_relacionados": [
            { "label": "Novo Contato", "href": "/contatos/novo" },
            { "label": "Lista de Contatos", "href": "/contatos" }
          ],
          "tags": ["contatos", "cadastro", "novo"],
          "aliases": ["/contatos/novo", "/contatos"]
        }
      ]
    }
  ]
}`;

export const AjudaModeloExample = () => {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(EXEMPLO_JSON);
    toast({
      title: "JSON copiado!",
      description: "Cole este exemplo na Biblioteca para personalizar a ajuda.",
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Para personalizar o conteúdo da ajuda, crie um modelo na Biblioteca com título 
          <strong> "Ajuda do Sistema"</strong> e formato JSON.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Exemplo de Modelo JSON
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href="/biblioteca" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Ir para Biblioteca
                </a>
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Estrutura JSON para criar conteúdo personalizado da ajuda
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{EXEMPLO_JSON}</code>
          </pre>
          
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <h4 className="font-medium text-foreground">Estrutura do JSON:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>categorias</strong>: Array de categorias de ajuda</li>
              <li><strong>topicos</strong>: Array de tópicos dentro de cada categoria</li>
              <li><strong>aliases</strong>: Rotas que levam automaticamente ao tópico</li>
              <li><strong>passos_markdown</strong>: Passos em formato Markdown</li>
              <li><strong>tags</strong>: Palavras-chave para busca</li>
              <li><strong>links_relacionados</strong>: Links úteis relacionados ao tópico</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
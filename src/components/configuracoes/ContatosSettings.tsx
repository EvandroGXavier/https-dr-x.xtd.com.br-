import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { Skeleton } from '@/components/ui/skeleton'

const CHAVE_CEP_API = 'contatos.cep_api_url'

const ContatosSettings = () => {
  const { valor, setValor, saveConfig, loading } = useConfiguracoes(CHAVE_CEP_API)

  const handleSave = () => {
    saveConfig(valor)
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Configurações de Contatos</CardTitle>
        <CardDescription>
          Ajustes relacionados à criação e gerenciamento de contatos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cep-api-url">Link para busca de CEP</Label>
              <Input
                id="cep-api-url"
                placeholder="Ex: https://viacep.com.br/ws/{cep}/json/"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Use `{"{"+ "cep" + "}"}` como curinga para o número do CEP.
              </p>
            </div>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ContatosSettings
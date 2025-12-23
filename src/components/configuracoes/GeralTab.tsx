import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ContatosSettings from './ContatosSettings'

const GeralTab = () => {
  return (
    <Tabs defaultValue="contatos" className="w-full mt-4">
      <TabsList>
        <TabsTrigger value="contatos">Contatos</TabsTrigger>
        {/* Adicione outras sub-abas aqui, como "Financeiro", "Processos", etc. */}
      </TabsList>
      <TabsContent value="contatos">
        <ContatosSettings />
      </TabsContent>
    </Tabs>
  )
}

export default GeralTab
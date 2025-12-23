import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X } from 'lucide-react'

interface ChatInfoPanelProps {
  contactName: string
  contactImage?: string
  contactNumber: string
  onClose: () => void
}

export function ChatInfoPanel({ contactName, contactImage, contactNumber, onClose }: ChatInfoPanelProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const mediaItems: any[] = []
  const docItems: any[] = []
  const linkItems: any[] = []

  return (
    <div className="flex flex-col h-full border-l">
      {/* Header fixo */}
      <header className="flex items-center justify-between p-3 border-b bg-muted/40 h-16 flex-shrink-0">
        <h3 className="font-semibold">Dados do Contato</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </header>
      
      {/* Info básica fixa */}
      <div className="flex flex-col items-center p-6 border-b flex-shrink-0">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={contactImage} alt={contactName} />
          <AvatarFallback className="text-3xl">{getInitials(contactName)}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold">{contactName}</h2>
        <p className="text-sm text-muted-foreground">{contactNumber}</p>
      </div>
      
      {/* Área de scroll independente */}
      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Nenhuma informação adicional disponível.</p>
          </CardContent>
        </Card>
        <Tabs defaultValue="media" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="media">Mídia</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>
          <TabsContent value="media" className="mt-4 text-center text-sm text-muted-foreground py-4">
            {mediaItems.length > 0 ? <div /> : <p>Nenhuma mídia</p>}
          </TabsContent>
          <TabsContent value="docs" className="mt-4 text-center text-sm text-muted-foreground py-4">
            {docItems.length > 0 ? <div /> : <p>Nenhum documento</p>}
          </TabsContent>
          <TabsContent value="links" className="mt-4 text-center text-sm text-muted-foreground py-4">
            {linkItems.length > 0 ? <div /> : <p>Nenhum link</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

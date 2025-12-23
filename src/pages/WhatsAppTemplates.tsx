import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { MessageSquareText, RefreshCw, ExternalLink } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface WhatsAppTemplate {
  id: string
  name: string
  category: string
  language: string
  status: string
  components: any[]
  rejected_reason?: string
}

export default function WhatsAppTemplates() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadTemplates = async () => {
    try {
      setLoading(true)
      // For now, just set empty array since we don't have wa_templates table yet
      // In production, this would load from the database
      setTemplates([])
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar templates',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const syncTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('wa-sync-templates')

      if (error) throw error

      toast({
        title: 'Templates sincronizados',
        description: `${data.total} templates foram sincronizados da Meta`
      })

      await loadTemplates()
    } catch (error: any) {
      toast({
        title: 'Erro ao sincronizar templates',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500">Aprovado</Badge>
      case 'PENDING':
        return <Badge variant="secondary">Pendente</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejeitado</Badge>
      case 'PAUSED':
        return <Badge variant="outline">Pausado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquareText className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Templates WhatsApp</h1>
        </div>
          <Button onClick={syncTemplates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar da Meta
          </Button>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Templates são mensagens pré-aprovadas pela Meta que podem ser enviadas 
                fora da janela de 24 horas após a última mensagem do cliente.
              </p>
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <a 
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Documentação oficial sobre Templates
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Templates Disponíveis ({templates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquareText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum template encontrado</p>
                <p className="text-sm">Clique em "Sincronizar da Meta" para buscar seus templates</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Idioma</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Componentes</TableHead>
                    <TableHead>Motivo Rejeição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.category}</TableCell>
                      <TableCell>{template.language}</TableCell>
                      <TableCell>{getStatusBadge(template.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.components?.map((comp: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {comp.type}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.rejected_reason && (
                          <span className="text-sm text-destructive">
                            {template.rejected_reason}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
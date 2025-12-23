import { MessageSquare, Mail, Calendar, Scale, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { InteracaoContato } from '@/hooks/useContatoInteracoes';

interface ContatoStatsProps {
  interacoes: InteracaoContato[];
}

export function ContatoStats({ interacoes }: ContatoStatsProps) {
  const stats = {
    whatsapp: interacoes.filter(i => i.tipo === 'whatsapp').length,
    email: interacoes.filter(i => i.tipo === 'email').length,
    agenda: interacoes.filter(i => i.tipo === 'agenda').length,
    processos: interacoes.filter(i => i.tipo === 'processo').length,
    pendentes: interacoes.filter(i => 
      i.status === 'pendente' || i.status === 'em_andamento'
    ).length
  };

  const statItems = [
    { icon: MessageSquare, label: 'WhatsApp', value: stats.whatsapp, color: 'text-green-600' },
    { icon: Mail, label: 'E-mails', value: stats.email, color: 'text-blue-600' },
    { icon: Calendar, label: 'Agendas', value: stats.agenda, color: 'text-purple-600' },
    { icon: Scale, label: 'Processos', value: stats.processos, color: 'text-orange-600' },
    { icon: AlertCircle, label: 'Pendentes', value: stats.pendentes, color: 'text-red-600' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

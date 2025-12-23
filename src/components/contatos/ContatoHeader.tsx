import { Building2, User, Mail, Phone, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContatoCompleto } from '@/types/contatos';
import { TagChip } from '@/components/etiquetas/TagChip';
import { useEtiquetaVinculos } from '@/hooks/useEtiquetas';
import { BotaoLigarContato } from './BotaoLigarContato';

interface ContatoHeaderProps {
  contato: ContatoCompleto;
}

export function ContatoHeader({ contato }: ContatoHeaderProps) {
  const { vinculos } = useEtiquetaVinculos('contatos', contato.id);
  
  const isPJ = contato.cpf_cnpj && contato.cpf_cnpj.length === 18;
  const nomeExibicao = contato.nome_fantasia || 'Sem nome';
  const iniciais = nomeExibicao.substring(0, 2).toUpperCase();
  
  // Buscar meio de contato principal
  const emailPrincipal = contato.meios_contato?.find(m => m.tipo === 'Email' && m.principal);
  const telefonePrincipal = contato.meios_contato?.find(m => m.principal);
  const enderecoPrincipal = contato.enderecos?.find(e => e.principal);

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
      <div className="flex items-start gap-6">
        <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {iniciais}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{nomeExibicao}</h1>
                {isPJ ? (
                  <Badge variant="secondary" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    Pessoa Jurídica
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <User className="h-3 w-3" />
                    Pessoa Física
                  </Badge>
                )}
              </div>
              
              {contato.cpf_cnpj && (
                <p className="text-muted-foreground">
                  {isPJ ? 'CNPJ' : 'CPF'}: {contato.cpf_cnpj}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              {telefonePrincipal && (
                <BotaoLigarContato 
                  numero={telefonePrincipal.valor}
                  nomeContato={nomeExibicao}
                  contatoId={contato.id}
                />
              )}
              {emailPrincipal && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${emailPrincipal.valor}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    E-mail
                  </a>
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {emailPrincipal && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {emailPrincipal.valor}
              </div>
            )}
            {telefonePrincipal && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {telefonePrincipal.valor}
              </div>
            )}
            {enderecoPrincipal && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {enderecoPrincipal.cidade}/{enderecoPrincipal.uf}
              </div>
            )}
          </div>
          
          {vinculos && vinculos.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {vinculos.map(v => {
                const etiqueta = v.etiqueta;
                if (!etiqueta) return null;
                return (
                  <TagChip 
                    key={v.etiqueta_id} 
                    nome={etiqueta.nome}
                    cor={etiqueta.cor || undefined}
                    icone={etiqueta.icone || undefined}
                    size="sm" 
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

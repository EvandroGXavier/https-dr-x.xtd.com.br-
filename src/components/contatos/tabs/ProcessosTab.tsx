import { ContatoCompleto } from '@/types/contatos';
import ProcessosLink from '@/components/contatos/ProcessosLink';
import { FEATURES } from '@/config/features';

interface ProcessosTabProps {
  contato: ContatoCompleto;
  onUpdate: (contato: ContatoCompleto) => void;
  isEditing?: boolean;
}

export function ProcessosTab({ contato }: ProcessosTabProps) {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold mb-4">Processos</h3>
      <p className="text-muted-foreground">
        Componente de processos (somente leitura) em desenvolvimento...
      </p>
      
      {FEATURES.LINK_PROCESSOS_EM_CONTATOS && (
        <div className="pt-4 border-t">
          <ProcessosLink
            contatoId={contato?.id}
            disabled={!contato?.id}
            className="justify-end"
          />
        </div>
      )}
    </div>
  );
}
import { ContatoCompleto } from '@/types/contatos';

interface ContratosTabProps {
  contato: ContatoCompleto;
  onUpdate: (contato: ContatoCompleto) => void;
  isEditing?: boolean;
}

export function ContratosTab({ contato }: ContratosTabProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Contratos</h3>
      <p className="text-muted-foreground">
        Componente de contratos (somente leitura) em desenvolvimento...
      </p>
    </div>
  );
}
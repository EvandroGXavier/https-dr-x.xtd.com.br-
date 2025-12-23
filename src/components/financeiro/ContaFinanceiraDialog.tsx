import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useContasFinanceiras, ContaFinanceira } from "@/hooks/useContasFinanceiras";

interface ContaFinanceiraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaFinanceira | null;
}

export function ContaFinanceiraDialog({
  open,
  onOpenChange,
  conta,
}: ContaFinanceiraDialogProps) {
  const { createConta, updateConta } = useContasFinanceiras();
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const tipoSelecionado = watch("tipo");

  useEffect(() => {
    if (conta) {
      reset(conta);
    } else {
      reset({
        nome: "",
        tipo: "Conta Corrente",
        banco: "",
        agencia: "",
        conta: "",
        pix: "",
        saldo_inicial: 0,
        observacoes: "",
        ativa: true,
      });
    }
  }, [conta, reset]);

  const onSubmit = (data: any) => {
    if (conta?.id) {
      updateConta({ ...data, id: conta.id });
    } else {
      createConta(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {conta ? "Editar Conta" : "Nova Conta Financeira"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nome">Nome da Conta *</Label>
              <Input
                id="nome"
                {...register("nome", { required: true })}
                placeholder="Ex: Banco do Brasil - Conta Corrente"
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo de Conta *</Label>
              <Select
                value={tipoSelecionado}
                onValueChange={(value) => setValue("tipo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                  <SelectItem value="Conta Poupança">Conta Poupança</SelectItem>
                  <SelectItem value="Caixa Físico">Caixa Físico</SelectItem>
                  <SelectItem value="Investimento">Investimento</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="saldo_inicial">Saldo Inicial *</Label>
              <Input
                id="saldo_inicial"
                type="number"
                step="0.01"
                {...register("saldo_inicial", { valueAsNumber: true })}
                placeholder="0,00"
              />
            </div>

            {tipoSelecionado !== "Caixa Físico" && (
              <>
                <div>
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    {...register("banco")}
                    placeholder="Ex: Banco do Brasil"
                  />
                </div>

                <div>
                  <Label htmlFor="agencia">Agência</Label>
                  <Input
                    id="agencia"
                    {...register("agencia")}
                    placeholder="Ex: 1234-5"
                  />
                </div>

                <div>
                  <Label htmlFor="conta">Número da Conta</Label>
                  <Input
                    id="conta"
                    {...register("conta")}
                    placeholder="Ex: 12345-6"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="pix">Chave PIX</Label>
                  <Input
                    id="pix"
                    {...register("pix")}
                    placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                  />
                </div>
              </>
            )}

            <div className="col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...register("observacoes")}
                placeholder="Anotações adicionais sobre esta conta"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {conta ? "Salvar Alterações" : "Criar Conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

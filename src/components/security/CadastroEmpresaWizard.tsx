import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Users, TestTube2, ArrowLeft } from "lucide-react";
import { formatarCNPJ, validarCNPJ } from "@/lib/cnpj";

interface CadastroEmpresaWizardProps {
  user: any;
  onSuccess?: () => void;
}

export function CadastroEmpresaWizard({ user, onSuccess }: CadastroEmpresaWizardProps) {
  const [choice, setChoice] = useState<"nova" | "existente" | "teste" | null>(null);
  const [cnpj, setCnpj] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCnpjChange = (value: string) => {
    const formatted = formatarCNPJ(value);
    setCnpj(formatted);
  };

  async function handleSubmit() {
    // Validações
    if (choice === "existente" && !cnpj) {
      toast.error("Informe o CNPJ da empresa");
      return;
    }

    if (choice === "existente" && !validarCNPJ(cnpj)) {
      toast.error("CNPJ inválido");
      return;
    }

    if (choice === "nova" && !empresa) {
      toast.error("Informe o nome da empresa");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("fn_register_user_with_cnpj_or_choice", {
        p_user_id: user.id,
        p_email: user.email,
        p_nome: user.user_metadata?.nome || user.user_metadata?.full_name || "Usuário",
        p_cnpj: cnpj || null,
        p_nome_empresa: empresa || null,
        p_choice: choice,
      });

      if (error) {
        console.error("Erro ao cadastrar empresa:", error);
        toast.error(error.message || "Erro ao cadastrar empresa. Tente novamente.");
        return;
      }

      toast.success("Cadastro realizado com sucesso!");
      
      // Atualizar profile do usuário com empresa e filial UUIDs
      const result = data as any;
      if (result?.empresa_id && result?.filial_id) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            empresa_id: result.empresa_id,
            filial_id: result.filial_id,
          })
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("Erro ao atualizar profile:", updateError);
        }
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Erro inesperado:", err);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const handleBack = () => {
    setChoice(null);
    setCnpj("");
    setEmpresa("");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
        <CardDescription>
          Configure sua empresa para começar a usar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!choice ? (
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => setChoice("nova")}
            >
              <Building2 className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Criar nova empresa</div>
                <div className="text-xs text-muted-foreground">
                  Cadastre sua empresa e comece a usar
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => setChoice("existente")}
            >
              <Users className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Entrar em empresa existente</div>
                <div className="text-xs text-muted-foreground">
                  Use o CNPJ para se vincular a uma empresa
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => setChoice("teste")}
            >
              <TestTube2 className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Explorar sistema (modo teste)</div>
                <div className="text-xs text-muted-foreground">
                  Teste o sistema sem compromisso
                </div>
              </div>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>

            {choice === "existente" && (
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ da Empresa</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  maxLength={18}
                />
                <p className="text-xs text-muted-foreground">
                  Informe o CNPJ da empresa que deseja se vincular
                </p>
              </div>
            )}

            {choice === "nova" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Nome da Empresa</Label>
                  <Input
                    id="empresa"
                    placeholder="Minha Empresa Ltda"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj-nova">CNPJ (opcional)</Label>
                  <Input
                    id="cnpj-nova"
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => handleCnpjChange(e.target.value)}
                    maxLength={18}
                  />
                  <p className="text-xs text-muted-foreground">
                    Você pode adicionar o CNPJ agora ou depois
                  </p>
                </div>
              </>
            )}

            {choice === "teste" && (
              <div className="rounded-lg border border-muted bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Você será vinculado a uma empresa de demonstração para explorar
                  todas as funcionalidades do sistema.
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Processando..." : "Confirmar cadastro"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

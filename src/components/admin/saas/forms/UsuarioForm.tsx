import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Filial {
  filial_id: string;
  nome: string;
  empresa_id: string;
}

const usuarioFormSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  celular: z.string().optional(),
  perfil: z.string(),
  sip_ramal: z.string().optional(),
  sip_senha: z.string().optional(),
  sip_host: z.string().optional(),
  sip_caller_id: z.string().optional(),
  sip_registrar: z.string().optional(),
  sip_ws_url: z.string().optional(),
  sip_status: z.enum(["online", "offline", "busy"]).optional(),
  current_empresa_id: z.string().uuid().nullable().optional(),
  current_filial_id: z.string().uuid().nullable().optional(),
});

type UsuarioFormValues = z.infer<typeof usuarioFormSchema>;

interface UsuarioFormProps {
  userId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UsuarioForm({ userId, onSuccess, onCancel }: UsuarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);

  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      celular: "",
      perfil: "usuario",
      sip_ramal: "",
      sip_senha: "",
      sip_host: "",
      sip_caller_id: "",
      sip_registrar: "",
      sip_ws_url: "",
      sip_status: "offline",
      current_empresa_id: undefined,
      current_filial_id: undefined,
    },
  });

  useEffect(() => {
    loadEmpresas();
    if (userId) {
      loadUsuario();
    }
  }, [userId]);

  const loadEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from("saas_empresas")
        .select("empresa_id, razao_social, nome_fantasia")
        .order("razao_social");

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    }
  };

  const loadFiliais = async (empresaId: string) => {
    try {
      const response = await supabase
        .from("saas_filiais")
        .select("filial_id, nome, empresa_id")
        .eq("empresa_id", empresaId)
        .order("nome");

      if (response.error) throw response.error;
      setFiliais((response.data || []) as Filial[]);
    } catch (error) {
      console.error("Erro ao carregar filiais:", error);
    }
  };

  const loadUsuario = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("profile_id", userId)
        .single();

      if (error) throw error;

      // Buscar o perfil de usuario_filial_perfis
      const { data: perfilData } = await supabase
        .from("usuario_filial_perfis")
        .select("perfil_slug, empresa_id, filial_id")
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (data) {
        const perfilSlug = perfilData?.perfil_slug || "usuario";
        const empresaUuid = data.empresa_id; // UUID from profiles
        const filialUuid = data.filial_id;   // UUID from profiles

        form.reset({
          nome: data.nome || "",
          email: data.email || "",
          celular: data.celular || "",
          perfil: perfilSlug,
          sip_ramal: data.sip_ramal || "",
          sip_senha: data.sip_senha || "",
          sip_host: data.sip_host || "",
          sip_caller_id: data.sip_caller_id || "",
          sip_registrar: data.sip_registrar || "",
          sip_ws_url: data.sip_ws_url || "",
          sip_status: (data.sip_status as "online" | "offline" | "busy") || "offline",
          current_empresa_id: empresaUuid || undefined,
          current_filial_id: filialUuid || undefined,
        });

        if (empresaUuid) {
          loadFiliais(empresaUuid);
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar usuário:", error);
      toast.error("Erro ao carregar usuário: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: UsuarioFormValues) => {
    try {
      setLoading(true);

      if (userId) {
        // Atualizar usuário existente no profiles (agora com UUIDs)
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            nome: values.nome,
            email: values.email,
            celular: values.celular,
            sip_ramal: values.sip_ramal,
            sip_senha: values.sip_senha,
            sip_host: values.sip_host,
            sip_caller_id: values.sip_caller_id,
            sip_registrar: values.sip_registrar,
            sip_ws_url: values.sip_ws_url,
            sip_status: values.sip_status,
            empresa_id: values.current_empresa_id || null,
            filial_id: values.current_filial_id || null,
          })
          .eq("profile_id", userId);

        if (profileError) throw profileError;

        // Atualizar o perfil_slug em usuario_filial_perfis
        if (values.perfil) {
          const { error: perfilError } = await supabase
            .from("usuario_filial_perfis")
            .update({ perfil_slug: values.perfil })
            .eq("user_id", userId);

          if (perfilError) console.error("Erro ao atualizar perfil:", perfilError);
        }

        toast.success("Usuário atualizado com sucesso");
      } else {
        toast.error("Criação de usuário deve ser feita via registro no sistema");
        return;
      }

      onSuccess();
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Erro ao salvar usuário: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const empresaUuid = form.watch("current_empresa_id");

  useEffect(() => {
    if (empresaUuid) {
      loadFiliais(empresaUuid);
      form.setValue("current_filial_id", undefined);
    }
  }, [empresaUuid]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
            <TabsTrigger value="sip">Configuração SIP</TabsTrigger>
            <TabsTrigger value="empresa">Empresa/Filial</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4">
            <Card className="p-4 space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="celular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="perfil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissão</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a permissão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="usuario">Usuário</SelectItem>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>
          </TabsContent>

          <TabsContent value="sip" className="space-y-4">
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Configuração de Ramal SIP</h3>
                <p className="text-sm text-muted-foreground">
                  Configure os dados de conexão SIP/Asterisk para este usuário
                </p>
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="sip_ramal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ramal</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Número do ramal no servidor SIP
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sip_senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha SIP</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Senha do ramal"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Senha de autenticação no servidor SIP
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sip_host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain / Host SIP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: sip.exemplo.com.br"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Domínio do servidor SIP (sem wss://)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sip_caller_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caller ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: João Silva"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Nome de exibição nas chamadas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sip_registrar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registrar Server</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: sip.exemplo.com.br"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Servidor de registro SIP (geralmente igual ao Domain)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sip_ws_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WebSocket URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: wss://sip.exemplo.com.br:8089/ws"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      URL completa do WebSocket do Asterisk
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sip_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Inicial</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="busy">Ocupado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>
          </TabsContent>

          <TabsContent value="empresa" className="space-y-4">
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Vínculo Organizacional</h3>
                <p className="text-sm text-muted-foreground">
                  Defina a empresa e filial padrão do usuário
                </p>
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="current_empresa_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {empresas.map((empresa) => (
                          <SelectItem key={empresa.empresa_id} value={empresa.empresa_id}>
                            {empresa.nome_fantasia || empresa.razao_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_filial_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filial</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={!empresaUuid}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a filial" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filiais.map((filial) => (
                          <SelectItem key={filial.filial_id} value={filial.filial_id}>
                            {filial.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione primeiro uma empresa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

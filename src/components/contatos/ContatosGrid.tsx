import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagFilter } from "@/components/etiquetas/TagFilter";
import { ItemEtiquetasInline } from "@/components/etiquetas/ItemEtiquetasInline";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Phone, Mail, MessageCircle, MapPin, Edit, Trash2, MoreHorizontal, Copy, ArrowUpDown, ExternalLink, ChevronLeft, ChevronRight, Plus, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContatoExtendido } from "@/types/contatos";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ExportButton } from "@/components/ui/export-button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Interface estendida para incluir dados de PF/PJ
interface ContatoComDatas extends ContatoExtendido {
  data_nascimento?: string;
  data_abertura?: string;
  _pf_data?: {
    data_nascimento?: string;
  };
  _pj_data?: {
    data_abertura?: string;
  };
}
interface ContatosGridProps {
  contacts?: any[]; // Permite passar contatos customizados
  onContactEdit?: (contactId: string) => void;
  onContactDelete?: (contactId: string) => void;
  showNewButton?: boolean;
  customBadges?: (contact: any) => React.ReactNode;
  customActions?: (contact: any) => React.ReactNode;
  hideColumns?: Array<'endereço' | 'etiquetas' | 'tipo'>;
  customTitle?: string;
  customDescription?: string;
  customStats?: React.ReactNode;
  onRowClick?: (contact: any) => void;
  disableDefaultActions?: boolean;
}
type SortField = 'nome_fantasia' | 'email' | 'celular' | 'telefone' | 'cpf_cnpj' | 'endereco' | 'cidade' | 'estado' | 'ativo' | 'created_at' | 'updated_at' | 'data_nascimento' | 'tipo_pessoa';
type SortDirection = 'asc' | 'desc';
type FilterTipo = 'todos' | 'pf' | 'pj' | 'lead';
type FilterSituacao = 'todos' | 'ativo' | 'inativo';
export function ContatosGrid({
  contacts: externalContacts,
  onContactEdit,
  onContactDelete,
  showNewButton = true,
  customBadges,
  customActions,
  hideColumns = [],
  customTitle,
  customDescription,
  customStats,
  onRowClick,
  disableDefaultActions = false
}: ContatosGridProps) {
  const [contacts, setContacts] = useState<ContatoComDatas[]>([]);
  const [contactTags, setContactTags] = useState<Record<string, Array<{
    nome: string;
    cor: string;
    icone: string;
  }>>>({});
  const [contactAddresses, setContactAddresses] = useState<Record<string, any>>({});
  const [contactMeiosContato, setContactMeiosContato] = useState<Record<string, Array<{
    tipo: string;
    valor: string;
    principal?: boolean;
  }>>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [comTags, setComTags] = useState<string[]>([]);
  const [semTags, setSemTags] = useState<string[]>([]);
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('todos');
  const [filterSituacao, setFilterSituacao] = useState<FilterSituacao>('todos');
  const [sortField, setSortField] = useState<SortField>('nome_fantasia');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    getNavigationUrl
  } = useGeolocation();

  // Bug 2: Lista de campos que existem fisicamente na tabela 'contatos_v2' e podem ser usados no .order()
  const colunasReaisOrdenaveis: SortField[] = [
    'nome_fantasia',
    'cpf_cnpj',
    'created_at',
    'updated_at',
    // Campos que são FKs ou texto simples na tabela principal
    // 'classificacao', // Descomentar se 'SortField' incluir
    // 'responsavel_id', // Descomentar se 'SortField' incluir
    // 'pessoa_tipo', // Descomentar se 'SortField' incluir
    // 'data_nascimento', 'tipo_pessoa', 'email', 'celular', 'telefone', 'endereco', 'cidade', 'estado', 'ativo'
    // são derivados (JOINs ou lógica) e ordenados em memória via useMemo.
  ];

  // Carregar contatos  
  const loadContacts = async () => {
    // Se contatos externos foram fornecidos, não carrega do banco
    if (externalContacts) {
      setContacts(externalContacts);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query = supabase.from('contatos_v2').select(`
          *,
          contato_enderecos (
            id,
            tipo,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            uf,
            cep,
            principal
          ),
          contato_pf ( data_nascimento ),
          contato_pj ( data_abertura )
        `);

      // Bug 2: Aplicar ordenação da API apenas se o campo for uma coluna real
      // A ordenação de campos derivados (email, endereco, etc.) é feita client-side
      // no useMemo 'filteredAndSortedContacts'
      if (colunasReaisOrdenaveis.includes(sortField as any)) {
        query = query.order(sortField, {
          ascending: sortDirection === 'asc'
        });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process addresses
      const processedContacts = data || [];
      const addressMap: Record<string, any> = {};
      processedContacts.forEach((contact: any) => {
        // Process addresses - priority: principal > único > primeiro
        if (contact.contato_enderecos && contact.contato_enderecos.length > 0) {
          const addresses = contact.contato_enderecos;
          let selectedAddress = null;

          // First try to find principal address
          selectedAddress = addresses.find((addr: any) => addr.principal);

          // If no principal, use the first one
          if (!selectedAddress) {
            selectedAddress = addresses[0];
          }
          addressMap[contact.id] = selectedAddress;
        }
      });
      setContacts(processedContacts.map((contact: any) => {
        // Remove related tables to match ContatoExtendido type, but keep data accessible
        const {
          contato_enderecos,
          contato_pf,
          contato_pj,
          ...cleanContact
        } = contact;
        // Store PF/PJ data for easy access
        const extended: ContatoComDatas = {
          ...(cleanContact as ContatoComDatas),
          _pf_data: contato_pf?.[0],
          _pj_data: contato_pj?.[0]
        };
        return extended;
      }));
      setContactAddresses(addressMap);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contatos",
        variant: "destructive"
      });
      // Bug 2: Não limpar contatos em caso de erro de query (ex: ordenação inválida)
      // setContacts([]); // Comentado para não apagar a lista em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Carregar etiquetas dos contatos com detalhes completos
  const loadContactTags = async () => {
    try {
      const {
        data: vinculos,
        error
      } = await supabase.from('etiqueta_vinculos').select(`
          referencia_id,
          etiquetas!inner (
            id, nome, cor, icone
          )
        `).eq('referencia_tipo', 'contatos');
      if (error) throw error;
      const tagsMap: Record<string, Array<{
        nome: string;
        cor: string;
        icone: string;
      }>> = {};
      vinculos?.forEach(vinculo => {
        const contactId = vinculo.referencia_id;
        const etiqueta = vinculo.etiquetas;
        if (contactId && etiqueta) {
          if (!tagsMap[contactId]) {
            tagsMap[contactId] = [];
          }
          tagsMap[contactId].push({
            nome: etiqueta.nome,
            cor: etiqueta.cor,
            icone: etiqueta.icone
          });
        }
      });
      setContactTags(tagsMap);
    } catch (error) {
      console.error('Erro ao carregar etiquetas:', error);
    }
  };

  // Carregar meios de contato
  const loadContactMeiosContato = async () => {
    if (externalContacts) return;
    try {
      const {
        data,
        error
      } = await supabase.from('contato_meios_contato').select('contato_id, tipo, valor, principal').in('contato_id', contacts.map(c => c.id));
      if (error) throw error;
      const meiosMap: Record<string, Array<{
        tipo: string;
        valor: string;
        principal?: boolean;
      }>> = {};
      data?.forEach(meio => {
        if (!meiosMap[meio.contato_id]) {
          meiosMap[meio.contato_id] = [];
        }
        meiosMap[meio.contato_id].push({
          tipo: meio.tipo || '',
          valor: meio.valor || '',
          principal: meio.principal || false
        });
      });
      setContactMeiosContato(meiosMap);
    } catch (error) {
      console.error('Erro ao carregar meios de contato:', error);
    }
  };
  useEffect(() => {
    loadContacts();
    if (!externalContacts) {
      loadContactTags();
    }
  }, [sortField, sortDirection, externalContacts]);
  useEffect(() => {
    if (contacts.length > 0 && !externalContacts) {
      loadContactMeiosContato();
    }
  }, [contacts, externalContacts]);

  // Bug 4: Adicionar listener para o atalho global de novo contato
  useEffect(() => {
    const handleRefresh = () => {
      // Só recarrega se não estiver usando contatos externos
      if (!externalContacts) {
        loadContacts();
        loadContactTags(); // Manter consistência
      }
    };

    window.addEventListener('refresh-contatos', handleRefresh);

    return () => {
      window.removeEventListener('refresh-contatos', handleRefresh);
    };
  }, [externalContacts]); // Remover dependências das funções para evitar loops

  // Determinação do tipo de pessoa
  const getTipoContato = (contact: ContatoComDatas | string): 'lead' | 'pf' | 'pj' => {
    const cpfCnpj = typeof contact === 'string' ? contact : contact.cpf_cnpj;
    if (!cpfCnpj) return 'lead';
    const digits = cpfCnpj.replace(/\D/g, '');
    if (digits.length === 11) return 'pf';
    if (digits.length === 14) return 'pj';
    return 'lead';
  };

  // Formatar endereço completo no padrão Google
  const formatGoogleAddress = (address: any): string => {
    if (!address) return '';
    const parts = [];
    if (address.logradouro) {
      let street = address.logradouro;
      if (address.numero) street += `, ${address.numero}`;
      if (address.complemento) street += `, ${address.complemento}`;
      parts.push(street);
    }
    if (address.bairro) parts.push(address.bairro);
    if (address.cidade) parts.push(address.cidade);
    if (address.uf) parts.push(address.uf);
    if (address.cep) parts.push(`CEP ${address.cep}`);
    return parts.join(', ');
  };

  // Filtros e ordenação aplicados
  const filteredAndSortedContacts = useMemo(() => {
    // Primeiro aplica filtros
    const filtered = contacts.filter(contact => {
      // Filtro de busca
      const searchLower = searchTerm.toLowerCase().trim();
      let basicFilter = true;
      if (searchLower) {
        const nomeMatch = contact.nome_fantasia && contact.nome_fantasia.toLowerCase().includes(searchLower);
        const cpfCnpjMatch = contact.cpf_cnpj && contact.cpf_cnpj.toLowerCase().includes(searchLower);

        // Bug 3: Buscar em meios de contato
        const meios = contactMeiosContato[contact.id] || [];
        const meiosMatch = meios.some(meio => 
          meio.valor && meio.valor.toLowerCase().includes(searchLower)
        );

        // Bug 3: Buscar em endereço
        const endereco = contactAddresses[contact.id];
        const enderecoFormatado = endereco ? formatGoogleAddress(endereco).toLowerCase() : '';
        const enderecoMatch = enderecoFormatado.includes(searchLower);

        basicFilter = nomeMatch || cpfCnpjMatch || meiosMatch || enderecoMatch;
      }
      if (!basicFilter) return false;

      // Filtro por tipo
      if (filterTipo !== 'todos') {
        const tipo = getTipoContato(contact.cpf_cnpj);
        if (tipo !== filterTipo) return false;
      }

      // Filtro por situação - verifica presença da tag "Ativo"
      if (filterSituacao !== 'todos') {
        const contactTagList = contactTags[contact.id] || [];
        const hasAtivoTag = contactTagList.some(tag => tag.nome.toLowerCase() === 'ativo');
        if (filterSituacao === 'ativo' && !hasAtivoTag) return false;
        if (filterSituacao === 'inativo' && hasAtivoTag) return false;
      }

      // Filtro por etiquetas
      const contactTagList = contactTags[contact.id] || [];

      // Filtro COM tags
      if (comTags.length > 0) {
        const hasAllComTags = comTags.every(tag => contactTagList.some(contactTag => contactTag.nome.toLowerCase() === tag.toLowerCase()));
        if (!hasAllComTags) return false;
      }

      // Filtro SEM tags
      if (semTags.length > 0) {
        const hasAnySemTag = semTags.some(tag => contactTagList.some(contactTag => contactTag.nome.toLowerCase() === tag.toLowerCase()));
        if (hasAnySemTag) return false;
      }
      return true;
    });

    // Depois aplica ordenação
    return [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      if (sortField === 'tipo_pessoa') {
        // Ordenar por tipo (lead < pf < pj)
        const tipoA = getTipoContato(a.cpf_cnpj);
        const tipoB = getTipoContato(b.cpf_cnpj);
        const ordem = {
          lead: 0,
          pf: 1,
          pj: 2
        };
        aValue = ordem[tipoA];
        bValue = ordem[tipoB];
      } else if (sortField === 'endereco' || sortField === 'cidade' || sortField === 'estado') {
        // Ordenar por endereço principal
        const aEndereco = contactAddresses[a.id];
        const bEndereco = contactAddresses[b.id];
        if (sortField === 'endereco') {
          aValue = aEndereco ? formatGoogleAddress(aEndereco).toLowerCase() : '';
          bValue = bEndereco ? formatGoogleAddress(bEndereco).toLowerCase() : '';
        } else if (sortField === 'cidade') {
          aValue = (aEndereco?.cidade || '').toLowerCase();
          bValue = (bEndereco?.cidade || '').toLowerCase();
        } else if (sortField === 'estado') {
          aValue = (aEndereco?.uf || '').toLowerCase();
          bValue = (bEndereco?.uf || '').toLowerCase();
        }
      } else if (sortField === 'email' || sortField === 'celular' || sortField === 'telefone') {
        // Ordenar por meios de contato
        const meiosA = contactMeiosContato[a.id] || [];
        const meiosB = contactMeiosContato[b.id] || [];
        if (sortField === 'email') {
          const emailA = meiosA.find(m => {
            const tipo = m.tipo?.toLowerCase() || '';
            return tipo === 'e-mail' || tipo === 'email';
          })?.valor || '';
          const emailB = meiosB.find(m => {
            const tipo = m.tipo?.toLowerCase() || '';
            return tipo === 'e-mail' || tipo === 'email';
          })?.valor || '';
          aValue = emailA.toLowerCase();
          bValue = emailB.toLowerCase();
        } else {
          const fieldA = meiosA.find(m => m.tipo?.toLowerCase() === sortField)?.valor || '';
          const fieldB = meiosB.find(m => m.tipo?.toLowerCase() === sortField)?.valor || '';
          aValue = fieldA.toLowerCase();
          bValue = fieldB.toLowerCase();
        }
      } else if (sortField === 'created_at' || sortField === 'updated_at') {
        aValue = new Date(a[sortField] || 0).getTime();
        bValue = new Date(b[sortField] || 0).getTime();
      } else {
        // Campos diretos
        aValue = (a[sortField] || '').toString().toLowerCase();
        bValue = (b[sortField] || '').toString().toLowerCase();
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [contacts, searchTerm, filterTipo, filterSituacao, comTags, semTags, contactTags, sortField, sortDirection, contactAddresses, contactMeiosContato]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedContacts.length / itemsPerPage);
  const paginatedContacts = filteredAndSortedContacts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };
  const handleEdit = (contact: ContatoComDatas) => {
    if (onContactEdit) {
      onContactEdit(contact.id);
    } else {
      navigate(`/contatos/${contact.id}/editar`);
    }
  };
  const handleView = (contact: ContatoComDatas) => {
    navigate(`/contatos/${contact.id}`);
  };
  const handleDelete = async (contact: ContatoComDatas) => {
    // Se o componente pai passou um handler, delega a exclusão a ele
    if (onContactDelete) {
      await onContactDelete(contact.id); // Bug 1: Await a função delegada
      await loadContacts(); // Bug 1: Garante que a grid recarregue após a delegação
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o contato "${contact.nome_fantasia}"?`)) {
      return;
    }
    try {
      const {
        error
      } = await supabase.from('contatos_v2').delete().eq('id', contact.id);
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Contato excluído com sucesso"
      });
      await loadContacts();
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir contato",
        variant: "destructive"
      });
    }
  };
  const handleDuplicate = async (contact: ContatoComDatas) => {
    try {
      const {
        data: newContact,
        error
      } = await supabase.from('contatos_v2').insert({
        user_id: contact.user_id,
        tenant_id: contact.tenant_id,
        empresa_id: contact.empresa_id,
        filial_id: contact.filial_id,
        nome_fantasia: `${contact.nome_fantasia} (Cópia)`,
        celular: contact.celular,
        telefone: contact.telefone,
        email: contact.email,
        cpf_cnpj: contact.cpf_cnpj,
        observacao: contact.observacao
      }).select().single();
      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Contato duplicado com sucesso"
      });
      navigate(`/contatos/${newContact.id}/editar`);
    } catch (error) {
      console.error('Erro ao duplicar contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao duplicar contato",
        variant: "destructive"
      });
    }
  };
  const formatPhoneForWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    const cleanDigits = digits.startsWith('0') ? digits.substring(1) : digits;
    return `55${cleanDigits}`;
  };
  const formatPhoneForTel = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return `+55${digits}`;
  };
  const openMaps = (contactId: string) => {
    const address = contactAddresses[contactId];
    if (!address) return;
    const fullAddress = formatGoogleAddress(address);
    const navigationUrl = getNavigationUrl(fullAddress);
    window.open(navigationUrl, '_blank');
  };

  // Preparar dados para exportação
  const exportHeaders = [{
    key: 'nome_fantasia' as keyof ContatoExtendido,
    label: 'Nome/Razão Social'
  }, {
    key: 'cpf_cnpj' as keyof ContatoExtendido,
    label: 'CPF/CNPJ'
  }, {
    key: 'email' as keyof ContatoExtendido,
    label: 'E-mail'
  }, {
    key: 'celular' as keyof ContatoExtendido,
    label: 'Celular'
  }, {
    key: 'telefone' as keyof ContatoExtendido,
    label: 'Telefone'
  }, {
    key: 'meet' as keyof ContatoExtendido,
    label: 'Meet'
  }, {
    key: 'data_referencia' as keyof ContatoExtendido,
    label: 'Data'
  }, {
    key: 'endereco' as keyof ContatoExtendido,
    label: 'Endereço'
  }];
  const exportData = filteredAndSortedContacts.map(contact => {
    const tipo = getTipoContato(contact);
    const meiosContato = contactMeiosContato[contact.id] || [];
    
    // Buscar meios de contato principais
    const emailPrincipal = meiosContato.find(m => m.tipo === 'Email' && m.principal)?.valor || '';
    const celularPrincipal = meiosContato.find(m => m.tipo === 'Celular' && m.principal)?.valor || '';
    const telefonePrincipal = meiosContato.find(m => m.tipo === 'Telefone' && m.principal)?.valor || '';
    const meetPrincipal = meiosContato.find(m => m.tipo === 'Meet' && m.principal)?.valor || '';
    
    // Data de referência: abertura para PJ, nascimento para PF
    let dataReferencia = '';
    if (tipo === 'pj' && contact.data_abertura) {
      dataReferencia = format(new Date(contact.data_abertura), 'dd/MM/yyyy', { locale: ptBR });
    } else if (tipo === 'pf' && contact.data_nascimento) {
      dataReferencia = format(new Date(contact.data_nascimento), 'dd/MM/yyyy', { locale: ptBR });
    }
    
    return {
      ...contact,
      email: emailPrincipal,
      celular: celularPrincipal,
      telefone: telefonePrincipal,
      meet: meetPrincipal,
      data_referencia: dataReferencia,
      endereco: contactAddresses[contact.id] ? formatGoogleAddress(contactAddresses[contact.id]) : contact.endereco || ''
    };
  });
  return <div className="space-y-3 sm:space-y-4">
      {/* Header com ações (opcional via props) */}
      {(customTitle || customDescription || showNewButton) && <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div>
            {customTitle && <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{customTitle}</h1>}
            {customDescription && <p className="text-xs sm:text-sm text-muted-foreground">{customDescription}</p>}
          </div>
          {showNewButton}
        </div>}

      {/* Estatísticas customizadas (opcional) */}
      {customStats}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-4">
            {/* Busca principal */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar por nome, email, telefone, CPF/CNPJ, endereço..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            {/* Filtros rápidos e Exportação */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <Select value={filterTipo} onValueChange={value => setFilterTipo(value as FilterTipo)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pf">Pessoa Física</SelectItem>
                    <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSituacao} onValueChange={value => setFilterSituacao(value as FilterSituacao)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={itemsPerPage.toString()} onValueChange={value => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ExportButton data={exportData} fileName="contatos" headers={exportHeaders} title="Relatório de Contatos" />
            </div>

            {/* Filtro por etiquetas */}
            <TagFilter value="" onChange={() => {}} comTags={comTags} semTags={semTags} onComTagsChange={setComTags} onSemTagsChange={setSemTags} />
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer w-[200px] lg:w-[250px]" onClick={() => handleSort('nome_fantasia')}>
                    <div className="flex items-center gap-1">
                      <span className="text-xs lg:text-sm font-medium">Nome</span>
                      <ArrowUpDown className="h-3 w-3" />
                      {sortField === 'nome_fantasia' && <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer w-[150px] lg:w-[180px] hidden md:table-cell" onClick={() => handleSort('email')}>
                    <div className="flex items-center gap-1">
                      <span className="text-xs lg:text-sm font-medium">Contato</span>
                      <ArrowUpDown className="h-3 w-3" />
                      {(sortField === 'email' || sortField === 'celular' || sortField === 'telefone') && <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </TableHead>
                  {!hideColumns.includes('endereço') && <TableHead className="cursor-pointer w-[180px] hidden lg:table-cell" onClick={() => handleSort('endereco')}>
                      <div className="flex items-center gap-1">
                        <span className="text-xs lg:text-sm font-medium">Endereço</span>
                        <ArrowUpDown className="h-3 w-3" />
                        {(sortField === 'endereco' || sortField === 'cidade' || sortField === 'estado') && <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </TableHead>}
                  {!hideColumns.includes('etiquetas') && <TableHead className="w-[120px] hidden xl:table-cell">
                      <span className="text-xs lg:text-sm font-medium">Etiquetas</span>
                    </TableHead>}
                  <TableHead className="text-right w-[70px]">
                    <span className="text-xs lg:text-sm font-medium">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContacts.map(contact => <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50 odd:bg-muted/50" onDoubleClick={() => externalContacts ? handleView(contact) : handleEdit(contact)} onClick={() => onRowClick?.(contact)}>
                    <TableCell className="font-medium">
                      <div className="space-y-0.5">
                        {/* Nome/Razão Social */}
                        <div className="text-sm font-medium text-blue-600 hover:underline cursor-pointer truncate" onClick={e => {
                      e.stopPropagation();
                      handleEdit(contact);
                    }}>
                          {contact.nome_fantasia}
                        </div>
                        
                        {/* CPF/CNPJ */}
                        {contact.cpf_cnpj && <div className="text-xs text-muted-foreground">
                            {getTipoContato(contact.cpf_cnpj) === 'pf' ? 'CPF:' : 'CNPJ:'} {contact.cpf_cnpj}
                          </div>}
                        
                        {/* Info mobile - mostrar celular em telas pequenas */}
                        <div className="md:hidden text-xs text-muted-foreground">
                          {contact.celular && <div>📱 {contact.celular}</div>}
                          {contact.email && <div className="truncate">✉️ {contact.email}</div>}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="hidden md:table-cell">
                    {(() => {
                    // Para listas externas (ex.: Vínculos), usamos os meios vindos do próprio contato
                    const rawContact: any = contact;
                    const meiosContato = externalContacts
                      ? (rawContact.contato_meios_contato || []).map((m: any) => ({
                          tipo: (m.tipo || '').toLowerCase(),
                          valor: m.valor || ''
                        }))
                      : (contactMeiosContato[contact.id] || []).map((m: any) => ({
                          tipo: (m.tipo || '').toLowerCase(),
                          valor: m.valor || ''
                        }));

                    const celular = (meiosContato.find(m => m.tipo === 'celular')?.valor
                                   || meiosContato.find(m => m.tipo === 'whatsapp')?.valor
                                   || rawContact.celular) as string | undefined;

                    const telefone = (meiosContato.find(m => m.tipo === 'telefone')?.valor
                                    || rawContact.telefone) as string | undefined;

                    const email = (meiosContato.find(m => m.tipo === 'email' || m.tipo === 'e-mail')?.valor
                                  || rawContact.email) as string | undefined;

                    const meet = meiosContato.find(m => m.tipo === 'meet')?.valor as string | undefined;
                    
                    if (!celular && !telefone && !email && !meet) {
                      return <span className="text-muted-foreground text-sm">-</span>;
                    }
                    return <div className="space-y-1">
                            {/* Celular com ícones */}
                            {celular && <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={e => {
                          e.stopPropagation();
                          window.open(`tel:${formatPhoneForTel(celular)}`, '_self');
                        }} title="Ligar">
                                  <Phone className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={e => {
                          e.stopPropagation();
                          window.open(`https://wa.me/${formatPhoneForWhatsApp(celular)}`, '_blank');
                        }} title="WhatsApp">
                                  <MessageCircle className="h-3 w-3" />
                                </Button>
                                <span className="text-xs">{celular}</span>
                              </div>}
                            
                            {/* Telefone com ícone */}
                            {telefone && <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={e => {
                          e.stopPropagation();
                          window.open(`tel:${formatPhoneForTel(telefone)}`, '_self');
                        }} title="Ligar">
                                  <Phone className="h-3 w-3" />
                                </Button>
                                <span className="text-xs text-muted-foreground">{telefone}</span>
                              </div>}

                            {/* Email com ícone */}
                            {email && <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={e => {
                          e.stopPropagation();
                          window.open(`mailto:${email}`, '_self');
                        }} title="Enviar email">
                                  <Mail className="h-3 w-3" />
                                </Button>
                                <span className="text-xs truncate max-w-[120px]">{email}</span>
                              </div>}

                            {/* Meet com ícone */}
                            {meet && <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={e => {
                          e.stopPropagation();
                          window.open(meet, '_blank');
                        }} title="Abrir Google Meet">
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                                <span className="text-xs truncate max-w-[120px]">Meet</span>
                              </div>}
                          </div>;
                  })()}
                    </TableCell>
                    
                    {!hideColumns.includes('endereço') && <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          {/* Para contatos externos (vínculos), usar o campo endereco diretamente */}
                          {externalContacts ? contact.endereco ? <div className="text-xs line-clamp-2">
                                <MapPin className="h-3 w-3 inline mr-1 text-muted-foreground" />
                                {contact.endereco}
                              </div> : <div className="text-xs text-muted-foreground">Não cadastrado</div> : contactAddresses[contact.id] ? <div className="flex items-start gap-1 cursor-pointer hover:text-primary transition-colors" onClick={e => {
                      e.stopPropagation();
                      openMaps(contact.id);
                    }} title="Clique para abrir no GPS">
                                <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground hover:text-primary flex-shrink-0" />
                                <div className="text-xs line-clamp-2">
                                  {formatGoogleAddress(contactAddresses[contact.id])}
                                </div>
                              </div> : <div className="text-xs text-muted-foreground">
                                Não cadastrado
                              </div>}
                         </div>
                      </TableCell>}
                    
                    {!hideColumns.includes('etiquetas') && <TableCell className="hidden xl:table-cell">
                        {customBadges ? customBadges(contact) : <ItemEtiquetasInline itemId={contact.id} itemType="contatos" itemTags={contactTags[contact.id] || []} onTagsChange={loadContactTags} />}
                      </TableCell>}

                    
                    <TableCell className="text-right">
                      {customActions ? <div className="flex justify-end gap-1">
                          {customActions(contact)}
                        </div> : !disableDefaultActions ? <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => handleView(contact)}>
                               <ExternalLink className="mr-2 h-4 w-4" />
                               Visualizar
                             </DropdownMenuItem>
                             {!externalContacts && <DropdownMenuItem onClick={() => handleEdit(contact)}>
                                 <Edit className="mr-2 h-4 w-4" />
                                 Editar
                               </DropdownMenuItem>}
                             {!externalContacts && <DropdownMenuItem onClick={() => handleDuplicate(contact)}>
                                 <Copy className="mr-2 h-4 w-4" />
                                 Duplicar
                               </DropdownMenuItem>}
                             <DropdownMenuItem onClick={() => handleDelete(contact)} className="text-destructive">
                               <Trash2 className="mr-2 h-4 w-4" />
                               Excluir
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu> : null}
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredAndSortedContacts.length)} de {filteredAndSortedContacts.length} contatos
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({
                length: Math.min(totalPages, 5)
              }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" className="w-8 h-8 p-0" onClick={() => setCurrentPage(page)}>
                        {page}
                      </Button>;
              })}
                </div>

                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>}

          {filteredAndSortedContacts.length === 0 && !loading && <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhum contato encontrado com os filtros aplicados
              </p>
              <Button onClick={() => {
            setSearchTerm('');
            setFilterTipo('todos');
            setFilterSituacao('todos');
            setComTags([]);
            setSemTags([]);
          }}>
                Limpar Filtros
              </Button>
            </div>}
        </CardContent>
      </Card>
    </div>;
}
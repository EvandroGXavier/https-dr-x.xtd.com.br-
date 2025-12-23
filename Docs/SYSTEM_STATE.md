# SYSTEM_STATE.md  
## Estado Técnico Atual — XTD ERP Jurídico (XavierAdv)  

📅 Última atualização: 14/11/2025  
👤 Atualizado por: Especialista Lovable (GPT-5)  
🔖 Versão do sistema: 2.11.0  
🧠 Contexto: Base consolidada com integração Supabase + React + shadcn/ui + Módulo SaaS V1 + Compras/Estoque + IA/OCR + Biblioteca V2 Enhanced + **Contatos V2 Hardened**

---

### 🔹 1. Resumo de Arquitetura
- **Frontend:** React + TypeScript + Vite + Tailwind + shadcn/ui (Radix)  
- **Backend:** Supabase (principal) + Laravel/MariaDB (compatibilidade financeira)  
- **Linguagem padrão:** Português Brasileiro (PT-BR)  
- **Estrutura multi-tenant:** isolamento por `tenant_id = empresa_id`  
- **Autenticação:** Supabase Auth  
- **Autorização:** RBAC baseado em papel (Admin / Advogado / Cliente)  
- **Auditoria:** via triggers → `security_audit_log` + RPCs transacionais  
- **Armazenamento de arquivos:** Supabase Storage (bucket `docs_erp`)  
- **IA integrada:** OCR e deduplicação parcial em módulo Documentos  

---

### 🗄️ 2. Estrutura de Dados (Schema Supabase)

#### Tabelas principais ativas:
| Tabela | Descrição | Status | RLS | Auditoria |
|--------|------------|--------|-----|------------|
| `contatos_v2` | Cadastro de clientes (PF/PJ) | ✅ **Hardened** | ✅ Multi-tenant | ✅ RPC + Triggers |
| `processos` | Processos jurídicos e administrativos | 🧪 Beta V1 | ✅ | ✅ |
| `financeiro_transacoes` | Lançamentos e contas | ✅ Estável | ✅ | ✅ |
| `documentos` | GED e OCR | ✅ Estável | ✅ | ✅ |
| `agendas` | Audiências, prazos e eventos | ✅ Estável | ✅ | ✅ |
| `honorarios` | Negociações e repasses financeiros | 🧩 Em evolução | ✅ | ✅ |
| `notas` | Anotações internas e comentários | ⚙️ Em rascunho | ✅ | ✅ |
| `produtos` | Catálogo de produtos e serviços | ✅ Estável | ✅ | ✅ |
| `compras` | Notas fiscais de entrada | ✅ Estável | ✅ | ✅ |
| `estoque_movimentacoes` | Entradas, saídas e transferências | ✅ Estável | ✅ | — |
| `estoque_saldos` | Saldos por produto/local (CMP) | ✅ Estável | ✅ | — |
| `biblioteca_modelos_v2` | Modelos jurídicos com editor Tiptap | ✅ Estável | ✅ | ✅ |
| `security_audit_log` | Registro de eventos (actor/action/target/module/tenant/timestamp) | ✅ Estável | 🔒 Isenta | — |

#### Tabelas auxiliares (Contatos V2):
- **✅ HARDENED**: `contato_enderecos`, `contato_meios_contato`, `contato_pf`, `contato_pj`, `contato_financeiro_config`, `contato_patrimonios`
- **RLS**: Todas isoladas por `tenant_id = empresa_id`
- **Auditoria**: Exclusões via RPC `excluir_contato_seguro()`

#### Outras tabelas auxiliares:
- `processo_partes`, `processo_timeline`, `processo_honorarios`  
- `agenda_fluxos`, `agenda_etapas`  
- `documentos_tags`, `documentos_anexos`
- `produtos_codigos_alternativos`, `estoque_localizacoes`, `compras_itens`, `compras_parcelas`

---

### 🧩 3. Módulos Ativos e Status

| Módulo | Status | Integrações | Observações |
|--------|---------|-------------|--------------|
| **Contatos** | ✅ **Hardened** | Financeiro, Processos, Telefonia | Multi-tenant seguro, RPC de exclusão, auditoria completa |
| **Processos** | 🧪 Beta | Contatos, Financeiro, Docs, WhatsApp | CRUD funcional + auditoria parcial |
| **Financeiro** | ✅ Estável | Contatos, Processos, Honorários, Compras | Integração automática com CR/CP |
| **Documentos** | ✅ Estável | OCR, IA, Upload-e-Pronto | Extração e dedupe funcionais |
| **Biblioteca V2** | ✅ **Enhanced** | Etiquetas, Tiptap, QRCode, PDF/DOCX | Editor avançado com tabelas e exportação |
| **Agenda/Audiências** | ✅ Estável | Processos, WhatsApp | V2 estabilizada com partes centralizadas |
| **Honorários** | 🧩 Em evolução | Financeiro | Trava pós-aprovação pendente |
| **Notas Internas** | ⚙️ Rascunho | Processos, Contatos | Permissões e visibilidade pendentes |
| **Compras/Estoque** | ✅ Estável | Financeiro, Contatos | Custo médio ponderado + controle fiscal |
| **Produtos** | ✅ Estável | Compras, Estoque | Catálogo com NCM/CFOP/CST |
| **Importação NF-e** | ✅ Estável | IA/OCR, Compras | Leitura automática de XML/PDF |
| **Relatórios Fiscais** | ✅ Estável | Compras, Estoque | Dashboard e divergências |
| **SaaS Admin** | ✅ V1 Estável | Multi-tenant, Auth | Provisionamento Trial simplificado |
| **AID (assistente inteligente)** | 🧠 Integrado | IA e OCR | Sugestões contextuais ativas |

---

### ⚙️ 4. Hooks e Funções Principais (Frontend)

| Hook | Função | Observações |
|------|--------|-------------|
| **`useContatos`** | ❌ **DEPRECADO** | Apenas leitura; mutações lançam erro |
| **`useContatosV2`** | ✅ **HARDENED** | CRUD seguro; `deleteContact()` usa RPC |
| **`useContatoCompleto`** | ✅ Estável | Criação transacional com setServerContext |
| **`useContatoPjTransacional`** | ✅ Estável | Criação PJ com CNPJ + QSA |
|------|--------|-------------|
| `useContatosV2.tsx` | CRUD, dedupe, máscaras CPF/CNPJ | Estável |
| `useProcessos.tsx` | Fluxos jurídicos e timeline | Em evolução |
| `useAgenda.tsx` | Status, calendário e notificações | Necessita otimização |
| `useHonorarios.tsx` | Geração de CR/CP e aprovação | Em teste |
| `useAuditoria.tsx` | Registro central de eventos | OK |
| `useUploads.tsx` | Validação MIME/tamanho + OCR | OK |
| `useCompras.tsx` | **NOVO** Gerenciamento de compras e NF-e | Estável |
| `useProdutos.tsx` | **NOVO** CRUD de produtos e serviços | Estável |
| `useEstoque.tsx` | **NOVO** Movimentações e saldos | Estável |
| `useBibliotecaV2.ts` | **NOVO** CRUD de modelos V2 com etiquetas | Estável |

---

### 🔥 5.1. Edge Functions

| Function | Função | Status |
|----------|--------|--------|
| `processar-nfe` | **NOVO** Importação automática de NF-e via XML/PDF | ✅ Ativo |

---

### 🔐 5. Políticas de Segurança Ativas

- **RLS:** aplicada em todas as tabelas multi-tenant (`tenant_id = current_setting('app.tenant_id', true)::uuid`)  
- **RBAC:** implementado no app com escopos específicos  
- **Auditoria:** trigger `audit_<tabela>()` para INSERT/UPDATE/DELETE  
- **Uploads:** verificação MIME (`pdf`, `jpeg`, `png`), limite 10MB, antivírus opcional  
- **Bloqueio pós-aprovação:** ativo para honorários/contratos  
- **A11y:** layout e componentes com suporte de foco/aria/contraste  

---

### 🧠 6. Estado da IA e Automação

| Área | Implementação | Observações |
|------|----------------|-------------|
| OCR | Ativo no módulo Documentos | IA extrai CPF, CNPJ, nome, datas |
| Dedupe | Integrado ao `useContatosV2` | Evita duplicação de clientes |
| Auto-preenchimento | Parcial | Em documentos e contatos |
| IA contextual (AID) | Ativa | Sugestões baseadas em módulo |
| Upload-e-Pronto | Beta | Precisa integração total com auditoria |

---

### 📈 7. Histórico Técnico Recente

| Data | Alteração | Módulo | Observações |
|------|------------|---------|--------------|
| 05/10/2025 | Adicionado módulo “Notas Internas” | Notas | Visibilidade por papel |
| 02/10/2025 | Correção de RLS em `honorarios` | Honorários | Ajuste Supabase |
| 30/09/2025 | Refatoração `useAgenda` | Agenda | Melhoria de performance |
| 25/09/2025 | Inclusão de OCR no upload | Documentos | Upload-e-Pronto funcional |
| 20/09/2025 | Adição de feature flags | Core | PROCESSOS_V1 e HONORARIOS_V1 |

---

### 🚧 8. Pendências e Gaps Técnicos

- [ ] Unificar `wa_*` e `whatsapp_*` em um módulo único  
- [x] ✅ IA OCR aplicada ao módulo Compras (processar-nfe)
- [ ] Criar logs de auditoria de download  
- [x] ✅ Implementado bloqueio automático em compras aprovadas
- [ ] Refatorar hooks para reutilização entre módulos  
- [ ] Adicionar testes unitários automatizados (Vitest/Jest)
- [ ] Melhorar validação fiscal (NCM/CFOP) com tabela IBPT
- [ ] Adicionar campo "Centro de Custo" nas compras

---

### 🔁 9. Próximas Etapas Planejadas

1. Consolidar auditoria central em `security_audit_log` para todos os módulos.  
2. Criar `processo_auditoria.tsx` para logs detalhados de ações judiciais.  
3. Implementar IA “assistente jurídico” para preenchimento automático.  
4. Estender Upload-e-Pronto para contratos e honorários.  
5. Otimizar layout dinâmico com carregamento modular.  

---

### 🧾 10. Estrutura Complementar de Documentação

| Arquivo | Função |
|----------|--------|
| `PROMPT_MASTER_BASE.md` | Prompt principal do Lovable |
| `PROMPT_RULES_EXT.md` | Regras e templates obrigatórios |
| `CHANGELOG.md` | Histórico cronológico de alterações |
| `SYSTEM_STATE.md` | Estado técnico atual (este arquivo) |

---

### 🔚 Conclusão

O `SYSTEM_STATE.md` é a **fonte viva de verdade técnica** do XTD ERP Jurídico.  
Ele deve ser atualizado **a cada modificação**, mantendo rastreabilidade entre código, schema e segurança.

> “Nada deve ser criado ou modificado sem antes consultar e atualizar o SYSTEM_STATE.md.”  
> — Especialista Lovable, versão 2.4


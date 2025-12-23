# Biblioteca Jurídica V2 - Documentação Técnica

**Data:** 2025-11-10  
**Versão:** 2.10.0  
**Status:** ✅ Implementado

## Visão Geral

A Biblioteca V2 substitui completamente o módulo anterior, implementando:
- ✅ Editor avançado com contenteditable
- ✅ Busca full-text (português) com pg_trgm + unaccent
- ✅ Taxonomia 100% via Etiquetas (sem campos área/tipo/status)
- ✅ RLS por tenant_id + soft delete
- ✅ Auditoria completa via security_audit_log
- ✅ VIEW otimizada (vw_biblioteca_grid) com etiquetas agregadas

## Estrutura do Banco

### Tabela: `biblioteca_modelos_v2`
```sql
- id (uuid, PK)
- tenant_id (uuid, NOT NULL) — RLS principal
- titulo (text, NOT NULL)
- descricao (text, nullable)
- conteudo_html (text, nullable) — HTML do editor
- search_vector (tsvector) — Busca full-text automática
- criado_por (uuid)
- atualizado_por (uuid)
- data_criacao (timestamptz)
- data_atualizacao (timestamptz)
- data_exclusao_logica (timestamptz) — Soft delete
```

### View: `vw_biblioteca_grid`
Agrega etiquetas em string para grid performática:
```sql
SELECT m.id, m.titulo, m.descricao, ..., 
       COALESCE(string_agg(DISTINCT e.nome, ', '), '') AS etiquetas
FROM biblioteca_modelos_v2 m
LEFT JOIN etiqueta_vinculos ev ON m.id::text = ev.referencia_id
LEFT JOIN etiquetas e ON e.id = ev.etiqueta_id
WHERE data_exclusao_logica IS NULL
GROUP BY ...
```

### RPC: `sp_biblioteca_set_etiquetas`
```sql
sp_biblioteca_set_etiquetas(p_modelo_id uuid, p_nomes text[])
```
- Deleta vínculos atuais de `etiqueta_vinculos` (modulo='biblioteca')
- Cria etiquetas se não existirem
- Vincula ao modelo

## Arquitetura Frontend

### Hook: `useBibliotecaV2.ts`
```tsx
const { listar, obter, criar, atualizar, excluir } = useBibliotecaV2();

// Listar com busca e filtro de etiquetas
listar(q?: string, etiquetas?: string[]): Promise<any[]>

// CRUD
obter(id: string): Promise<ModeloV2 | null>
criar(payload: Partial<ModeloV2>, etiquetas: string[]): Promise<ModeloV2 | null>
atualizar(id: string, payload: Partial<ModeloV2>, etiquetas?: string[]): Promise<ModeloV2 | null>
excluir(id: string): Promise<boolean> // soft delete
```

### Componentes

#### `EditorModeloV2.tsx`
- Editor contenteditable simples e estável
- Barra de ferramentas (negrito, itálico, listas, alinhamento)
- Gerenciamento de etiquetas inline
- Props: `id?`, `onSaved?`, `etiquetasIniciais?`

#### `ModelosGrid.tsx`
- Grid responsivo (1-3 colunas)
- Busca client-side
- Ações: Editar, Visualizar, Excluir

### Páginas e Rotas

```tsx
/biblioteca → Lista (ModelosGrid)
/biblioteca/novo → Criar (EditorModeloV2)
/biblioteca/editar/:id → Editar (EditorModeloV2)
/biblioteca/visualizar/:id → Visualizar (readonly)
```

## Segurança

✅ **RLS por tenant_id** em todas as operações (SELECT/INSERT/UPDATE/DELETE)  
✅ **Soft delete** via `data_exclusao_logica`  
✅ **Auditoria automática** via trigger `trg_audit_biblioteca_v2` → `security_audit_log`  
✅ **Validação de entrada** via toasts e verificações client-side  
✅ **Sem exposição de dados entre tenants**

## Migração

### O que foi deletado:
- ❌ `biblioteca_modelos` (tabela antiga)
- ❌ `biblioteca_grupos` (tabela antiga)
- ❌ Todos os relacionamentos CASCADE

### O que foi criado:
- ✅ `biblioteca_modelos_v2`
- ✅ `vw_biblioteca_grid`
- ✅ `sp_biblioteca_set_etiquetas()`
- ✅ Triggers de auditoria e busca

**⚠️ Sem migração de dados:** conforme decisão do cliente.

## Próximas Evoluções (Futuro)

1. **Placeholders Dinâmicos**
   - {{contato.nome}}, {{processo.numero}}
   - Pré-visualização com dados reais

2. **IA Generativa**
   - Sugestões de conteúdo
   - Correção ortográfica/jurídica
   - Templates pré-prontos por área

3. **Assinatura Digital**
   - Integração com ICP-Brasil
   - Workflow de assinatura

## Editor Enhanced (Tiptap) - Implementado ✅

**Data:** 2025-11-11  
**Versão:** 2.10.1

### Funcionalidades

1. **Editor Tiptap Rico**
   - ✅ Toolbar ampliada: negrito, itálico, sublinhado
   - ✅ Títulos H1-H4 hierárquicos
   - ✅ Alinhamento (esquerda, centro, direita)
   - ✅ Listas ordenadas e não-ordenadas
   - ✅ Linha horizontal

2. **Tabelas Complexas**
   - ✅ Inserção de tabelas 3x3 com cabeçalho
   - ✅ Adicionar/remover colunas e linhas dinamicamente
   - ✅ Tabelas redimensionáveis
   - ✅ Estilo visual consistente com design system

3. **Sumário Automático**
   - ✅ Geração automática a partir dos títulos (H1-H4)
   - ✅ Links internos para navegação rápida
   - ✅ Atualização em tempo real ao editar

4. **QRCode Embutido**
   - ✅ Geração de QRCode a partir de texto/URL
   - ✅ Inserção direta no documento como imagem
   - ✅ Baseado em data URL (sem necessidade de servidor)

5. **Exportação Avançada**
   - ✅ **PDF**: Exportação client-side via html2canvas + jsPDF
   - ✅ **DOCX**: Exportação via html-to-docx com cabeçalho/rodapé
   - ✅ Preservação de formatação e tabelas
   - ✅ Paginação automática

6. **Visual Law Presets**
   - ✅ Tema "oficial": fonte base 14px, formal
   - ✅ Tema "humanizado": fonte 15px, espaçamento amplo
   - ✅ Tema "simplificado": fonte 14px, minimal
   - ✅ CSS utilitário em `visual-law.css`

7. **Impressão Profissional**
   - ✅ Cabeçalho/rodapé fixos em todas as páginas
   - ✅ Numeração automática de páginas
   - ✅ Margens adequadas para impressão

### Arquivos Criados

- `src/components/biblioteca/EditorCoreTiptap.tsx` - Editor Tiptap completo
- `src/styles/visual-law.css` - Estilos para Visual Law e tabelas

### Compatibilidade

- ✅ API `html/setHtml` preservada (retrocompatível)
- ✅ Componente drop-in replacement do EditorCore anterior
- ✅ Sem mudanças no schema de banco de dados
- ✅ RLS e auditoria mantidos intactos

### Dependências Adicionadas

```bash
@tiptap/react @tiptap/starter-kit @tiptap/extension-underline 
@tiptap/extension-text-align @tiptap/extension-heading 
@tiptap/extension-link @tiptap/extension-image @tiptap/extension-table 
@tiptap/extension-table-row @tiptap/extension-table-cell 
@tiptap/extension-table-header @tiptap/extension-placeholder 
@tiptap/extension-horizontal-rule @tiptap/extension-character-count 
html-to-docx jspdf html2canvas qrcode
```

## Rollback

```sql
DROP VIEW IF EXISTS public.vw_biblioteca_grid;
DROP TRIGGER IF EXISTS trg_audit_biblioteca_v2 ON public.biblioteca_modelos_v2;
DROP FUNCTION IF EXISTS public.fn_audit_biblioteca_v2;
DROP FUNCTION IF EXISTS public.fn_biblioteca_v2_update_search_vector;
DROP FUNCTION IF EXISTS public.sp_biblioteca_set_etiquetas(uuid, text[]);
DROP TABLE IF EXISTS public.biblioteca_modelos_v2;
```

## Teste Manual

1. Criar modelo: `/biblioteca/novo` → título + etiquetas
2. Buscar na grid por título/descrição/etiqueta
3. Editar modelo existente
4. Visualizar (readonly)
5. Excluir (soft delete) e confirmar remoção da grid
6. Verificar auditoria em `security_audit_log`

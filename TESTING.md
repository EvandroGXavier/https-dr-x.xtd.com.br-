# Guia de Testes Automatizados

## Instalação

Para configurar o ambiente de testes, execute:

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom
```

## Executando os Testes

### Modo Watch (Desenvolvimento)
```bash
npm test
```

### Com Interface Gráfica
```bash
npm run test:ui
```

### Com Cobertura de Código
```bash
npm run test:coverage
```

## Estrutura de Testes

### Arquivos Criados

1. **vitest.config.ts**: Configuração do Vitest
2. **src/test/setup.ts**: Setup global dos testes (mocks do Supabase)
3. **src/test/utils.tsx**: Utilitários e helpers para testes
4. **src/test/hooks/useProcessos.test.ts**: Testes do hook de processos

### Testes Implementados

#### 1. Criação de Processo Básico
- Valida criação com campos mínimos (título, status)
- Verifica chamada correta da RPC `criar_processo_v1`
- Confirma retorno do processo criado

#### 2. Criação de Processo Judicial Completo
- Testa criação com todos os campos judiciais
- Valida passagem de dados para `processos_tj`
- Verifica campos: número CNJ, tribunal, vara, comarca, etc.

#### 3. Tratamento de Erros
- Valida comportamento quando RPC falha
- Testa validação de campos obrigatórios
- Verifica mensagens de erro apropriadas

#### 4. Teste de Integração (Placeholder)
- Documenta necessidade de teste com banco real
- Valida persistência em `processos_tj`

## Executando Testes Específicos

```bash
# Executar apenas testes de processos
npm test useProcessos

# Executar em modo watch para um arquivo específico
npm test -- useProcessos.test.ts
```

## Cobertura de Código

A cobertura é gerada em:
- **Terminal**: Resumo em texto
- **HTML**: `coverage/index.html` (abre no navegador)
- **JSON**: `coverage/coverage-final.json`

## Próximos Passos

1. **Instalar dependências** (comando acima)
2. **Executar testes**: `npm test`
3. **Verificar cobertura**: `npm run test:coverage`
4. **Adicionar mais testes** conforme necessário:
   - Testes de atualização de processos
   - Testes de exclusão
   - Testes de consulta/filtros
   - Testes de componentes de UI

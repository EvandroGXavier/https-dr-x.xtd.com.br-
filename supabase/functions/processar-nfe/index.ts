import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const globalHeaders: Record<string, string> = {};
    if (authHeader) {
      globalHeaders['Authorization'] = authHeader;
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: globalHeaders } }
    );

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('Arquivo não fornecido');
    }

    const fileName = file.name.toLowerCase();
    let dadosNfe: any = {};

    // Processar XML
    if (fileName.endsWith('.xml')) {
      const xmlText = await file.text();
      dadosNfe = await processarXML(xmlText);
    } 
    // Processar PDF/Imagem com OCR (placeholder - requer edge function de OCR)
    else if (fileName.endsWith('.pdf') || fileName.endsWith('.jpg') || fileName.endsWith('.png')) {
      const arrayBuffer = await file.arrayBuffer();
      dadosNfe = await processarComOCR(arrayBuffer, fileName);
    } else {
      throw new Error('Formato de arquivo não suportado. Use XML, PDF, JPG ou PNG.');
    }

    // Verificar usuário autenticado e contexto de tenant (empresa/filial)
    const { data: userData } = await supabaseClient.auth.getUser();
    const userId = userData?.user?.id ?? null;
    let tenantId = userId; // fallback
    let empresaId: string | null = null;
    let filialId: string | null = null;

    if (userId) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('current_empresa_uuid, current_filial_uuid')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile?.current_empresa_uuid) {
        tenantId = profile.current_empresa_uuid;
        empresaId = profile.current_empresa_uuid;
      }
      if (profile?.current_filial_uuid) {
        filialId = profile.current_filial_uuid;
      }
    }

    // Verificar se já existe compra com esta chave
    if (dadosNfe.chave_nfe) {
      const { data: compraExistente } = await supabaseClient
        .from('compras')
        .select('id')
        .eq('chave_nfe', dadosNfe.chave_nfe)
        .single();

      if (compraExistente) {
        throw new Error('Nota fiscal já importada anteriormente');
      }
    }

    // Buscar ou criar fornecedor
    let fornecedorId = null;
    
    if (dadosNfe.fornecedor?.cnpj) {
      // Limpar CNPJ
      const cnpjLimpo = dadosNfe.fornecedor.cnpj.replace(/\D/g, '');
      
      // Buscar fornecedor existente
      const { data: fornecedor } = await supabaseClient
        .from('contatos_v2')
        .select('id')
        .eq('cpf_cnpj', cnpjLimpo)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (fornecedor) {
        fornecedorId = fornecedor.id;
      } else {
        // Consultar dados completos na Receita via edge function
        let dadosReceita = null;
        try {
          const { data } = await supabaseClient.functions.invoke('consultar-cnpj', {
            body: { cnpj: cnpjLimpo }
          });
          if (data && !data.error) {
            dadosReceita = data;
          }
        } catch (e) {
          console.log('Erro ao consultar CNPJ na Receita:', e);
        }

        // Preparar dados do fornecedor
        const celularFornecedor = dadosNfe.fornecedor.celular || dadosNfe.fornecedor.telefone || '00000000000';
        const nomeFornecedor = dadosReceita?.nome || dadosReceita?.nome_fantasia || dadosNfe.fornecedor.nome || 'Fornecedor Desconhecido';

        // Criar novo fornecedor com dados da Receita se disponível
        const novoFornecedorData: any = {
          tenant_id: tenantId,
          user_id: userId,
          empresa_id: empresaId,
          filial_id: filialId,
          nome_fantasia: nomeFornecedor,
          cpf_cnpj: cnpjLimpo,
          tipo_pessoa: 'pj',
          celular: celularFornecedor,
          email: dadosReceita?.email || null,
          observacao: 'Criado automaticamente na importação de NFe'
        };

        const { data: novoFornecedor, error: errorFornecedor } = await supabaseClient
          .from('contatos_v2')
          .insert(novoFornecedorData)
          .select()
          .single();

        if (errorFornecedor) throw errorFornecedor;
        fornecedorId = novoFornecedor.id;

        // Se temos dados completos da Receita, criar também contato_pj
        if (dadosReceita) {
          await supabaseClient.from('contato_pj').insert({
            contato_id: novoFornecedor.id,
            empresa_id: empresaId,
            filial_id: filialId,
            cnpj: cnpjLimpo,
            razao_social: dadosReceita.nome || dadosReceita.razao_social,
            nome_fantasia: dadosReceita.nome_fantasia,
            porte: dadosReceita.porte,
            natureza_juridica: dadosReceita.natureza_juridica,
            cnae_principal: dadosReceita.cnae_fiscal,
            data_abertura: dadosReceita.data_abertura || dadosReceita.data_inicio_atividade,
            situacao_cadastral: dadosReceita.situacao_cadastral || dadosReceita.status,
            capital_social: dadosReceita.capital_social ? parseFloat(dadosReceita.capital_social) : null
          });
        }
      }
    } else {
      // Se não tem CNPJ, usar "Contato Padrão"
      const { data: contatoPadrao } = await supabaseClient.rpc('get_or_create_contato_padrao', {
        p_tenant_id: tenantId,
        p_user_id: userId
      });
      
      fornecedorId = contatoPadrao;
    }

    // 🕒 Criar compra com data/hora local (Brasil)
    const now = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    
    const { data: compra, error: errorCompra } = await supabaseClient
      .from('compras')
      .insert({
        tenant_id: tenantId,
        empresa_id: empresaId,
        filial_id: filialId,
        fornecedor_id: fornecedorId,
        tipo: dadosNfe.tipo || 'revenda',
        numero_nfe: dadosNfe.numero_nfe,
        chave_nfe: dadosNfe.chave_nfe,
        data_emissao: dadosNfe.data_emissao,
        valor_total: dadosNfe.valor_total,
        status: 'pendente',
        observacoes: 'Importado automaticamente via OCR/IA',
        created_at: now, // 🕒 Garante data de criação local correta
        updated_at: now,
      })
      .select()
      .single();

    if (errorCompra) throw errorCompra;

    // Inserir itens + criar produtos + movimentar estoque
    if (dadosNfe.itens?.length > 0) {
      for (const [index, item] of dadosNfe.itens.entries()) {
        // Garantir produto
        let produtoId: string | null = null;
        const codigo = item.codigo || `NFE-${dadosNfe.numero_nfe || 'SEM'}-${index + 1}`;

        const { data: produtoExistente } = await supabaseClient
          .from('produtos')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('codigo_interno', codigo)
          .maybeSingle();

        if (produtoExistente?.id) {
          produtoId = produtoExistente.id;
        } else {
          const { data: novoProduto, error: errorProduto } = await supabaseClient
            .from('produtos')
            .insert({
              tenant_id: tenantId,
              codigo_interno: codigo,
              descricao: item.descricao || `Produto NF ${dadosNfe.numero_nfe}`,
              ncm: item.ncm,
              unidade_principal: item.unidade || 'UN',
              unidade_compra: item.unidade || 'UN',
              controla_estoque: true,
              ativo: true,
            })
            .select()
            .single();
          if (errorProduto) throw errorProduto;
          produtoId = novoProduto.id;
        }

        // Inserir item da compra
        const { error: errorItem } = await supabaseClient
          .from('compras_itens')
          .insert({
            compra_id: compra.id,
            produto_id: produtoId,
            codigo_produto: codigo,
            descricao: item.descricao,
            ncm: item.ncm,
            cfop: item.cfop,
            unidade: item.unidade,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
            aliquota_icms: item.aliquota_icms,
            aliquota_pis: item.aliquota_pis,
            aliquota_cofins: item.aliquota_cofins,
            valor_ipi: item.valor_ipi,
          });
        if (errorItem) throw errorItem;

        // Movimentação de estoque (entrada)
        await supabaseClient
          .from('estoque_movimentacoes')
          .insert({
            tenant_id: tenantId,
            produto_id: produtoId,
            tipo_movimentacao: 'entrada',
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
            documento_origem: `NF ${dadosNfe.numero_nfe}`,
            chave_nfe: dadosNfe.chave_nfe,
            origem_modulo: 'compras',
            referencia_id: compra.id,
            observacao: 'Movimentação automática via importação de NF-e',
          });
      }
    }

    // Inserir parcelas e gerar contas a pagar
    if (dadosNfe.parcelas?.length > 0) {
      const { error: errorParcelas } = await supabaseClient
        .from('compras_parcelas')
        .insert(
          dadosNfe.parcelas.map((parcela: any) => ({
            compra_id: compra.id,
            numero_parcela: parcela.numero,
            data_vencimento: parcela.vencimento,
            valor: parcela.valor,
          }))
        );

      if (errorParcelas) throw errorParcelas;

      // Obter ou criar conta financeira padrão do usuário
      let contaId: string | null = null;
      const { data: conta } = await supabaseClient
        .from('contas_financeiras')
        .select('id')
        .eq('user_id', userId)
        .eq('ativa', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (conta?.id) {
        contaId = conta.id;
      } else {
        const { data: novaConta, error: errorConta } = await supabaseClient
          .from('contas_financeiras')
          .insert({
            user_id: userId,
            empresa_id: empresaId,
            filial_id: filialId,
            nome: 'Caixa Principal',
            tipo: 'carteira',
            ativa: true,
            saldo_inicial: 0,
          })
          .select()
          .single();
        if (errorConta) throw errorConta;
        contaId = novaConta.id;
      }

      // Gerar títulos a pagar para cada parcela
      for (const [idx, parcela] of dadosNfe.parcelas.entries()) {
        const { error: errorTitulo } = await supabaseClient
          .from('transacoes_financeiras')
          .insert({
            user_id: userId,
            empresa_id: empresaId,
            filial_id: filialId,
            contato_id: fornecedorId,
            conta_financeira_id: contaId,
            tipo: 'pagar',
            valor_documento: parcela.valor,
            data_emissao: dadosNfe.data_emissao || new Date().toISOString().split('T')[0],
            data_vencimento: parcela.vencimento || new Date().toISOString().split('T')[0],
            numero_documento: `${dadosNfe.numero_nfe || 'NF'}-${parcela.numero || idx + 1}`,
            categoria: 'COMPRAS',
            historico: `Compra NF ${dadosNfe.numero_nfe} - Parcela ${parcela.numero || idx + 1}`,
            forma_pagamento: 'BOLETO',
            origem_tipo: 'compra',
            origem_id: compra.id,
            compra_id: compra.id,
          });
        if (errorTitulo) throw errorTitulo;
      }
    }

    // Log de auditoria
    await supabaseClient.from('security_audit_log').insert({
      event_type: 'nfe_imported',
      event_description: `NF-e ${dadosNfe.numero_nfe} importada via OCR/IA`,
      metadata: {
        compra_id: compra.id,
        chave_nfe: dadosNfe.chave_nfe,
        fornecedor_id: fornecedorId,
        valor_total: dadosNfe.valor_total,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        compra_id: compra.id,
        dados: dadosNfe,
        message: 'Nota fiscal importada com sucesso!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar NF-e:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processarXML(xmlText: string): Promise<any> {
  // Parser básico de XML de NF-e
  const chaveMatch = xmlText.match(/<chNFe>(\d+)<\/chNFe>/);
  const numeroMatch = xmlText.match(/<nNF>(\d+)<\/nNF>/);
  const dataMatch = xmlText.match(/<dhEmi>([\d\-T:+]+)<\/dhEmi>/);
  const valorMatch = xmlText.match(/<vNF>([\d.]+)<\/vNF>/);
  
  const cnpjMatch = xmlText.match(/<emit>[\s\S]*?<CNPJ>(\d+)<\/CNPJ>[\s\S]*?<\/emit>/);
  const nomeMatch = xmlText.match(/<emit>[\s\S]*?<xNome>([^<]+)<\/xNome>[\s\S]*?<\/emit>/);
  // Telefones podem estar em <enderEmit><fone> ou diretamente em <emit><fone>
  const foneEnderMatch = xmlText.match(/<enderEmit>[\s\S]*?<fone>(\d+)<\/fone>[\s\S]*?<\/enderEmit>/);
  const foneEmitMatch = xmlText.match(/<emit>[\s\S]*?<fone>(\d+)<\/fone>[\s\S]*?<\/emit>/);
  const fone = foneEnderMatch?.[1] || foneEmitMatch?.[1] || null;

  return {
    chave_nfe: chaveMatch?.[1] || null,
    numero_nfe: numeroMatch?.[1] || null,
    data_emissao: dataMatch?.[1]?.split('T')[0] || null,
    valor_total: parseFloat(valorMatch?.[1] || '0'),
    fornecedor: {
      cnpj: cnpjMatch?.[1] || null,
      nome: nomeMatch?.[1] || 'Fornecedor Desconhecido',
      celular: fone,
    },
    itens: extrairItensXML(xmlText),
    parcelas: extrairParcelasXML(xmlText),
    tipo: 'revenda',
  };
}

function extrairItensXML(xmlText: string): any[] {
  const itensRegex = /<det[\s\S]*?<\/det>/g;
  const itensMatch = xmlText.match(itensRegex) || [];
  
  return itensMatch.map((itemXml, index) => {
    const codigoMatch = itemXml.match(/<cProd>([^<]+)<\/cProd>/);
    const descMatch = itemXml.match(/<xProd>([^<]+)<\/xProd>/);
    const ncmMatch = itemXml.match(/<NCM>(\d+)<\/NCM>/);
    const cfopMatch = itemXml.match(/<CFOP>(\d+)<\/CFOP>/);
    const unidadeMatch = itemXml.match(/<uCom>([^<]+)<\/uCom>/);
    const qtdMatch = itemXml.match(/<qCom>([\d.]+)<\/qCom>/);
    const valorUnitMatch = itemXml.match(/<vUnCom>([\d.]+)<\/vUnCom>/);
    const valorTotalMatch = itemXml.match(/<vProd>([\d.]+)<\/vProd>/);

    return {
      codigo: codigoMatch?.[1] || `ITEM${index + 1}`,
      descricao: descMatch?.[1] || 'Produto sem descrição',
      ncm: ncmMatch?.[1] || null,
      cfop: cfopMatch?.[1] || null,
      unidade: unidadeMatch?.[1] || 'UN',
      quantidade: parseFloat(qtdMatch?.[1] || '1'),
      valor_unitario: parseFloat(valorUnitMatch?.[1] || '0'),
      valor_total: parseFloat(valorTotalMatch?.[1] || '0'),
      aliquota_icms: null,
      aliquota_pis: null,
      aliquota_cofins: null,
      valor_ipi: null,
    };
  });
}

function extrairParcelasXML(xmlText: string): any[] {
  const parcelasRegex = /<dup>[\s\S]*?<\/dup>/g;
  const parcelasMatch = xmlText.match(parcelasRegex) || [];
  
  return parcelasMatch.map((parcelaXml, index) => {
    const vencimentoMatch = parcelaXml.match(/<dVenc>([\d\-]+)<\/dVenc>/);
    const valorMatch = parcelaXml.match(/<vDup>([\d.]+)<\/vDup>/);

    return {
      numero: index + 1,
      vencimento: vencimentoMatch?.[1] || null,
      valor: parseFloat(valorMatch?.[1] || '0'),
    };
  });
}

async function processarComOCR(arrayBuffer: ArrayBuffer, fileName: string): Promise<any> {
  // Placeholder para integração com OCR (Tesseract, Google Vision, etc.)
  // Por enquanto, retorna estrutura básica
  console.log('Processamento OCR ainda não implementado para:', fileName);
  
  return {
    chave_nfe: null,
    numero_nfe: null,
    data_emissao: new Date().toISOString().split('T')[0],
    valor_total: 0,
    fornecedor: {
      cnpj: null,
      nome: 'Fornecedor a ser identificado',
    },
    itens: [],
    parcelas: [],
    tipo: 'consumo',
  };
}

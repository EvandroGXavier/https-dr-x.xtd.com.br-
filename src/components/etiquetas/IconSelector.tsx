import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Scale, Building2, Clock } from "lucide-react";

const WHATSAPP_EMOJIS = [
  // Especiais para Direito e Jurídico 
  { name: "⚖️", emoji: "⚖️", label: "Balança da Justiça" },
  { name: "🏛️", emoji: "🏛️", label: "Tribunal/Fórum" },
  { name: "👨‍⚖️", emoji: "👨‍⚖️", label: "Juiz" },
  { name: "👩‍⚖️", emoji: "👩‍⚖️", label: "Juíza" },
  { name: "📜", emoji: "📜", label: "Documento Legal" },
  { name: "📋", emoji: "📋", label: "Petição" },
  { name: "📑", emoji: "📑", label: "Contrato" },
  { name: "🔏", emoji: "🔏", label: "Documento Sigiloso" },
  { name: "📝", emoji: "📝", label: "Documento" },
  { name: "✍️", emoji: "✍️", label: "Assinatura" },
  { name: "🖊️", emoji: "🖊️", label: "Caneta" },
  { name: "📍", emoji: "📍", label: "Marco Legal" },
  { name: "🔍", emoji: "🔍", label: "Investigação" },
  { name: "🕵️", emoji: "🕵️", label: "Investigador" },
  { name: "🚔", emoji: "🚔", label: "Polícia" },
  { name: "🚨", emoji: "🚨", label: "Emergência Legal" },
  { name: "⚡", emoji: "⚡", label: "Urgente" },
  { name: "🛡️", emoji: "🛡️", label: "Proteção Legal" },
  { name: "🎯", emoji: "🎯", label: "Objetivo" },
  { name: "🏆", emoji: "🏆", label: "Vitória" },
  { name: "💼", emoji: "💼", label: "Advocacia" },
  { name: "📁", emoji: "📁", label: "Pasta de Processo" },
  { name: "📂", emoji: "📂", label: "Arquivo" },
  { name: "🗂️", emoji: "🗂️", label: "Organizador" },
  { name: "📊", emoji: "📊", label: "Relatório" },
  { name: "📈", emoji: "📈", label: "Crescimento" },
  { name: "🏷️", emoji: "🏷️", label: "Etiqueta" },
  { name: "🔖", emoji: "🔖", label: "Marcador" },
  { name: "📌", emoji: "📌", label: "Importante" },
  { name: "📎", emoji: "📎", label: "Anexo" },

  // Especiais para Empresas e Negócios
  { name: "🏢", emoji: "🏢", label: "Empresa" },
  { name: "🏪", emoji: "🏪", label: "Loja" },
  { name: "🏭", emoji: "🏭", label: "Indústria" },
  { name: "🏦", emoji: "🏦", label: "Banco" },
  { name: "💰", emoji: "💰", label: "Dinheiro" },
  { name: "💸", emoji: "💸", label: "Pagamento" },
  { name: "💳", emoji: "💳", label: "Cartão" },
  { name: "🧾", emoji: "🧾", label: "Recibo" },
  { name: "📊", emoji: "📊", label: "Gráfico" },
  { name: "📈", emoji: "📈", label: "Lucro" },
  { name: "📉", emoji: "📉", label: "Perda" },
  { name: "💹", emoji: "💹", label: "Investimento" },
  { name: "🎢", emoji: "🎢", label: "Volatilidade" },
  { name: "🤝", emoji: "🤝", label: "Parceria" },
  { name: "🤵", emoji: "🤵", label: "Executivo" },
  { name: "👔", emoji: "👔", label: "Formal" },
  { name: "🎯", emoji: "🎯", label: "Meta" },
  { name: "🚀", emoji: "🚀", label: "Crescimento" },
  { name: "💡", emoji: "💡", label: "Ideia" },
  { name: "⚙️", emoji: "⚙️", label: "Processo" },
  { name: "🔧", emoji: "🔧", label: "Ferramentas" },
  { name: "📋", emoji: "📋", label: "Checklist" },
  { name: "📅", emoji: "📅", label: "Agenda" },
  { name: "📆", emoji: "📆", label: "Calendário" },
  { name: "🗓️", emoji: "🗓️", label: "Planejamento" },
  { name: "⏰", emoji: "⏰", label: "Prazo" },
  { name: "📱", emoji: "📱", label: "Digital" },
  { name: "💻", emoji: "💻", label: "Tecnologia" },
  { name: "🖥️", emoji: "🖥️", label: "Sistema" },
  { name: "⌨️", emoji: "⌨️", label: "Produtividade" },
  { name: "🖱️", emoji: "🖱️", label: "Interface" },

  // Especiais para Tempo e Prazos
  { name: "⏰", emoji: "⏰", label: "Prazo" },
  { name: "⏱️", emoji: "⏱️", label: "Cronômetro" },
  { name: "⏲️", emoji: "⏲️", label: "Timer" },
  { name: "🕐", emoji: "🕐", label: "1 Hora" },
  { name: "🕑", emoji: "🕑", label: "2 Horas" },
  { name: "🕒", emoji: "🕒", label: "3 Horas" },
  { name: "🕓", emoji: "🕓", label: "4 Horas" },
  { name: "🕔", emoji: "🕔", label: "5 Horas" },
  { name: "🕕", emoji: "🕕", label: "6 Horas" },
  { name: "🕖", emoji: "🕖", label: "7 Horas" },
  { name: "🕗", emoji: "🕗", label: "8 Horas" },
  { name: "🕘", emoji: "🕘", label: "9 Horas" },
  { name: "🕙", emoji: "🕙", label: "10 Horas" },
  { name: "🕚", emoji: "🕚", label: "11 Horas" },
  { name: "🕛", emoji: "🕛", label: "12 Horas" },
  { name: "📅", emoji: "📅", label: "Data" },
  { name: "📆", emoji: "📆", label: "Calendário" },
  { name: "🗓️", emoji: "🗓️", label: "Agenda" },
  { name: "⌛", emoji: "⌛", label: "Ampulheta" },
  { name: "⏳", emoji: "⏳", label: "Tempo Correndo" },
  { name: "🔔", emoji: "🔔", label: "Lembrete" },
  { name: "🔕", emoji: "🔕", label: "Silencioso" },
  { name: "📢", emoji: "📢", label: "Urgente" },
  { name: "⚠️", emoji: "⚠️", label: "Atenção" },
  { name: "🚨", emoji: "🚨", label: "Alerta" },
  { name: "⏫", emoji: "⏫", label: "Prioritário" },
  { name: "🔴", emoji: "🔴", label: "Atrasado" },
  { name: "🟡", emoji: "🟡", label: "Próximo Vencimento" },
  { name: "🟢", emoji: "🟢", label: "No Prazo" },

  // Expressões e Emoções Básicas
  { name: "😀", emoji: "😀", label: "Feliz" },
  { name: "😃", emoji: "😃", label: "Sorrindo" },
  { name: "😄", emoji: "😄", label: "Alegre" },
  { name: "😁", emoji: "😁", label: "Radiante" },
  { name: "😅", emoji: "😅", label: "Rindo Suando" },
  { name: "😂", emoji: "😂", label: "Chorando de Rir" },
  { name: "🤣", emoji: "🤣", label: "Gargalhada" },
  { name: "😊", emoji: "😊", label: "Feliz Corado" },
  { name: "😇", emoji: "😇", label: "Anjo" },
  { name: "🙂", emoji: "🙂", label: "Levemente Sorrindo" },
  { name: "🙃", emoji: "🙃", label: "De Cabeça para Baixo" },
  { name: "😉", emoji: "😉", label: "Piscadinha" },
  { name: "😌", emoji: "😌", label: "Aliviado" },
  { name: "😍", emoji: "😍", label: "Apaixonado" },
  { name: "🥰", emoji: "🥰", label: "Rosto Sorridente com Corações" },
  { name: "😘", emoji: "😘", label: "Beijinho" },
  { name: "😗", emoji: "😗", label: "Beijando" },
  { name: "😙", emoji: "😙", label: "Beijando com Olhos Sorridentes" },
  { name: "😚", emoji: "😚", label: "Beijando com Olhos Fechados" },
  { name: "😋", emoji: "😋", label: "Gostoso" },
  { name: "😛", emoji: "😛", label: "Língua de Fora" },
  { name: "😝", emoji: "😝", label: "Língua de Fora com Olhos Fechados" },
  { name: "😜", emoji: "😜", label: "Língua de Fora Piscando" },
  { name: "🤪", emoji: "🤪", label: "Maluco" },
  { name: "🤨", emoji: "🤨", label: "Sobrancelha Levantada" },
  { name: "🧐", emoji: "🧐", label: "Monóculo" },
  { name: "🤓", emoji: "🤓", label: "Nerd" },
  { name: "😎", emoji: "😎", label: "Óculos Escuros" },
  { name: "🤩", emoji: "🤩", label: "Estrelas nos Olhos" },
  { name: "🥳", emoji: "🥳", label: "Festa" },
  { name: "😏", emoji: "😏", label: "Malicioso" },
  { name: "😒", emoji: "😒", label: "Desanimado" },
  { name: "😞", emoji: "😞", label: "Decepcionado" },
  { name: "😔", emoji: "😔", label: "Pensativo" },
  { name: "😟", emoji: "😟", label: "Preocupado" },
  { name: "😕", emoji: "😕", label: "Confuso" },
  { name: "🙁", emoji: "🙁", label: "Levemente Triste" },
  { name: "☹️", emoji: "☹️", label: "Triste" },
  { name: "😣", emoji: "😣", label: "Perseverante" },
  { name: "😖", emoji: "😖", label: "Confundido" },
  { name: "😫", emoji: "😫", label: "Cansado" },
  { name: "😩", emoji: "😩", label: "Fatigado" },
  { name: "🥺", emoji: "🥺", label: "Olhos Suplicantes" },
  { name: "😢", emoji: "😢", label: "Chorando" },
  { name: "😭", emoji: "😭", label: "Chorando Alto" },
  { name: "😤", emoji: "😤", label: "Bufando" },
  { name: "😠", emoji: "😠", label: "Raiva" },
  { name: "😡", emoji: "😡", label: "Furioso" },
  { name: "🤬", emoji: "🤬", label: "Palavrão" },
  { name: "🤯", emoji: "🤯", label: "Mente Explodindo" },
  { name: "😳", emoji: "😳", label: "Corado" },
  { name: "🥵", emoji: "🥵", label: "Calor" },
  { name: "🥶", emoji: "🥶", label: "Frio" },
  { name: "😱", emoji: "😱", label: "Gritando de Medo" },
  { name: "😨", emoji: "😨", label: "Com Medo" },
  { name: "😰", emoji: "😰", label: "Ansioso com Suor" },
  { name: "😥", emoji: "😥", label: "Triste mas Aliviado" },
  { name: "😓", emoji: "😓", label: "Suando" },
  { name: "🤗", emoji: "🤗", label: "Abraço" },
  { name: "🤔", emoji: "🤔", label: "Pensando" },
  { name: "🤭", emoji: "🤭", label: "Mão na Boca" },
  { name: "🤫", emoji: "🤫", label: "Silêncio" },
  { name: "🤥", emoji: "🤥", label: "Mentiroso" },
  { name: "😶", emoji: "😶", label: "Sem Boca" },
  { name: "😐", emoji: "😐", label: "Neutro" },
  { name: "😑", emoji: "😑", label: "Sem Expressão" },
  { name: "😬", emoji: "😬", label: "Careta" },
  { name: "🙄", emoji: "🙄", label: "Revirando os Olhos" },
  { name: "😯", emoji: "😯", label: "Surpreso" },
  { name: "😦", emoji: "😦", label: "Franzindo" },
  { name: "😧", emoji: "😧", label: "Angustiado" },
  { name: "😮", emoji: "😮", label: "Boca Aberta" },
  { name: "😲", emoji: "😲", label: "Atônito" },
  { name: "🥱", emoji: "🥱", label: "Bocejando" },
  { name: "😴", emoji: "😴", label: "Dormindo" },
  { name: "🤤", emoji: "🤤", label: "Babando" },
  { name: "😪", emoji: "😪", label: "Sonolento" },
  { name: "😵", emoji: "😵", label: "Tonto" },
  { name: "🤐", emoji: "🤐", label: "Boca Fechada" },
  { name: "🥴", emoji: "🥴", label: "Woozy" },
  { name: "🤢", emoji: "🤢", label: "Enjoado" },
  { name: "🤮", emoji: "🤮", label: "Vomitando" },
  { name: "🤧", emoji: "🤧", label: "Espirrando" },
  { name: "😷", emoji: "😷", label: "Máscara Médica" },
  { name: "🤒", emoji: "🤒", label: "Termômetro" },
  { name: "🤕", emoji: "🤕", label: "Bandagem na Cabeça" },
  { name: "🤑", emoji: "🤑", label: "Dinheiro na Boca" },
  { name: "🤠", emoji: "🤠", label: "Cowboy" },

  // Gestos e Mãos
  { name: "👏", emoji: "👏", label: "Palmas" },
  { name: "🙌", emoji: "🙌", label: "Mãos Levantadas" },
  { name: "👍", emoji: "👍", label: "Joia" },
  { name: "👎", emoji: "👎", label: "Polegar para Baixo" },
  { name: "👌", emoji: "👌", label: "OK" },
  { name: "✌️", emoji: "✌️", label: "Vitória" },
  { name: "🤞", emoji: "🤞", label: "Dedos Cruzados" },
  { name: "🤟", emoji: "🤟", label: "Te Amo" },
  { name: "🤘", emoji: "🤘", label: "Rock" },
  { name: "🤙", emoji: "🤙", label: "Me Liga" },
  { name: "💪", emoji: "💪", label: "Músculo" },
  { name: "🦾", emoji: "🦾", label: "Braço Mecânico" },
  { name: "🖕", emoji: "🖕", label: "Dedo do Meio" },
  { name: "☝️", emoji: "☝️", label: "Apontando para Cima" },
  { name: "👆", emoji: "👆", label: "Apontando para Cima com Dorso" },
  { name: "🖐️", emoji: "🖐️", label: "Mão Levantada" },
  { name: "✋", emoji: "✋", label: "Mão Levantada" },
  { name: "👋", emoji: "👋", label: "Tchau" },
  { name: "🤚", emoji: "🤚", label: "Dorso da Mão Levantada" },
  { name: "🙏", emoji: "🙏", label: "Mãos em Oração" },
  { name: "🤝", emoji: "🤝", label: "Aperto de Mão" },
  { name: "✍️", emoji: "✍️", label: "Escrevendo" },
  { name: "💅", emoji: "💅", label: "Esmalte de Unha" },
  { name: "🤳", emoji: "🤳", label: "Selfie" },

  // Corações e Amor
  { name: "❤️", emoji: "❤️", label: "Coração Vermelho" },
  { name: "🧡", emoji: "🧡", label: "Coração Laranja" },
  { name: "💛", emoji: "💛", label: "Coração Amarelo" },
  { name: "💚", emoji: "💚", label: "Coração Verde" },
  { name: "💙", emoji: "💙", label: "Coração Azul" },
  { name: "💜", emoji: "💜", label: "Coração Roxo" },
  { name: "🖤", emoji: "🖤", label: "Coração Preto" },
  { name: "🤍", emoji: "🤍", label: "Coração Branco" },
  { name: "🤎", emoji: "🤎", label: "Coração Marrom" },
  { name: "💔", emoji: "💔", label: "Coração Partido" },
  { name: "❣️", emoji: "❣️", label: "Exclamação de Coração" },
  { name: "💕", emoji: "💕", label: "Dois Corações" },
  { name: "💞", emoji: "💞", label: "Corações Girando" },
  { name: "💓", emoji: "💓", label: "Coração Batendo" },
  { name: "💗", emoji: "💗", label: "Coração Crescendo" },
  { name: "💖", emoji: "💖", label: "Coração Brilhante" },
  { name: "💘", emoji: "💘", label: "Coração com Flecha" },
  { name: "💝", emoji: "💝", label: "Coração com Fita" },
  { name: "💟", emoji: "💟", label: "Decoração de Coração" },

  // Símbolos Religiosos e Espirituais
  { name: "☮️", emoji: "☮️", label: "Símbolo da Paz" },
  { name: "✝️", emoji: "✝️", label: "Cruz Latina" },
  { name: "☪️", emoji: "☪️", label: "Estrela e Crescente" },
  { name: "🕉️", emoji: "🕉️", label: "Om" },
  { name: "☸️", emoji: "☸️", label: "Roda do Dharma" },
  { name: "✡️", emoji: "✡️", label: "Estrela de Davi" },
  { name: "🔯", emoji: "🔯", label: "Estrela de Seis Pontas" },
  { name: "🕎", emoji: "🕎", label: "Menorá" },
  { name: "☯️", emoji: "☯️", label: "Yin Yang" },
  { name: "☦️", emoji: "☦️", label: "Cruz Ortodoxa" },
  { name: "🛐", emoji: "🛐", label: "Local de Adoração" },

  // Signos do Zodíaco
  { name: "⛎", emoji: "⛎", label: "Ofiúco" },
  { name: "♈", emoji: "♈", label: "Áries" },
  { name: "♉", emoji: "♉", label: "Touro" },
  { name: "♊", emoji: "♊", label: "Gêmeos" },
  { name: "♋", emoji: "♋", label: "Câncer" },
  { name: "♌", emoji: "♌", label: "Leão" },
  { name: "♍", emoji: "♍", label: "Virgem" },
  { name: "♎", emoji: "♎", label: "Libra" },
  { name: "♏", emoji: "♏", label: "Escorpião" },
  { name: "♐", emoji: "♐", label: "Sagitário" },
  { name: "♑", emoji: "♑", label: "Capricórnio" },
  { name: "♒", emoji: "♒", label: "Aquário" },
  { name: "♓", emoji: "♓", label: "Peixes" },

  // Símbolos e Identificadores
  { name: "🆔", emoji: "🆔", label: "ID" },
  { name: "⚡", emoji: "⚡", label: "Raio" },
  { name: "🔥", emoji: "🔥", label: "Fogo" },
  { name: "💯", emoji: "💯", label: "100" },
  { name: "💢", emoji: "💢", label: "Símbolo de Raiva" },
  { name: "💥", emoji: "💥", label: "Colisão" },
  { name: "💫", emoji: "💫", label: "Tonto" },
  { name: "💦", emoji: "💦", label: "Gotas de Suor" },
  { name: "💨", emoji: "💨", label: "Correndo" },
  { name: "🕳️", emoji: "🕳️", label: "Buraco" },
  { name: "💬", emoji: "💬", label: "Balão de Fala" },
  { name: "👁️‍🗨️", emoji: "👁️‍🗨️", label: "Olho no Balão de Fala" },
  { name: "🗨️", emoji: "🗨️", label: "Balão de Fala à Esquerda" },
  { name: "🗯️", emoji: "🗯️", label: "Balão de Raiva à Direita" },
  { name: "💭", emoji: "💭", label: "Balão de Pensamento" },
  { name: "💤", emoji: "💤", label: "Zzz" },

  // Lugares e Edifícios
  { name: "🏠", emoji: "🏠", label: "Casa" },
  { name: "🏡", emoji: "🏡", label: "Casa com Jardim" },
  { name: "🏢", emoji: "🏢", label: "Prédio de Escritórios" },
  { name: "🏣", emoji: "🏣", label: "Posto Japonês" },
  { name: "🏤", emoji: "🏤", label: "Posto Europeu" },
  { name: "🏥", emoji: "🏥", label: "Hospital" },
  { name: "🏦", emoji: "🏦", label: "Banco" },
  { name: "🏧", emoji: "🏧", label: "Caixa Eletrônico" },
  { name: "🏨", emoji: "🏨", label: "Hotel" },
  { name: "🏩", emoji: "🏩", label: "Hotel do Amor" },
  { name: "🏪", emoji: "🏪", label: "Loja de Conveniência" },
  { name: "🏫", emoji: "🏫", label: "Escola" },
  { name: "🏬", emoji: "🏬", label: "Loja de Departamento" },
  { name: "🏭", emoji: "🏭", label: "Fábrica" },
  { name: "🏮", emoji: "🏮", label: "Lanterna Vermelha" },
  { name: "🏯", emoji: "🏯", label: "Castelo Japonês" },
  { name: "🏰", emoji: "🏰", label: "Castelo" },
  { name: "🗼", emoji: "🗼", label: "Torre de Tóquio" },
  { name: "🗽", emoji: "🗽", label: "Estátua da Liberdade" },
  { name: "⛪", emoji: "⛪", label: "Igreja" },
  { name: "🕌", emoji: "🕌", label: "Mesquita" },
  { name: "🛕", emoji: "🛕", label: "Templo Hindu" },
  { name: "🕍", emoji: "🕍", label: "Sinagoga" },
  { name: "⛩️", emoji: "⛩️", label: "Santuário Xintoísta" },
  { name: "🕋", emoji: "🕋", label: "Kaaba" },
  { name: "⛲", emoji: "⛲", label: "Fonte" },
  { name: "⛺", emoji: "⛺", label: "Barraca" },
  { name: "🌁", emoji: "🌁", label: "Nebuloso" },
  { name: "🌃", emoji: "🌃", label: "Noite com Estrelas" },
  { name: "🏙️", emoji: "🏙️", label: "Paisagem Urbana" },
  { name: "🌄", emoji: "🌄", label: "Nascer do Sol sobre Montanhas" },
  { name: "🌅", emoji: "🌅", label: "Nascer do Sol" },
  { name: "🌆", emoji: "🌆", label: "Paisagem Urbana ao Crepúsculo" },
  { name: "🌇", emoji: "🌇", label: "Pôr do Sol" },
  { name: "🌉", emoji: "🌉", label: "Ponte à Noite" },

  // Entretenimento e Diversão
  { name: "🎡", emoji: "🎡", label: "Roda Gigante" },
  { name: "🎢", emoji: "🎢", label: "Montanha Russa" },
  { name: "🎠", emoji: "🎠", label: "Carrossel" },
  { name: "🎪", emoji: "🎪", label: "Circo" },
  { name: "🎭", emoji: "🎭", label: "Teatro" },
  { name: "🎨", emoji: "🎨", label: "Arte" },
  { name: "🎬", emoji: "🎬", label: "Cinema" },
  { name: "🎤", emoji: "🎤", label: "Microfone" },
  { name: "🎧", emoji: "🎧", label: "Fones de Ouvido" },
  { name: "🎼", emoji: "🎼", label: "Partitura" },
  { name: "🎵", emoji: "🎵", label: "Nota Musical" },
  { name: "🎶", emoji: "🎶", label: "Notas Musicais" },
  { name: "🎹", emoji: "🎹", label: "Piano" },
  { name: "🥁", emoji: "🥁", label: "Bateria" },
  { name: "🎷", emoji: "🎷", label: "Saxofone" },
  { name: "🎺", emoji: "🎺", label: "Trompete" },
  { name: "🎸", emoji: "🎸", label: "Guitarra" },
  { name: "🎻", emoji: "🎻", label: "Violino" },
  { name: "🎯", emoji: "🎯", label: "Alvo" },
  { name: "🎲", emoji: "🎲", label: "Dado" },
  { name: "🎰", emoji: "🎰", label: "Caça-níquel" },
  { name: "🎮", emoji: "🎮", label: "Videogame" },
  { name: "🕹️", emoji: "🕹️", label: "Joystick" },

  // Transportes
  { name: "🚗", emoji: "🚗", label: "Carro" },
  { name: "🚕", emoji: "🚕", label: "Táxi" },
  { name: "🚙", emoji: "🚙", label: "SUV" },
  { name: "🚌", emoji: "🚌", label: "Ônibus" },
  { name: "🚎", emoji: "🚎", label: "Trólei" },
  { name: "🏎️", emoji: "🏎️", label: "Carro de Corrida" },
  { name: "🚓", emoji: "🚓", label: "Carro de Polícia" },
  { name: "🚑", emoji: "🚑", label: "Ambulância" },
  { name: "🚒", emoji: "🚒", label: "Caminhão de Bombeiros" },
  { name: "🚐", emoji: "🚐", label: "Minibus" },
  { name: "🚚", emoji: "🚚", label: "Caminhão de Entrega" },
  { name: "🚛", emoji: "🚛", label: "Caminhão Articulado" },
  { name: "🚜", emoji: "🚜", label: "Trator" },
  { name: "🏍️", emoji: "🏍️", label: "Motocicleta" },
  { name: "🛴", emoji: "🛴", label: "Patinete" },
  { name: "🚲", emoji: "🚲", label: "Bicicleta" },
  { name: "🛵", emoji: "🛵", label: "Scooter" },
  { name: "🚁", emoji: "🚁", label: "Helicóptero" },
  { name: "🚟", emoji: "🚟", label: "Monotrilho" },
  { name: "🚠", emoji: "🚠", label: "Teleférico de Montanha" },
  { name: "🚡", emoji: "🚡", label: "Bondinho Aéreo" },
  { name: "🛰️", emoji: "🛰️", label: "Satélite" },
  { name: "🚀", emoji: "🚀", label: "Foguete" },
  { name: "🛸", emoji: "🛸", label: "Disco Voador" },

  // Transportes Aquáticos
  { name: "⛵", emoji: "⛵", label: "Barco à Vela" },
  { name: "🚤", emoji: "🚤", label: "Lancha" },
  { name: "🛥️", emoji: "🛥️", label: "Barco a Motor" },
  { name: "🛳️", emoji: "🛳️", label: "Navio de Passageiros" },
  { name: "⛴️", emoji: "⛴️", label: "Balsa" },
  { name: "🚢", emoji: "🚢", label: "Navio" },
  { name: "⚓", emoji: "⚓", label: "Âncora" },

  // Infraestrutura e Sinais
  { name: "⛽", emoji: "⛽", label: "Posto de Gasolina" },
  { name: "🚧", emoji: "🚧", label: "Construção" },
  { name: "🚨", emoji: "🚨", label: "Sirene de Polícia" },
  { name: "🚥", emoji: "🚥", label: "Semáforo Horizontal" },
  { name: "🚦", emoji: "🚦", label: "Semáforo Vertical" },
  { name: "🛑", emoji: "🛑", label: "Placa de Pare" },
  { name: "🚏", emoji: "🚏", label: "Ponto de Ônibus" },

  // Animais e Natureza
  { name: "🐶", emoji: "🐶", label: "Cachorro" },
  { name: "🐱", emoji: "🐱", label: "Gato" },
  { name: "🐭", emoji: "🐭", label: "Rato" },
  { name: "🐹", emoji: "🐹", label: "Hamster" },
  { name: "🐰", emoji: "🐰", label: "Coelho" },
  { name: "🦊", emoji: "🦊", label: "Raposa" },
  { name: "🐻", emoji: "🐻", label: "Urso" },
  { name: "🐼", emoji: "🐼", label: "Panda" },
  { name: "🐨", emoji: "🐨", label: "Coala" },
  { name: "🐯", emoji: "🐯", label: "Tigre" },
  { name: "🦁", emoji: "🦁", label: "Leão" },
  { name: "🐮", emoji: "🐮", label: "Vaca" },
  { name: "🐷", emoji: "🐷", label: "Porco" },
  { name: "🐽", emoji: "🐽", label: "Focinho de Porco" },
  { name: "🐸", emoji: "🐸", label: "Sapo" },
  { name: "🐵", emoji: "🐵", label: "Macaco" },
  { name: "🙈", emoji: "🙈", label: "Macaco Não Vê" },
  { name: "🙉", emoji: "🙉", label: "Macaco Não Ouve" },
  { name: "🙊", emoji: "🙊", label: "Macaco Não Fala" },
  { name: "🐒", emoji: "🐒", label: "Macaco" },
  { name: "🐔", emoji: "🐔", label: "Galinha" },
  { name: "🐧", emoji: "🐧", label: "Pinguim" },
  { name: "🐦", emoji: "🐦", label: "Pássaro" },
  { name: "🐤", emoji: "🐤", label: "Pintinho" },
  { name: "🐣", emoji: "🐣", label: "Pintinho Nascendo" },
  { name: "🐥", emoji: "🐥", label: "Pintinho de Frente" },
  { name: "🦆", emoji: "🦆", label: "Pato" },
  { name: "🦅", emoji: "🦅", label: "Águia" },
  { name: "🦉", emoji: "🦉", label: "Coruja" },
  { name: "🦇", emoji: "🦇", label: "Morcego" },
  { name: "🐺", emoji: "🐺", label: "Lobo" },
  { name: "🐗", emoji: "🐗", label: "Javali" },
  { name: "🐴", emoji: "🐴", label: "Cavalo" },
  { name: "🦄", emoji: "🦄", label: "Unicórnio" },
  { name: "🐝", emoji: "🐝", label: "Abelha" },
  { name: "🐛", emoji: "🐛", label: "Lagarta" },
  { name: "🦋", emoji: "🦋", label: "Borboleta" },
  { name: "🐌", emoji: "🐌", label: "Caracol" },
  { name: "🐞", emoji: "🐞", label: "Joaninha" },
  { name: "🐜", emoji: "🐜", label: "Formiga" },
  { name: "🦟", emoji: "🦟", label: "Mosquito" },
  { name: "🦗", emoji: "🦗", label: "Grilo" },
  { name: "🕷️", emoji: "🕷️", label: "Aranha" },
  { name: "🕸️", emoji: "🕸️", label: "Teia de Aranha" },
  { name: "🦂", emoji: "🦂", label: "Escorpião" },

  // Plantas e Flores
  { name: "🌸", emoji: "🌸", label: "Flor de Cerejeira" },
  { name: "💐", emoji: "💐", label: "Buquê" },
  { name: "🌷", emoji: "🌷", label: "Tulipa" },
  { name: "🌹", emoji: "🌹", label: "Rosa" },
  { name: "🥀", emoji: "🥀", label: "Rosa Murcha" },
  { name: "🌺", emoji: "🌺", label: "Hibisco" },
  { name: "🌻", emoji: "🌻", label: "Girassol" },
  { name: "🌼", emoji: "🌼", label: "Margarida" },
  { name: "🌱", emoji: "🌱", label: "Broto" },
  { name: "🌿", emoji: "🌿", label: "Erva" },
  { name: "☘️", emoji: "☘️", label: "Trevo" },
  { name: "🍀", emoji: "🍀", label: "Trevo de Quatro Folhas" },
  { name: "🍃", emoji: "🍃", label: "Folhas ao Vento" },
  { name: "🌳", emoji: "🌳", label: "Árvore Frondosa" },
  { name: "🌲", emoji: "🌲", label: "Árvore Perene" },
  { name: "🌴", emoji: "🌴", label: "Palmeira" },
  { name: "🌵", emoji: "🌵", label: "Cacto" },

  // Comidas e Bebidas
  { name: "🍎", emoji: "🍎", label: "Maçã Vermelha" },
  { name: "🍏", emoji: "🍏", label: "Maçã Verde" },
  { name: "🍊", emoji: "🍊", label: "Laranja" },
  { name: "🍋", emoji: "🍋", label: "Limão" },
  { name: "🍌", emoji: "🍌", label: "Banana" },
  { name: "🍉", emoji: "🍉", label: "Melancia" },
  { name: "🍇", emoji: "🍇", label: "Uvas" },
  { name: "🍓", emoji: "🍓", label: "Morango" },
  { name: "🍈", emoji: "🍈", label: "Melão" },
  { name: "🍑", emoji: "🍑", label: "Pêssego" },
  { name: "🍒", emoji: "🍒", label: "Cerejas" },
  { name: "🥭", emoji: "🥭", label: "Manga" },
  { name: "🍍", emoji: "🍍", label: "Abacaxi" },
  { name: "🥥", emoji: "🥥", label: "Coco" },
  { name: "🥝", emoji: "🥝", label: "Kiwi" },
  { name: "🍅", emoji: "🍅", label: "Tomate" },
  { name: "🍆", emoji: "🍆", label: "Berinjela" },
  { name: "🥑", emoji: "🥑", label: "Abacate" },
  { name: "🥦", emoji: "🥦", label: "Brócolis" },
  { name: "🥬", emoji: "🥬", label: "Folhas Verdes" },
  { name: "🥒", emoji: "🥒", label: "Pepino" },
  { name: "🌶️", emoji: "🌶️", label: "Pimenta" },
  { name: "🌽", emoji: "🌽", label: "Milho" },
  { name: "🥕", emoji: "🥕", label: "Cenoura" },
  { name: "🧄", emoji: "🧄", label: "Alho" },
  { name: "🧅", emoji: "🧅", label: "Cebola" },
  { name: "🥔", emoji: "🥔", label: "Batata" },
  { name: "🍠", emoji: "🍠", label: "Batata Doce" },

  // Objetos e Ferramentas
  { name: "💼", emoji: "💼", label: "Maleta" },
  { name: "📱", emoji: "📱", label: "Celular" },
  { name: "💻", emoji: "💻", label: "Laptop" },
  { name: "🖥️", emoji: "🖥️", label: "Desktop" },
  { name: "⌨️", emoji: "⌨️", label: "Teclado" },
  { name: "🖱️", emoji: "🖱️", label: "Mouse" },
  { name: "🖨️", emoji: "🖨️", label: "Impressora" },
  { name: "📺", emoji: "📺", label: "TV" },
  { name: "📷", emoji: "📷", label: "Câmera" },
  { name: "📹", emoji: "📹", label: "Filmadora" },
  { name: "📞", emoji: "📞", label: "Telefone" },
  { name: "☎️", emoji: "☎️", label: "Telefone Antigo" },
  { name: "📠", emoji: "📠", label: "Fax" },
  { name: "📧", emoji: "📧", label: "E-mail" },
  { name: "📨", emoji: "📨", label: "Envelope Chegando" },
  { name: "📩", emoji: "📩", label: "Envelope com Seta" },
  { name: "📮", emoji: "📮", label: "Caixa de Correio" },
  { name: "🗳️", emoji: "🗳️", label: "Urna" },
  { name: "✏️", emoji: "✏️", label: "Lápis" },
  { name: "✒️", emoji: "✒️", label: "Caneta Tinteiro" },
  { name: "🖋️", emoji: "🖋️", label: "Caneta de Pena" },
  { name: "🖊️", emoji: "🖊️", label: "Caneta" },
  { name: "🖌️", emoji: "🖌️", label: "Pincel" },
  { name: "🗂️", emoji: "🗂️", label: "Divisórias de Arquivo" },
  { name: "📅", emoji: "📅", label: "Calendário" },
  { name: "📆", emoji: "📆", label: "Calendário Destacável" },
  { name: "🗑️", emoji: "🗑️", label: "Lixeira" },
  { name: "🔗", emoji: "🔗", label: "Link" },
  { name: "📎", emoji: "📎", label: "Clipe" },
  { name: "🖇️", emoji: "🖇️", label: "Clipes Ligados" },
  { name: "📐", emoji: "📐", label: "Esquadro" },
  { name: "📏", emoji: "📏", label: "Régua" },
  { name: "📌", emoji: "📌", label: "Alfinete" },
  { name: "📍", emoji: "📍", label: "Alfinete Redondo" },
  { name: "✂️", emoji: "✂️", label: "Tesoura" },
  { name: "🗃️", emoji: "🗃️", label: "Arquivo" },
  { name: "🗄️", emoji: "🗄️", label: "Arquivo de Escritório" },
  { name: "🗑️", emoji: "🗑️", label: "Lixeira" },
  { name: "🔒", emoji: "🔒", label: "Fechado" },
  { name: "🔓", emoji: "🔓", label: "Aberto" },
  { name: "🔏", emoji: "🔏", label: "Fechado com Caneta" },
  { name: "🔐", emoji: "🔐", label: "Fechado com Chave" },
  { name: "🔑", emoji: "🔑", label: "Chave" },
  { name: "🗝️", emoji: "🗝️", label: "Chave Antiga" },
  { name: "🔨", emoji: "🔨", label: "Martelo" },
  { name: "🪓", emoji: "🪓", label: "Machado" },
  { name: "⛏️", emoji: "⛏️", label: "Picareta" },
  { name: "⚒️", emoji: "⚒️", label: "Martelo e Picareta" },
  { name: "🛠️", emoji: "🛠️", label: "Martelo e Chave" },
  { name: "🗡️", emoji: "🗡️", label: "Espada" },
  { name: "⚔️", emoji: "⚔️", label: "Espadas Cruzadas" },
  { name: "🔫", emoji: "🔫", label: "Pistola" },
  { name: "🏹", emoji: "🏹", label: "Arco e Flecha" },
  { name: "🛡️", emoji: "🛡️", label: "Escudo" },
  { name: "🔧", emoji: "🔧", label: "Chave Inglesa" },
  { name: "🔩", emoji: "🔩", label: "Porca e Parafuso" },
  { name: "⚙️", emoji: "⚙️", label: "Engrenagem" },
  { name: "🗜️", emoji: "🗜️", label: "Morsa" },
  { name: "⚖️", emoji: "⚖️", label: "Balança" },
  { name: "🦯", emoji: "🦯", label: "Bengala Branca" },
  { name: "🔗", emoji: "🔗", label: "Elo" },
  { name: "⛓️", emoji: "⛓️", label: "Correntes" },
  { name: "🧰", emoji: "🧰", label: "Caixa de Ferramentas" },
  { name: "🧲", emoji: "🧲", label: "Ímã" },

  // Status e Indicadores
  { name: "✅", emoji: "✅", label: "Correto" },
  { name: "❌", emoji: "❌", label: "Erro" },
  { name: "❎", emoji: "❎", label: "X Quadrado" },
  { name: "✔️", emoji: "✔️", label: "Check" },
  { name: "☑️", emoji: "☑️", label: "Check Quadrado" },
  { name: "❓", emoji: "❓", label: "Pergunta" },
  { name: "❔", emoji: "❔", label: "Pergunta Branca" },
  { name: "❕", emoji: "❕", label: "Exclamação Branca" },
  { name: "❗", emoji: "❗", label: "Exclamação" },
  { name: "〰️", emoji: "〰️", label: "Onda" },
  { name: "💱", emoji: "💱", label: "Câmbio" },
  { name: "💲", emoji: "💲", label: "Cifrão" },
  { name: "⚠️", emoji: "⚠️", label: "Aviso" },
  { name: "🚸", emoji: "🚸", label: "Crianças Atravessando" },
  { name: "🔱", emoji: "🔱", label: "Tridente" },
  { name: "📴", emoji: "📴", label: "Celular Desligado" },
  { name: "📳", emoji: "📳", label: "Modo Vibração" },
  { name: "🈶", emoji: "🈶", label: "Taxa Japonesa" },
  { name: "🈚", emoji: "🈚", label: "Grátis Japonês" },
  { name: "🈸", emoji: "🈸", label: "Aplicação Japonesa" },
  { name: "🈺", emoji: "🈺", label: "Aberto Japonês" },
  { name: "🈷️", emoji: "🈷️", label: "Quantia Mensal Japonesa" },
  { name: "✴️", emoji: "✴️", label: "Estrela de Oito Pontas" },
  { name: "🆚", emoji: "🆚", label: "VS" },
  { name: "💮", emoji: "💮", label: "Flor Branca" },
  { name: "🉐", emoji: "🉐", label: "Barganha Japonesa" },
  { name: "㊙️", emoji: "㊙️", label: "Segredo Japonês" },
  { name: "㊗️", emoji: "㊗️", label: "Parabéns Japonês" },
  { name: "🈴", emoji: "🈴", label: "Aprovado Japonês" },
  { name: "🈵", emoji: "🈵", label: "Completo Japonês" },
  { name: "🈹", emoji: "🈹", label: "Desconto Japonês" },
  { name: "🈲", emoji: "🈲", label: "Proibido Japonês" },
  { name: "🅰️", emoji: "🅰️", label: "Tipo Sanguíneo A" },
  { name: "🅱️", emoji: "🅱️", label: "Tipo Sanguíneo B" },
  { name: "🆎", emoji: "🆎", label: "Tipo Sanguíneo AB" },
  { name: "🅾️", emoji: "🅾️", label: "Tipo Sanguíneo O" },
  { name: "💯", emoji: "💯", label: "100 Pontos" },
  { name: "🔠", emoji: "🔠", label: "Maiúsculas" },
  { name: "🔡", emoji: "🔡", label: "Minúsculas" },
  { name: "🔢", emoji: "🔢", label: "Números" },
  { name: "🔣", emoji: "🔣", label: "Símbolos" },
  { name: "🔤", emoji: "🔤", label: "Letras" },
  { name: "⭐", emoji: "⭐", label: "Estrela" },
  { name: "🌟", emoji: "🌟", label: "Estrela Brilhante" },
  { name: "💫", emoji: "💫", label: "Estrela Tonta" },
  { name: "⭐", emoji: "⭐", label: "Estrela Média" },
  { name: "🌠", emoji: "🌠", label: "Estrela Cadente" },
  { name: "🌌", emoji: "🌌", label: "Via Láctea" },
  { name: "☄️", emoji: "☄️", label: "Cometa" },
  { name: "☀️", emoji: "☀️", label: "Sol" },
  { name: "🌞", emoji: "🌞", label: "Sol com Rosto" },
  { name: "🌝", emoji: "🌝", label: "Lua Cheia com Rosto" },
  { name: "🌛", emoji: "🌛", label: "Lua Crescente com Rosto" },
  { name: "🌜", emoji: "🌜", label: "Lua Minguante com Rosto" },
  { name: "🌚", emoji: "🌚", label: "Lua Nova com Rosto" },
  { name: "🌕", emoji: "🌕", label: "Lua Cheia" },
  { name: "🌖", emoji: "🌖", label: "Lua Minguante Gibosa" },
  { name: "🌗", emoji: "🌗", label: "Quarto Minguante" },
  { name: "🌘", emoji: "🌘", label: "Lua Minguante Crescente" },
  { name: "🌑", emoji: "🌑", label: "Lua Nova" },
  { name: "🌒", emoji: "🌒", label: "Lua Crescente" },
  { name: "🌓", emoji: "🌓", label: "Quarto Crescente" },
  { name: "🌔", emoji: "🌔", label: "Lua Crescente Gibosa" },
  { name: "🌙", emoji: "🌙", label: "Lua Crescente" },
  { name: "🌎", emoji: "🌎", label: "Terra Américas" },
  { name: "🌍", emoji: "🌍", label: "Terra Europa-África" },
  { name: "🌏", emoji: "🌏", label: "Terra Ásia-Austrália" },
  { name: "🪐", emoji: "🪐", label: "Saturno" },
  { name: "💫", emoji: "💫", label: "Vertigem" },
  { name: "⚡", emoji: "⚡", label: "Raio" },
  { name: "☔", emoji: "☔", label: "Chuva" },
  { name: "❄️", emoji: "❄️", label: "Floco de Neve" },
  { name: "☃️", emoji: "☃️", label: "Boneco de Neve" },
  { name: "⛄", emoji: "⛄", label: "Boneco de Neve sem Neve" },
  { name: "☀️", emoji: "☀️", label: "Sol" },
  { name: "🌤️", emoji: "🌤️", label: "Sol Atrás de Nuvem Pequena" },
  { name: "⛅", emoji: "⛅", label: "Sol Atrás de Nuvem" },
  { name: "🌥️", emoji: "🌥️", label: "Sol Atrás de Nuvem Grande" },
  { name: "☁️", emoji: "☁️", label: "Nuvem" },
  { name: "🌦️", emoji: "🌦️", label: "Sol Atrás de Nuvem de Chuva" },
  { name: "🌧️", emoji: "🌧️", label: "Nuvem com Chuva" },
  { name: "⛈️", emoji: "⛈️", label: "Nuvem com Raio e Chuva" },
  { name: "🌩️", emoji: "🌩️", label: "Nuvem com Raio" },
  { name: "🌨️", emoji: "🌨️", label: "Nuvem com Neve" },
  { name: "❄️", emoji: "❄️", label: "Floco de Neve" },
  { name: "☄️", emoji: "☄️", label: "Cometa" },
  { name: "🔥", emoji: "🔥", label: "Fogo" },
  { name: "💧", emoji: "💧", label: "Gota" },
  { name: "🌊", emoji: "🌊", label: "Onda" },

  // Símbolos especiais adicionais
  { name: "🆕", emoji: "🆕", label: "Novo" },
  { name: "🆓", emoji: "🆓", label: "Grátis" },
  { name: "🆙", emoji: "🆙", label: "Up" },
  { name: "🆗", emoji: "🆗", label: "OK" },
  { name: "🆒", emoji: "🆒", label: "Legal" },
  { name: "🎫", emoji: "🎫", label: "Ticket" },
  { name: "🎟️", emoji: "🎟️", label: "Bilhetes" },
  { name: "🎪", emoji: "🎪", label: "Circo" },
  { name: "🤹", emoji: "🤹", label: "Malabarista" },
  { name: "🎭", emoji: "🎭", label: "Artes Cênicas" },
  { name: "🖼️", emoji: "🖼️", label: "Quadro Emoldurado" },
  { name: "🎨", emoji: "🎨", label: "Paleta de Artista" },
  { name: "🧵", emoji: "🧵", label: "Linha" },
  { name: "🧶", emoji: "🧶", label: "Lã" }
];

interface IconSelectorProps {
  value: string;
  onChange: (iconName: string) => void;
  className?: string;
}

const ICON_CATEGORIES = [
  { id: "all", label: "Todos", icon: "🔍", emojis: WHATSAPP_EMOJIS },
  { 
    id: "legal", 
    label: "Direito", 
    icon: "⚖️", 
    emojis: WHATSAPP_EMOJIS.slice(0, 41) // Especiais para Direito e Jurídico
  },
  { 
    id: "business", 
    label: "Negócios", 
    icon: "🏢", 
    emojis: WHATSAPP_EMOJIS.slice(42, 74) // Especiais para Empresas e Negócios
  },
  { 
    id: "time", 
    label: "Tempo", 
    icon: "⏰", 
    emojis: WHATSAPP_EMOJIS.slice(75, 105) // Especiais para Tempo e Prazos
  },
  { 
    id: "faces", 
    label: "Expressões", 
    icon: "😀", 
    emojis: WHATSAPP_EMOJIS.slice(106, 195) // Expressões e Emoções Básicas
  },
  { 
    id: "gestures", 
    label: "Gestos", 
    icon: "👏", 
    emojis: WHATSAPP_EMOJIS.slice(196, 221) // Gestos e Mãos
  },
  { 
    id: "hearts", 
    label: "Corações", 
    icon: "❤️", 
    emojis: WHATSAPP_EMOJIS.slice(222, 242) // Corações e Amor
  },
  { 
    id: "symbols", 
    label: "Símbolos", 
    icon: "⚡", 
    emojis: WHATSAPP_EMOJIS.slice(271, 287) // Símbolos e Identificadores
  },
  { 
    id: "places", 
    label: "Lugares", 
    icon: "🏠", 
    emojis: WHATSAPP_EMOJIS.slice(289, 325) // Lugares e Edifícios
  },
  { 
    id: "animals", 
    label: "Animais", 
    icon: "🐶", 
    emojis: WHATSAPP_EMOJIS.slice(395, 441) // Animais e Natureza
  },
  { 
    id: "nature", 
    label: "Plantas", 
    icon: "🌸", 
    emojis: WHATSAPP_EMOJIS.slice(442, 460) // Plantas e Flores
  },
  { 
    id: "food", 
    label: "Comida", 
    icon: "🍎", 
    emojis: WHATSAPP_EMOJIS.slice(461, 490) // Comidas e Bebidas
  },
  { 
    id: "objects", 
    label: "Objetos", 
    icon: "💼", 
    emojis: WHATSAPP_EMOJIS.slice(491, 556) // Objetos e Ferramentas
  },
  { 
    id: "status", 
    label: "Status", 
    icon: "✅", 
    emojis: WHATSAPP_EMOJIS.slice(557, 663) // Status e Indicadores
  }
];

export const IconSelector = ({ value, onChange, className }: IconSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const currentCategory = ICON_CATEGORIES.find(cat => cat.id === selectedCategory) || ICON_CATEGORIES[0];
  
  const filteredIcons = search 
    ? WHATSAPP_EMOJIS.filter(
        emoji => 
          emoji.label.toLowerCase().includes(search.toLowerCase()) ||
          emoji.emoji.includes(search)
      )
    : currentCategory.emojis;

  return (
    <div className={className}>
      <Label htmlFor="icon">Ícone</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{value}</span>
              {value && (
                <span className="text-sm text-muted-foreground">
                  {WHATSAPP_EMOJIS.find(e => e.emoji === value)?.label}
                </span>
              )}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3">
            <Input
              placeholder="Buscar ícone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) {
                  setSelectedCategory("all");
                }
              }}
              className="mb-3"
            />
            
            {/* Category shortcuts */}
            <div className="grid grid-cols-5 gap-1 mb-3">
              {ICON_CATEGORIES.slice(0, 10).map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  size="sm"
                  className="h-12 flex flex-col items-center justify-center p-1"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSearch("");
                  }}
                  title={category.label}
                >
                  <span className="text-lg leading-none mb-1">{category.icon}</span>
                  <span className="text-[9px] leading-none">{category.label}</span>
                </Button>
              ))}
            </div>
            
            {/* Show remaining categories in a second row if needed */}
            {ICON_CATEGORIES.length > 10 && (
              <div className="grid grid-cols-5 gap-1 mb-3">
                {ICON_CATEGORIES.slice(10).map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    size="sm"
                    className="h-12 flex flex-col items-center justify-center p-1"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSearch("");
                    }}
                    title={category.label}
                  >
                    <span className="text-lg leading-none mb-1">{category.icon}</span>
                    <span className="text-[9px] leading-none">{category.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          <ScrollArea className="h-80">
            <div className="grid grid-cols-6 gap-1 p-2">
              {filteredIcons.map((emoji) => (
                <Button
                  key={emoji.name}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 hover:bg-accent"
                  onClick={() => {
                    onChange(emoji.emoji);
                    setOpen(false);
                  }}
                  title={emoji.label}
                >
                  <span className="text-lg">{emoji.emoji}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
          {filteredIcons.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum ícone encontrado
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
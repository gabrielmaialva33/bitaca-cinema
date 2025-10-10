// ===============================================
// BITACA CINEMA - DATA
// Catálogo completo de produções audiovisuais
// ===============================================

const filmesData = [
  // ========== PROJETOS COM FICHA TÉCNICA COMPLETA ==========
  {
    id: 1,
    titulo: 'Ainda que Nada Fosse Meu',
    diretor: 'Danilo de Pontes Cacciacarro',
    duracao: '30 min',
    genero: 'Drama',
    status: 'lancado',
    tema: 'patrimonio',
    pontuacaoLPG: 157,
    pontuacaoPNAB: null,
    sinopse: 'Drama sensível sobre gravidez na adolescência, focando no isolamento e dilemas de uma jovem de 16 anos gestante. Filmado em diferentes pontos de Capão Bonito, o curta funciona também como retrato visual da cidade.',
    equipeTecnica: {
      roteiro: 'Lua Maia (Monique L. Andrade de Oliveira)',
      elenco: ['Victoria Delfino', 'Lua Maia'],
      fotografia: 'Danilo Cacciacarro',
      trilha: 'Banda Alien Alice',
      producao: 'Bizarre World'
    },
    estreia: '25 de Abril de 2025',
    local: 'Centro de Convenções "Joel Humberto Stori"',
    proposito: 'Ferramenta educativa para escolas, rodas de conversa sobre saúde reprodutiva e programas de educação sexual',
    streaming: true
  },
  {
    id: 2,
    titulo: 'Ponteia Viola',
    diretor: 'Margarida Chaves de Oliveira Scuoteguazza',
    duracao: '10-15 min (estimado)',
    genero: 'Documentário/Videoclipe Musical',
    status: 'producao',
    tema: 'musica',
    pontuacaoLPG: 238,
    pontuacaoPNAB: 98,
    ranking: {
      lpg: '1º lugar 🥇',
      pnab: '1º lugar 🥇'
    },
    sinopse: 'Documentário sobre a tradição da viola caipira, resgatando a cultura musical do interior paulista. A alta pontuação em ambos os editais demonstra forte apelo cultural à identidade regional.',
    estreia: '2025',
    streaming: false
  },
  {
    id: 3,
    titulo: 'Os Cascatinhas',
    diretor: 'Flavio Francisco Ramos Pereira',
    duracao: '3-6 min (estimado)',
    genero: 'Documentário Musical',
    estiloMusical: 'Choro',
    status: 'producao',
    tema: 'musica',
    pontuacaoLPG: 236,
    pontuacaoPNAB: 96,
    ranking: {
      lpg: '2º lugar 🥈',
      pnab: '2º lugar 🥈'
    },
    sinopse: 'Videoclipe/documentário musical sobre grupo de choro local já apresentado em eventos municipais. Primeira aparição pública em junho de 2022 (abertura para Orquestra Sinfônica da PM).',
    estreia: '2025',
    youtube: 'https://m.youtube.com/watch?v=B6pWRo5GmwU',
    streaming: false
  },
  {
    id: 4,
    titulo: 'Pelas Ruas de Capão: Skate e Espaços Públicos',
    diretor: 'Valdir dos Reis Junior',
    duracao: '10-15 min (estimado)',
    genero: 'Documentário de Cultura Urbana',
    status: 'producao',
    tema: 'ambiente',
    pontuacaoLPG: 230,
    pontuacaoPNAB: 90,
    sinopse: 'Curta-documentário sobre cultura do skate e ocupação urbana em Capão Bonito. Explora a relação dos jovens com o espaço urbano, práticas esportivas e manifestações culturais da juventude.',
    estreia: '2025',
    streaming: false
  },
  {
    id: 5,
    titulo: 'Animação Memórias Vivas',
    diretor: 'Jose Luiz Rodrigues',
    duracao: '10-15 min (estimado)',
    genero: 'Animação',
    status: 'producao',
    tema: 'patrimonio',
    pontuacaoLPG: 228,
    pontuacaoPNAB: 88,
    sinopse: 'Animação sobre memória coletiva de Capão Bonito. Um dos apenas dois projetos de animação aprovados, demonstrando diversidade de formatos na produção local.',
    estreia: '2025',
    streaming: false
  },
  {
    id: 6,
    titulo: 'Amarelo, Vermelho, Azul',
    diretor: 'Lucas Brener Andrade de Oliveira',
    duracao: '3-6 min (estimado)',
    genero: 'Videoclipe Experimental',
    status: 'producao',
    tema: 'musica',
    pontuacaoLPG: 226,
    pontuacaoPNAB: 86,
    statusPNAB: 'suplente',
    sinopse: 'Videoclipe experimental explorando tema de cores e emoções através de linguagem audiovisual contemporânea.',
    estreia: '2025',
    streaming: false
  },
  {
    id: 7,
    titulo: 'Versos Vivos de Nossa Cidade',
    diretor: 'Agatha Fabiane Santiago da Paixão',
    duracao: '10-12 min (estimado)',
    genero: 'Documentário Poético',
    status: 'producao',
    tema: 'patrimonio',
    pontuacaoLPG: 224,
    pontuacaoPNAB: 84,
    statusPNAB: 'suplente',
    sinopse: 'Documentário poético integrando recitais de poesia e imagens urbanas de Capão Bonito, celebrando a produção literária local.',
    estreia: '2025',
    streaming: false
  },
  {
    id: 8,
    titulo: 'Vídeo Clipe',
    diretor: 'Fabiano Domingues Rosa',
    duracao: '3-5 min (estimado)',
    genero: 'Videoclipe',
    estiloMusical: 'Rock/Pop Local',
    status: 'producao',
    tema: 'musica',
    pontuacaoLPG: 222,
    pontuacaoPNAB: 82,
    statusPNAB: 'suplente',
    sinopse: 'Videoclipe de banda local (rock/pop), dando visibilidade à cena musical contemporânea de Capão Bonito.',
    estreia: '2025',
    streaming: false
  },
  {
    id: 9,
    titulo: 'Memórias da Minha Terra',
    diretor: 'Fausto Vieira de Camargo',
    duracao: '15-20 min (estimado)',
    genero: 'Documentário Etnográfico',
    status: 'producao',
    tema: 'patrimonio',
    pontuacaoLPG: 218,
    pontuacaoPNAB: 78,
    statusPNAB: 'suplente',
    sinopse: 'Documentário etnográfico sobre tradições e lendas locais de Capão Bonito, preservando memória oral e cultural do município.',
    estreia: '2025',
    streaming: false
  },
  {
    id: 10,
    titulo: 'Bonito do Meu Interior',
    diretor: 'Carina Chaves Scuoteguazza',
    duracao: '10-15 min (estimado)',
    genero: 'Curta de Ficção',
    status: 'producao',
    tema: 'patrimonio',
    pontuacaoLPG: 195,
    pontuacaoPNAB: 75,
    statusPNAB: 'suplente',
    sinopse: 'Curta de ficção celebrando cultura e paisagens do interior paulista, com foco na identidade e beleza de Capão Bonito.',
    estreia: '2025',
    streaming: false
  },

  // ========== DEMAIS PROJETOS LEI PAULO GUSTAVO ==========
  {
    id: 11,
    titulo: 'Reconstruction',
    diretor: 'Bruna Maximovitz Kadoo Polississo',
    genero: 'Audiovisual',
    status: 'producao',
    tema: 'patrimonio',
    pontuacaoLPG: 234,
    pontuacaoPNAB: 94,
    ranking: { lpg: '3º lugar 🥉' },
    sinopse: 'Projeto audiovisual focado em reconstrução de memórias e narrativas locais.',
    estreia: '2025'
  },
  {
    id: 12,
    titulo: 'A Crônica',
    diretor: 'Micaelen de Oliveira Silva',
    genero: 'Curta/Documentário',
    status: 'producao',
    tema: 'patrimonio',
    pontuacaoLPG: 234,
    pontuacaoPNAB: 94,
    sinopse: 'Obra que explora o gênero literário da crônica, narrando histórias do cotidiano de Capão Bonito.',
    estreia: '2025'
  },
  {
    id: 13,
    titulo: 'Grupo Êre',
    diretor: 'Luan Augusto da Costa Oliveira',
    genero: 'Audiovisual',
    status: 'producao',
    tema: 'musica',
    pontuacaoLPG: 232,
    pontuacaoPNAB: 92,
    sinopse: 'Projeto audiovisual sobre manifestações culturais e musicais locais.',
    estreia: '2025'
  },
  {
    id: 14,
    titulo: 'Arte Urbana',
    diretor: 'Gabriel Felipe dos Santos Souza',
    genero: 'Documentário',
    status: 'producao',
    tema: 'ambiente',
    pontuacaoLPG: 192,
    sinopse: 'Documentário sobre arte urbana e grafitti em Capão Bonito.',
    estreia: '2025'
  },
  {
    id: 15,
    titulo: 'Cypher do Campeão',
    diretor: 'Alcides de Souza Vieira',
    genero: 'Videoclipe Hip-Hop',
    status: 'producao',
    tema: 'musica',
    pontuacaoLPG: 190,
    sinopse: 'Videoclipe de hip-hop celebrando a cultura urbana local.',
    estreia: '2025'
  },
  {
    id: 16,
    titulo: 'Preservação do Patrimônio Arbóreo',
    diretor: 'Ane Samara Santiago da Paixão',
    genero: 'Documentário Ambiental',
    status: 'producao',
    tema: 'ambiente',
    pontuacaoLPG: 187,
    sinopse: 'Documentário sobre preservação de árvores e patrimônio natural de Capão Bonito.',
    estreia: '2025'
  },
  {
    id: 17,
    titulo: 'Capão Sustentável',
    diretor: 'Dorival de Proença Junior',
    genero: 'Documentário Ambiental',
    status: 'producao',
    tema: 'ambiente',
    pontuacaoLPG: 182,
    sinopse: 'Documentário sobre sustentabilidade e consciência ecológica em Capão Bonito.',
    estreia: '2025'
  },
  {
    id: 18,
    titulo: 'Batalha do Capão',
    diretor: 'Pedro Fernando da Silva Matos',
    genero: 'Documentário Hip-Hop',
    status: 'producao',
    tema: 'musica',
    pontuacaoLPG: 180,
    sinopse: 'Documentário sobre batalhas de rimas e cultura hip-hop local.',
    estreia: '2025'
  },
  {
    id: 19,
    titulo: 'Abaixo das Árvores',
    diretor: 'Danilo de Pontes Cacciacarro',
    genero: 'Curta Ficção',
    status: 'producao',
    tema: 'ambiente',
    pontuacaoLPG: 157,
    sinopse: 'Curta de ficção ambientado na natureza de Capão Bonito.',
    estreia: '2025'
  },
  {
    id: 20,
    titulo: 'Rastro da Serpente, a Rota da Aventura',
    diretor: 'Elcio Shigueo Ueda',
    genero: 'Documentário Turismo',
    status: 'producao',
    tema: 'ambiente',
    pontuacaoLPG: 155,
    sinopse: 'Documentário sobre rotas turísticas e aventuras em Capão Bonito.',
    estreia: '2025'
  },
  {
    id: 21,
    titulo: 'Roteiro do Milho',
    diretor: 'Diego Fernandes Ferreira',
    genero: 'Documentário Gastronômico',
    status: 'producao',
    tema: 'patrimonio',
    pontuacaoLPG: 152,
    sinopse: 'Da gastronomia à história de Capão Bonito através do milho.',
    estreia: '2025'
  },
  {
    id: 22,
    titulo: 'A História do Rock de Capão Bonito',
    diretor: 'Osvaldo Polississo',
    genero: 'Documentário Musical',
    status: 'producao',
    tema: 'musica',
    pontuacaoLPG: 150,
    sinopse: 'Documentário sobre a cena de rock local e suas raízes.',
    estreia: '2025'
  },
  {
    id: 23,
    titulo: '1-Sala de Cinema',
    diretor: 'Anderson Ferreira',
    genero: 'Projeto',
    status: 'producao',
    tema: 'patrimonio',
    pontuacaoLPG: 145,
    sinopse: 'Projeto de reforma e adequação de sala de cinema.',
    estreia: '2025'
  },
  {
    id: 24,
    titulo: 'Padre Arlindo Veira',
    diretor: 'Leandro de Mello Almeida',
    genero: 'Documentário Biográfico',
    status: 'producao',
    tema: 'patrimonio',
    pontuacaoLPG: 140,
    sinopse: 'Documentário biográfico sobre personagem histórico de Capão Bonito.',
    estreia: '2025'
  },
  {
    id: 25,
    titulo: 'Harmonias de Capão Bonito',
    diretor: 'Nicolas Nascimento de Queiroz',
    genero: 'Documentário Musical',
    status: 'producao',
    tema: 'musica',
    pontuacaoLPG: 127,
    sinopse: 'Celebrando a herança cultural musical de Capão Bonito.',
    estreia: '2025'
  }
];

// Função auxiliar para buscar filmes
function buscarFilmes(termo) {
  termo = termo.toLowerCase();
  return filmesData.filter(filme =>
    filme.titulo.toLowerCase().includes(termo) ||
    filme.diretor.toLowerCase().includes(termo) ||
    (filme.sinopse && filme.sinopse.toLowerCase().includes(termo))
  );
}

// Função auxiliar para filtrar por categoria
function filtrarPorCategoria(categoria) {
  switch(categoria) {
    case 'lancado':
      return filmesData.filter(f => f.status === 'lancado');
    case 'producao':
      return filmesData.filter(f => f.status === 'producao');
    case 'patrimonio':
      return filmesData.filter(f => f.tema === 'patrimonio');
    case 'musica':
      return filmesData.filter(f => f.tema === 'musica');
    case 'ambiente':
      return filmesData.filter(f => f.tema === 'ambiente');
    case 'all':
    default:
      return filmesData;
  }
}

// Estatísticas do catálogo
const estatisticas = {
  total: filmesData.length,
  lancados: filmesData.filter(f => f.status === 'lancado').length,
  emProducao: filmesData.filter(f => f.status === 'producao').length,
  patrimonio: filmesData.filter(f => f.tema === 'patrimonio').length,
  musica: filmesData.filter(f => f.tema === 'musica').length,
  ambiente: filmesData.filter(f => f.tema === 'ambiente').length
};

// Exportar para uso global
window.filmesData = filmesData;
window.buscarFilmes = buscarFilmes;
window.filtrarPorCategoria = filtrarPorCategoria;
window.estatisticas = estatisticas;

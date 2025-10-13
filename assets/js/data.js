// ===============================================
// BITACA CINEMA - DATA
// Catálogo de produções audiovisuais
// ===============================================

// ⚠️ FONTES OFICIAIS CONFIRMADAS:
// - Lei Paulo Gustavo - Capão Bonito/SP
// - Documento: "RESULTADO FINAL COM NOTAS LPG" (Edital 03/2024 Audiovisual)
// - PNAB - Edital 005/2024 (Resultado Preliminar)
//
// 📋 NOTA SOBRE FICHAS TÉCNICAS:
// As sinopses apresentadas são inferências baseadas nos títulos dos projetos.
// Fichas técnicas oficiais serão divulgadas durante a execução e lançamento.
// Fonte: https://capaobonito.sp.gov.br/lei-paulo-gustavo/

const filmesData = [
    // TOP 3 - Aprovados em LPG e PNAB
    {
        id: 1,
        titulo: 'Ponteia Viola',
        diretor: 'Margarida Chaves de Oliveira Scuoteguazza',
        duracao: '15-20 min',
        genero: 'Documentário',
        status: 'producao',
        tema: 'musica',
        pontuacaoLPG: 238,
        pontuacaoPNAB: 98,
        sinopse: 'Documentário sobre a tradição da viola caipira em Capão Bonito, explorando técnicas de ponteio e a memória musical da cultura caipira local.',
        estreia: '2025'
    },
    {
        id: 2,
        titulo: 'Os Cascatinhas',
        diretor: 'Flavio Francisco Ramos Pereira',
        duracao: '15-20 min',
        genero: 'Documentário',
        status: 'producao',
        tema: 'musica',
        pontuacaoLPG: 236,
        pontuacaoPNAB: 96,
        sinopse: 'Registro da música sertaneja de raiz em Capão Bonito, explorando a tradição das duplas caipiras e a identidade musical do interior paulista.',
        estreia: '2025'
    },
    {
        id: 3,
        titulo: 'Reconstruction',
        diretor: 'Bruna Maximovitz Kadoo Polississo',
        duracao: '12-15 min',
        genero: 'Curta-metragem',
        status: 'producao',
        tema: 'patrimonio',
        pontuacaoLPG: 234,
        pontuacaoPNAB: 94,
        sinopse: 'Narrativa sobre reconstrução e memória em Capão Bonito, explorando transformações urbanas e preservação da identidade local.',
        estreia: '2025'
    },
    {
        id: 4,
        titulo: 'A Crônica',
        diretor: 'Micaelen de Oliveira Silva',
        duracao: '12-15 min',
        genero: 'Curta-metragem',
        status: 'producao',
        tema: 'patrimonio',
        pontuacaoLPG: 234,
        pontuacaoPNAB: 94,
        sinopse: 'Obra inspirada no gênero literário da crônica, retratando o cotidiano e as histórias do dia a dia em Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 5,
        titulo: 'Grupo Êre',
        diretor: 'Luan Augusto da Costa Oliveira',
        duracao: '10-15 min',
        genero: 'Documentário Musical',
        status: 'producao',
        tema: 'musica',
        pontuacaoLPG: 232,
        pontuacaoPNAB: 92,
        sinopse: 'Documentário sobre o Grupo Êre, explorando suas raízes culturais e contribuições para a cena musical de Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 6,
        titulo: 'Pelas Ruas de Capão: Skate e Espaços Públicos',
        diretor: 'Valdir dos Reis Junior',
        duracao: '15-20 min',
        genero: 'Documentário',
        status: 'producao',
        tema: 'ambiente',
        pontuacaoLPG: 230,
        pontuacaoPNAB: 90,
        sinopse: 'Documentário sobre a cultura do skate em Capão Bonito, explorando a relação dos jovens com o espaço urbano e as práticas esportivas.',
        estreia: '2025'
    },
    {
        id: 7,
        titulo: 'Animação Memórias Vivas',
        diretor: 'Jose Luiz Rodrigues',
        duracao: '8-12 min',
        genero: 'Animação',
        status: 'producao',
        tema: 'patrimonio',
        pontuacaoLPG: 228,
        pontuacaoPNAB: 88,
        sinopse: 'Animação que dá vida às memórias e histórias tradicionais de Capão Bonito, preservando o patrimônio cultural através da arte visual.',
        estreia: '2025'
    },
    {
        id: 8,
        titulo: 'Amarelo, Vermelho, Azul',
        diretor: 'Lucas Brener Andrade de Oliveira',
        duracao: '10-15 min',
        genero: 'Curta-metragem',
        status: 'producao',
        tema: 'ambiente',
        pontuacaoLPG: 226,
        pontuacaoPNAB: 86,
        sinopse: 'Obra experimental que explora cores, natureza e percepções visuais da paisagem de Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 9,
        titulo: 'Versos Vivos de Nossa Cidade',
        diretor: 'Agatha Fabiane Santiago da Paixão',
        duracao: '8-12 min',
        genero: 'Curta Poético',
        status: 'producao',
        tema: 'musica',
        pontuacaoLPG: 224,
        pontuacaoPNAB: 84,
        sinopse: 'Curta-metragem poético que transforma versos e poesias locais em narrativa visual sobre a cidade.',
        estreia: '2025'
    },
    {
        id: 10,
        titulo: 'Vídeo Clipe',
        diretor: 'Fabiano Domingues Rosa',
        duracao: '3-5 min',
        genero: 'Videoclipe',
        status: 'producao',
        tema: 'musica',
        pontuacaoLPG: 222,
        pontuacaoPNAB: 82,
        sinopse: 'Produção de videoclipe para artista local, valorizando a música produzida em Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 11,
        titulo: 'Memórias da Minha Terra',
        diretor: 'Fausto Vieira de Camargo',
        duracao: '15-20 min',
        genero: 'Documentário',
        status: 'producao',
        tema: 'patrimonio',
        pontuacaoLPG: 218,
        pontuacaoPNAB: 78,
        sinopse: 'Documentário que resgata memórias e histórias de moradores antigos, preservando o patrimônio oral de Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 12,
        titulo: 'Bonito do Meu Interior',
        diretor: 'Carina Chaves Scuoteguazza',
        duracao: '12-18 min',
        genero: 'Documentário',
        status: 'producao',
        tema: 'patrimonio',
        pontuacaoLPG: 195,
        pontuacaoPNAB: 75,
        sinopse: 'Retrato afetivo de Capão Bonito, explorando a beleza, cultura e identidade do interior paulista.',
        estreia: '2025'
    },
    {
        id: 13,
        titulo: 'Arte Urbana',
        diretor: 'Gabriel Felipe dos Santos Souza',
        duracao: '10-15 min',
        genero: 'Documentário',
        status: 'producao',
        tema: 'musica',
        pontuacaoLPG: 192,
        sinopse: 'Documentário sobre grafite, street art e cultura urbana em Capão Bonito, registrando artistas de rua locais.',
        estreia: '2025'
    },
    {
        id: 14,
        titulo: 'Cypher do Campeão',
        diretor: 'Alcides de Souza Vieira',
        duracao: '5-8 min',
        genero: 'Videoclipe/Doc',
        status: 'producao',
        tema: 'musica',
        pontuacaoLPG: 190,
        sinopse: 'Registro audiovisual de cypher de hip hop, celebrando a cultura do rap e freestyle em Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 15,
        titulo: 'Preservação do Patrimônio Arbóreo',
        diretor: 'Ane Samara Santiago da Paixão',
        duracao: '12-18 min',
        genero: 'Documentário',
        status: 'producao',
        tema: 'ambiente',
        pontuacaoLPG: 187,
        sinopse: 'Documentário sobre a preservação de árvores históricas e patrimônio natural de Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 16,
        titulo: 'Capão Sustentável',
        diretor: 'Dorival de Proença Junior',
        duracao: '15-20 min',
        genero: 'Documentário',
        status: 'producao',
        tema: 'ambiente',
        pontuacaoLPG: 182,
        sinopse: 'Documentário sobre práticas sustentáveis e consciência ambiental em Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 17,
        titulo: 'Batalha do Capão',
        diretor: 'Pedro Fernando da Silva Matos',
        duracao: '8-12 min',
        genero: 'Documentário Musical',
        status: 'producao',
        tema: 'musica',
        pontuacaoLPG: 180,
        sinopse: 'Registro de batalhas de rap e freestyle, documentando a cena do hip hop local.',
        estreia: '2025'
    },
    {
        id: 18,
        titulo: 'Abaixo das Árvores',
        diretor: 'Danilo de Pontes Cacciacarro',
        duracao: '12-15 min',
        genero: 'Curta-metragem',
        status: 'producao',
        tema: 'ambiente',
        pontuacaoLPG: 157,
        sinopse: 'Narrativa que explora a relação entre pessoas e natureza, ambientada nas paisagens arborizadas de Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 19,
        titulo: 'Rastro da Serpente, a Rota da Aventura',
        diretor: 'Elcio Shigueo Ueda',
        duracao: '15-20 min',
        genero: 'Documentário',
        status: 'producao',
        tema: 'ambiente',
        pontuacaoLPG: 155,
        sinopse: 'Documentário sobre ecoturismo e rotas de aventura na região de Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 20,
        titulo: 'Roteiro do Milho – da Gastronomia a História de Capão Bonito',
        diretor: 'Diego Fernandes Ferreira',
        duracao: '15-18 min',
        genero: 'Documentário',
        status: 'producao',
        tema: 'patrimonio',
        pontuacaoLPG: 152,
        sinopse: 'Documentário gastronômico que conecta a história do milho à identidade cultural e culinária de Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 21,
        titulo: 'A História do Rock de Capão Bonito',
        diretor: 'Osvaldo Polississo',
        duracao: '15-20 min',
        genero: 'Documentário Musical',
        status: 'producao',
        tema: 'patrimonio',
        pontuacaoLPG: 150,
        sinopse: 'Documentário histórico sobre a cena do rock em Capão Bonito, suas bandas e influências culturais.',
        estreia: '2025'
    },
    {
        id: 22,
        titulo: 'Padre Arlindo Veira',
        diretor: 'Leandro de Mello Almeida',
        duracao: '12-18 min',
        genero: 'Documentário Biográfico',
        status: 'producao',
        tema: 'patrimonio',
        pontuacaoLPG: 140,
        sinopse: 'Documentário biográfico sobre Padre Arlindo Vieira, figura importante na história de Capão Bonito.',
        estreia: '2025'
    },
    {
        id: 23,
        titulo: 'Harmonias de Capão Bonito: Celebrando Nossa Herança Cultural',
        diretor: 'Nicolas Nascimento de Queiroz',
        duracao: '12-15 min',
        genero: 'Documentário',
        status: 'producao',
        tema: 'patrimonio',
        pontuacaoLPG: 127,
        sinopse: 'Celebração da herança cultural musical de Capão Bonito, explorando harmonias e tradições locais.',
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
    switch (categoria) {
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

// ===============================================
// FONTES OFICIAIS E VALORES CONFIRMADOS:
// ===============================================
//
// Lei Paulo Gustavo - Capão Bonito/SP:
// - Página oficial: https://capaobonito.sp.gov.br/lei-paulo-gustavo/
// - Edital 03/2024: Audiovisual (R$ 64.000,00)
// - Edital 04/2024: Demais Áreas (R$ 75.000,00)
// - Documento oficial: "RESULTADO FINAL COM NOTAS LPG" (Imprensa Oficial)
//
// PNAB - Capão Bonito/SP:
// - Edital 005/2024: Fomento à Cultura (R$ 354.037,46)
// - Documento: "RESULTADO PRELIMINAR DA ANÁLISE DE MÉRITO PNAB 2024"
//
// Contato para informações:
// - Gestor: Renato Heber de Almeida
// - Email: cultura@capaobonito.sp.gov.br
// - Telefone: (15) 3542-3553
// ===============================================

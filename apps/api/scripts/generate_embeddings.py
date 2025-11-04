#!/usr/bin/env python3
"""
Script para gerar embeddings dos filmes do Bitaca Cinema
Usa a API da NVIDIA NIM através do backend proxy
"""

import json
import httpx
import time
from pathlib import Path

# Configuração
API_URL = "https://api.abitaca.com.br/api/embeddings"
EMBEDDING_MODEL = "nvidia/nv-embedqa-e5-v5"
OUTPUT_FILE = Path(__file__).parent.parent / "assets" / "data" / "embeddings.json"

# Dados dos 23 filmes
FILMES_DATA = [
    {
        "id": 1,
        "titulo": "Ponteia Viola",
        "diretor": "Margarida Chaves de Oliveira Scuoteguazza",
        "tema": "musica",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Documentário sobre a tradição da viola caipira em Capão Bonito, explorando técnicas de ponteio e a memória musical da cultura caipira local.",
        "status": "producao"
    },
    {
        "id": 2,
        "titulo": "Os Cascatinhas",
        "diretor": "Flavio Francisco Ramos Pereira",
        "tema": "musica",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Registro da música sertaneja de raiz em Capão Bonito, explorando a tradição das duplas caipiras e a identidade musical do interior paulista.",
        "status": "producao"
    },
    {
        "id": 3,
        "titulo": "Reconstruction",
        "diretor": "Bruna Maximovitz Kadoo Polississo",
        "tema": "patrimonio",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Narrativa sobre reconstrução e memória em Capão Bonito, explorando transformações urbanas e preservação da identidade local.",
        "status": "producao"
    },
    {
        "id": 4,
        "titulo": "A Crônica",
        "diretor": "Micaelen de Oliveira Silva",
        "tema": "patrimonio",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Obra inspirada no gênero literário da crônica, retratando o cotidiano e as histórias do dia a dia em Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 5,
        "titulo": "Grupo Êre",
        "diretor": "Luan Augusto da Costa Oliveira",
        "tema": "musica",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Documentário sobre o Grupo Êre, explorando suas raízes culturais e contribuições para a cena musical de Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 6,
        "titulo": "Pelas Ruas de Capão: Skate e Espaços Públicos",
        "diretor": "Valdir dos Reis Junior",
        "tema": "ambiente",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Documentário sobre a cultura do skate em Capão Bonito, explorando a relação dos jovens com o espaço urbano e as práticas esportivas.",
        "status": "producao"
    },
    {
        "id": 7,
        "titulo": "Animação Memórias Vivas",
        "diretor": "Jose Luiz Rodrigues",
        "tema": "patrimonio",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Animação que dá vida às memórias e histórias tradicionais de Capão Bonito, preservando o patrimônio cultural através da arte visual.",
        "status": "producao"
    },
    {
        "id": 8,
        "titulo": "Amarelo, Vermelho, Azul",
        "diretor": "Lucas Brener Andrade de Oliveira",
        "tema": "ambiente",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Obra experimental que explora cores, natureza e percepções visuais da paisagem de Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 9,
        "titulo": "Versos Vivos de Nossa Cidade",
        "diretor": "Agatha Fabiane Santiago da Paixão",
        "tema": "musica",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Curta-metragem poético que transforma versos e poesias locais em narrativa visual sobre a cidade.",
        "status": "producao"
    },
    {
        "id": 10,
        "titulo": "Vídeo Clipe",
        "diretor": "Fabiano Domingues Rosa",
        "tema": "musica",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Produção de videoclipe para artista local, valorizando a música produzida em Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 11,
        "titulo": "Memórias da Minha Terra",
        "diretor": "Fausto Vieira de Camargo",
        "tema": "patrimonio",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Documentário que resgata memórias e histórias de moradores antigos, preservando o patrimônio oral de Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 12,
        "titulo": "Bonito do Meu Interior",
        "diretor": "Carina Chaves Scuoteguazza",
        "tema": "patrimonio",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Retrato afetivo de Capão Bonito, explorando a beleza, cultura e identidade do interior paulista.",
        "status": "producao"
    },
    {
        "id": 13,
        "titulo": "Arte Urbana",
        "diretor": "Gabriel Felipe dos Santos Souza",
        "tema": "musica",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Documentário sobre grafite, street art e cultura urbana em Capão Bonito, registrando artistas de rua locais.",
        "status": "producao"
    },
    {
        "id": 14,
        "titulo": "Cypher do Campeão",
        "diretor": "Alcides de Souza Vieira",
        "tema": "musica",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Registro audiovisual de cypher de hip hop, celebrando a cultura do rap e freestyle em Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 15,
        "titulo": "Preservação do Patrimônio Arbóreo",
        "diretor": "Ane Samara Santiago da Paixão",
        "tema": "ambiente",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Documentário sobre a preservação de árvores históricas e patrimônio natural de Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 16,
        "titulo": "Capão Sustentável",
        "diretor": "Dorival de Proença Junior",
        "tema": "ambiente",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Documentário sobre práticas sustentáveis e consciência ambiental em Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 17,
        "titulo": "Batalha do Capão",
        "diretor": "Pedro Fernando da Silva Matos",
        "tema": "musica",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Registro de batalhas de rap e freestyle, documentando a cena do hip hop local.",
        "status": "producao"
    },
    {
        "id": 18,
        "titulo": "Abaixo das Árvores",
        "diretor": "Danilo de Pontes Cacciacarro",
        "tema": "ambiente",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Narrativa que explora a relação entre pessoas e natureza, ambientada nas paisagens arborizadas de Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 19,
        "titulo": "Rastro da Serpente, a Rota da Aventura",
        "diretor": "Elcio Shigueo Ueda",
        "tema": "ambiente",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Documentário sobre ecoturismo e rotas de aventura na região de Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 20,
        "titulo": "Roteiro do Milho – da Gastronomia a História de Capão Bonito",
        "diretor": "Diego Fernandes Ferreira",
        "tema": "patrimonio",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Documentário gastronômico que conecta a história do milho à identidade cultural e culinária de Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 21,
        "titulo": "A História do Rock de Capão Bonito",
        "diretor": "Osvaldo Polississo",
        "tema": "patrimonio",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Documentário histórico sobre a cena do rock em Capão Bonito, suas bandas e influências culturais.",
        "status": "producao"
    },
    {
        "id": 22,
        "titulo": "Padre Arlindo Veira",
        "diretor": "Leandro de Mello Almeida",
        "tema": "patrimonio",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Documentário biográfico sobre Padre Arlindo Vieira, figura importante na história de Capão Bonito.",
        "status": "producao"
    },
    {
        "id": 23,
        "titulo": "Harmonias de Capão Bonito: Celebrando Nossa Herança Cultural",
        "diretor": "Nicolas Nascimento de Queiroz",
        "tema": "patrimonio",
        "eixo": "Lei Paulo Gustavo",
        "sinopse": "Celebração da herança cultural musical de Capão Bonito, explorando harmonias e tradições locais.",
        "status": "producao"
    }
]


def prepare_text_for_embedding(filme):
    """Prepara texto otimizado para embedding"""
    return f"""Título: {filme['titulo']}
Diretor: {filme['diretor']}
Tema: {filme['tema']}
Eixo Temático: {filme['eixo']}
Sinopse: {filme['sinopse']}
Status: {filme['status']}""".strip()


def generate_embedding(text):
    """Gera embedding usando a API"""
    try:
        response = httpx.post(
            API_URL,
            json={
                "model": EMBEDDING_MODEL,
                "input": text,
                "input_type": "passage",
                "encoding_format": "float"
            },
            timeout=30.0
        )
        response.raise_for_status()
        data = response.json()
        return data["data"][0]["embedding"]
    except Exception as e:
        print(f"❌ Erro ao gerar embedding: {e}")
        raise


def main():
    print("🎬 Bitaca Cinema - Gerador de Embeddings")
    print("=" * 60)
    print(f"Total de filmes: {len(FILMES_DATA)}")
    print(f"API: {API_URL}")
    print(f"Modelo: {EMBEDDING_MODEL}")
    print(f"Output: {OUTPUT_FILE}")
    print("=" * 60)
    print()

    embeddings = []

    for i, filme in enumerate(FILMES_DATA, 1):
        try:
            # Prepara texto
            text = prepare_text_for_embedding(filme)

            print(f"[{i}/{len(FILMES_DATA)}] Gerando: \"{filme['titulo']}\"...", end=" ")

            # Gera embedding
            embedding = generate_embedding(text)

            # Valida dimensões (deve ser 1024)
            if len(embedding) != 1024:
                print(f"⚠️  AVISO: Embedding tem {len(embedding)} dimensões (esperado 1024)")

            # Adiciona ao resultado
            embeddings.append({
                "id": filme["id"],
                "titulo": filme["titulo"],
                "embedding": embedding,
                "metadata": {
                    "diretor": filme["diretor"],
                    "tema": filme["tema"],
                    "eixo": filme["eixo"],
                    "sinopse": filme["sinopse"],
                    "status": filme["status"]
                }
            })

            print("✅")

            # Rate limiting (evitar throttle)
            if i < len(FILMES_DATA):
                time.sleep(0.5)

        except Exception as e:
            print(f"❌ ERRO: {e}")
            print(f"Continuando com os próximos filmes...")

    print()
    print("=" * 60)
    print(f"✅ Embeddings gerados: {len(embeddings)}/{len(FILMES_DATA)}")

    # Salva arquivo
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(embeddings, f, indent=2, ensure_ascii=False)

    # Calcula tamanho
    file_size_mb = OUTPUT_FILE.stat().st_size / (1024 * 1024)

    print(f"📁 Arquivo salvo: {OUTPUT_FILE}")
    print(f"📊 Tamanho: {file_size_mb:.2f} MB")
    print()

    # Estatísticas
    if embeddings:
        print("📈 Estatísticas:")
        print(f"   - Dimensões: {len(embeddings[0]['embedding'])}")
        print(f"   - Temas:")
        temas = {}
        for e in embeddings:
            tema = e['metadata']['tema']
            temas[tema] = temas.get(tema, 0) + 1
        for tema, count in sorted(temas.items()):
            print(f"     • {tema}: {count} filmes")

    print()
    print("🎉 Concluído!")


if __name__ == "__main__":
    main()

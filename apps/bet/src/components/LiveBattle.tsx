import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useTextToSpeech } from '../hooks/useVoice';

interface LiveBattleProps {
  rapper1: string;
  rapper2: string;
  isLive: boolean;
  onBattleEnd?: (winner: string) => void;
}

interface Round {
  id: string;
  number: number;
  rapper: string;
  verse: string;
  score: number;
  timestamp: number;
}

interface BattleState {
  rounds: Round[];
  currentRound: number;
  scores: { [key: string]: number };
  status: 'ready' | 'in_progress' | 'finished';
  winner: string | null;
}

export default function LiveBattle({ rapper1, rapper2, isLive, onBattleEnd }: LiveBattleProps) {
  const [battle, setBattle] = useState<BattleState>({
    rounds: [],
    currentRound: 0,
    scores: { [rapper1]: 0, [rapper2]: 0 },
    status: 'ready',
    winner: null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoPlay] = useState(true);
  const { speak, enabled: ttsEnabled } = useTextToSpeech();
  const battleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateVerse = useCallback(async (rapper: string, roundNumber: number, previousVerses: string[]) => {
    try {
      const context = previousVerses.length > 0
        ? `\n\nVersos anteriores da batalha:\n${previousVerses.join('\n\n')}`
        : '';

      // Personalidade de cada rapper
      const personalities: { [key: string]: string } = {
        'Emicida': 'Você é Emicida, rapper paulista da Zona Norte de SP. Seu estilo mistura poesia, consciência social e punch lines afiadas. Suas rimas são inteligentes, com referências históricas e culturais. Flow preciso e métrico.',
        'Criolo': 'Você é Criolo, MC da Zona Sul de SP. Suas rimas são profundas, melódicas e cheias de verdade das ruas. Mistura rap com MPB. Flow suave mas certeiro, com mensagens fortes sobre periferia e resistência.',
        'BK': 'Você é BK (Abebe Bikila), rapper carioca. Seu estilo é técnico, rápido e cheio de metáforas complexas. Flow impecável, rimas internas e externas. Referências literárias e urbanas. Sempre eleva o nível técnico.',
        'Djonga': 'Você é Djonga, rapper mineiro de BH. Suas rimas são viscerais, cruas e politizadas. Flow agressivo e cadenciado. Aborda racismo, desigualdade e vivência da favela. Punch lines devastadoras e realidade nua.'
      };

      const personality = personalities[rapper] || `Você é ${rapper}, um rapper brasileiro em uma batalha de rima ao vivo. Você é agressivo, criativo e usa gírias de rap.`;

      const response = await axios.post('https://api.abitaca.com.br/api/chat/completions', {
        messages: [
          {
            role: 'system',
            content: `${personality} Suas rimas DEVEM ter esquema de rima (AABB, ABAB ou similar). Você está em uma batalha de freestyle ao vivo.`
          },
          {
            role: 'user',
            content: `Round ${roundNumber} da batalha! Solte uma rima de 4 linhas DESTRUIDORA contra seu oponente.

Requisitos:
- 4 linhas que RIMAM entre si
- Ataque direto ao adversário
- Metáforas e wordplay
- Flow brasileiro autêntico
- Gírias de batalha de rua

${context}

RESPONDA APENAS COM AS 4 LINHAS DA RIMA, SEM INTRODUÇÕES.`
          }
        ],
        stream: false,
        max_tokens: 150,
        temperature: 0.95 // High creativity
      });

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Erro ao gerar verso:', error);
      return 'Eu vim da zona, minha rima é calibrada\nTua derrota já tá escrita, tá selada\nMeu flow é navalha, te corta sem dó\nNessa batalha eu sou rei, cê é pó!';
    }
  }, []);

  const scoreVerse = useCallback(async (verse: string, rapper: string, opponent: string) => {
    try {
      const response = await axios.post('https://api.abitaca.com.br/api/chat/completions', {
        messages: [
          {
            role: 'system',
            content: 'Você é um juiz profissional de batalhas de rap. Avalie versos baseado em: rima (30%), flow (25%), criatividade (25%), impacto/punch lines (20%). Retorne APENAS um número de 0 a 10.'
          },
          {
            role: 'user',
            content: `Avalie este verso de ${rapper} contra ${opponent}:\n\n"${verse}"\n\nResponda APENAS com um número de 0.0 a 10.0 (exemplo: 8.5)`
          }
        ],
        stream: false,
        max_tokens: 10,
        temperature: 0.3 // Low temperature for consistent scoring
      });

      const scoreText = response.data.choices[0].message.content.trim();
      const score = parseFloat(scoreText.replace(/[^0-9.]/g, ''));
      return isNaN(score) ? 7.0 : Math.min(Math.max(score, 0), 10);
    } catch (error) {
      console.error('Erro ao pontuar verso:', error);
      return Math.random() * 3 + 6; // Fallback: 6-9
    }
  }, []);

  const runRound = useCallback(async (roundNumber: number) => {
    if (!isLive || battle.status !== 'in_progress') return;

    setIsGenerating(true);

    // Determinar quem rima primeiro (alterna)
    const firstRapper = roundNumber % 2 === 1 ? rapper1 : rapper2;
    const secondRapper = roundNumber % 2 === 1 ? rapper2 : rapper1;

    const previousVerses = battle.rounds.map(r => `${r.rapper}: ${r.verse}`);

    // Primeiro rapper
    speak(`Round ${roundNumber}! ${firstRapper} na batida!`, { rate: 1.2 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const verse1 = await generateVerse(firstRapper, roundNumber, previousVerses);
    const score1 = await scoreVerse(verse1, firstRapper, secondRapper);

    const round1: Round = {
      id: `${roundNumber}-1`,
      number: roundNumber,
      rapper: firstRapper,
      verse: verse1,
      score: score1,
      timestamp: Date.now()
    };

    setBattle(prev => ({
      ...prev,
      rounds: [...prev.rounds, round1],
      scores: { ...prev.scores, [firstRapper]: prev.scores[firstRapper] + score1 }
    }));

    // Narrar verso com TTS
    if (ttsEnabled) {
      speak(verse1, { rate: 1.0, pitch: 1.0 });
      await new Promise(resolve => setTimeout(resolve, verse1.length * 50)); // Wait for speech
    } else {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Segundo rapper
    speak(`Agora é a vez de ${secondRapper}! Responde essa!`, { rate: 1.2 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const verse2 = await generateVerse(secondRapper, roundNumber, [...previousVerses, `${firstRapper}: ${verse1}`]);
    const score2 = await scoreVerse(verse2, secondRapper, firstRapper);

    const round2: Round = {
      id: `${roundNumber}-2`,
      number: roundNumber,
      rapper: secondRapper,
      verse: verse2,
      score: score2,
      timestamp: Date.now()
    };

    setBattle(prev => ({
      ...prev,
      rounds: [...prev.rounds, round2],
      currentRound: roundNumber,
      scores: { ...prev.scores, [secondRapper]: prev.scores[secondRapper] + score2 }
    }));

    // Narrar verso com TTS
    if (ttsEnabled) {
      speak(verse2, { rate: 1.0, pitch: 1.0 });
      await new Promise(resolve => setTimeout(resolve, verse2.length * 50));
    } else {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    setIsGenerating(false);

    // Anunciar pontuação
    speak(`Round ${roundNumber} finalizado! ${firstRapper}: ${score1.toFixed(1)} pontos. ${secondRapper}: ${score2.toFixed(1)} pontos.`, { rate: 1.1 });
  }, [isLive, battle, rapper1, rapper2, generateVerse, scoreVerse, speak, ttsEnabled]);

  const startBattle = useCallback(() => {
    if (!isLive || battle.status === 'in_progress') return;

    setBattle(prev => ({ ...prev, status: 'in_progress', currentRound: 0 }));
    speak(`Batalha entre ${rapper1} e ${rapper2}! Que comecem as rimas!`, { rate: 1.3, pitch: 1.1 });

    let currentRound = 1;

    battleIntervalRef.current = setInterval(async () => {
      if (currentRound > 3) { // 3 rounds
        endBattle();
        return;
      }

      await runRound(currentRound);
      currentRound++;
    }, 1000);
  }, [isLive, battle.status, rapper1, rapper2, speak, runRound]);

  const endBattle = useCallback(() => {
    if (battleIntervalRef.current) {
      clearInterval(battleIntervalRef.current);
    }

    const winner = battle.scores[rapper1] > battle.scores[rapper2] ? rapper1 : rapper2;

    setBattle(prev => ({
      ...prev,
      status: 'finished',
      winner
    }));

    speak(`Batalha finalizada! O vencedor é ${winner} com ${Math.max(battle.scores[rapper1], battle.scores[rapper2]).toFixed(1)} pontos!`, { rate: 1.2, pitch: 1.2 });

    if (onBattleEnd) {
      onBattleEnd(winner);
    }
  }, [battle.scores, rapper1, rapper2, speak, onBattleEnd]);

  useEffect(() => {
    if (isLive && autoPlay && battle.status === 'ready') {
      setTimeout(() => startBattle(), 3000); // Start after 3s
    }

    return () => {
      if (battleIntervalRef.current) {
        clearInterval(battleIntervalRef.current);
      }
    };
  }, [isLive, autoPlay, battle.status, startBattle]);

  if (!isLive) return null;

  return (
    <div className="card border-2 border-blood-red/50 bg-gradient-to-br from-slate-darker to-shadow-black">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-blood-red/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-blood-red" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
            </div>
            {battle.status === 'in_progress' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <div>
            <h3 className="font-display text-xl text-blood-red">Batalha ao Vivo</h3>
            <p className="text-xs text-gray-500">Powered by NVIDIA NIM + TTS</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {battle.status === 'ready' && (
            <button
              onClick={startBattle}
              className="px-4 py-2 bg-blood-red hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-all"
            >
              ▶ Iniciar Batalha
            </button>
          )}
          {battle.status === 'in_progress' && (
            <span className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg font-semibold text-sm animate-pulse">
              🔴 AO VIVO
            </span>
          )}
          {battle.status === 'finished' && (
            <span className="px-4 py-2 bg-toxic-green/20 text-toxic-green rounded-lg font-semibold text-sm">
              ✓ Finalizada
            </span>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-dark/50 rounded-lg p-4 border-2 border-blood-red/30">
          <p className="text-sm text-gray-400 mb-1">Rapper 1</p>
          <p className="font-display text-xl text-white">{rapper1}</p>
          <p className="text-3xl font-bold text-blood-red mt-2">{battle.scores[rapper1].toFixed(1)}</p>
        </div>
        <div className="bg-slate-dark/50 rounded-lg p-4 border-2 border-electric-blue/30">
          <p className="text-sm text-gray-400 mb-1">Rapper 2</p>
          <p className="font-display text-xl text-white">{rapper2}</p>
          <p className="text-3xl font-bold text-electric-blue mt-2">{battle.scores[rapper2].toFixed(1)}</p>
        </div>
      </div>

      {/* Battle Feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blood-red/30">
        {battle.rounds.length === 0 && battle.status === 'ready' && (
          <p className="text-gray-500 text-sm text-center py-8">
            Aguardando início da batalha...
          </p>
        )}

        {isGenerating && (
          <div className="flex items-center gap-3 text-blood-red animate-pulse p-4 bg-slate-dark/30 rounded-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blood-red border-t-transparent"></div>
            <span className="text-sm font-semibold">Gerando rima...</span>
          </div>
        )}

        {battle.rounds.map((round) => (
          <div
            key={round.id}
            className={`p-4 rounded-lg border-l-4 animate-fade-in ${
              round.rapper === rapper1
                ? 'bg-blood-red/10 border-blood-red'
                : 'bg-electric-blue/10 border-electric-blue'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎤</span>
                <div>
                  <p className="font-semibold text-white">{round.rapper}</p>
                  <p className="text-xs text-gray-500">Round {round.number}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-toxic-green">{round.score.toFixed(1)}</p>
                <p className="text-xs text-gray-500">pontos</p>
              </div>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line italic">
              {round.verse}
            </p>
          </div>
        ))}
      </div>

      {/* Winner Announcement */}
      {battle.status === 'finished' && battle.winner && (
        <div className="mt-6 p-6 bg-gradient-to-r from-toxic-green/20 to-electric-blue/20 rounded-lg border-2 border-toxic-green/50 animate-fade-in">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Vencedor da Batalha</p>
            <p className="text-3xl font-display font-bold text-toxic-green mb-2">
              🏆 {battle.winner}
            </p>
            <p className="text-xl text-white font-semibold">
              {battle.scores[battle.winner].toFixed(1)} pontos
            </p>
          </div>
        </div>
      )}

      {/* TTS Status */}
      {!ttsEnabled && battle.status === 'in_progress' && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-500 text-center">
            💡 Ative a narração por voz para melhor experiência
          </p>
        </div>
      )}
    </div>
  );
}

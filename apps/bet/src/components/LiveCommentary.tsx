import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface LiveCommentaryProps {
  battleId: string;
  rapper1: string;
  rapper2: string;
  isLive: boolean;
}

interface Comment {
  id: string;
  text: string;
  timestamp: number;
  type: 'intro' | 'round' | 'highlight' | 'result';
}

export default function LiveCommentary({ rapper1, rapper2, isLive }: LiveCommentaryProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  const generateCommentary = useCallback(async (type: 'intro' | 'round' | 'highlight') => {
    if (!isLive) return;

    setLoading(true);
    try {
      let prompt = '';

      switch (type) {
        case 'intro':
          prompt = `Você é um narrador esportivo de batalhas de rap estilo ESPN. Crie uma introdução empolgante e curta (2-3 frases) para a batalha entre ${rapper1} e ${rapper2}. Use gírias de rap e energia máxima!`;
          break;
        case 'round':
          prompt = `Você é um narrador esportivo de batalhas de rap. Narre 1-2 frases sobre o round atual entre ${rapper1} e ${rapper2}. Seja dinâmico e mencione técnicas de flow, punch lines ou improviso.`;
          break;
        case 'highlight':
          prompt = `Você é um narrador de batalhas de rap. Comente um momento de destaque na batalha entre ${rapper1} e ${rapper2} (1 frase curta e impactante). Use expressões como "EITA!", "PESADO!", "VOADORA!".`;
          break;
      }

      const response = await axios.post('https://api.abitaca.com.br/api/chat/completions', {
        messages: [
          {
            role: 'system',
            content: 'Você é um narrador esportivo de batalhas de rap brasileiro, estilo Rinha dos MCs. Use gírias de rap, seja dinâmico e empolgante. Sempre responda em português do Brasil.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false,
        max_tokens: 150,
        temperature: 0.9 // High creativity for commentary
      });

      const commentText = response.data.choices[0].message.content;
      const newComment: Comment = {
        id: `${Date.now()}-${Math.random()}`,
        text: commentText,
        timestamp: Date.now(),
        type
      };

      setComments(prev => [newComment, ...prev].slice(0, 10)); // Keep last 10 comments
    } catch (error) {
      console.error('Erro ao gerar comentário:', error);
    } finally {
      setLoading(false);
    }
  }, [rapper1, rapper2, isLive]);

  // Auto-generate commentary when battle is live
  useEffect(() => {
    if (!isLive || !autoPlay) return;

    // Generate intro
    generateCommentary('intro');

    // Generate periodic commentary (every 15-30 seconds)
    const interval = setInterval(() => {
      const types: ('round' | 'highlight')[] = ['round', 'highlight'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      generateCommentary(randomType);
    }, Math.random() * 15000 + 15000); // 15-30 seconds

    return () => clearInterval(interval);
  }, [isLive, autoPlay, generateCommentary]);

  if (!isLive) {
    return null;
  }

  return (
    <div className="card border-2 border-electric-blue/30 bg-gradient-to-br from-slate-darker to-shadow-black">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-electric-blue/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-electric-blue" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            {isLive && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <div>
            <h3 className="font-display text-lg text-electric-blue">Narração ao Vivo</h3>
            <p className="text-xs text-gray-500">Powered by NVIDIA NIM</p>
          </div>
        </div>

        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            autoPlay
              ? 'bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          {autoPlay ? '⏸ Pausar' : '▶ Continuar'}
        </button>
      </div>

      {/* Commentary Feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-electric-blue/30">
        {loading && (
          <div className="flex items-center gap-2 text-electric-blue text-sm animate-pulse">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-electric-blue border-t-transparent"></div>
            <span>Narrando...</span>
          </div>
        )}

        {comments.length === 0 && !loading && (
          <p className="text-gray-500 text-sm text-center py-4">
            Aguardando narração da batalha...
          </p>
        )}

        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`p-3 rounded-lg border-l-4 animate-fade-in ${
              comment.type === 'intro'
                ? 'bg-electric-blue/10 border-electric-blue'
                : comment.type === 'highlight'
                ? 'bg-toxic-green/10 border-toxic-green'
                : 'bg-slate-dark/50 border-gray-600'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">
                {comment.type === 'intro' && '🎤'}
                {comment.type === 'round' && '🔥'}
                {comment.type === 'highlight' && '⚡'}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-200 leading-relaxed">
                  {comment.text}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(comment.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Commentary Button */}
      <div className="mt-4 pt-4 border-t border-gray-800 flex gap-2">
        <button
          onClick={() => generateCommentary('round')}
          disabled={loading}
          className="flex-1 px-3 py-2 bg-slate-dark hover:bg-slate-medium rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
        >
          🎯 Narrar Round
        </button>
        <button
          onClick={() => generateCommentary('highlight')}
          disabled={loading}
          className="flex-1 px-3 py-2 bg-slate-dark hover:bg-slate-medium rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
        >
          ⚡ Gerar Destaque
        </button>
      </div>
    </div>
  );
}

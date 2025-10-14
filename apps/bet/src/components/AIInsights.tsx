import { useState } from 'react';
import axios from 'axios';

interface AIInsightsProps {
  rapper1: string;
  rapper2: string;
}

export default function AIInsights({ rapper1, rapper2 }: AIInsightsProps) {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const getAIInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.post('https://api.abitaca.com.br/api/chat/completions', {
        messages: [
          {
            role: 'system',
            content: 'Você é um analista especializado em batalhas de rap. Forneça análises técnicas, imparciais e baseadas em dados sobre os rappers.'
          },
          {
            role: 'user',
            content: `Analise a batalha entre ${rapper1} vs ${rapper2}.

Forneça uma análise técnica de aproximadamente 100 palavras cobrindo:
1. Pontos fortes de cada rapper
2. Estilos de flow e rima
3. Performance em batalhas anteriores
4. Fatores que podem influenciar o resultado

Seja objetivo e não faça previsões diretas de vencedor.`
          }
        ],
        stream: false,
        max_tokens: 300,
        temperature: 0.7
      });

      const aiResponse = response.data.choices[0].message.content;
      setInsights(aiResponse);
      setShowInsights(true);
    } catch (error) {
      console.error('Erro ao obter insights da AI:', error);
      setInsights('Não foi possível obter insights no momento. Tente novamente mais tarde.');
      setShowInsights(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-2 border-toxic-green/30 bg-gradient-to-br from-void-black to-shadow-black">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-toxic-green/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-toxic-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-toxic-green">AI Insights</h3>
            <p className="text-xs text-gray-500">Powered by NVIDIA NIM</p>
          </div>
        </div>

        {!showInsights && (
          <button
            onClick={getAIInsights}
            disabled={loading}
            className="px-4 py-2 bg-toxic-green/20 hover:bg-toxic-green/30 text-toxic-green rounded-lg transition-all duration-200 font-semibold text-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-toxic-green border-t-transparent"></div>
                <span>Analisando...</span>
              </div>
            ) : (
              'Obter Análise'
            )}
          </button>
        )}
      </div>

      {showInsights && (
        <div className="mt-4 p-4 bg-shadow-black/50 rounded-lg border border-toxic-green/20">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-toxic-green flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {insights}
            </p>
          </div>

          <button
            onClick={() => setShowInsights(false)}
            className="mt-4 text-xs text-gray-500 hover:text-toxic-green transition-colors"
          >
            ← Fechar análise
          </button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">
          Análises geradas por IA não constituem recomendações de apostas
        </p>
      </div>
    </div>
  );
}

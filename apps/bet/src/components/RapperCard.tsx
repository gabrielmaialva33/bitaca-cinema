import { useState, useEffect } from 'react';
import { rapperEnrichment, type RapperProfile } from '../services/rapperEnrichment';

interface RapperCardProps {
  rapperName: string;
  odds: number;
  onBet: () => void;
  isDisabled?: boolean;
}

export default function RapperCard({ rapperName, odds, onBet, isDisabled }: RapperCardProps) {
  const [profile, setProfile] = useState<RapperProfile | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const enriched = await rapperEnrichment.enrichRapper(rapperName);
        setProfile(enriched.profile);
        setTags(enriched.tags);
        setAvatarUrl(enriched.avatarUrl);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [rapperName]);

  if (loading) {
    return (
      <div className="bg-slate-dark rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-slate-medium rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-slate-medium rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-medium rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div
      className="bg-slate-dark/80 backdrop-blur-sm rounded-xl p-4 border-2 hover:border-opacity-100 transition-all duration-300"
      style={{
        borderColor: `${profile.colors.primary}40`,
        '--primary-color': profile.colors.primary,
        '--secondary-color': profile.colors.secondary
      } as React.CSSProperties}
    >
      {/* Main Content */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative group">
          <img
            src={avatarUrl}
            alt={profile.name}
            className="w-20 h-20 rounded-xl object-cover border-2 transition-transform duration-300 group-hover:scale-105"
            style={{ borderColor: profile.colors.primary }}
          />
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"
            style={{ backgroundColor: profile.colors.primary }}
          ></div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3
                className="font-display text-xl font-bold truncate"
                style={{ color: profile.colors.primary }}
              >
                {profile.name}
              </h3>
              <p className="text-sm text-gray-400">{profile.origin}</p>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showDetails ? '▼' : '▶'}
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${profile.colors.secondary}20`,
                  color: profile.colors.secondary
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Odds and Bet */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Odds</p>
              <p
                className="text-2xl font-bold"
                style={{ color: profile.colors.primary }}
              >
                {odds}x
              </p>
            </div>
            <button
              onClick={onBet}
              disabled={isDisabled}
              className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: profile.colors.primary,
                color: 'white'
              }}
            >
              Apostar
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div
          className="mt-4 pt-4 border-t space-y-3 animate-fade-in"
          style={{ borderColor: `${profile.colors.primary}30` }}
        >
          {/* Style */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Estilo</p>
            <p className="text-sm text-gray-200">{profile.style}</p>
          </div>

          {/* Flow Pattern */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Flow</p>
            <p className="text-sm text-gray-200">{profile.flowPattern}</p>
          </div>

          {/* Signature */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Verso Icônico</p>
            <p
              className="text-sm italic font-medium"
              style={{ color: profile.colors.secondary }}
            >
              "{profile.signature}"
            </p>
          </div>

          {/* Keywords */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Palavras-Chave</p>
            <div className="flex flex-wrap gap-1">
              {profile.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded bg-slate-medium text-gray-300"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Powered by NVIDIA */}
          <div className="flex items-center gap-2 pt-2">
            <svg className="w-4 h-4 text-toxic-green" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-gray-600">Powered by NVIDIA Web Agents</p>
          </div>
        </div>
      )}
    </div>
  );
}

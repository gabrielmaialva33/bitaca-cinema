import { useState } from 'react';

interface AgeGateProps {
  onConfirm: () => void;
}

export default function AgeGate({ onConfirm }: AgeGateProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border-2 border-red-600 rounded-xl p-8 shadow-2xl">
        {/* Warning Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-600 rounded-full mb-4">
            <span className="text-6xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-bold text-red-500 mb-2">AVISO DE CONTEÚDO</h1>
          <p className="text-xl font-semibold text-white">18+</p>
        </div>

        {/* Warning Text */}
        <div className="space-y-4 text-gray-300 text-sm mb-6">
          <p>
            Esta área contém <span className="text-red-400 font-bold">conteúdo para maiores de 18 anos</span>.
          </p>
          <p>
            O acesso é <span className="text-red-400 font-bold">RESTRITO</span> e requer:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Ter 18 anos ou mais</li>
            <li>Conta Google (Gmail)</li>
            <li>Aceitar os termos de uso</li>
          </ul>
          <p className="text-yellow-400 font-semibold">
            ⚠️ Ao prosseguir, você declara ter 18+ anos
          </p>
        </div>

        {/* Checkbox */}
        <label className="flex items-start space-x-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
          />
          <span className="text-sm text-gray-300">
            Confirmo que tenho <strong className="text-white">18 anos ou mais</strong> e aceito os termos de uso da plataforma.
          </span>
        </label>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.href = '/play.html'}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            ← Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={!accepted}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              accepted
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Prosseguir →
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Ao prosseguir, você concorda em usar a plataforma de forma responsável e legal.
        </p>
      </div>
    </div>
  );
}

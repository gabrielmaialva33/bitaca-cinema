import { useTextToSpeech, useSpeechRecognition } from '../hooks/useVoice';
import { useEffect } from 'react';

interface VoiceControlProps {
  onCommand?: (command: { action: string; rapper?: string; amount?: number }) => void;
}

export default function VoiceControl({ onCommand }: VoiceControlProps) {
  const { enabled, toggle, speaking } = useTextToSpeech();
  const { listening, transcript, startListening, stopListening, parseCommand, supported } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      const command = parseCommand(transcript);
      if (command && onCommand) {
        onCommand(command);
      }
    }
  }, [transcript, parseCommand, onCommand]);

  if (!supported) {
    return null; // Don't show if browser doesn't support speech recognition
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Voice Commands Info */}
      {listening && (
        <div className="bg-slate-darker/95 backdrop-blur-sm border border-electric-blue/50 rounded-xl p-4 shadow-2xl animate-pulse">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-electric-blue rounded-full animate-ping"></div>
            <p className="text-sm font-semibold text-electric-blue">Escutando...</p>
          </div>
          {transcript && (
            <p className="text-xs text-gray-400 mt-2">"{transcript}"</p>
          )}
          <div className="mt-3 text-xs text-gray-500">
            <p>Comandos disponíveis:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>"Apostar 100 moedas no primeiro"</li>
              <li>"Coletar bônus"</li>
              <li>"Ver carteira"</li>
            </ul>
          </div>
        </div>
      )}

      {/* Voice Controls */}
      <div className="flex gap-3">
        {/* Text-to-Speech Toggle */}
        <button
          onClick={toggle}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            enabled
              ? 'bg-gradient-to-br from-toxic-green to-neon-green hover:from-neon-green hover:to-toxic-green'
              : 'bg-slate-dark hover:bg-slate-medium'
          } ${speaking ? 'animate-pulse scale-110' : 'scale-100'}`}
          title={enabled ? 'Desativar narração' : 'Ativar narração'}
        >
          {enabled ? (
            <svg className="w-7 h-7 text-shadow-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Speech Recognition Toggle */}
        <button
          onClick={listening ? stopListening : startListening}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            listening
              ? 'bg-gradient-to-br from-electric-blue to-blue-500 animate-pulse scale-110'
              : 'bg-slate-dark hover:bg-slate-medium scale-100'
          }`}
          title={listening ? 'Parar de escutar' : 'Ativar comandos de voz'}
        >
          <svg className={`w-7 h-7 ${listening ? 'text-white' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Powered by NVIDIA badge */}
      <div className="bg-slate-darker/80 backdrop-blur-sm rounded-lg px-3 py-2 text-center border border-slate-dark">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Powered by</p>
        <p className="text-xs font-semibold text-toxic-green">NVIDIA NIM</p>
      </div>
    </div>
  );
}

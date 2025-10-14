import { useState, useEffect, useCallback } from 'react';

interface VoiceOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Check if TTS is enabled in localStorage
    const savedEnabled = localStorage.getItem('bet_voice_enabled');
    if (savedEnabled !== null) {
      setEnabled(savedEnabled === 'true');
    }
  }, []);

  const speak = useCallback((text: string, options: VoiceOptions = {}) => {
    if (!enabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Find Brazilian Portuguese voice or fallback to Portuguese
    const ptBRVoice = voices.find(v => v.lang === 'pt-BR') ||
                      voices.find(v => v.lang.startsWith('pt'));

    if (ptBRVoice) {
      utterance.voice = ptBRVoice;
    }

    utterance.lang = options.lang || 'pt-BR';
    utterance.rate = options.rate || 1.1; // Slightly faster
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [enabled, voices]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    localStorage.setItem('bet_voice_enabled', String(newEnabled));
    if (!newEnabled) {
      stop();
    }
  }, [enabled, stop]);

  // Battle announcements
  const announceBattle = useCallback((rapper1: string, rapper2: string) => {
    speak(`Batalha de rima! ${rapper1} versus ${rapper2}. Faça suas apostas!`, {
      rate: 1.2,
      pitch: 1.1
    });
  }, [speak]);

  const announceWin = useCallback((winner: string, amount: number) => {
    speak(`Você ganhou! ${winner} venceu. Você recebeu ${amount} moedas!`, {
      rate: 1.0,
      pitch: 1.2
    });
  }, [speak]);

  const announceLoss = useCallback((winner: string) => {
    speak(`${winner} venceu a batalha. Tente novamente!`, {
      rate: 0.9
    });
  }, [speak]);

  const announceBonus = useCallback(() => {
    speak('Bônus diário coletado! Cem moedas adicionadas à sua carteira!', {
      rate: 1.1,
      pitch: 1.2
    });
  }, [speak]);

  return {
    speak,
    stop,
    speaking,
    enabled,
    toggle,
    // Specialized announcements
    announceBattle,
    announceWin,
    announceLoss,
    announceBonus
  };
}

export function useSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.lang = 'pt-BR';
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;

    recognitionInstance.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
    };

    recognitionInstance.onend = () => {
      setListening(false);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !listening) {
      setTranscript('');
      recognition.start();
      setListening(true);
    }
  }, [recognition, listening]);

  const stopListening = useCallback(() => {
    if (recognition && listening) {
      recognition.stop();
      setListening(false);
    }
  }, [recognition, listening]);

  // Parse voice commands
  const parseCommand = useCallback((text: string): { action: string; rapper?: string; amount?: number } | null => {
    const lowerText = text.toLowerCase();

    // Bet commands
    if (lowerText.includes('apostar') || lowerText.includes('aposta')) {
      // Extract rapper name and amount
      const amountMatch = lowerText.match(/(\d+)\s*(moedas?|coins?)/);
      const amount = amountMatch ? parseInt(amountMatch[1]) : 100;

      // Check for rapper mentions
      let rapper: string | undefined = undefined;
      if (lowerText.includes('primeiro') || lowerText.includes('um')) {
        rapper = 'first';
      } else if (lowerText.includes('segundo') || lowerText.includes('dois')) {
        rapper = 'second';
      }

      return { action: 'bet', rapper, amount };
    }

    // Bonus command
    if (lowerText.includes('bônus') || lowerText.includes('bonus') || lowerText.includes('coletar')) {
      return { action: 'bonus' };
    }

    // Info command
    if (lowerText.includes('carteira') || lowerText.includes('saldo')) {
      return { action: 'wallet' };
    }

    return null;
  }, []);

  return {
    listening,
    transcript,
    startListening,
    stopListening,
    parseCommand,
    supported: !!recognition
  };
}

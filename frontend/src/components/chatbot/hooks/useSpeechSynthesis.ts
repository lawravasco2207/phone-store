import { useState, useEffect } from 'react';

interface UseSpeechSynthesisProps {
  isCheckoutMode: boolean;
}

interface SpeechSynthesisState {
  isSpeaking: boolean;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  setVoiceRate: (rate: number) => void;
  setVoicePitch: (pitch: number) => void;
  setVoiceVolume: (volume: number) => void;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
  speak: (text: string) => void;
}

export const useSpeechSynthesis = ({ 
  isCheckoutMode 
}: UseSpeechSynthesisProps): SpeechSynthesisState => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceRate, setVoiceRate] = useState(1.0);
  // Slightly lower default pitch for a more masculine tone (overridable by settings)
  const [voicePitch, setVoicePitch] = useState(0.9);
  const [voiceVolume, setVoiceVolume] = useState(1.0);

  const pickMalePreferredVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (!voices || voices.length === 0) return null;
    const maleHints = ['male','david','daniel','alex','mark','mike','john','guy','ryan','george','matthew','brian','justin','joey','arthur','fred','giles'];
    const isMaleish = (v: SpeechSynthesisVoice) => {
      const n = (v.name || '').toLowerCase();
      const u = (v.voiceURI || '').toLowerCase();
      return maleHints.some(h => n.includes(h) || u.includes(h)) || /english.*male/i.test(v.name || '');
    };
    const english = voices.filter(v => (v.lang || '').toLowerCase().startsWith('en'));
    const englishMale = english.filter(isMaleish);
    if (englishMale.length) return englishMale[0];
    const anyMale = voices.filter(isMaleish);
    if (anyMale.length) return anyMale[0];
    // Fallbacks
    if (english.length) return english[0];
    return voices[0] || null;
  };

  // Check for Speech Synthesis support
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      setIsSupported(false);
      return;
    }
    
    // Get available voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Set default voice (prefer male English voice)
        const preferred = pickMalePreferredVoice(voices);
        setSelectedVoice(preferred || voices[0]);
      }
    };
    
    // Initial load
    loadVoices();
    
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = (text: string) => {
    if (!isSupported || isCheckoutMode) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice settings
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = 'en-US';
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    utterance.volume = voiceVolume;
    
    // Handle speaking states
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  };

  return {
    isSpeaking,
    isSupported,
    availableVoices,
    selectedVoice,
    voiceRate,
    voicePitch,
    voiceVolume,
    setVoiceRate,
    setVoicePitch,
    setVoiceVolume,
    setSelectedVoice,
    speak
  };
};

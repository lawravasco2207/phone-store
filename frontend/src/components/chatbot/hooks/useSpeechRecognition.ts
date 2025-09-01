import { useState, useEffect, useRef } from 'react';
import VoiceVisualizer from '../components/VoiceVisualizer';

// Ensure the SpeechRecognition global types are available
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface UseSpeechRecognitionProps {
  continuousListening: boolean;
  isSpeaking: boolean;
  isCheckoutMode: boolean;
  onResult: (text: string) => void;
}

interface SpeechRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  browserCompatWarning: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleListening: () => void;
  visualizerData: number[];
}

// Hook for speech recognition functionality
export const useSpeechRecognition = ({
  continuousListening,
  isSpeaking,
  isCheckoutMode,
  onResult
}: UseSpeechRecognitionProps): SpeechRecognitionState => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [browserCompatWarning, setBrowserCompatWarning] = useState('');
  const [visualizerData, setVisualizerData] = useState<number[]>([]);
  
  // Refs to store objects and state that shouldn't trigger re-renders
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const visualizerRef = useRef<VoiceVisualizer | null>(null);
  const timerRef = useRef<number | null>(null);
  
  // Initialize recognition instance and check browser compatibility once
  useEffect(() => {
    // Detect browser compatibility
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent);
    const isEdge = /Edge|Edg/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    // Check for SpeechRecognition support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      setIsSupported(false);
      
      if (isFirefox) {
        setBrowserCompatWarning('Firefox has limited support for voice recognition. For the best experience, try Chrome or Edge.');
      } else if (isSafari) {
        setBrowserCompatWarning('Safari has limited support for voice recognition. For the best experience, try Chrome or Edge.');
      } else {
        setBrowserCompatWarning('Your browser doesn\'t support voice recognition. For the best experience, try Chrome or Edge.');
      }
      return;
    } else if (!(isChrome || isEdge)) {
      setBrowserCompatWarning('For the best voice experience, try using Chrome or Edge.');
    }
    
    // Create SpeechRecognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Configure event handlers for recognition
    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      // Only send non-empty final results
      if (finalTranscript.trim() !== '') {
        onResult(finalTranscript.trim());
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Only update state if we were listening
      if (isListening) {
        setIsListening(false);
      }
      
      // Stop visualizer on error
      if (visualizerRef.current) {
        visualizerRef.current.stop();
        setVisualizerData([]);
      }
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // If continuous listening is enabled and we're still in listening mode,
      // restart recognition after a delay unless we're speaking
      if (continuousListening && isListening && !isSpeaking && !isCheckoutMode) {
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
        }
        
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          
          // Only restart if conditions are still valid
          if (continuousListening && isListening && !isSpeaking && !isCheckoutMode) {
            try {
              recognition.start();
            } catch (e) {
              console.error('Failed to restart continuous listening:', e);
              setIsListening(false);
            }
          } else {
            // Conditions changed, update state if needed
            if (isListening) {
              setIsListening(false);
            }
            
            // Stop visualizer
            if (visualizerRef.current) {
              visualizerRef.current.stop();
              setVisualizerData([]);
            }
          }
        }, 1000);
      } else {
        // Not in continuous mode or conditions not met
        if (isListening) {
          setIsListening(false);
        }
        
        // Stop visualizer
        if (visualizerRef.current) {
          visualizerRef.current.stop();
          setVisualizerData([]);
        }
      }
    };
    
    recognition.onstart = () => {
      console.log('Speech recognition started');
    };
    
    // Store the instance in the ref
    recognitionRef.current = recognition;
    
    // Clean up on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore errors from stopping recognition
        }
      }
      
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      if (visualizerRef.current) {
        visualizerRef.current.stop();
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Handle isListening state changes
  useEffect(() => {
    // Skip if speech recognition isn't supported or instance isn't ready
    if (!isSupported || !recognitionRef.current) return;
    
    if (isListening && !isSpeaking && !isCheckoutMode) {
      // Start recognition if we're supposed to be listening
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
        setIsListening(false);
      }
    } else if (!isListening && recognitionRef.current) {
      // Stop recognition if we're not supposed to be listening
      try {
        recognitionRef.current.abort();
        
        // Cancel any pending restarts
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        
        // Stop visualizer
        if (visualizerRef.current) {
          visualizerRef.current.stop();
          setVisualizerData([]);
        }
      } catch (e) {
        console.error('Failed to stop speech recognition:', e);
      }
    }
  }, [isListening, isSpeaking, isCheckoutMode, isSupported]);

  // Handle checkout mode changes
  useEffect(() => {
    if (isCheckoutMode && isListening) {
      // Stop listening during checkout
      setIsListening(false);
    }
  }, [isCheckoutMode, isListening]);

  // Initialize and handle visualizer
  const initializeVisualizer = async () => {
    if (!visualizerRef.current) {
      visualizerRef.current = new VoiceVisualizer((data) => {
        // Process and update visualizer data
        setVisualizerData(data.slice(0, 20));
      });
    }
    
    if (!visualizerRef.current.isRunning()) {
      return await visualizerRef.current.initialize();
    }
    
    return true;
  };

  // Public API functions
  const startListening = async () => {
    if (isCheckoutMode || isSpeaking || !isSupported || isListening) return;
    
    // Initialize visualizer first
    const visualizerReady = await initializeVisualizer();
    if (visualizerReady && visualizerRef.current) {
      visualizerRef.current.start();
    }
    
    // Update state - the effect will handle starting recognition
    setIsListening(true);
  };
  
  const stopListening = () => {
    if (!isListening) return;
    
    // Update state - the effect will handle stopping recognition
    setIsListening(false);
  };
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else if (!isCheckoutMode && !isSpeaking) {
      startListening().catch(error => {
        console.error('Failed to toggle listening state:', error);
      });
    }
  };

  return {
    isListening,
    isSupported,
    browserCompatWarning,
    startListening,
    stopListening,
    toggleListening,
    visualizerData
  };
};

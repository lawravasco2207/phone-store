import React from 'react';

interface VoiceSettingsProps {
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  continuousListening: boolean;
  selectedVoice: SpeechSynthesisVoice | null;
  availableVoices: SpeechSynthesisVoice[];
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
  onVolumeChange: (volume: number) => void;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
  onContinuousListeningChange: (enabled: boolean) => void;
  onClose: () => void;
}

const VoiceSettingsPanel: React.FC<VoiceSettingsProps> = ({
  voiceRate,
  voicePitch,
  voiceVolume,
  continuousListening,
  selectedVoice,
  availableVoices,
  onRateChange,
  onPitchChange,
  onVolumeChange,
  onVoiceChange,
  onContinuousListeningChange,
  onClose
}) => {
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceURI = e.target.value;
    const voice = availableVoices.find(v => v.voiceURI === voiceURI) || null;
    if (voice) {
      onVoiceChange(voice);
    }
  };

  return (
    <div className="voice-settings-panel">
      <div className="voice-settings-header">
        <h3>Voice Settings</h3>
        <button onClick={onClose} className="close-button" aria-label="Close settings">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="voice-settings-content">
        <div className="setting-group">
          <label htmlFor="voice-select">Assistant Voice</label>
          <select 
            id="voice-select" 
            value={selectedVoice?.voiceURI || ''}
            onChange={handleVoiceChange}
            className="voice-select"
          >
            {availableVoices.length === 0 && (
              <option value="">No voices available</option>
            )}
            {availableVoices.map(voice => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        <div className="setting-group">
          <label htmlFor="rate-slider">Speaking Rate: {voiceRate.toFixed(1)}x</label>
          <input 
            id="rate-slider" 
            type="range" 
            min="0.5" 
            max="2" 
            step="0.1" 
            value={voiceRate}
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
            className="slider"
          />
        </div>

        <div className="setting-group">
          <label htmlFor="pitch-slider">Voice Pitch: {voicePitch.toFixed(1)}</label>
          <input 
            id="pitch-slider" 
            type="range" 
            min="0.5" 
            max="2" 
            step="0.1" 
            value={voicePitch}
            onChange={(e) => onPitchChange(parseFloat(e.target.value))}
            className="slider"
          />
        </div>

        <div className="setting-group">
          <label htmlFor="volume-slider">Volume: {(voiceVolume * 100).toFixed(0)}%</label>
          <input 
            id="volume-slider" 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={voiceVolume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="slider"
          />
        </div>

        <div className="setting-group checkbox">
          <label htmlFor="continuous-listening">
            <input 
              id="continuous-listening" 
              type="checkbox" 
              checked={continuousListening}
              onChange={(e) => onContinuousListeningChange(e.target.checked)}
            />
            Continuous Listening Mode
          </label>
          <small className="setting-description">
            When enabled, the assistant will automatically start listening again after responding
          </small>
        </div>

        <div className="settings-shortcuts">
          <h4>Keyboard Shortcuts</h4>
          <ul>
            <li><kbd>Space</kbd> - Start/stop listening</li>
            <li><kbd>Esc</kbd> - Close chat</li>
            <li><kbd>Ctrl</kbd> + <kbd>/</kbd> - Toggle settings</li>
          </ul>
        </div>

        <button className="test-voice-btn" onClick={() => {
          const utterance = new SpeechSynthesisUtterance("Hello! This is how I'll sound with these settings.");
          utterance.voice = selectedVoice;
          utterance.rate = voiceRate;
          utterance.pitch = voicePitch;
          utterance.volume = voiceVolume;
          window.speechSynthesis.speak(utterance);
        }}>
          Test Voice
        </button>
      </div>
    </div>
  );
};

export default VoiceSettingsPanel;

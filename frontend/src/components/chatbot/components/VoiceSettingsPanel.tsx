import React from 'react';

interface VoiceSettingsPanelProps {
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

const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({
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
  return (
    <div className="voice-settings-panel">
      <div className="settings-header">
        <h3>Voice Settings</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="settings-content">
        {/* Voice selection */}
        <div className="setting-group">
          <label htmlFor="voice-select">Voice:</label>
          <select 
            id="voice-select"
            value={selectedVoice?.voiceURI || ''}
            onChange={(e) => {
              const voice = availableVoices.find(v => v.voiceURI === e.target.value);
              if (voice) onVoiceChange(voice);
            }}
          >
            {availableVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
        
        {/* Rate control */}
        <div className="setting-group">
          <label htmlFor="rate-slider">Speech rate: {voiceRate.toFixed(1)}x</label>
          <input
            id="rate-slider"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voiceRate}
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
          />
        </div>
        
        {/* Pitch control */}
        <div className="setting-group">
          <label htmlFor="pitch-slider">Pitch: {voicePitch.toFixed(1)}</label>
          <input
            id="pitch-slider"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={voicePitch}
            onChange={(e) => onPitchChange(parseFloat(e.target.value))}
          />
        </div>
        
        {/* Volume control */}
        <div className="setting-group">
          <label htmlFor="volume-slider">Volume: {Math.round(voiceVolume * 100)}%</label>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={voiceVolume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          />
        </div>
        
        {/* Continuous listening toggle */}
        <div className="setting-group">
          <label htmlFor="continuous-toggle">Continuous listening:</label>
          <input
            id="continuous-toggle"
            type="checkbox"
            checked={continuousListening}
            onChange={(e) => onContinuousListeningChange(e.target.checked)}
          />
          <span className="setting-hint">
            When enabled, the microphone will automatically listen after the assistant stops speaking.
          </span>
        </div>
      </div>
      
      <div className="settings-footer">
        <button onClick={onClose} className="settings-button">Close</button>
      </div>
    </div>
  );
};

export default VoiceSettingsPanel;

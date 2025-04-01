
import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  audioData?: Uint8Array | null;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ isRecording, audioData }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const numBars = 40;
  
  useEffect(() => {
    if (!waveformRef.current) return;
    
    if (!isRecording || !audioData) {
      // Render static waveform when not recording
      const bars = waveformRef.current.children;
      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i] as HTMLElement;
        bar.style.height = '5px';
        bar.style.transform = 'scaleY(1)';
        bar.classList.remove('animate-wave');
      }
      return;
    }
    
    // Update heights based on audio data
    const bars = waveformRef.current.children;
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i] as HTMLElement;
      const index = Math.floor(i * (audioData.length / bars.length));
      const value = audioData[index] || 128;
      const height = Math.max(3, (value / 255) * 40);
      bar.style.height = `${height}px`;
      
      // Add animation with delay based on position
      bar.classList.add('animate-wave');
      bar.style.animationDelay = `${i * 0.05}s`;
    }
  }, [isRecording, audioData]);

  return (
    <div className="flex items-center justify-center h-20 w-full">
      <div
        ref={waveformRef}
        className="flex items-center justify-center h-full"
      >
        {[...Array(numBars)].map((_, i) => (
          <div
            key={i}
            className={`waveform-bar ${isRecording ? 'bg-blue-500' : 'bg-gray-400'}`}
            style={{
              height: '5px',
              transition: 'height 0.1s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AudioWaveform;

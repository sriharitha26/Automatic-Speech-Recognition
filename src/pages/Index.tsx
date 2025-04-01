import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import AudioWaveform from '@/components/AudioWaveform';
import TranscriptionItem, { Transcription } from '@/components/TranscriptionItem';
import { audioRecorder } from '@/services/audioRecorder';
import { transcriptionService } from '@/services/transcriptionService';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const initializeModel = async () => {
      try {
        setIsLoading(true);
        await transcriptionService.loadModel();
        setModelLoaded(true);
        setIsLoading(false);
      } catch (error) {
        toast.error('Failed to load speech recognition model. Please refresh and try again.');
        setIsLoading(false);
      }
    };
    
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      initializeModel();
    }
  }, []);

  const handleToggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      await audioRecorder.startRecording(setAudioData);
      setIsRecording(true);
    } catch (error) {
      toast.error('Could not access microphone. Please check permissions and try again.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      const audioBlob = await audioRecorder.stopRecording();
      
      const newId = uuidv4();
      const newTranscription: Transcription = {
        id: newId,
        text: '',
        createdAt: new Date(),
        isProcessing: true
      };
      
      setTranscriptions(prev => [newTranscription, ...prev]);
      
      try {
        const text = await transcriptionService.transcribe(audioBlob);
        
        setTranscriptions(prev => 
          prev.map(t => 
            t.id === newId 
              ? { ...t, text, isProcessing: false } 
              : t
          )
        );
      } catch (error) {
        toast.error('Failed to transcribe audio. Please try again.');
        
        setTranscriptions(prev => 
          prev.map(t => 
            t.id === newId 
              ? { ...t, text: 'Transcription failed', isProcessing: false } 
              : t
          )
        );
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('An error occurred while processing your recording.');
      setIsRecording(false);
    }
  };

  const deleteTranscription = (id: string) => {
    setTranscriptions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-6 px-6 border-b border-border">
        <h1 className="text-2xl font-semibold text-center">Whisper Wave</h1>
        <p className="text-center text-muted-foreground mt-1">
          Automatic Speech Recognition
        </p>
      </header>

      <main className="flex-1 container max-w-3xl mx-auto p-4 md:p-6 flex flex-col">
        <div className="flex flex-col items-center justify-center py-8 mb-6">
          {isLoading ? (
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading speech recognition model...</p>
            </div>
          ) : (
            <>
              <AudioWaveform 
                isRecording={isRecording} 
                audioData={audioData} 
              />
              
              <Button
                onClick={handleToggleRecording}
                disabled={isLoading || !modelLoaded}
                size="lg"
                className={`mt-6 rounded-full w-16 h-16 ${
                  isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
              
              <p className="mt-4 text-sm text-muted-foreground">
                {isRecording
                  ? "Click to stop recording"
                  : "Click to start recording"}
              </p>
            </>
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-medium mb-4">Transcriptions</h2>
          
          {transcriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Your transcriptions will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transcriptions.map(transcription => (
                <TranscriptionItem
                  key={transcription.id}
                  transcription={transcription}
                  onDelete={deleteTranscription}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;


import { pipeline, read_audio } from '@huggingface/transformers';

export class TranscriptionService {
  private model: any = null;
  private isLoading = false;

  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) return;
    
    try {
      this.isLoading = true;
      console.log('Loading ASR model...');
      
      // Small English model, good balance of accuracy and speed
      this.model = await pipeline(
        'automatic-speech-recognition', 
        'onnx-community/whisper-tiny.en'
      );
      
      console.log('ASR model loaded successfully!');
    } catch (error) {
      console.error('Error loading ASR model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.model) {
      await this.loadModel();
    }
    
    try {
      // Convert blob to array buffer
      const buffer = await audioBlob.arrayBuffer();
      
      // Convert array buffer to a URL for the audio file
      const audioUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/webm' }));
      
      // Use read_audio helper to get the expected Float32Array format
      const audioData = await read_audio(audioUrl, 16000);
      
      // Clean up the temporary URL
      URL.revokeObjectURL(audioUrl);
      
      // Run through the model with the properly formatted audio data
      const result = await this.model(audioData);
      
      if (result && typeof result.text === 'string') {
        return result.text.trim();
      } else {
        throw new Error('Transcription failed: Invalid response');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  isModelLoaded(): boolean {
    return this.model !== null;
  }
}

export const transcriptionService = new TranscriptionService();


export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private onDataAvailable: ((data: Uint8Array) => void) | null = null;

  async startRecording(onDataCallback: (data: Uint8Array) => void): Promise<void> {
    try {
      this.audioChunks = [];
      this.onDataAvailable = onDataCallback;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      source.connect(this.analyser);
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      // Start visualizing
      this.visualize();
      
      // Set up recorder
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        this.cancelVisualization();
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Stop all tracks in the stream
        const tracks = this.mediaRecorder?.stream.getTracks() || [];
        tracks.forEach(track => track.stop());
        
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioContext?.close();
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        
        resolve(audioBlob);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  private visualize(): void {
    if (!this.analyser || !this.dataArray) return;
    
    const updateData = () => {
      if (!this.analyser || !this.dataArray) return;
      
      this.analyser.getByteFrequencyData(this.dataArray);
      
      if (this.onDataAvailable) {
        this.onDataAvailable(this.dataArray);
      }
      
      this.animationFrameId = requestAnimationFrame(updateData);
    };
    
    updateData();
  }
  
  private cancelVisualization(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

export const audioRecorder = new AudioRecorderService();

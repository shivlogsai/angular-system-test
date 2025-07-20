import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-audio-recorder',
  standalone: true,
  imports: [MatButtonModule, MatIcon, CommonModule],
  templateUrl: './audio-recorder.component.html',
  styleUrls: ['./audio-recorder.component.scss']
})
export class AudioRecorderComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('waveformCanvas') waveformCanvas!: ElementRef<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D | null = null;
  private mediaRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];
  time = '0:00/0:30';
  isRecording = false;
  isRecorded = false;
  audioUrl?: string;
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private source?: MediaStreamAudioSourceNode;
  private dataArray?: Uint8Array;
  private audio?: HTMLAudioElement;
  isPlaying = false;
  private playbackTime = 30;
  private animationFrameId?: number;
  lastWaveform: Uint8Array = new Uint8Array(60);
  constructor(private cdr: ChangeDetectorRef) {
    for (let i = 0; i < this.lastWaveform.length; i++) {
      this.lastWaveform[i] = 128 + 64 * Math.sin(i * Math.PI / 30);
    }
  }

  ngOnInit() {
    this.resetState();
    this.startWaveAnimation();
  }

  ngOnDestroy() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.audio) {
      this.audio.pause();
    }
    this.clearPlaybackInterval();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/ogg',
        'audio/mpeg'
      ];
      let mimeType = '';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      if (!mimeType) {
        throw new Error('No supported audio type found');
      }

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.audioChunks = [];
      this.isRecording = true;
      this.time = '0:00/0:30';

      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.source.connect(this.analyser);
      this.initializeCanvas();
      this.startWaveAnimation();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.audioUrl = URL.createObjectURL(audioBlob);
        console.log('Audio URL created with type:', mimeType);
      };
      this.mediaRecorder.start();

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed++;
        this.time = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}/0:30`;
        if (elapsed >= 30) {
          clearInterval(interval);
          this.stopRecording();
        }
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.isRecording = false;
      this.isRecorded = true;
      this.time = '0:30/0:30';
      if (this.analyser) {
        const barCount = 60;
        const tempData = new Uint8Array(barCount);
        this.analyser.getByteFrequencyData(tempData);
        this.lastWaveform = tempData;
      }

      if (this.audioContext) {
        this.audioContext.close();
      }

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  }


  initializeCanvas() {
    if (this.waveformCanvas && this.waveformCanvas.nativeElement) {
      const canvas = this.waveformCanvas.nativeElement;
      this.ctx = canvas.getContext('2d');
      if (!this.ctx) {
        console.error('Failed to get 2D context for canvas');
        return;
      }
      this.ctx.clearRect(0, 0, 300, 60);
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(0, 0, 300, 60);
    }
  }

  startWaveAnimation() {
    if (!this.analyser || !this.dataArray || !this.ctx) return;

    const animate = () => {
      this.analyser!.getByteFrequencyData(this.dataArray!);
      this.drawWaveform();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  drawWaveform() {
    if (!this.ctx || !this.dataArray) return;

    this.ctx.clearRect(0, 0, 300, 60);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(0, 0, 300, 60);

    const barWidth = (300 / this.dataArray.length) * 2.5;
    let x = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      const barHeight = (this.dataArray[i] / 255) * 50;
      const gradient = this.ctx.createLinearGradient(0, 60, 0, 10);
      gradient.addColorStop(0, '#d40064');
      gradient.addColorStop(1, '#ff0066');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, 60 - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }

  playRecording() {
    if (this.audioUrl) {
      this.isPlaying = true;
      this.playbackTime = 30;
      this.audio = new Audio(this.audioUrl);
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaElementSource(this.audio);
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      this.initializeCanvas();
      this.startWaveAnimation();

      this.audio.onplay = () => {
        this.isPlaying = true;
        this.updateTimer();
      };
      this.audio.onpause = () => this.isPlaying = false;
      this.audio.onended = () => {
        this.isPlaying = false;
        this.clearPlaybackInterval();
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
        }
      };
      this.audio.onerror = (e) => console.error('Audio playback error:', e);
      this.audio.play().catch(e => console.error('Play failed:', e));
    } else {
      console.error('No audio URL available');
    }
  }

  private updateTimer() {
    const interval = setInterval(() => {
      if (this.playbackTime > 0 && this.isPlaying && this.audio) {
        this.playbackTime--;
        this.time = `${Math.floor(this.playbackTime / 60)}:${(this.playbackTime % 60).toString().padStart(2, '0')}/0:30`;
      } else {
        this.clearPlaybackInterval();
      }
    }, 1000);
    this.audio!.onended = () => this.clearPlaybackInterval();
    this.audio!.onpause = () => this.clearPlaybackInterval();
  }

  private clearPlaybackInterval() {
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onpause = null;
    }
  }

  cancelRecording() {
    if (this.audio) {
      this.audio.pause();
    }
    this.isPlaying = false;
    this.clearPlaybackInterval();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.resetState();
  }

  private resetState() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.audioChunks = [];
    this.time = '0:00/0:30';
    this.isRecording = false;
    this.isRecorded = false;
    this.audioUrl = undefined;
    URL.revokeObjectURL(this.audioUrl || '');
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, 300, 60);
    }
  }

  ngAfterViewInit() {
    this.initializeCanvas();
  }
}
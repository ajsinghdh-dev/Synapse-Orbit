import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Loader2, Sparkles, AlertCircle, Volume2, X } from 'lucide-react';
import { Note, Flashcard, OrbitNode } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (note: Partial<Note>, newCards?: Partial<Flashcard>[], newSubtopics?: string[]) => void;
  subjects: string[];
}

export const AudioTranscriberModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveNote,
  subjects,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || 'Neuroscience');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Stop recording & cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  if (!isOpen) return null;

  // Start Live Microphone Recording
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize Web Audio API for visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Start canvas waveform visualizer
      drawWaveform();

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250); // collect 250ms chunks
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setError('Microphone access denied or not available. You can also upload an audio file below.');
    }
  };

  // Draw audio frequency bars in HUD style
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

        // Cyan to blue neon gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#00b4d8');
        gradient.addColorStop(1, '#00f5d4');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };

    render();
  };

  // Stop Recording and trigger AI Transcription
  const stopRecordingAndTranscribe = async () => {
    if (!mediaRecorderRef.current) return;

    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await processAudioBlob(audioBlob, 'audio/webm');
    };
  };

  // Process file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAudioBlob(file, file.type || 'audio/mp3');
  };

  // Send to backend Gemini API
  const processAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setError(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];

        const response = await fetch('/api/ai/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType,
            subject: selectedSubject,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to transcribe audio on server');
        }

        const data = await response.json();

        // Pass to note handler
        onSaveNote(
          {
            title: data.title || `Lecture Note (${new Date().toLocaleTimeString()})`,
            contentMarkdown: data.notesMarkdown || data.transcript,
            summary: data.summary || 'Transcribed lecture recording',
            subject: selectedSubject,
            tags: data.tags || ['Voice Memo', selectedSubject],
            difficulty: 3,
            transcription: data.transcript,
          },
          data.flashcards || []
        );

        onClose();
      };
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Error transcribing audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#050914] shadow-2xl overflow-hidden font-mono text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#091124]">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-cyan-400" />
            <span className="font-display font-bold text-white text-base tracking-wide">
              Neural Audio Transcriber
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-950/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject Target */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">TARGET SUBJECT HUB</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isRecording || isTranscribing}
              className="w-full bg-[#0a1224] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Waveform Canvas Visualizer */}
          <div className="rounded-xl border border-slate-800 bg-[#03060d] p-4 text-center">
            <canvas
              ref={canvasRef}
              width={400}
              height={100}
              className="w-full h-24 rounded-lg block mx-auto bg-[#050914]"
            />

            <div className="mt-4 flex items-center justify-center gap-4 text-xs font-mono">
              <span className="text-slate-400">RECORD TIME:</span>
              <span className={`text-base font-bold ${isRecording ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`}>
                {formatSeconds(recordingDuration)}
              </span>
            </div>
          </div>

          {/* Controls */}
          {isTranscribing ? (
            <div className="flex flex-col items-center justify-center p-6 space-y-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="text-sm font-semibold text-white">Transcribing & Synthesizing Neural Notes...</div>
              <div className="text-xs text-slate-400 text-center">
                Gemini 3.5 is parsing academic terminology, formulas, and generating spaced flashcards.
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm shadow-lg shadow-cyan-500/20 transition active:scale-95"
                >
                  <Mic className="w-4 h-4 text-black" />
                  <span>Start Live Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecordingAndTranscribe}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-600/30 transition active:scale-95 animate-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop & Transcribe</span>
                </button>
              )}

              {/* Upload file alternative */}
              <label className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-700 hover:border-cyan-500 bg-slate-900/60 text-slate-300 text-xs cursor-pointer transition">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload Audio</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isRecording || isTranscribing}
                />
              </label>
            </div>
          )}

          {/* Quick Info */}
          <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
            ✨ Voice memos and recorded lectures are automatically converted into structured markdown notes with key takeaways, formulas, and Anki-style active recall flashcards placed directly into your orbit.
          </div>
        </div>
      </div>
    </div>
  );
};

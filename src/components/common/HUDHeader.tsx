import React, { useState, useEffect } from 'react';
import { 
  Orbit, FileText, Layers, Calendar, Mic, Plus, 
  Smartphone, Radio, Clock, ShieldCheck, Sparkles, Search
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenTranscriber: () => void;
  onOpenNewNote: () => void;
  onOpenSyncModal: () => void;
  syncKey: string;
  notesCount: number;
  flashcardsCount: number;
  eventsCount: number;
}

export const HUDHeader: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenTranscriber,
  onOpenNewNote,
  onOpenSyncModal,
  syncKey,
  notesCount,
  flashcardsCount,
  eventsCount,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full border-b border-cyan-500/20 bg-[#040711]/95 backdrop-blur-md z-30 font-mono text-slate-300 px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Telemetry Identifiers */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onTabChange('canvas')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400 transition shadow-lg shadow-cyan-500/10">
              <Orbit className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-white text-sm tracking-wider">
                  SYNAPSE ORBIT
                </span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-black text-[9px] font-bold">
                  SR-7832
                </span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                57.0062 // NEURAL SOLAR MATRIX
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800 text-[10px] text-slate-500">
            <span className="text-cyan-400 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> ROOM: {syncKey}
            </span>
            <span>•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeStr}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#060c1c] p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onTabChange('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'canvas'
                ? 'bg-cyan-500 text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connectome</span>
          </button>

          <button
            onClick={() => onTabChange('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'notes'
                ? 'bg-cyan-500 text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes ({notesCount})</span>
          </button>

          <button
            onClick={() => onTabChange('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'flashcards'
                ? 'bg-cyan-500 text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flashcards ({flashcardsCount})</span>
          </button>

          <button
            onClick={() => onTabChange('syllabus')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'syllabus'
                ? 'bg-cyan-500 text-black font-semibold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Syllabus & Exams</span>
          </button>
        </nav>

        {/* Action Controls & Mobile / Install Hub */}
        <div className="flex items-center gap-2">
          {/* Audio Transcriber Button */}
          <button
            onClick={onOpenTranscriber}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-semibold shadow-sm transition active:scale-95"
            title="Transcribe Lecture or Voice Memo"
          >
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Transcribe</span>
          </button>

          {/* New Note Button */}
          <button
            onClick={onOpenNewNote}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold shadow-md shadow-cyan-500/20 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>

          {/* PWA Install Button + iOS/Android Sync Hub */}
          <PWAInstallButton onOpenSyncModal={onOpenSyncModal} />
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Save, X, Eye, Edit3, Trash2, Calendar, 
  HelpCircle, Share2, Tag, Loader2, ArrowRight
} from 'lucide-react';
import { Note, Flashcard, OrbitNode } from '../../types';

interface Props {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note, newCards?: Partial<Flashcard>[], newSubtopics?: string[]) => void;
  onDelete?: (noteId: string) => void;
  onScheduleStudy?: (note: Note) => void;
  subjects: string[];
}

export const NoteEditorModal: React.FC<Props> = ({
  note,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onScheduleStudy,
  subjects,
}) => {
  const [title, setTitle] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [summary, setSummary] = useState('');
  const [subject, setSubject] = useState(subjects[0] || 'Neuroscience');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(3);
  const [previewMode, setPreviewMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiActionMessage, setAiActionMessage] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContentMarkdown(note.contentMarkdown || '');
      setSummary(note.summary || '');
      setSubject(note.subject || subjects[0] || 'Neuroscience');
      setTags(note.tags || []);
      setDifficulty(note.difficulty || 3);
    } else {
      setTitle('');
      setContentMarkdown('');
      setSummary('');
      setSubject(subjects[0] || 'Neuroscience');
      setTags(['New Concept']);
      setDifficulty(3);
    }
  }, [note, subjects]);

  if (!isOpen) return null;

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // AI Actions: Generate / Expand / Mind-Map
  const handleAiAction = async (actionType: 'create' | 'expand' | 'summarize') => {
    setIsAiLoading(true);
    setAiActionMessage(
      actionType === 'expand'
        ? 'Deep diving into mathematical rigor & biophysical pathways...'
        : actionType === 'summarize'
        ? 'Synthesizing high-yield exam takeaways...'
        : 'Synthesizing comprehensive study note from prompt...'
    );

    try {
      const response = await fetch('/api/ai/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: title || 'Untitled Study Concept',
          subject,
          rawInput: contentMarkdown,
          action: actionType,
        }),
      });

      if (!response.ok) throw new Error('AI Generation failed');
      const data = await response.json();

      if (data.title && !title) setTitle(data.title);
      setContentMarkdown(data.contentMarkdown || contentMarkdown);
      setSummary(data.summary || summary);
      if (data.tags?.length) {
        setTags((prev) => Array.from(new Set([...prev, ...data.tags])));
      }
      if (data.difficulty) setDifficulty(data.difficulty);
    } catch (err) {
      console.error('AI Error:', err);
    } finally {
      setIsAiLoading(false);
      setAiActionMessage('');
    }
  };

  // AI Flashcard Generation from current note
  const handleGenerateFlashcards = async () => {
    setIsAiLoading(true);
    setAiActionMessage('Synthesizing active-recall flashcard deck...');
    try {
      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent: contentMarkdown,
          topic: title,
          subject,
          count: 5,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate flashcards');
      const data = await response.json();

      const createdNote: Note = {
        id: note?.id || `note-${Date.now()}`,
        title: title || 'Untitled Note',
        contentMarkdown,
        summary,
        subject,
        tags,
        difficulty,
        orbitSubtopics: note?.orbitSubtopics || [],
        orbitNodeId: note?.orbitNodeId,
        createdAt: note?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      onSave(createdNote, data.cards || []);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save changes
  const handleSave = () => {
    const updatedNote: Note = {
      id: note?.id || `note-${Date.now()}`,
      title: title || 'Untitled Concept Node',
      contentMarkdown,
      summary,
      subject,
      tags,
      difficulty,
      orbitSubtopics: note?.orbitSubtopics || [],
      orbitNodeId: note?.orbitNodeId,
      createdAt: note?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    onSave(updatedNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-cyan-500/40 bg-[#050914] shadow-2xl overflow-hidden font-mono text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#081024]">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-cyan-500 text-black text-xs font-bold font-mono">
              NOTE ORBIT
            </span>
            <span className="text-xs text-slate-400">TELEMETRY // [SR-{note?.id ? note.id.slice(-4) : 'NEW'}]</span>
          </div>

          <div className="flex items-center gap-2">
            {onScheduleStudy && (
              <button
                onClick={() => note && onScheduleStudy(note)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:border-cyan-500/40 text-cyan-300 text-xs transition"
                title="Schedule in Calendar"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Schedule Study</span>
              </button>
            )}

            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:text-white text-slate-300 text-xs transition"
            >
              {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{previewMode ? 'Edit' : 'Preview'}</span>
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition active:scale-95 shadow-md shadow-cyan-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Node</span>
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Action Tool Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 bg-[#09132b] border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>AI Neural Tools:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleAiAction(contentMarkdown ? 'expand' : 'create')}
              disabled={isAiLoading}
              className="px-2.5 py-1 rounded border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              <span>{contentMarkdown ? 'AI Expand & Deepen' : 'AI Generate from Title'}</span>
            </button>

            <button
              onClick={() => handleAiAction('summarize')}
              disabled={isAiLoading || !contentMarkdown}
              className="px-2.5 py-1 rounded border border-slate-700 bg-slate-900/60 hover:border-slate-500 text-slate-300 text-xs transition"
            >
              Summarize Key Takeaways
            </button>

            <button
              onClick={handleGenerateFlashcards}
              disabled={isAiLoading || !contentMarkdown}
              className="px-2.5 py-1 rounded border border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 text-xs transition flex items-center gap-1.5"
            >
              <span>Auto-Extract Flashcards</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Loading overlay for AI */}
        {isAiLoading && (
          <div className="p-3 bg-cyan-950/40 border-b border-cyan-500/30 flex items-center justify-center gap-2 text-cyan-300 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{aiActionMessage || 'Synthesizing with Gemini AI...'}</span>
          </div>
        )}

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title & Subject Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-400 mb-1">CONCEPT / NOTE TITLE</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Synaptic Plasticity & LTP Cascades"
                className="w-full bg-[#0a1224] border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-white font-display outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">PARENT SUBJECT STAR</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#0a1224] border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Summary */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">ONE-LINE SUMMARY / INTUITION</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="High-level neural intuition or one-sentence definition..."
              className="w-full bg-[#0a1224] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
            />
          </div>

          {/* Main Markdown Content */}
          <div className="flex-1 min-h-[300px]">
            <label className="block text-[10px] text-slate-400 mb-1">
              {previewMode ? 'RENDERED STUDY VIEW' : 'MARKDOWN NOTE SOURCE'}
            </label>

            {previewMode ? (
              <div className="w-full min-h-[320px] p-4 rounded-xl border border-slate-800 bg-[#03060e] text-slate-200 text-xs leading-relaxed space-y-3 select-text overflow-y-auto">
                <div className="prose prose-invert max-w-none text-slate-200 whitespace-pre-wrap font-sans">
                  {contentMarkdown || (
                    <span className="text-slate-500 italic">No content yet. Click Edit to begin typing or use AI Generate!</span>
                  )}
                </div>
              </div>
            ) : (
              <textarea
                value={contentMarkdown}
                onChange={(e) => setContentMarkdown(e.target.value)}
                placeholder="# Introduction&#10;&#10;Write detailed lecture notes, biophysical formulas, or code snippets here... You can also click 'AI Expand' above to let Gemini elaborate!"
                rows={14}
                className="w-full bg-[#03060e] border border-slate-800 focus:border-cyan-500 rounded-xl p-4 text-xs font-mono text-slate-200 leading-relaxed outline-none resize-none"
              />
            )}
          </div>

          {/* Tags and Metadata Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                <Tag className="w-3 h-3 text-cyan-400" /> Tags:
              </span>
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[10px] flex items-center gap-1"
                >
                  {t}
                  <button onClick={() => handleRemoveTag(t)} className="hover:text-red-400">
                    ×
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="+ Add tag"
                  className="bg-transparent border border-slate-800 rounded px-2 py-0.5 text-[10px] text-white outline-none w-20 focus:w-28 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            {/* Delete button if existing */}
            {note?.id && onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this neural note and its orbit?')) {
                    onDelete(note.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-red-400 hover:text-red-300 text-[11px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Node</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

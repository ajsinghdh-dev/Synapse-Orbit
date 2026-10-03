import React, { useState } from 'react';
import { 
  FileText, Search, Plus, Calendar, Tag, ArrowRight, 
  Sparkles, Layers, BookOpen, Clock, Trash2
} from 'lucide-react';
import { Note } from '../../types';

interface Props {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  onDeleteNote: (id: string) => void;
  subjects: string[];
}

export const NotesMatrixView: React.FC<Props> = ({
  notes,
  onSelectNote,
  onNewNote,
  onDeleteNote,
  subjects,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const filteredNotes = notes.filter((n) => {
    const matchesSubject = selectedSubject === 'all' || n.subject === selectedSubject;
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6 font-mono text-slate-200 overflow-y-auto">
      {/* Header and Filter Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-cyan-500/30 bg-[#050a18]/90 backdrop-blur-md">
        <div>
          <h2 className="text-white font-display font-bold text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>NEURAL NOTES MATRIX ({notes.length})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Synthesized academic study notes mapped into celestial gravitational orbits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search concepts, tags..."
              className="bg-[#03060f] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={onNewNote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition active:scale-95 shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Note</span>
          </button>
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 text-[11px]">Subject Stars:</span>
        <button
          onClick={() => setSelectedSubject('all')}
          className={`px-2.5 py-1 rounded transition ${
            selectedSubject === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Subjects ({notes.length})
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSubject(s)}
            className={`px-2.5 py-1 rounded transition ${
              selectedSubject === s
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {s} ({notes.filter((n) => n.subject === s).length})
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-2xl bg-[#040813] text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600" />
          <div className="text-slate-300 font-semibold text-sm">No notes found</div>
          <div className="text-xs text-slate-500 max-w-sm">
            Try adjusting your search criteria or create a new note with our AI Neural Assistant.
          </div>
          <button
            onClick={onNewNote}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold text-xs"
          >
            Create First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note)}
              className="p-4 rounded-xl border border-slate-800 bg-[#050914] hover:border-cyan-500/50 hover:bg-[#070e20] transition cursor-pointer flex flex-col justify-between space-y-3 group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                    {note.subject}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-semibold text-white text-sm font-display group-hover:text-cyan-300 transition line-clamp-2">
                  {note.title}
                </h3>

                <p className="text-xs text-slate-400 mt-2 font-sans line-clamp-3 leading-relaxed">
                  {note.summary || note.contentMarkdown.slice(0, 150)}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400"
                    >
                      #{t}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="text-[9px] text-slate-500">+{note.tags.length - 2}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${note.title}"?`)) onDeleteNote(note.id);
                    }}
                    className="text-slate-600 hover:text-red-400 p-1"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

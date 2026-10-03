import React, { useState } from 'react';
import { 
  Sparkles, RotateCw, CheckCircle2, AlertCircle, ChevronLeft, 
  ChevronRight, Plus, HelpCircle, Layers, Flame, BookOpen
} from 'lucide-react';
import { Flashcard } from '../../types';

interface Props {
  flashcards: Flashcard[];
  onUpdateCard: (card: Flashcard) => void;
  onAddCards: (cards: Flashcard[]) => void;
  subjects: string[];
}

export const FlashcardDeckView: React.FC<Props> = ({
  flashcards,
  onUpdateCard,
  onAddCards,
  subjects,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // AI Generator Modal state
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genSubject, setGenSubject] = useState(subjects[0] || 'Neuroscience');
  const [genCount, setGenCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter cards by subject
  const filteredCards = selectedSubject === 'all'
    ? flashcards
    : flashcards.filter(c => c.subject === selectedSubject);

  const currentCard = filteredCards[currentIndex] || null;

  // Compute deck statistics
  const masteredCount = flashcards.filter(c => c.state === 'mastered').length;
  const learningCount = flashcards.filter(c => c.state === 'learning').length;
  const reviewCount = flashcards.filter(c => c.state === 'review').length;
  const masteryPercentage = flashcards.length > 0 
    ? Math.round((masteredCount / flashcards.length) * 100) 
    : 0;

  // Rate card with spaced repetition intervals
  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    let interval = currentCard.intervalDays || 1;
    let repetitions = currentCard.repetitions || 0;
    let easeFactor = currentCard.easeFactor || 2.5;
    let newState: Flashcard['state'] = currentCard.state;

    if (rating === 'again') {
      interval = 1;
      repetitions = 0;
      newState = 'learning';
    } else if (rating === 'hard') {
      interval = Math.max(1, Math.round(interval * 1.2));
      repetitions += 1;
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      newState = 'review';
    } else if (rating === 'good') {
      interval = Math.max(2, Math.round(interval * easeFactor));
      repetitions += 1;
      newState = repetitions >= 3 ? 'mastered' : 'review';
    } else if (rating === 'easy') {
      interval = Math.max(4, Math.round(interval * easeFactor * 1.4));
      repetitions += 1;
      easeFactor += 0.15;
      newState = 'mastered';
    }

    // Due date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    const dueDateStr = nextDate.toISOString().split('T')[0];

    const updated: Flashcard = {
      ...currentCard,
      intervalDays: interval,
      repetitions,
      easeFactor,
      dueDate: dueDateStr,
      state: newState,
      lastReviewed: Date.now(),
    };

    onUpdateCard(updated);

    // Advance to next card
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  // Generate Flashcards with AI
  const handleAIGenerate = async () => {
    if (!genTopic.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genTopic,
          subject: genSubject,
          noteContent: `Create in-depth academic flashcards for high retention study on: ${genTopic}`,
          count: genCount,
        }),
      });

      if (!response.ok) throw new Error('Flashcard generation failed');
      const data = await response.json();

      const newCards: Flashcard[] = (data.cards || []).map((c: any, idx: number) => ({
        id: `card-${Date.now()}-${idx}`,
        deckTitle: data.deckTitle || `${genTopic} Deck`,
        subject: genSubject,
        front: c.front,
        back: c.back,
        hint: c.hint,
        difficulty: c.difficulty || 'medium',
        tags: c.tags || [genSubject],
        intervalDays: 1,
        repetitions: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString().split('T')[0],
        state: 'new',
      }));

      onAddCards(newCards);
      setShowGenerator(false);
      setGenTopic('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6 font-mono text-slate-200 overflow-y-auto">
      {/* Top Banner: Telemetry & Deck Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-cyan-500/30 bg-[#050a18]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-display font-bold text-base">HOLO-DECK FLASHCARDS</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-black text-[10px] font-bold">SM-2 ALGO</span>
            </div>
            <div className="text-xs text-slate-400">Active Recall & Spaced Repetition Neural Memory Matrix</div>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex flex-col items-center p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500">RETENTION RATE</span>
            <span className="text-cyan-400 font-bold text-sm">{masteryPercentage}%</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500">MASTERED</span>
            <span className="text-green-400 font-bold text-sm">{masteredCount}</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500">IN REVIEW</span>
            <span className="text-yellow-400 font-bold text-sm">{reviewCount + learningCount}</span>
          </div>

          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs transition active:scale-95 shadow-md shadow-cyan-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Generate Deck</span>
          </button>
        </div>
      </div>

      {/* Filter by subject */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 text-[11px]">Filter Subject:</span>
        <button
          onClick={() => { setSelectedSubject('all'); setCurrentIndex(0); }}
          className={`px-2.5 py-1 rounded transition ${
            selectedSubject === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Decks ({flashcards.length})
        </button>
        {subjects.map(s => (
          <button
            key={s}
            onClick={() => { setSelectedSubject(s); setCurrentIndex(0); }}
            className={`px-2.5 py-1 rounded transition ${
              selectedSubject === s
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {s} ({flashcards.filter(c => c.subject === s).length})
          </button>
        ))}
      </div>

      {/* Main Flashcard Interactive Area */}
      {filteredCards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-2xl bg-[#040813] text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600" />
          <div className="text-slate-300 font-semibold text-sm">No flashcards in this orbit yet</div>
          <div className="text-xs text-slate-500 max-w-sm">
            Use the "AI Generate Deck" button or extract flashcards automatically from your notes to begin spaced repetition.
          </div>
          <button
            onClick={() => setShowGenerator(true)}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold text-xs"
          >
            Create Flashcards with AI
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-4">
          {/* Card Meta Indicator */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 px-2">
            <span>
              CARD {currentIndex + 1} OF {filteredCards.length}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-400">
              {currentCard?.deckTitle} // {currentCard?.subject}
            </span>
            <span className="uppercase text-[10px] text-slate-500">
              Interval: {currentCard?.intervalDays}d
            </span>
          </div>

          {/* 3D Flip Card Element */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[300px] h-[320px] rounded-2xl border border-cyan-500/30 bg-[#050a18] p-8 flex flex-col justify-between cursor-pointer select-text transition-all duration-300 hover:border-cyan-400/60 shadow-2xl relative overflow-hidden"
          >
            {/* Top Tag inside card */}
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                isFlipped ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-300'
              }`}>
                {isFlipped ? 'RESPONSE / SOLUTION' : 'ACTIVE INQUIRY'}
              </span>

              <div className="flex items-center gap-2">
                {currentCard?.hint && !isFlipped && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }}
                    className="flex items-center gap-1 text-[11px] text-yellow-400/80 hover:text-yellow-300 p-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                  </button>
                )}
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <RotateCw className="w-3 h-3" /> Click to Flip
                </span>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="my-auto text-center px-4">
              {!isFlipped ? (
                <div className="space-y-4">
                  <div className="text-base sm:text-lg font-medium text-white leading-relaxed font-sans">
                    {currentCard?.front}
                  </div>
                  {showHint && currentCard?.hint && (
                    <div className="p-2.5 rounded-lg bg-yellow-950/20 border border-yellow-500/30 text-yellow-300 text-xs">
                      💡 Hint: {currentCard.hint}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm sm:text-base font-medium text-cyan-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {currentCard?.back}
                  </div>
                  {currentCard?.tags && (
                    <div className="flex flex-wrap justify-center gap-1 mt-3">
                      {currentCard.tags.map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Progress Bar */}
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Rating Buttons (Spaced Repetition SM-2) */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <button
              onClick={() => handleRate('again')}
              className="py-2.5 px-3 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-semibold flex flex-col items-center gap-0.5 transition active:scale-95"
            >
              <span>Again</span>
              <span className="text-[10px] text-red-400 font-normal">1 Day</span>
            </button>

            <button
              onClick={() => handleRate('hard')}
              className="py-2.5 px-3 rounded-xl border border-yellow-500/40 bg-yellow-950/30 hover:bg-yellow-900/40 text-yellow-300 text-xs font-semibold flex flex-col items-center gap-0.5 transition active:scale-95"
            >
              <span>Hard</span>
              <span className="text-[10px] text-yellow-400 font-normal">3 Days</span>
            </button>

            <button
              onClick={() => handleRate('good')}
              className="py-2.5 px-3 rounded-xl border border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/40 text-blue-300 text-xs font-semibold flex flex-col items-center gap-0.5 transition active:scale-95"
            >
              <span>Good</span>
              <span className="text-[10px] text-blue-400 font-normal">7 Days</span>
            </button>

            <button
              onClick={() => handleRate('easy')}
              className="py-2.5 px-3 rounded-xl border border-green-500/40 bg-green-950/30 hover:bg-green-900/40 text-green-300 text-xs font-semibold flex flex-col items-center gap-0.5 transition active:scale-95"
            >
              <span>Easy</span>
              <span className="text-[10px] text-green-400 font-normal">14 Days</span>
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between w-full pt-2 text-xs text-slate-400">
            <button
              onClick={() => {
                setIsFlipped(false);
                setShowHint(false);
                setCurrentIndex(prev => (prev > 0 ? prev - 1 : filteredCards.length - 1));
              }}
              className="flex items-center gap-1 hover:text-white p-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Flip Card (Space)
            </button>

            <button
              onClick={() => {
                setIsFlipped(false);
                setShowHint(false);
                setCurrentIndex(prev => (prev < filteredCards.length - 1 ? prev + 1 : 0));
              }}
              className="flex items-center gap-1 hover:text-white p-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* AI Deck Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-[#050914] p-6 shadow-2xl font-mono text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-display font-bold text-white text-sm">AI Flashcard Generator</span>
              </div>
              <button onClick={() => setShowGenerator(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">TOPIC OR SYLLABUS UNIT</label>
              <input
                type="text"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="e.g. Action Potentials, Krebs Cycle, Quantum Spin..."
                className="w-full bg-[#0a1224] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">SUBJECT HUB</label>
                <select
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
                  className="w-full bg-[#0a1224] border border-slate-700 rounded-lg px-2 py-2 text-xs text-white outline-none"
                >
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">CARD COUNT</label>
                <input
                  type="number"
                  min={3}
                  max={12}
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value, 10) || 5)}
                  className="w-full bg-[#0a1224] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleAIGenerate}
              disabled={isGenerating || !genTopic.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs shadow-lg shadow-cyan-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? 'Synthesizing Spaced Flashcards...' : 'Generate Deck'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

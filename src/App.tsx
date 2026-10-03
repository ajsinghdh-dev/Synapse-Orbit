/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  OrbitNode, Note, Flashcard, SyllabusPlan, CalendarEvent, ActiveTab, NodeType 
} from './types';
import { 
  INITIAL_NODES, INITIAL_NOTES, INITIAL_FLASHCARDS, 
  INITIAL_SYLLABUS_PLAN, INITIAL_CALENDAR_EVENTS 
} from './data/seedData';
import { HUDHeader } from './components/common/HUDHeader';
import { NeuralSolarCanvas } from './components/canvas/NeuralSolarCanvas';
import { NotesMatrixView } from './components/notes/NotesMatrixView';
import { NoteEditorModal } from './components/notes/NoteEditorModal';
import { AudioTranscriberModal } from './components/audio/AudioTranscriberModal';
import { FlashcardDeckView } from './components/flashcards/FlashcardDeckView';
import { SyllabusPlannerView } from './components/syllabus/SyllabusPlannerView';
import { CrossPlatformSyncModal } from './components/sync/CrossPlatformSyncModal';

const STORAGE_KEYS = {
  NODES: 'synapse_orbit_nodes',
  NOTES: 'synapse_orbit_notes',
  FLASHCARDS: 'synapse_orbit_flashcards',
  PLANS: 'synapse_orbit_plans',
  EVENTS: 'synapse_orbit_events',
  SYNC_KEY: 'synapse_orbit_sync_key',
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('canvas');

  // Core Data State (with local fallback to seedData)
  const [nodes, setNodes] = useState<OrbitNode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NODES);
    return saved ? JSON.parse(saved) : INITIAL_NODES;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
    return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
  });

  const [plans, setPlans] = useState<SyllabusPlan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLANS);
    return saved ? JSON.parse(saved) : [INITIAL_SYLLABUS_PLAN];
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : INITIAL_CALENDAR_EVENTS;
  });

  // Cross-Platform Cloud Sync State
  const [syncKey, setSyncKey] = useState<string>(() => {
    // Check URL parameters for fast mobile pairing
    const urlParams = new URLSearchParams(window.location.search);
    const paramKey = urlParams.get('synckey');
    if (paramKey) return paramKey.toUpperCase();

    const saved = localStorage.getItem(STORAGE_KEYS.SYNC_KEY);
    return saved || 'NEURAL-7832';
  });

  const [lastSyncedAt, setLastSyncedAt] = useState<number>(Date.now());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [isTranscriberOpen, setIsTranscriberOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // List of distinct subjects derived from subject stars
  const subjects = Array.from(
    new Set(nodes.filter(n => n.type === 'subject').map(n => n.subject))
  );

  // Save to LocalStorage on updates (Offline persistence)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(flashcards));
  }, [flashcards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYNC_KEY, syncKey);
  }, [syncKey]);

  // Push local state to cloud sync room
  const handlePushSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncKey,
          data: {
            notes,
            flashcards,
            studyPlans: plans,
            calendarEvents,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to push sync to cloud');
      const data = await response.json();
      setLastSyncedAt(data.updatedAt || Date.now());
    } catch (err) {
      console.error('Push sync error:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [syncKey, notes, flashcards, plans, calendarEvents]);

  // Pull cloud state from room key
  const handlePullSync = useCallback(async (keyToPull: string) => {
    setIsSyncing(true);
    try {
      const response = await fetch(`/api/sync/load/${keyToPull}`);
      if (!response.ok) throw new Error('Sync room not found or empty.');
      const result = await response.json();
      if (result.data) {
        if (result.data.notes?.length) setNotes(result.data.notes);
        if (result.data.flashcards?.length) setFlashcards(result.data.flashcards);
        if (result.data.studyPlans?.length) setPlans(result.data.studyPlans);
        if (result.data.calendarEvents?.length) setCalendarEvents(result.data.calendarEvents);
        setLastSyncedAt(result.data.updatedAt || Date.now());
        setSyncKey(keyToPull);
      }
    } catch (err) {
      console.error('Pull sync error:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Handle Canvas Node Selection
  const handleSelectNode = (node: OrbitNode) => {
    if (node.type === 'note' && node.noteId) {
      const n = notes.find(item => item.id === node.noteId);
      if (n) {
        setSelectedNote(n);
        setIsNoteEditorOpen(true);
      }
    } else if (node.type === 'flashcard') {
      setActiveTab('flashcards');
    } else if (node.type === 'exam' || node.type === 'syllabus_module') {
      setActiveTab('syllabus');
    } else if (node.type === 'subject') {
      // Open Note editor for new note under this subject
      setSelectedNote(null);
      setIsNoteEditorOpen(true);
    }
  };

  // Add new node directly from canvas
  const handleAddNodeFromCanvas = (type: NodeType) => {
    if (type === 'note') {
      setSelectedNote(null);
      setIsNoteEditorOpen(true);
    } else if (type === 'flashcard') {
      setActiveTab('flashcards');
    }
  };

  // Save Note (Create or Update) + Sync to Orbit Graph
  const handleSaveNote = (
    noteData: Partial<Note>,
    newCards?: Partial<Flashcard>[],
    newSubtopics?: string[]
  ) => {
    let targetNoteId = noteData.id || `note-${Date.now()}`;
    const now = Date.now();

    const fullNote: Note = {
      id: targetNoteId,
      title: noteData.title || 'Untitled Note',
      contentMarkdown: noteData.contentMarkdown || '',
      summary: noteData.summary || '',
      subject: noteData.subject || subjects[0] || 'Neuroscience',
      tags: noteData.tags || ['Study Note'],
      difficulty: noteData.difficulty || 3,
      orbitSubtopics: noteData.orbitSubtopics || newSubtopics || [],
      orbitNodeId: noteData.orbitNodeId || `node-note-${targetNoteId}`,
      createdAt: noteData.createdAt || now,
      updatedAt: now,
      audioRecordingUrl: noteData.audioRecordingUrl,
      transcription: noteData.transcription,
    };

    // Update notes array
    setNotes(prev => {
      const exists = prev.some(n => n.id === fullNote.id);
      return exists ? prev.map(n => (n.id === fullNote.id ? fullNote : n)) : [fullNote, ...prev];
    });

    // Create / Update Orbit Node on the Solar System Canvas!
    setNodes(prev => {
      const nodeExists = prev.some(n => n.id === fullNote.orbitNodeId);
      if (nodeExists) {
        return prev.map(n =>
          n.id === fullNote.orbitNodeId
            ? { ...n, label: fullNote.title, subject: fullNote.subject }
            : n
        );
      }

      // Find parent subject star
      const parentStar = prev.find(
        n => n.type === 'subject' && n.subject.toLowerCase() === fullNote.subject.toLowerCase()
      ) || prev[0];

      const orbitRadius = 140 + Math.random() * 80;
      const angle = Math.random() * Math.PI * 2;
      const orbitSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.002);

      const newOrbitNode: OrbitNode = {
        id: fullNote.orbitNodeId!,
        label: fullNote.title,
        code: `VA-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'note',
        subject: fullNote.subject,
        parentId: parentStar?.id,
        x: (parentStar?.x || 0) + Math.cos(angle) * orbitRadius,
        y: (parentStar?.y || 0) + Math.sin(angle) * orbitRadius,
        radius: 19,
        orbitRadius,
        orbitSpeed,
        angle,
        color: '#00f5d4',
        pulseRate: 1.5,
        progressPct: Math.floor(40 + Math.random() * 55),
        telemetryCode: `${(Math.random() * 80).toFixed(4)}`,
        noteId: fullNote.id,
      };

      return [...prev, newOrbitNode];
    });

    // Add extracted flashcards if any
    if (newCards && newCards.length > 0) {
      const createdCards: Flashcard[] = newCards.map((c, i) => ({
        id: `card-${now}-${i}`,
        noteId: fullNote.id,
        deckTitle: `${fullNote.title.slice(0, 20)} Deck`,
        subject: fullNote.subject,
        front: c.front || 'Question',
        back: c.back || 'Answer',
        hint: c.hint,
        difficulty: c.difficulty || 'medium',
        tags: c.tags || [fullNote.subject],
        intervalDays: 1,
        repetitions: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString().split('T')[0],
        state: 'new',
      }));

      setFlashcards(prev => [...createdCards, ...prev]);
    }
  };

  // Delete Note
  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    setNodes(prev => prev.filter(node => node.noteId !== noteId));
  };

  // Schedule Study Session for specific note
  const handleScheduleNoteStudy = (note: Note) => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 2);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 45);

    const newEvt: CalendarEvent = {
      id: `evt-note-${Date.now()}`,
      title: `🧠 Review: ${note.title}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      type: 'study',
      focusTopic: note.title,
      description: `Active recall study block on ${note.summary || note.title}`,
      isExam: false,
      completed: false,
      courseTitle: note.subject,
      orbitNodeId: note.orbitNodeId,
    };

    setCalendarEvents(prev => [newEvt, ...prev]);
    setActiveTab('syllabus');
  };

  // Export JSON backup string
  const exportDataJson = () => {
    return JSON.stringify(
      {
        nodes,
        notes,
        flashcards,
        plans,
        calendarEvents,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      },
      null,
      2
    );
  };

  // Import JSON backup
  const importDataJson = (jsonStr: string) => {
    const parsed = JSON.parse(jsonStr);
    if (parsed.nodes) setNodes(parsed.nodes);
    if (parsed.notes) setNotes(parsed.notes);
    if (parsed.flashcards) setFlashcards(parsed.flashcards);
    if (parsed.plans) setPlans(parsed.plans);
    if (parsed.calendarEvents) setCalendarEvents(parsed.calendarEvents);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#030308] text-slate-100 font-mono select-none">
      {/* HUD Telemetry Top Navigation */}
      <HUDHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenTranscriber={() => setIsTranscriberOpen(true)}
        onOpenNewNote={() => {
          setSelectedNote(null);
          setIsNoteEditorOpen(true);
        }}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        syncKey={syncKey}
        notesCount={notes.length}
        flashcardsCount={flashcards.length}
        eventsCount={calendarEvents.length}
      />

      {/* Main View Area */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'canvas' && (
          <NeuralSolarCanvas
            nodes={nodes}
            onSelectNode={handleSelectNode}
            onAddNode={handleAddNodeFromCanvas}
          />
        )}

        {activeTab === 'notes' && (
          <NotesMatrixView
            notes={notes}
            onSelectNote={(n) => {
              setSelectedNote(n);
              setIsNoteEditorOpen(true);
            }}
            onNewNote={() => {
              setSelectedNote(null);
              setIsNoteEditorOpen(true);
            }}
            onDeleteNote={handleDeleteNote}
            subjects={subjects}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardDeckView
            flashcards={flashcards}
            onUpdateCard={(updated) => {
              setFlashcards(prev => prev.map(c => (c.id === updated.id ? updated : c)));
            }}
            onAddCards={(newCards) => {
              setFlashcards(prev => [...newCards, ...prev]);
            }}
            subjects={subjects}
          />
        )}

        {activeTab === 'syllabus' && (
          <SyllabusPlannerView
            plans={plans}
            events={calendarEvents}
            syncKey={syncKey}
            onSavePlan={(newPlan, newEvents, newNodes) => {
              setPlans(prev => [newPlan, ...prev.filter(p => p.id !== newPlan.id)]);
              if (newEvents && newEvents.length > 0) {
                setCalendarEvents(prev => [...newEvents, ...prev]);
              }
              if (newNodes && newNodes.length > 0) {
                setNodes(prev => [...prev, ...newNodes]);
              }
            }}
            onAddCalendarEvent={(evt) => {
              setCalendarEvents(prev => {
                const idx = prev.findIndex(e => e.id === evt.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = evt;
                  return copy;
                }
                return [evt, ...prev];
              });
            }}
          />
        )}
      </main>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isNoteEditorOpen}
        onClose={() => setIsNoteEditorOpen(false)}
        note={selectedNote}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        onScheduleStudy={handleScheduleNoteStudy}
        subjects={subjects}
      />

      {/* Audio Transcriber Modal */}
      <AudioTranscriberModal
        isOpen={isTranscriberOpen}
        onClose={() => setIsTranscriberOpen(false)}
        onSaveNote={handleSaveNote}
        subjects={subjects}
      />

      {/* Cross-Platform Sync & iOS/Android Publishing Modal */}
      <CrossPlatformSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncKey={syncKey}
        onUpdateSyncKey={setSyncKey}
        onPushSync={handlePushSync}
        onPullSync={handlePullSync}
        lastSyncedAt={lastSyncedAt}
        isSyncing={isSyncing}
        exportDataJson={exportDataJson}
        importDataJson={importDataJson}
      />
    </div>
  );
}

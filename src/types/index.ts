export type NodeType = 'subject' | 'note' | 'flashcard' | 'exam' | 'syllabus_module';

export interface OrbitNode {
  id: string;
  label: string;
  code: string; // e.g. "SR-7832", "P-8931", "G-4/2"
  type: NodeType;
  subject: string;
  parentId?: string; // links note/exam node to parent subject star
  
  // Celestial & Orbital coordinates
  x: number;
  y: number;
  radius: number; // visual size of sphere
  orbitRadius: number; // distance from central or parent hub
  orbitSpeed: number; // angular velocity
  angle: number; // current orbit angle in radians
  color: string;
  pulseRate: number;
  
  // Progress & Telemetry
  progressPct: number; // e.g. 29%, 76%
  telemetryCode: string; // e.g. "DS-2893-8004", "57.0062"
  itemCount?: number;
  dueDate?: string;
  
  // Link to specific data object
  noteId?: string;
  deckId?: string;
  examId?: string;
  moduleId?: string;
}

export interface Note {
  id: string;
  title: string;
  contentMarkdown: string;
  summary: string;
  subject: string;
  tags: string[];
  difficulty: number; // 1-5
  orbitSubtopics: string[];
  orbitNodeId?: string;
  createdAt: number;
  updatedAt: number;
  audioRecordingUrl?: string;
  transcription?: string;
}

export interface Flashcard {
  id: string;
  noteId?: string;
  deckTitle: string;
  subject: string;
  front: string;
  back: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  
  // Spaced Repetition (SM-2 / Leitner metrics)
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  dueDate: string; // YYYY-MM-DD
  state: 'new' | 'learning' | 'review' | 'mastered';
  lastReviewed?: number;
}

export interface SyllabusExam {
  id: string;
  title: string;
  type: string; // Midterm, Final, Quiz
  weightPercent?: number;
  estimatedDate: string; // YYYY-MM-DD
  topicsCovered: string[];
  daysRemaining?: number;
  orbitNodeId?: string;
}

export interface SyllabusModule {
  id: string;
  unitNumber: number;
  title: string;
  estimatedDurationWeeks?: number;
  topics: string[];
  keyObjectives: string[];
  completed?: boolean;
}

export interface SyllabusPlan {
  id: string;
  courseTitle: string;
  courseCode: string;
  instructor?: string;
  exams: SyllabusExam[];
  modules: SyllabusModule[];
  recommendedWeeklyHours: number;
  studyStrategySummary: string;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO string e.g. "2026-10-06T14:00:00Z"
  endTime: string;
  type: 'study' | 'exam' | 'review' | 'flashcard_sprint';
  focusTopic: string;
  description: string;
  isExam: boolean;
  completed: boolean;
  courseTitle?: string;
  orbitNodeId?: string;
}

export interface SyncState {
  syncKey: string;
  lastSyncedAt: number;
  isSyncing: boolean;
  online: boolean;
  peerCount: number;
  serverUrl: string;
}

export type ActiveTab = 'canvas' | 'notes' | 'flashcards' | 'syllabus' | 'calendar' | 'sync';

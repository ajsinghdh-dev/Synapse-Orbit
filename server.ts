import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory sync store (can be indexed by 6-character room codes)
interface SyncData {
  notes: any[];
  flashcards: any[];
  studyPlans: any[];
  calendarEvents: any[];
  updatedAt: number;
}
const syncStore = new Map<string, SyncData>();

// Seed a demo sync key so user can test immediate sync or start fresh
syncStore.set('NEURAL-7832', {
  notes: [],
  flashcards: [],
  studyPlans: [],
  calendarEvents: [],
  updatedAt: Date.now(),
});

// Helper to escape iCal text
function escapeICalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// Generate RFC 5545 iCalendar format
function generateICalString(events: any[], calendarTitle = 'Synapse Orbit Study Schedule'): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Synapse Orbit//Neural Study System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarTitle}`,
    'X-WR-TIMEZONE:UTC',
  ];

  events.forEach((evt, idx) => {
    const uid = evt.id || `synapse-${idx}-${Date.now()}@synapseorbit.app`;
    const dtstart = evt.startTime
      ? new Date(evt.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      : now;
    const dtend = evt.endTime
      ? new Date(evt.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      : now;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);
    lines.push(`SUMMARY:${escapeICalText(evt.title || 'Study Session')}`);
    lines.push(`DESCRIPTION:${escapeICalText(evt.description || 'Auto-scheduled via Synapse Orbit')}`);
    lines.push(`STATUS:CONFIRMED`);
    if (evt.isExam) {
      lines.push('CATEGORIES:EXAM,CRITICAL');
      lines.push('PRIORITY:1');
    } else {
      lines.push('CATEGORIES:STUDY,NEURAL-ORBIT');
    }
    // 15-minute reminder alarm
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Reminder: ${escapeICalText(evt.title || 'Study Session')}`);
    lines.push('TRIGGER:-PT15M');
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/* =========================================================================
   API Endpoints
========================================================================= */

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// 1. Generate / Expand Notes
app.post('/api/ai/generate-notes', async (req: Request, res: Response) => {
  try {
    const { topic, subject, rawInput, action = 'create' } = req.body;

    const prompt = `
You are the Synapse Orbit Neural Notes Engine.
Task: ${action === 'expand' ? 'Expand and deep-dive into the existing notes' : action === 'summarize' ? 'Create a high-density summary and key takeaways' : 'Synthesize comprehensive academic study notes'}.

Subject: ${subject || 'General Knowledge'}
Topic: ${topic || 'Untitled Study Node'}
Context/Notes:
${rawInput || ''}

Generate structured notes in clear Markdown format. Include:
1. # Clear H1 Title
2. ## Conceptual Overview & Neural Intuition (mental models, how it relates to broader solar/neural nodes)
3. ## Core Fundamentals & Breakdown (organized with bullet points, bold key terms)
4. ## Mathematical Formulas / Equations / Code (if applicable, using clean formatting)
5. ## High-Yield Key Points for Exams (bulleted insights)
6. ## Flashcard Concepts (3-5 quick recall cues)

Also provide JSON metadata including suggested tags, difficulty (1-5), and 3-5 connected sub-node concepts for solar system orbits.
Format response as JSON:
{
  "title": "String",
  "contentMarkdown": "String",
  "summary": "String",
  "tags": ["String"],
  "difficulty": 3,
  "orbitSubtopics": ["subtopic 1", "subtopic 2", "subtopic 3"]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            contentMarkdown: { type: Type.STRING },
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            difficulty: { type: Type.NUMBER },
            orbitSubtopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['title', 'contentMarkdown', 'summary', 'tags', 'difficulty', 'orbitSubtopics'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error generating notes:', err);
    res.status(500).json({ error: err.message || 'Failed to generate notes' });
  }
});

// 2. Transcribe Audio (Voice Memos / Lectures)
app.post('/api/ai/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', subject = 'General' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0],
        data: audioBase64,
      },
    };

    const promptText = `
Transcribe this lecture / voice recording accurately.
Produce:
1. Exact transcription of what was said.
2. Structured lecture notes with key concepts, definitions, formulas, and action items.
3. 3-5 flashcard questions extracted from the speech.
Subject context: ${subject}

Return JSON:
{
  "transcript": "Full verbatim transcript...",
  "notesMarkdown": "Structured markdown notes...",
  "title": "Generated Lecture Title",
  "summary": "Short 2-sentence summary",
  "tags": ["Tag1", "Tag2"],
  "flashcards": [
    { "front": "Question", "back": "Answer", "hint": "Short memory cue" }
  ]
}
`;

    // Audio transcription using gemini-3.5-transcribe
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [audioPart, { text: promptText }],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Fallback clean markdown extraction
      data = {
        transcript: text,
        notesMarkdown: text,
        title: `Voice Note - ${new Date().toLocaleDateString()}`,
        summary: 'Transcribed voice recording',
        tags: ['Voice', subject],
        flashcards: [],
      };
    }

    res.json(data);
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: err.message || 'Failed to transcribe audio' });
  }
});

// 3. Generate Spaced Repetition Flashcards
app.post('/api/ai/generate-flashcards', async (req: Request, res: Response) => {
  try {
    const { noteContent, topic, subject, count = 6 } = req.body;

    const prompt = `
Create ${count} high-yield, active-recall flashcards based on this content for ${subject || 'general study'} on topic "${topic}".
Follow cognitive science best practices:
- Front should be a precise inquiry or conceptual challenge (no trivial yes/no questions).
- Back should be concise, authoritative, and provide the core answer plus brief context.
- Include a helpful hint for each.
- Assign an initial difficulty estimate ('easy', 'medium', 'hard').

Content:
${noteContent}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['front', 'back'],
              },
            },
          },
          required: ['deckTitle', 'cards'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('Error generating flashcards:', err);
    res.status(500).json({ error: err.message || 'Failed to generate flashcards' });
  }
});

// 4. Parse Syllabus & Generate Complete Study Roadmap
app.post('/api/ai/parse-syllabus', async (req: Request, res: Response) => {
  try {
    const { syllabusText, courseName, semesterEnd } = req.body;

    const todayStr = new Date().toISOString().split('T')[0];

    const prompt = `
You are an expert academic curriculum parser and study strategist.
Analyze this course syllabus and generate an actionable, comprehensive study plan.
Today's Date: ${todayStr}
Estimated Semester Target: ${semesterEnd || 'within next 90 days'}
Course Name: ${courseName || 'Unspecified Course'}

Syllabus Content:
${syllabusText}

Extract and structure:
1. Course Details (name, code, instructor, grading weights)
2. All Major Exams, Midterms, Quizzes, and Final Dates. If specific calendar dates are not mentioned, infer realistic distributed milestones starting from today.
3. Course Units / Weekly Modules with specific topics and learning objectives.
4. Auto-generated study schedule recommendations (optimal study session duration, target weekly review hours, cramming prevention tactics).

Format as strict JSON:
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            courseTitle: { type: Type.STRING },
            courseCode: { type: Type.STRING },
            instructor: { type: Type.STRING },
            exams: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
                  weightPercent: { type: Type.NUMBER },
                  estimatedDate: { type: Type.STRING },
                  topicsCovered: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['title', 'estimatedDate'],
              },
            },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  unitNumber: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  estimatedDurationWeeks: { type: Type.NUMBER },
                  topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                  keyObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['title', 'topics'],
              },
            },
            recommendedWeeklyHours: { type: Type.NUMBER },
            studyStrategySummary: { type: Type.STRING },
          },
          required: ['courseTitle', 'exams', 'modules', 'studyStrategySummary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error parsing syllabus:', err);
    res.status(500).json({ error: err.message || 'Failed to parse syllabus' });
  }
});

// 5. Auto-Schedule Study Sessions Based on Exam Dates
app.post('/api/ai/auto-schedule', async (req: Request, res: Response) => {
  try {
    const {
      courseTitle,
      exams,
      modules,
      dailyHours = 1.5,
      preferredDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday', 'Sunday'],
      targetStartDate = new Date().toISOString().split('T')[0],
    } = req.body;

    const prompt = `
Generate a calendar study schedule based on upcoming exam dates and course modules.
Course: ${courseTitle}
Start Date: ${targetStartDate}
Daily Study Capacity: ${dailyHours} hours
Preferred Study Days: ${preferredDays.join(', ')}
Exams: ${JSON.stringify(exams)}
Modules: ${JSON.stringify(modules)}

Instructions:
1. Schedule focused study blocks (e.g. 45-60 min each) strategically leading up to each exam date.
2. Implement spaced repetition: initial concept review -> active recall practice -> high-intensity practice exam mock 48h before the exam.
3. Avoid cramming the night before; include a light refresher session.
4. Output discrete calendar sessions with start and end ISO timestamps (e.g. 2026-10-05T18:00:00Z).

Format as strict JSON:
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scheduleOverview: { type: Type.STRING },
            totalSessions: { type: Type.NUMBER },
            sessions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  type: { type: Type.STRING },
                  focusTopic: { type: Type.STRING },
                  description: { type: Type.STRING },
                  isExam: { type: Type.BOOLEAN },
                  orbitNodeId: { type: Type.STRING },
                },
                required: ['title', 'startTime', 'endTime', 'description'],
              },
            },
          },
          required: ['scheduleOverview', 'sessions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error auto-scheduling:', err);
    res.status(500).json({ error: err.message || 'Failed to auto-schedule study sessions' });
  }
});

// 6. Cross-Platform Sync: Save Cloud State
app.post('/api/sync/save', (req: Request, res: Response) => {
  const { syncKey, data } = req.body;
  if (!syncKey || !data) {
    return res.status(400).json({ error: 'syncKey and data are required' });
  }

  const existing = syncStore.get(syncKey) || {
    notes: [],
    flashcards: [],
    studyPlans: [],
    calendarEvents: [],
    updatedAt: 0,
  };

  const updated: SyncData = {
    notes: data.notes || existing.notes,
    flashcards: data.flashcards || existing.flashcards,
    studyPlans: data.studyPlans || existing.studyPlans,
    calendarEvents: data.calendarEvents || existing.calendarEvents,
    updatedAt: Date.now(),
  };

  syncStore.set(syncKey, updated);
  res.json({ success: true, syncKey, updatedAt: updated.updatedAt });
});

// 7. Cross-Platform Sync: Load Cloud State
app.get('/api/sync/load/:syncKey', (req: Request, res: Response) => {
  const { syncKey } = req.params;
  const data = syncStore.get(syncKey);

  if (!data) {
    return res.status(404).json({ error: 'Sync room not found. You can start a new sync room with this key.' });
  }

  res.json({ success: true, syncKey, data });
});

// 8. Dynamic .ics Calendar Subscription Feed for iOS / Android / Google Calendar
app.get('/api/calendar/:syncKey/events.ics', (req: Request, res: Response) => {
  const { syncKey } = req.params;
  const data = syncStore.get(syncKey);
  const events = data?.calendarEvents || [];

  const icalContent = generateICalString(events, `Synapse Orbit (${syncKey})`);

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="synapse-${syncKey}.ics"`);
  res.setHeader('Cache-Control', 'no-cache');
  res.send(icalContent);
});

// 9. Instant .ics Download endpoint
app.post('/api/calendar/export-ics', (req: Request, res: Response) => {
  const { events, calendarTitle } = req.body;
  const icalContent = generateICalString(events || [], calendarTitle || 'Synapse Orbit Study Schedule');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="study-schedule.ics"');
  res.send(icalContent);
});

/* =========================================================================
   Frontend Server Mounting
========================================================================= */

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Synapse Orbit server active on port ${PORT}`);
  });
}

startServer();

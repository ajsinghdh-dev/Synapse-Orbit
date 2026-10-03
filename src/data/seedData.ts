import { Note, Flashcard, SyllabusPlan, CalendarEvent, OrbitNode } from '../types';

export const INITIAL_NODES: OrbitNode[] = [
  // Major Central Star / Subject Hub 1: Cognitive Neuroscience & Connectomics
  {
    id: 'subject-neuro',
    label: 'Cognitive Connectomics',
    code: 'SR-7832',
    type: 'subject',
    subject: 'Neuroscience',
    x: 0,
    y: 0,
    radius: 46,
    orbitRadius: 0,
    orbitSpeed: 0,
    angle: 0,
    color: '#ffffff',
    pulseRate: 1.2,
    progressPct: 76,
    telemetryCode: '57.0062',
    itemCount: 8,
  },
  // Major Subject Hub 2: Quantum Physics & Solar Dynamics
  {
    id: 'subject-quantum',
    label: 'Quantum Mechanics',
    code: 'P-8931',
    type: 'subject',
    subject: 'Quantum Physics',
    x: -280,
    y: 120,
    radius: 36,
    orbitRadius: 280,
    orbitSpeed: 0.0012,
    angle: 2.8,
    color: '#00f5d4',
    pulseRate: 1.5,
    progressPct: 29,
    telemetryCode: '46.8725',
    itemCount: 5,
  },
  // Major Subject Hub 3: Cellular Biochemistry
  {
    id: 'subject-bio',
    label: 'Cellular Biochemistry',
    code: 'RO-2893',
    type: 'subject',
    subject: 'Biochemistry',
    x: 290,
    y: -140,
    radius: 38,
    orbitRadius: 310,
    orbitSpeed: -0.0009,
    angle: 5.6,
    color: '#00b4d8',
    pulseRate: 0.9,
    progressPct: 84,
    telemetryCode: '68.3742',
    itemCount: 6,
  },

  // Satellites orbiting Cognitive Connectomics
  {
    id: 'node-note-synaptic',
    label: 'Synaptic Plasticity & LTP',
    code: 'VA-2904',
    type: 'note',
    subject: 'Neuroscience',
    parentId: 'subject-neuro',
    x: 120,
    y: 90,
    radius: 20,
    orbitRadius: 140,
    orbitSpeed: 0.0025,
    angle: 0.8,
    color: '#ffffff',
    pulseRate: 1.8,
    progressPct: 88,
    telemetryCode: '31.8472',
    noteId: 'note-1',
  },
  {
    id: 'node-note-action-potential',
    label: 'Hodgkin-Huxley Dynamics',
    code: 'KU-0073',
    type: 'note',
    subject: 'Neuroscience',
    parentId: 'subject-neuro',
    x: -110,
    y: 130,
    radius: 18,
    orbitRadius: 170,
    orbitSpeed: -0.002,
    angle: 2.4,
    color: '#00f5d4',
    pulseRate: 2.0,
    progressPct: 64,
    telemetryCode: '63.7843',
    noteId: 'note-2',
  },
  {
    id: 'node-exam-neuro-midterm',
    label: 'Neuro Midterm Exam',
    code: 'FN-9062',
    type: 'exam',
    subject: 'Neuroscience',
    parentId: 'subject-neuro',
    x: 180,
    y: -110,
    radius: 25,
    orbitRadius: 210,
    orbitSpeed: 0.0016,
    angle: 5.1,
    color: '#ff007f',
    pulseRate: 2.5,
    progressPct: 40,
    telemetryCode: 'RO-9472',
    dueDate: '2026-10-18',
    examId: 'exam-1',
  },
  {
    id: 'node-flashcard-neuro',
    label: 'Synapse Recall Deck',
    code: 'PV-1785',
    type: 'flashcard',
    subject: 'Neuroscience',
    parentId: 'subject-neuro',
    x: 70,
    y: -170,
    radius: 16,
    orbitRadius: 190,
    orbitSpeed: -0.003,
    angle: 4.2,
    color: '#00f5d4',
    pulseRate: 1.4,
    progressPct: 92,
    telemetryCode: 'TQ-0782',
    deckId: 'deck-1',
  },

  // Satellites orbiting Quantum Mechanics
  {
    id: 'node-note-schrodinger',
    label: 'Wave Equations & Superposition',
    code: 'DW-7361',
    type: 'note',
    subject: 'Quantum Physics',
    parentId: 'subject-quantum',
    x: -360,
    y: 190,
    radius: 17,
    orbitRadius: 110,
    orbitSpeed: 0.0035,
    angle: 1.2,
    color: '#00b4d8',
    pulseRate: 1.7,
    progressPct: 52,
    telemetryCode: '33.2748',
    noteId: 'note-3',
  },
  {
    id: 'node-exam-quantum-final',
    label: 'Quantum Comprehensive Exam',
    code: 'Q-9973',
    type: 'exam',
    subject: 'Quantum Physics',
    parentId: 'subject-quantum',
    x: -210,
    y: 80,
    radius: 24,
    orbitRadius: 150,
    orbitSpeed: -0.0022,
    angle: 3.9,
    color: '#ff007f',
    pulseRate: 2.8,
    progressPct: 20,
    telemetryCode: '22.106',
    dueDate: '2026-11-04',
    examId: 'exam-2',
  },

  // Satellites orbiting Cellular Biochemistry
  {
    id: 'node-note-krebs',
    label: 'ATP Synthase & Chemiosmosis',
    code: 'G-4/2',
    type: 'note',
    subject: 'Biochemistry',
    parentId: 'subject-bio',
    x: 360,
    y: -80,
    radius: 19,
    orbitRadius: 120,
    orbitSpeed: 0.003,
    angle: 0.5,
    color: '#ffffff',
    pulseRate: 1.3,
    progressPct: 95,
    telemetryCode: '37.4856',
    noteId: 'note-4',
  },
  {
    id: 'node-flashcard-krebs',
    label: 'Metabolic Cycles Mastery',
    code: 'A-7/3',
    type: 'flashcard',
    subject: 'Biochemistry',
    parentId: 'subject-bio',
    x: 230,
    y: -220,
    radius: 16,
    orbitRadius: 140,
    orbitSpeed: -0.0028,
    angle: 4.1,
    color: '#00f5d4',
    pulseRate: 1.6,
    progressPct: 78,
    telemetryCode: '15.9438',
    deckId: 'deck-2',
  },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Long-Term Potentiation (LTP) & Hebbian Synapses',
    summary: 'Biochemical cascade underlying memory consolidation, NMDA/AMPA receptor dynamics, and spine morphogenesis.',
    subject: 'Neuroscience',
    difficulty: 4,
    tags: ['Neurobiology', 'Plasticity', 'NMDA', 'Memory'],
    orbitSubtopics: ['Ca2+ influx mechanisms', 'CaMKII autophosphorylation', 'Retrograde NO signaling', 'Dendritic spine remodeling'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000 * 2,
    orbitNodeId: 'node-note-synaptic',
    contentMarkdown: `# Long-Term Potentiation (LTP) & Hebbian Synapses

## Conceptual Overview & Neural Intuition
"Neurons that fire together, wire together." LTP represents the persistent strengthening of synapses based on recent patterns of activity, serving as the primary electrophysiological mechanism for long-term memory encoding in the hippocampal formation.

## Core Fundamentals & Breakdown
1. **Presynaptic Glutamate Release**: Action potential invades the axon terminal, triggering exocytosis of glutamate into the synaptic cleft.
2. **Postsynaptic Baseline Activation**: Glutamate binds to **AMPA receptors**, permitting $Na^+$ influx and generating an excitatory postsynaptic potential (EPSP).
3. **The Magnesium Block Removal**: **NMDA receptors** are blocked by extracellular $Mg^{2+}$ ions at resting potential ($-70\\text{ mV}$). Sufficient AMPA-mediated depolarization expels the $Mg^{2+}$ plug.
4. **Calcium Influx ($Ca^{2+}$)**: With the channel unblocked, $Ca^{2+}$ enters the postsynaptic dendritic spine.
5. **Enzymatic Cascade**: High intracellular $Ca^{2+}$ binds calmodulin, activating **CaMKII** (Calcium/Calmodulin-dependent protein kinase II) and **PKC**.

## High-Yield Key Points for Exams
- **AMPA Trafficking**: CaMKII phosphorylates existing AMPA receptors (increasing single-channel conductance) and mobilizes reserve AMPA receptors from intracellular endosomes to the postsynaptic density (PSD).
- **Late-Phase LTP (L-LTP)**: Requires de novo protein synthesis and gene transcription via the **cAMP-PKA-CREB** signaling pathway.
- **Structural Plasticity**: Enlargement of dendritic spine heads into mature mushroom spines within 30-60 minutes.
`,
  },
  {
    id: 'note-2',
    title: 'Hodgkin-Huxley Dynamics & Voltage-Gated Conductance',
    summary: 'Quantitative biophysical model describing the ionic basis of the neuronal action potential using differential equations.',
    subject: 'Neuroscience',
    difficulty: 5,
    tags: ['Electrophysiology', 'Ion Channels', 'Hodgkin-Huxley', 'Math Modeling'],
    orbitSubtopics: ['Nernst and Goldman Equations', 'Gating particles m, h, n', 'Refractory periods', 'Patch-clamp analysis'],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
    orbitNodeId: 'node-note-action-potential',
    contentMarkdown: `# Hodgkin-Huxley Dynamics & Voltage-Gated Conductance

## Conceptual Overview & Neural Intuition
The giant axon of the Atlantic squid (*Loligo pealeii*) enabled Alan Hodgkin and Andrew Huxley to formulate the bedrock mathematical model of electrophysiology, quantifying how voltage-dependent conductance changes for $Na^+$ and $K^+$ generate the action potential.

## Core Fundamentals & Equations
The total membrane current $I_m$ is governed by capacitance and ionic flow:
$$I_m = C_m \\frac{dV_m}{dt} + I_{Na} + I_K + I_L$$

Where the ionic currents are:
- $I_{Na} = \\bar{g}_{Na} m^3 h (V_m - E_{Na})$
- $I_K = \\bar{g}_K n^4 (V_m - E_K)$
- $I_L = \\bar{g}_L (V_m - E_L)$

### Gating Particles:
- **m (activation of $Na^+$)**: 3 activation gates ($m^3$). Rapid opening upon depolarization.
- **h (inactivation of $Na^+$)**: 1 ball-and-chain inactivation gate ($h$). Slower closure during sustained depolarization.
- **n (activation of $K^+$)**: 4 activation gates ($n^4$). Delayed rectifier kinetics.
`,
  },
  {
    id: 'note-3',
    title: 'Quantum Superposition & Wavefunction Collapse',
    summary: 'Linear combinations of orthogonal eigenstates, Hilbert spaces, and measurement postulates in non-relativistic quantum physics.',
    subject: 'Quantum Physics',
    difficulty: 4,
    tags: ['Quantum', 'Schrodinger', 'Linear Algebra', 'Wavefunction'],
    orbitSubtopics: ['Bra-ket Dirac notation', 'Born rule probability', 'Hermitian observables', 'Decoherence'],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 4,
    orbitNodeId: 'node-note-schrodinger',
    contentMarkdown: `# Quantum Superposition & Wavefunction Collapse

## Conceptual Overview
In quantum state space, any linear combination of valid quantum state vectors constitutes another valid state vector. A state $|\\psi\\rangle$ exists simultaneously as a superposition of basis eigenstates until thermodynamic coupling to an macroscopic measurement apparatus forces state vector reduction.

## Mathematical Formulation
State expansion in an orthonormal eigenbasis $\{|\\phi_i\\rangle\}$:
$$|\\psi\\rangle = \\sum_{i} c_i |\\phi_i\\rangle, \\quad \\text{where } c_i = \\langle\\phi_i | \\psi\\rangle$$

### Normalization Condition:
$$\\sum_i |c_i|^2 = 1$$

### Born Rule Postulate:
The probability of measuring eigenvalue $\\lambda_k$ corresponding to projector $P_k = |\\phi_k\\rangle\\langle\\phi_k|$ is:
$$P(\\lambda_k) = |\\langle\\phi_k | \\psi\\rangle|^2 = |c_k|^2$$
`,
  },
  {
    id: 'note-4',
    title: 'ATP Synthase Complex & Chemiosmotic Proton Motive Force',
    summary: 'Rotary molecular motor catalysis driven by electrochemical proton gradients across the mitochondrial inner membrane.',
    subject: 'Biochemistry',
    difficulty: 3,
    tags: ['Mitochondria', 'ATP Synthase', 'Bioenergetics', 'Metabolism'],
    orbitSubtopics: ['F0 and F1 subunits', 'Boyer binding change mechanism', 'Proton flux per revolution', 'Oligomycin inhibition'],
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 86400000 * 1,
    orbitNodeId: 'node-note-krebs',
    contentMarkdown: `# ATP Synthase Complex & Chemiosmotic Proton Motive Force

## Overview & Intuition
Proposed by Peter Mitchell (1961), chemiosmosis couples electron transport to ATP synthesis via an electrochemical proton gradient ($\Delta p$). Complex V (ATP Synthase) functions as a nanoscale rotary turbine converting chemical potential into mechanical rotation and chemical high-energy phosphoanhydride bonds.

## Structural Subunits:
1. **$F_0$ Domain (Hydrophobic Membrane-Embedded Rotor)**:
   - Contains subunit **a** (two half-channels for $H^+$ entry/exit) and a ring of subunit **c** (oligomer of 8-14 subunits).
2. **$F_1$ Domain (Hydrophilic Catalytic Hexamer)**:
   - $\\alpha_3\\beta_3$ headpiece projecting into the mitochondrial matrix.
   - Catalytic activity resides exclusively on the $\\beta$ subunits.

## Paul Boyer's Binding Change Mechanism:
Each of the three $\\beta$ catalytic sites adopts one of three conformations:
1. **Open (O)**: Very low affinity for substrates; newly synthesized ATP dissociates.
2. **Loose (L)**: Binds ADP and inorganic phosphate ($P_i$) loosely and reversibly.
3. **Tight (T)**: Conformationally forces substrate condensation into ATP without external thermodynamic input.
`,
  },
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'card-1',
    noteId: 'note-1',
    deckTitle: 'Synapse Recall Deck',
    subject: 'Neuroscience',
    front: 'What ion acts as the molecular "plug" blocking the NMDA receptor pore at resting potential (-70 mV)?',
    back: 'Extracellular Magnesium ($Mg^{2+}$). Depolarization above -30 mV electrostatically repels the $Mg^{2+}$ ion, allowing $Ca^{2+}$ and $Na^+$ influx.',
    hint: 'Bivalent cation essential for chlorophyll and cellular enzymes.',
    difficulty: 'medium',
    tags: ['NMDA', 'Ion Channels', 'LTP'],
    intervalDays: 7,
    repetitions: 3,
    easeFactor: 2.5,
    dueDate: '2026-10-08',
    state: 'review',
    lastReviewed: Date.now() - 86400000 * 2,
  },
  {
    id: 'card-2',
    noteId: 'note-1',
    deckTitle: 'Synapse Recall Deck',
    subject: 'Neuroscience',
    front: 'Which primary protein kinase is autophosphorylated following high-amplitude Ca2+ influx to stabilize early-LTP?',
    back: 'CaMKII (Calcium/Calmodulin-dependent protein kinase II). Autophosphorylation at Thr286 locks the enzyme in an autonomous active state.',
    hint: 'Starts with CaM...',
    difficulty: 'hard',
    tags: ['Kinases', 'Signaling', 'LTP'],
    intervalDays: 4,
    repetitions: 2,
    easeFactor: 2.3,
    dueDate: '2026-10-06',
    state: 'learning',
    lastReviewed: Date.now() - 86400000 * 1,
  },
  {
    id: 'card-3',
    noteId: 'note-2',
    deckTitle: 'Synapse Recall Deck',
    subject: 'Neuroscience',
    front: 'In the Hodgkin-Huxley model, what power is the potassium activation variable "n" raised to, and why?',
    back: 'Raised to the 4th power ($n^4$), reflecting the cooperative gating of 4 homologous subunits forming the functional potassium tetramer channel.',
    hint: 'A single digit integer > 2 and < 5.',
    difficulty: 'hard',
    tags: ['Hodgkin-Huxley', 'Math', 'Conductance'],
    intervalDays: 14,
    repetitions: 4,
    easeFactor: 2.6,
    dueDate: '2026-10-14',
    state: 'mastered',
    lastReviewed: Date.now() - 86400000 * 4,
  },
  {
    id: 'card-4',
    noteId: 'note-3',
    deckTitle: 'Quantum Holo-Deck',
    subject: 'Quantum Physics',
    front: 'What mathematical rule yields the probability density of observing an eigenstate from its complex amplitude?',
    back: 'The Born Rule: $P(\\lambda_k) = |c_k|^2 = |\\langle\\phi_k | \\psi\\rangle|^2$. The probability equals the square modulus of the projection coefficient.',
    hint: 'Named after Max Born (Nobel Prize 1954).',
    difficulty: 'easy',
    tags: ['Quantum', 'Born Rule'],
    intervalDays: 21,
    repetitions: 5,
    easeFactor: 2.8,
    dueDate: '2026-10-21',
    state: 'mastered',
    lastReviewed: Date.now() - 86400000 * 5,
  },
  {
    id: 'card-5',
    noteId: 'note-4',
    deckTitle: 'Metabolic Cycles Mastery',
    subject: 'Biochemistry',
    front: 'In Boyer\'s binding change mechanism for ATP synthase, in which conformational state does ATP synthesis actually occur?',
    back: 'The "Tight" (T) state. Substrates ADP and Pi are mechanically compressed together into ATP by conformational free energy.',
    hint: 'Opposite of Open or Loose.',
    difficulty: 'medium',
    tags: ['ATP', 'Enzymology'],
    intervalDays: 10,
    repetitions: 3,
    easeFactor: 2.4,
    dueDate: '2026-10-10',
    state: 'review',
    lastReviewed: Date.now() - 86400000 * 3,
  },
];

export const INITIAL_SYLLABUS_PLAN: SyllabusPlan = {
  id: 'plan-neuro-101',
  courseTitle: 'NEUR-4820: Advanced Cellular & Molecular Neurobiology',
  courseCode: 'NEUR-4820',
  instructor: 'Dr. Evelyn Vance, Ph.D.',
  recommendedWeeklyHours: 8.5,
  studyStrategySummary: 'Distributed cognitive load schedule focusing on high-frequency active recall for biophysical models, coupled with timed mock exam simulations 48h prior to midterm and final orbits.',
  createdAt: Date.now() - 86400000 * 10,
  exams: [
    {
      id: 'exam-1',
      title: 'Midterm Examination: Bioelectricity & Synaptic Transmission',
      type: 'Midterm',
      weightPercent: 30,
      estimatedDate: '2026-10-18',
      topicsCovered: [
        'Resting Membrane Potential & Nernst/Goldman',
        'Hodgkin-Huxley Kinetic Conductance',
        'Neurotransmitter Release & SNARE Complex',
        'LTP, LTD, and Hebbian Synaptic Plasticity',
      ],
      daysRemaining: 15,
      orbitNodeId: 'node-exam-neuro-midterm',
    },
    {
      id: 'exam-2',
      title: 'Final Comprehensive Exam & Neuro-Circuit Defense',
      type: 'Final',
      weightPercent: 45,
      estimatedDate: '2026-11-20',
      topicsCovered: [
        'Complete Semester Syllabus',
        'Synaptic Circuits & Optogenetics',
        'Long-term Memory Systems & Hippocampal Replay',
        'Pathophysiology of Synaptopathies',
      ],
      daysRemaining: 48,
    },
  ],
  modules: [
    {
      id: 'mod-1',
      unitNumber: 1,
      title: 'Ionic Equilibrium & Membrane Capacitance',
      estimatedDurationWeeks: 2,
      topics: ['Nernst Potential', 'Goldman-Hodgkin-Katz Equation', 'Equivalent RC Circuit Model'],
      keyObjectives: ['Calculate reversal potentials', 'Model time and length constants of unmyelinated axons'],
      completed: true,
    },
    {
      id: 'mod-2',
      unitNumber: 2,
      title: 'Voltage-Gated Channels & Patch Clamp Techniques',
      estimatedDurationWeeks: 2.5,
      topics: ['Hodgkin-Huxley Conductance', 'Channel S4 Voltage Sensor', 'Whole-Cell Recording'],
      keyObjectives: ['Derive macroscopic currents from single-channel gating states'],
      completed: true,
    },
    {
      id: 'mod-3',
      unitNumber: 3,
      title: 'Synaptic Plasticity & Biochemical Cascades',
      estimatedDurationWeeks: 3,
      topics: ['LTP & LTD', 'NMDA/AMPA Trafficking', 'Retrograde Endocannabinoid Signaling'],
      keyObjectives: ['Trace the CaMKII autophosphorylation pathway from Ca2+ influx to PSD-95 anchoring'],
      completed: false,
    },
    {
      id: 'mod-4',
      unitNumber: 4,
      title: 'Neural Networks & Connectome Mapping',
      estimatedDurationWeeks: 3,
      topics: ['Small-world topologies', 'Graph theory in connectomics', 'Synaptic pruning'],
      keyObjectives: ['Analyze modularity and node centrality in mammalian cortical microcircuits'],
      completed: false,
    },
  ],
};

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: '🧠 Study Sprint: Hodgkin-Huxley Differential Gating',
    startTime: '2026-10-04T16:00:00Z',
    endTime: '2026-10-04T17:30:00Z',
    type: 'study',
    focusTopic: 'Gating particles m, h, n and voltage-clamp derivation',
    description: '45m focused recall + 15m problem solving on reversal potentials. Target: 100% mastery on Hodgkin conductance equations.',
    isExam: false,
    completed: false,
    courseTitle: 'NEUR-4820',
    orbitNodeId: 'node-note-action-potential',
  },
  {
    id: 'evt-2',
    title: '⚡ Flashcard Active Recall: Synapse Mastery Deck',
    startTime: '2026-10-05T19:00:00Z',
    endTime: '2026-10-05T19:45:00Z',
    type: 'flashcard_sprint',
    focusTopic: 'LTP, NMDA receptors, and CaMKII cascades',
    description: 'Clear the 12 due spaced repetition cards in the Holo-Deck. Aim for minimum 85% accuracy.',
    isExam: false,
    completed: false,
    courseTitle: 'NEUR-4820',
    orbitNodeId: 'node-flashcard-neuro',
  },
  {
    id: 'evt-3',
    title: '🔬 Syllabus Milestone: Deep Review Module 3',
    startTime: '2026-10-07T14:00:00Z',
    endTime: '2026-10-07T16:00:00Z',
    type: 'review',
    focusTopic: 'Synaptic Plasticity & Biochemical Cascades',
    description: 'Map out the downstream kinase signaling pathways on the Solar Canvas. Review retrograde messengers.',
    isExam: false,
    completed: false,
    courseTitle: 'NEUR-4820',
  },
  {
    id: 'evt-4',
    title: '🎯 Timed Mock Exam: Bioelectricity & Synapses',
    startTime: '2026-10-15T18:00:00Z',
    endTime: '2026-10-15T20:00:00Z',
    type: 'review',
    focusTopic: 'Comprehensive Midterm Simulation',
    description: 'Simulated 90-minute closed-book exam 72 hours before the official midterm. Identifies remaining knowledge gaps.',
    isExam: false,
    completed: false,
    courseTitle: 'NEUR-4820',
    orbitNodeId: 'node-exam-neuro-midterm',
  },
  {
    id: 'evt-exam-midterm',
    title: '🚨 EXAM ORBIT: NEUR-4820 Midterm Examination',
    startTime: '2026-10-18T13:00:00Z',
    endTime: '2026-10-18T15:00:00Z',
    type: 'exam',
    focusTopic: 'Midterm 30% Weight - Hall C / Online Proctored',
    description: 'Bring scientific calculator, student ID, and calibrated neural baseline! 50 multiple choice + 3 essay derivations.',
    isExam: true,
    completed: false,
    courseTitle: 'NEUR-4820',
    orbitNodeId: 'node-exam-neuro-midterm',
  },
];

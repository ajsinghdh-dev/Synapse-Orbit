import React, { useRef, useEffect, useState, useCallback } from 'react';
import { OrbitNode, NodeType } from '../../types';
import { 
  ZoomIn, ZoomOut, RotateCcw, Play, Pause, 
  Layers, Plus, Sparkles, Eye, Filter, Crosshair
} from 'lucide-react';

interface Props {
  nodes: OrbitNode[];
  selectedNodeId?: string | null;
  onSelectNode: (node: OrbitNode) => void;
  onAddNode: (type: NodeType) => void;
}

export const NeuralSolarCanvas: React.FC<Props> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onAddNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Transform state (Pan & Zoom)
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Animation & simulation state
  const [isPlaying, setIsPlaying] = useState(true);
  const [fiberDensity, setFiberDensity] = useState<'normal' | 'dense' | 'ultra'>('dense');
  const [showHUD, setShowHUD] = useState(true);
  const [activeFilter, setActiveFilter] = useState<NodeType | 'all'>('all');
  const [hoveredNode, setHoveredNode] = useState<OrbitNode | null>(null);
  
  // Dynamic nodes state with angles
  const nodesRef = useRef<OrbitNode[]>(nodes);
  useEffect(() => {
    // Preserve current angles when nodes update
    const currentMap = new Map(nodesRef.current.map(n => [n.id, n.angle]));
    nodesRef.current = nodes.map(n => ({
      ...n,
      angle: currentMap.get(n.id) ?? n.angle,
    }));
  }, [nodes]);

  // Particles moving along synaptic fiber curves
  const particlesRef = useRef<Array<{
    sourceId: string;
    targetId: string;
    progress: number;
    speed: number;
    curveOffset: number;
  }>>([]);

  // Initialize particles
  useEffect(() => {
    const list: typeof particlesRef.current = [];
    const subjects = nodes.filter(n => n.type === 'subject');
    const satellites = nodes.filter(n => n.type !== 'subject');

    satellites.forEach(sat => {
      const parent = nodes.find(n => n.id === sat.parentId) || subjects[0];
      if (parent) {
        // Create 2-4 synaptic impulse particles for each connection
        for (let i = 0; i < 3; i++) {
          list.push({
            sourceId: parent.id,
            targetId: sat.id,
            progress: Math.random(),
            speed: 0.003 + Math.random() * 0.006,
            curveOffset: (Math.random() - 0.5) * 80,
          });
        }
      }
    });
    particlesRef.current = list;
  }, [nodes]);

  // Center canvas on mount or window resize
  const centerCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const { width, height } = canvasRef.current;
    setPan({ x: width / 2, y: height / 2 });
    setScale(Math.min(width, height) / 950);
  }, []);

  useEffect(() => {
    centerCanvas();
  }, [centerCanvas]);

  // Main 60FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Resize to match device pixel ratio
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      // 1. Clear background: deep obsidian space
      ctx.fillStyle = '#030308';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 40 * scale;
      const startX = (pan.x % gridSize);
      const startY = (pan.y % gridSize);

      ctx.beginPath();
      for (let x = startX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = startY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw stylized background text from the reference image
      if (showHUD) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1.5;
        ctx.font = '700 80px "Space Grotesk", sans-serif';
        ctx.strokeText('NET WORK', 60, height - 120);

        // Binary code stream on the left HUD
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '10px "JetBrains Mono", monospace';
        const binaryLines = [
          '10001', '10100', '10001', '101011', '10010', '010111',
          'ET - 3940 - 8192', 'DS - 2893 - 8004', 'RT - 7832 - 9043',
        ];
        binaryLines.forEach((line, idx) => {
          ctx.fillText(line, 40, 150 + idx * 16);
        });

        // Top left title
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText('NEURAL NETWORK // SOLAR CONNECTOME', 40, 50);

        ctx.restore();
      }

      // 2. Apply Pan & Zoom transformation
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(scale, scale);

      // Update orbital rotation if playing
      if (isPlaying) {
        nodesRef.current.forEach(node => {
          if (node.orbitSpeed !== 0) {
            node.angle += node.orbitSpeed;
            // Update x, y relative to parent
            if (node.parentId) {
              const parent = nodesRef.current.find(n => n.id === node.parentId);
              if (parent) {
                node.x = parent.x + Math.cos(node.angle) * node.orbitRadius;
                node.y = parent.y + Math.sin(node.angle) * node.orbitRadius;
              }
            } else if (node.orbitRadius > 0) {
              node.x = Math.cos(node.angle) * node.orbitRadius;
              node.y = Math.sin(node.angle) * node.orbitRadius;
            }
          }
        });
      }

      // 3. Draw Concentric Solar Orbit Rings for parent hubs
      nodesRef.current.filter(n => n.type === 'subject').forEach(hub => {
        // Concentric gravitational contour rings
        const ringRadii = [hub.radius * 1.5, hub.radius * 2.4, hub.radius * 3.6, hub.radius * 5.2];
        ringRadii.forEach((r, idx) => {
          ctx.beginPath();
          ctx.arc(hub.x, hub.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = idx % 2 === 0 ? 'rgba(0, 245, 212, 0.12)' : 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          if (idx === 2) ctx.setLineDash([4, 8]);
          else ctx.setLineDash([]);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      });

      // 4. Draw Dense Synaptic Fiber Streamlines (The Signature Neural Aesthetics from the Image!)
      // Count strands based on density
      const strandCount = fiberDensity === 'ultra' ? 14 : fiberDensity === 'dense' ? 9 : 5;

      nodesRef.current.forEach(node => {
        if (!node.parentId) return;
        const parent = nodesRef.current.find(p => p.id === node.parentId);
        if (!parent) return;

        // Skip if filtered out
        if (activeFilter !== 'all' && node.type !== activeFilter && parent.type !== activeFilter) {
          return;
        }

        const isHighlighted = selectedNodeId === node.id || selectedNodeId === parent.id || hoveredNode?.id === node.id;
        const baseAlpha = isHighlighted ? 0.85 : 0.45;

        // Draw bundle of curved bezier lines between parent and child
        for (let i = 0; i < strandCount; i++) {
          const spread = (i - (strandCount - 1) / 2) * 8;
          const curveFactor = ((i % 2 === 0 ? 1 : -1) * (20 + i * 8));

          // Compute midpoint with perpendicular offset
          const midX = (parent.x + node.x) / 2 + Math.sin(node.angle + i) * curveFactor;
          const midY = (parent.y + node.y) / 2 + Math.cos(node.angle + i) * curveFactor;

          ctx.beginPath();
          ctx.moveTo(parent.x + spread * 0.3, parent.y + spread * 0.3);
          ctx.quadraticCurveTo(midX, midY, node.x, node.y);

          if (i === Math.floor(strandCount / 2)) {
            // Main backbone axon
            ctx.strokeStyle = isHighlighted ? '#00f5d4' : 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1.4;
          } else {
            // Fanning secondary synaptic fibers
            ctx.strokeStyle = i % 3 === 0 
              ? `rgba(0, 245, 212, ${baseAlpha * 0.4})` 
              : `rgba(255, 255, 255, ${baseAlpha * 0.25})`;
            ctx.lineWidth = 0.75;
          }
          ctx.stroke();
        }
      });

      // 5. Draw Action Potential Impulse Particles along fibers
      if (isPlaying) {
        particlesRef.current.forEach(p => {
          const source = nodesRef.current.find(n => n.id === p.sourceId);
          const target = nodesRef.current.find(n => n.id === p.targetId);
          if (!source || !target) return;

          p.progress += p.speed;
          if (p.progress > 1) p.progress = 0;

          // Quadratic bezier interpolation
          const t = p.progress;
          const midX = (source.x + target.x) / 2 + p.curveOffset;
          const midY = (source.y + target.y) / 2 + p.curveOffset;

          const px = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * midX + t * t * target.x;
          const py = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * midY + t * t * target.y;

          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#00f5d4';
          ctx.shadowColor = '#00f5d4';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        });
      }

      // 6. Draw Celestial & Neural Spheres (Nodes)
      nodesRef.current.forEach(node => {
        // Filter check
        if (activeFilter !== 'all' && node.type !== activeFilter && node.type !== 'subject') {
          return;
        }

        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNode?.id === node.id;

        // Outer glow on select/hover
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 14, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 245, 212, 0.12)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#00f5d4';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // High-tech target crosshairs
          const arm = node.radius + 18;
          ctx.beginPath();
          ctx.moveTo(node.x - arm, node.y); ctx.lineTo(node.x - arm + 6, node.y);
          ctx.moveTo(node.x + arm, node.y); ctx.lineTo(node.x + arm - 6, node.y);
          ctx.moveTo(node.x, node.y - arm); ctx.lineTo(node.x, node.y - arm + 6);
          ctx.moveTo(node.x, node.y + arm); ctx.lineTo(node.x, node.y + arm - 6);
          ctx.strokeStyle = '#00f5d4';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Spherical Body Base (Dark core with luminous rim)
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#040711';
        ctx.fill();

        // Rim contour
        ctx.strokeStyle = node.type === 'exam' 
          ? '#ff007f' 
          : node.type === 'subject' 
          ? '#ffffff' 
          : node.type === 'flashcard' 
          ? '#00f5d4' 
          : '#00b4d8';
        ctx.lineWidth = node.type === 'subject' ? 2.5 : 1.5;
        ctx.stroke();

        // Concentric craters / contours inside large subject planets (like in image)
        if (node.type === 'subject') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(node.x - node.radius * 0.25, node.y - node.radius * 0.25, node.radius * 0.25, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 245, 212, 0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Center nucleus light
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        } else {
          // Smaller node inner core
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = node.type === 'exam' ? '#ff007f' : '#00f5d4';
          ctx.fill();
        }

        // 7. HUD Telemetry Badges (e.g. [SR-7832], [29%], [G-4/2])
        if (showHUD) {
          ctx.save();
          ctx.font = '10px "JetBrains Mono", monospace';

          // Telemetry cyan tag
          const tagText = `[${node.code}]`;
          const textWidth = ctx.measureText(tagText).width;
          const tagX = node.x + node.radius + 8;
          const tagY = node.y - 4;

          // Cyan badge pill
          ctx.fillStyle = '#00f5d4';
          ctx.fillRect(tagX, tagY - 10, textWidth + 6, 13);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillText(node.code, tagX + 3, tagY);

          // Node Label
          ctx.fillStyle = isSelected ? '#00f5d4' : '#e2e8f0';
          ctx.font = '500 11px "Space Grotesk", sans-serif';
          ctx.fillText(node.label, tagX, tagY + 14);

          // Telemetry metric: progress % or coordinate
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '9px "JetBrains Mono", monospace';
          const subMetric = node.progressPct ? `${node.progressPct}%` : node.telemetryCode;
          ctx.fillText(`${subMetric} • ${node.telemetryCode}`, tagX, tagY + 26);

          ctx.restore();
        }
      });

      ctx.restore(); // Restore Pan & Zoom

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [pan, scale, isPlaying, fiberDensity, showHUD, activeFilter, selectedNodeId, hoveredNode]);

  // Mouse / Touch Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Check hover hit detection
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse coordinates to world space
    const worldX = (mouseX - pan.x) / scale;
    const worldY = (mouseY - pan.y) / scale;

    const hit = nodesRef.current.find(node => {
      const dx = node.x - worldX;
      const dy = node.y - worldY;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius + 12;
    });

    setHoveredNode(hit || null);
    canvas.style.cursor = hit ? 'pointer' : 'grab';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - pan.x) / scale;
    const worldY = (mouseY - pan.y) / scale;

    const hit = nodesRef.current.find(node => {
      const dx = node.x - worldX;
      const dy = node.y - worldY;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius + 14;
    });

    if (hit) {
      onSelectNode(hit);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.3), 3.0);
    setScale(newScale);
  };

  // Center on a specific node
  const focusOnNode = (node: OrbitNode) => {
    if (!canvasRef.current) return;
    const { width, height } = canvasRef.current;
    setPan({
      x: width / 2 - node.x * scale,
      y: height / 2 - node.y * scale,
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#030308] select-none">
      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Floating HUD Controls (matching telemetry aesthetic) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-1 p-1 rounded-lg border border-cyan-500/30 bg-[#050914]/90 backdrop-blur-md shadow-2xl text-xs font-mono text-cyan-300">
          <button
            onClick={() => setScale(s => Math.min(s * 1.2, 3))}
            className="p-1.5 hover:bg-cyan-500/20 rounded transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(s => Math.max(s * 0.8, 0.3))}
            className="p-1.5 hover:bg-cyan-500/20 rounded transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={centerCanvas}
            className="p-1.5 hover:bg-cyan-500/20 rounded transition"
            title="Recenter Solar System"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-700" />
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded transition ${isPlaying ? 'text-cyan-400' : 'text-slate-500'}`}
            title={isPlaying ? 'Pause Orbits' : 'Resume Orbits'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowHUD(!showHUD)}
            className={`p-1.5 rounded transition ${showHUD ? 'text-cyan-400' : 'text-slate-500'}`}
            title="Toggle HUD Telemetry"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Fiber Density & Node Filter */}
        <div className="flex items-center gap-1.5 p-1 px-2 rounded-lg border border-slate-800 bg-[#050914]/90 backdrop-blur-md text-[11px] font-mono text-slate-300">
          <span className="text-slate-500">Synapses:</span>
          {(['normal', 'dense', 'ultra'] as const).map(d => (
            <button
              key={d}
              onClick={() => setFiberDensity(d)}
              className={`px-1.5 py-0.5 rounded capitalize ${
                fiberDensity === d ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom HUD Bar: Filter Nodes & Fast Add */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Node Category Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-800 bg-[#050914]/90 backdrop-blur-md pointer-events-auto text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-1 rounded transition ${
              activeFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Orbits ({nodes.length})
          </button>
          <button
            onClick={() => setActiveFilter('note')}
            className={`px-2 py-1 rounded transition ${
              activeFilter === 'note' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Notes ({nodes.filter(n => n.type === 'note').length})
          </button>
          <button
            onClick={() => setActiveFilter('flashcard')}
            className={`px-2 py-1 rounded transition ${
              activeFilter === 'flashcard' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Flashcards ({nodes.filter(n => n.type === 'flashcard').length})
          </button>
          <button
            onClick={() => setActiveFilter('exam')}
            className={`px-2 py-1 rounded transition ${
              activeFilter === 'exam' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Exams ({nodes.filter(n => n.type === 'exam').length})
          </button>
        </div>

        {/* Quick Add Node to Solar System */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => onAddNode('note')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-mono shadow-lg transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note Node</span>
          </button>
          <button
            onClick={() => onAddNode('flashcard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 text-xs font-mono shadow-lg transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Deck Node</span>
          </button>
        </div>
      </div>

      {/* Selected Node Mini Telemetry Card */}
      {hoveredNode && (
        <div className="absolute top-16 left-6 z-20 pointer-events-none p-3 rounded-lg border border-cyan-500/40 bg-[#050a18]/90 backdrop-blur-md shadow-2xl text-xs max-w-xs font-mono text-slate-300">
          <div className="flex items-center justify-between text-cyan-400 text-[10px] pb-1 border-b border-cyan-500/20 mb-2">
            <span>ORBIT NODE // {hoveredNode.code}</span>
            <span className="uppercase">{hoveredNode.type}</span>
          </div>
          <div className="font-semibold text-white text-sm font-display mb-1">{hoveredNode.label}</div>
          <div className="text-slate-400 text-[11px] mb-2">Subject: {hoveredNode.subject}</div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-cyan-300">Mastery / Progress:</span>
            <span className="text-white font-bold">{hoveredNode.progressPct}%</span>
          </div>
          {hoveredNode.dueDate && (
            <div className="flex items-center justify-between text-[11px] text-pink-400 mt-1">
              <span>Exam Orbit Date:</span>
              <span>{hoveredNode.dueDate}</span>
            </div>
          )}
          <div className="mt-2 pt-1 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Telemetry: {hoveredNode.telemetryCode}</span>
            <span className="text-cyan-400">Click to Open</span>
          </div>
        </div>
      )}
    </div>
  );
};

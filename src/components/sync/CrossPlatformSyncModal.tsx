import React, { useState } from 'react';
import { 
  Smartphone, Apple, RefreshCw, CheckCircle2, Copy, 
  Check, Download, Upload, Shield, QrCode, Cloud, 
  Radio, X, ExternalLink, ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  syncKey: string;
  onUpdateSyncKey: (newKey: string) => void;
  onPushSync: () => Promise<void>;
  onPullSync: (keyToPull: string) => Promise<void>;
  lastSyncedAt: number;
  isSyncing: boolean;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => void;
}

export const CrossPlatformSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  syncKey,
  onUpdateSyncKey,
  onPushSync,
  onPullSync,
  lastSyncedAt,
  isSyncing,
  exportDataJson,
  importDataJson,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [inputKey, setInputKey] = useState(syncKey);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'publish' | 'backup'>('sync');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(syncKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyPairingLink = () => {
    const url = `${window.location.origin}?synckey=${syncKey}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePush = async () => {
    try {
      await onPushSync();
      setStatusMsg('Cloud State Successfully Synced!');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (e: any) {
      setStatusMsg(`Push Error: ${e.message}`);
    }
  };

  const handlePull = async () => {
    try {
      await onPullSync(inputKey);
      setStatusMsg(`Joined Sync Room [${inputKey}] and Loaded Data!`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (e: any) {
      setStatusMsg(`Pull Error: ${e.message}`);
    }
  };

  const handleExportBackup = () => {
    const dataStr = exportDataJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse-orbit-backup-${syncKey}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        importDataJson(content);
        setStatusMsg('Backup Imported Successfully!');
        setTimeout(() => setStatusMsg(null), 3000);
      } catch (err: any) {
        setStatusMsg(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-cyan-500/40 bg-[#050914] shadow-2xl overflow-hidden font-mono text-slate-200 space-y-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#091124]">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <span className="font-display font-bold text-white text-base">
                Cross-Platform Sync & Mobile Hub
              </span>
              <div className="text-[10px] text-slate-400">iOS • Android • Desktop Connectome Sync</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-[#060c1c] text-xs">
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-3 text-center border-b-2 font-semibold transition ${
              activeTab === 'sync'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Cloud Room Sync
          </button>
          <button
            onClick={() => setActiveTab('publish')}
            className={`flex-1 py-3 text-center border-b-2 font-semibold transition ${
              activeTab === 'publish'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            iOS & Android Install
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-3 text-center border-b-2 font-semibold transition ${
              activeTab === 'backup'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Local JSON Backup
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className="px-6 py-2.5 bg-cyan-950/40 border-b border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Cloud Sync */}
        {activeTab === 'sync' && (
          <div className="p-6 space-y-6">
            {/* Sync Key Card */}
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-[#070e22] space-y-3">
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>YOUR ACTIVE SYNC KEY</span>
                <span className="text-cyan-400 flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5" /> Real-time Relay Active
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-[#03060f] p-3 rounded-lg border border-slate-800">
                <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-cyan-300">
                  {syncKey}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyKey}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:border-cyan-500 text-xs text-slate-300 transition"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                  </button>

                  <button
                    onClick={handleCopyPairingLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition"
                    title="Direct URL with key included"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-black" /> : <ExternalLink className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied' : 'Pairing Link'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Enter this key on any iPhone, iPad, Android phone, or secondary browser to instantly share and sync all your Notes, Flashcards, Syllabus Plans, and Calendar Events.
              </div>
            </div>

            {/* Push / Pull Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handlePush}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 text-xs font-semibold transition active:scale-95"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>{isSyncing ? 'Syncing...' : 'Push Local Changes to Cloud'}</span>
              </button>

              <button
                onClick={handlePull}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/40 text-blue-300 text-xs font-semibold transition active:scale-95"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>Pull from Cloud Room</span>
              </button>
            </div>

            {/* Switch Room / Key */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#060c1c] space-y-3">
              <span className="text-xs font-semibold text-white">Join a Different Sync Room</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                  placeholder="e.g. NEURAL-7832"
                  className="flex-1 bg-[#03060f] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => {
                    onUpdateSyncKey(inputKey);
                    handlePull();
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold text-xs transition"
                >
                  Join & Sync
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: iOS & Android Publishing & PWA Install */}
        {activeTab === 'publish' && (
          <div className="p-6 space-y-6">
            {/* Install PWA Button if available */}
            {isInstallable && (
              <div className="p-4 rounded-xl border border-green-500/30 bg-green-950/20 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-green-400" /> Native App Install Available
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Install Synapse Orbit directly onto your Android device or desktop.
                  </p>
                </div>
                <button
                  onClick={install}
                  className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-black font-semibold text-xs transition shadow-md"
                >
                  Install Now
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* iOS Guide */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#060c1c] space-y-3">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Apple className="w-4 h-4 text-cyan-400" />
                  <span>Publish to iPhone & iPad (iOS)</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-2 leading-relaxed">
                  <li>Open Synapse Orbit in <strong>Apple Safari</strong> on your iPhone.</li>
                  <li>Tap the <strong>Share</strong> button (box with an arrow pointing up).</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top right.</li>
                  <li>The app will launch full-screen with offline support and standalone status bar!</li>
                </ol>
              </div>

              {/* Android Guide */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#060c1c] space-y-3">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Publish to Android (Chrome / APK)</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-2 leading-relaxed">
                  <li>Open Synapse Orbit in <strong>Google Chrome</strong> on Android.</li>
                  <li>Tap the <strong>Install App</strong> banner or the Chrome menu (⋮).</li>
                  <li>Tap <strong>Install Synapse Orbit</strong> or <strong>Add to Home screen</strong>.</li>
                  <li>An app icon will appear in your app drawer alongside native apps.</li>
                  <li>Features full offline service worker caching and background sync!</li>
                </ol>
              </div>
            </div>

            {/* Apple & Google Calendar Feed Subscription Info */}
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-[#070e22] space-y-2">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Live Mobile Calendar Subscription
              </span>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                You can also subscribe to your study schedule in Apple Calendar (iOS Settings → Calendar → Accounts → Add Subscribed Calendar) or Google Calendar using your private feed URL. Any session you reschedule automatically updates on your phone!
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Local Backup */}
        {activeTab === 'backup' && (
          <div className="p-6 space-y-4">
            <div className="text-xs text-slate-400 leading-relaxed font-sans">
              Export an unencrypted JSON bundle of all your Notes, Flashcard mastery ratings, Syllabus Roadmaps, and Calendar events. Useful for offline archiving or transferring between different cloud sync keys.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border border-cyan-500/40 bg-[#08122c] hover:bg-[#0d1a3c] text-cyan-300 text-xs font-semibold transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:border-cyan-500/40 text-slate-300 text-xs font-semibold cursor-pointer transition active:scale-95">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Import JSON Backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

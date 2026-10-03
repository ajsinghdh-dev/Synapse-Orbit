import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, Apple, CheckCircle2, X } from 'lucide-react';

interface Props {
  onOpenSyncModal?: () => void;
}

export const PWAInstallButton: React.FC<Props> = ({ onOpenSyncModal }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as standalone PWA
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 text-xs font-mono">
        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">PWA Active</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        {isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-semibold shadow-lg shadow-cyan-500/20 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Install App</span>
          </button>
        )}

        {isIOS && (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-cyan-500/40 bg-[#0a1020] hover:bg-[#121c35] text-cyan-300 text-xs font-mono transition"
          >
            <Apple className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">iOS Install</span>
          </button>
        )}

        {/* Universal Publish & Install Hub button */}
        <button
          onClick={onOpenSyncModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-700 bg-slate-900/60 hover:border-cyan-500/40 hover:text-cyan-300 text-slate-300 text-xs font-mono transition"
          title="iOS & Android Sync & Install Hub"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Publish / Sync</span>
        </button>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-cyan-500/40 bg-[#060a14] p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Apple className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-white font-display">Install on iPhone & iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">1</span>
                <div>
                  Tap the <strong className="text-cyan-300">Share</strong> icon in the Safari navigation bar at the bottom.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">2</span>
                <div>
                  Scroll down the menu and tap <strong className="text-cyan-300">Add to Home Screen</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">3</span>
                <div>
                  Tap <strong className="text-cyan-300">Add</strong> in the top right. Synapse Orbit will launch as an app with full offline cache and sync!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black py-2 text-xs font-semibold transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};

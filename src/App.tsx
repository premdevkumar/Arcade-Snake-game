/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MusicPlayer } from './components/MusicPlayer';
import { SnakeGame } from './components/SnakeGame';

export default function App() {
  return (
    <div className="h-screen w-full bg-[#050505] text-[#00FF41] font-mono flex flex-col overflow-hidden">
      {/* Top Bar: Navigation & Game Status */}
      <header className="h-16 flex-shrink-0 border-b border-[#1a1a1a] flex items-center justify-between px-4 md:px-8 bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-[#00FF41] animate-pulse shadow-[0_0_8px_#00FF41]"></div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic text-[#00FF41]">Neon Synth Snake</h1>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-auto flex flex-col items-center justify-center p-4 relative pb-28 md:pb-4">
        <SnakeGame />
      </main>

      {/* Persistent Music Player */}
      <MusicPlayer />
    </div>
  );
}

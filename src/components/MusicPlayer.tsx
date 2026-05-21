import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music } from 'lucide-react';

const TRACKS = [
  { id: 1, title: 'Cyber Pulse - AI Gen', artist: 'NeuralNet AI', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Neon Grid Runner', artist: 'DeepSynth AI', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 3, title: 'Digital Horizon', artist: 'AlgoBeats AI', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' }
];

export function MusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.log("Audio autoplay blocked or failed:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev === 0 ? TRACKS.length - 1 : prev - 1));
    setIsPlaying(true);
  };

  const handleEnded = () => {
    handleNext();
  };

  return (
    <footer className="w-full border-t border-[#1a1a1a] bg-[#0a0a0a] flex flex-col md:flex-row items-center justify-between px-4 md:px-12 py-4 md:h-24 flex-shrink-0 z-50">
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onEnded={handleEnded}
      />

      {/* Track Info */}
      <div className="w-full md:w-1/3 flex items-center gap-4 justify-center md:justify-start">
        <div 
          className="w-12 h-12 bg-[#111] border border-[#00FF41]/30 flex items-center justify-center text-xl shadow-[inset_0_0_10px_rgba(0,255,65,0.1)] flex-shrink-0"
        >
          <Music className={`text-[#00FF41] w-6 h-6 ${isPlaying ? 'animate-pulse' : ''}`} />
        </div>
        <div className="flex flex-col overflow-hidden max-w-[200px]">
          <span className="text-sm font-bold text-white truncate">{currentTrack.title}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest truncate">{currentTrack.artist}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full md:w-1/3 flex flex-col items-center gap-2 mt-4 md:mt-0">
        <div className="flex items-center gap-8">
          <button onClick={handlePrev} className="text-gray-500 hover:text-[#00FF41] transition-colors outline-none cursor-pointer">
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button 
            onClick={togglePlay} 
            className="w-12 h-12 rounded-full border-2 border-[#00FF41] flex items-center justify-center text-[#00FF41] hover:bg-[#00FF41] hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,65,0.2)] outline-none cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
          </button>

          <button onClick={handleNext} className="text-gray-500 hover:text-[#00FF41] transition-colors outline-none cursor-pointer">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Volume & Details */}
      <div className="w-full md:w-1/3 flex justify-center md:justify-end gap-6 items-center mt-4 md:mt-0">
        <div className="flex items-center gap-2 text-gray-500">
          <button onClick={() => setIsMuted(!isMuted)} className="hover:text-[#00FF41] transition-colors outline-none cursor-pointer">
             {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

    </footer>
  );
}

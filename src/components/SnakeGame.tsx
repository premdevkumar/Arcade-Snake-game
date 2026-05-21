import { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Play, RotateCcw } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150; // Faster initial speed

type Point = { x: number; y: number };

export function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [obstacles, setObstacles] = useState<Point[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // We use refs to store currently committed direction + next incoming direction
  // This bypasses React's async batting state problems restricting user from doing quick 180 maneuvers
  const lastDirectionRef = useRef<Point>(INITIAL_DIRECTION);
  const inputQueueRef = useRef<Point[]>([]);
  const speedRef = useRef(INITIAL_SPEED);
  const savedCallback = useRef<() => void>();

  const randomFood = useCallback((currentSnake: Point[], currentObstacles: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      const onObstacle = currentObstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y);
      if (!onSnake && !onObstacle) break;
    }
    return newFood;
  }, []);

  const randomObstacle = useCallback((currentSnake: Point[], currentFood: Point, currentObstacles: Point[]) => {
    let newObs: Point;
    while (true) {
      newObs = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const onSnake = currentSnake.some(segment => segment.x === newObs.x && segment.y === newObs.y);
      const onFood = currentFood.x === newObs.x && currentFood.y === newObs.y;
      const onObstacle = currentObstacles.some(obs => obs.x === newObs.x && obs.y === newObs.y);
      
      const head = currentSnake[0];
      const dir = lastDirectionRef.current;
      const inFront = (
         (newObs.x === head.x + dir.x && newObs.y === head.y + dir.y) ||
         (newObs.x === head.x + dir.x * 2 && newObs.y === head.y + dir.y * 2)
      );

      if (!onSnake && !onFood && !onObstacle && !inFront) break;
    }
    return newObs;
  }, []);

  const resetGame = () => {
    const startSnake = [{ x: 10, y: 10 }];
    setSnake(startSnake);
    lastDirectionRef.current = INITIAL_DIRECTION;
    inputQueueRef.current = [];
    speedRef.current = INITIAL_SPEED;
    setObstacles([]);
    setFood(randomFood(startSnake, []));
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault(); // Stop screen from scrolling heavily
      }
      
      if (!isPlaying || isGameOver) return;
      
      const lastInput = inputQueueRef.current.length > 0 
        ? inputQueueRef.current[inputQueueRef.current.length - 1] 
        : lastDirectionRef.current;
        
      let nextDir: Point | null = null;
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
          if (lastInput.y !== 1) nextDir = { x: 0, y: -1 }; break;
        case 'ArrowDown':
        case 's':
          if (lastInput.y !== -1) nextDir = { x: 0, y: 1 }; break;
        case 'ArrowLeft':
        case 'a':
          if (lastInput.x !== 1) nextDir = { x: -1, y: 0 }; break;
        case 'ArrowRight':
        case 'd':
          if (lastInput.x !== -1) nextDir = { x: 1, y: 0 }; break;
      }
      
      if (nextDir) {
        // Prevent adding redundant inputs
        if (nextDir.x !== lastInput.x || nextDir.y !== lastInput.y) {
          inputQueueRef.current.push(nextDir);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver]);

  useEffect(() => {
    speedRef.current = Math.max(50, INITIAL_SPEED - (snake.length * 8));
  }, [snake.length]);

  useEffect(() => {
    savedCallback.current = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        
        let dir = lastDirectionRef.current;
        if (inputQueueRef.current.length > 0) {
           dir = inputQueueRef.current.shift()!;
           lastDirectionRef.current = dir;
        }
        
        const newHead = { 
          x: head.x + dir.x, 
          y: head.y + dir.y 
        };

        // Out of bounds detection
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE || 
          newHead.y < 0 || newHead.y >= GRID_SIZE
        ) {
          setIsGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        // Self-collision detection
        if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          setIsGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        // Obstacle collision detection
        if (obstacles.some(obs => obs.x === newHead.x && obs.y === newHead.y)) {
          setIsGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Apple Eaten detection
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          
          let nextObstacles = [...obstacles];
          // Spawn an obstacle every 3 foods to make getting longer harder
          if ((newSnake.length - 1) % 3 === 0) {
             const newObs = randomObstacle(newSnake, food, nextObstacles);
             nextObstacles.push(newObs);
             setObstacles(nextObstacles);
          }

          setFood(randomFood(newSnake, nextObstacles));
        } else {
          newSnake.pop(); // Standard movement clears the tail end
        }

        return newSnake;
      });
    };
  }); // runs on every render to keep savedCallback fresh

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    
    const tick = () => {
      savedCallback.current?.();
      timeoutId = setTimeout(tick, speedRef.current);
    };
    
    timeoutId = setTimeout(tick, speedRef.current);
    return () => clearTimeout(timeoutId);
  }, [isPlaying, isGameOver]);

  // Handle caching the final high score when game ends
  useEffect(() => {
    if (isGameOver) {
      setHighScore(prev => {
        const newHigh = Math.max(prev, score);
        localStorage.setItem('snakeHighScore', newHigh.toString());
        return newHigh;
      });
    }
  }, [isGameOver, score]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 gap-6 select-none relative">
      
      {/* Heads-up Display Panel */}
      <div className="w-full max-w-[512px] flex justify-between items-center bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-none z-10 mb-[-1.5rem]">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-tight">Current Score</span>
          <span className="text-2xl font-bold text-[#00FF41] leading-none mt-1">{score.toString().padStart(6, '0')}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-tight">Speed</span>
          <span className="text-2xl font-bold text-[#00FF41] leading-none mt-1">{Math.floor(1000 / Math.max(50, INITIAL_SPEED - (snake.length * 8)))}<span className="text-sm ml-1 text-gray-500">u/s</span></span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-tight flex items-center gap-2">
            High Score
          </span>
          <span className="text-2xl font-bold text-gray-400 leading-none mt-1">{highScore.toString().padStart(6, '0')}</span>
        </div>
      </div>

      {/* Main Game Surface Canvas */}
      <div className="w-full aspect-square max-w-[512px] border border-[#00FF41]/20 bg-[#000] shadow-[0_0_50px_rgba(0,255,65,0.05)] rounded-none relative overflow-hidden flex-shrink-0">
        
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00FF41 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        {/* Render Snake Array Elements */}
        {snake.map((segment, index) => {
          const isHead = index === 0;
          return (
            <div 
              key={`${segment.x}-${segment.y}-${index}`}
              className={`absolute rounded-[2px] ${isHead ? 'bg-white shadow-[0_0_20px_#fff] z-10 flex items-center justify-center' : 'bg-[#00FF41] shadow-[0_0_15px_#00FF41]'}`}
              style={{
                left: `${(segment.x / GRID_SIZE) * 100}%`,
                top: `${(segment.y / GRID_SIZE) * 100}%`,
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
              }}
            />
          );
        })}

        {/* Render Food Pickup Element */}
        <div 
          className="absolute bg-red-500 shadow-[0_0_10px_#ff0000] rounded-sm animate-pulse"
          style={{
            left: `${(food.x / GRID_SIZE) * 100}%`,
            top: `${(food.y / GRID_SIZE) * 100}%`,
            width: `${100 / GRID_SIZE}%`,
            height: `${100 / GRID_SIZE}%`,
            transform: 'scale(0.8)'
          }}
        />

        {/* Render Obstacles Elements */}
        {obstacles.map((obs, index) => (
          <div 
            key={`obs-${obs.x}-${obs.y}-${index}`}
            className="absolute bg-[#111] border border-red-500/50 shadow-[inset_0_0_8px_rgba(255,0,0,0.3)] rounded-sm"
            style={{
              left: `${(obs.x / GRID_SIZE) * 100}%`,
              top: `${(obs.y / GRID_SIZE) * 100}%`,
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
            }}
          />
        ))}

        {/* Start Game Initial Boot Screen */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-[#000]/80 flex flex-col items-center justify-center p-6 backdrop-blur-sm z-20 gap-6">
            <div className="text-[#00FF41] border border-[#00FF41]/30 p-4 bg-[#111] max-w-sm text-center">
              <h3 className="font-bold mb-2 uppercase tracking-widest text-sm text-[#00FF41]">Instructions</h3>
              <p className="mb-1 uppercase text-gray-400 tracking-widest text-[10px]">Use WASD or Arrows to move.</p>
              <p className="mb-1 uppercase text-gray-400 tracking-widest text-[10px]">Collect bright food to grow.</p>
              <p className="uppercase text-gray-400 tracking-widest text-[10px]">Avoid walls, yourself, and obstacles.</p>
            </div>
            <button 
              onClick={() => setIsPlaying(true)}
              className="flex items-center gap-2 px-6 py-2 border border-[#00FF41] text-xs uppercase tracking-widest text-[#00FF41] hover:bg-[#00FF41] hover:text-black transition-colors outline-none"
            >
              <Play className="w-4 h-4" /> Start System
            </button>
          </div>
        )}

        {/* Crash / Death Screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-[#000]/80 flex flex-col items-center justify-center p-6 backdrop-blur-sm z-20">
            <h2 className="text-[#00FF41] text-4xl font-black mb-2 glow-text text-center leading-tight uppercase italic">SYSTEM<br/>FAILURE</h2>
            <p className="text-gray-400 mb-8 font-mono text-sm tracking-widest uppercase">Final Score: {score.toString().padStart(6, '0')}</p>
            <button 
              onClick={resetGame}
              className="flex items-center gap-2 px-6 py-2 border border-[#00FF41] text-xs uppercase tracking-widest text-[#00FF41] hover:bg-[#00FF41] hover:text-black transition-colors outline-none"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
        )}
      </div>
      
    </div>
  );
}

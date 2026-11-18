import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Flame, 
  Coffee, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  RotateCw,
  Sparkles
} from 'lucide-react';

export default function App() {
  
  // Config state
  const [targetCycles, setTargetCycles] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  
  // Timer state
  const [mode, setMode] = useState('work'); // 'work' | 'break' | 'completed'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [keyRotation, setKeyRotation] = useState(0);

  const audioCtxRef = useRef(null);

  const playChime = (type = 'work') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      
      if (type === 'work') {
        // Soft double bell sound for work
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3); // E5
      } else {
        // Gentle descending tone for break
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.4); // C5
      }

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.log('Audio playback standard fallback:', e);
    }
  };

  useEffect(() => {
    if (!isRunning) {
      if (mode === 'work') {
        setTimeLeft(workDuration * 60);
      } else if (mode === 'break') {
        setTimeLeft(breakDuration * 60);
      }
    }
  }, [workDuration, breakDuration, mode, isRunning]);

  useEffect(() => {
    let timer = null;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        // Rotate key slightly on each tick to simulate unwinding/ticking
        setKeyRotation((prev) => (prev + 1.5) % 360);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Logic on session end
      if (mode === 'work') {
        playChime('break');
        const nextCompleted = completedCycles + 1;
        setCompletedCycles(nextCompleted);

        if (nextCompleted >= targetCycles) {
          setMode('completed');
          setIsRunning(false);
        } else {
          setMode('break');
          setTimeLeft(breakDuration * 60);
        }
      } else if (mode === 'break') {
        playChime('work');
        setMode('work');
        setCurrentCycle((prev) => prev + 1);
        setTimeLeft(workDuration * 60);
      }
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode, completedCycles, targetCycles, workDuration, breakDuration]);

  const windClock = () => {
    setKeyRotation((prev) => prev + 90);
    playChime('work');
  };

  const togglePlay = () => {
    if (mode === 'completed') {
      resetAll();
      return;
    }
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? workDuration * 60 : breakDuration * 60);
  };

  const resetAll = () => {
    setIsRunning(false);
    setMode('work');
    setCompletedCycles(0);
    setCurrentCycle(1);
    setTimeLeft(workDuration * 60);
  };

  const handleSkip = () => {
    if (mode === 'work') {
      const nextCompleted = completedCycles + 1;
      setCompletedCycles(nextCompleted);
      if (nextCompleted >= targetCycles) {
        setMode('completed');
        setIsRunning(false);
      } else {
        setMode('break');
        setTimeLeft(breakDuration * 60);
      }
    } else if (mode === 'break') {
      setMode('work');
      setCurrentCycle((prev) => prev + 1);
      setTimeLeft(workDuration * 60);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSecs = mode === 'work' ? workDuration * 60 : breakDuration * 60;
  const progressPercent = totalSecs > 0 ? ((totalSecs - timeLeft) / totalSecs) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#3e3a36] flex flex-col justify-between items-center p-4 sm:p-8 select-none transition-colors duration-500">

      <header className="w-full max-w-md flex justify-between items-center py-2 border-b border-[#e8e2d5]/60">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#8c6d46]" />
          <h1 className="font-serif italic text-xl font-bold tracking-wide text-[#2c2825]">
            Relógio de Corda
          </h1>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 text-[#736b63] hover:text-[#2c2825] hover:bg-[#eae3d2]/50 rounded-full transition-all"
          title={soundEnabled ? "Mute sound" : "Enable sound"} >

          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </header>

      <main className="w-full max-w-md flex flex-col items-center gap-8 my-auto py-6">

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f1ebe0] text-[#5e554d] text-xs font-medium tracking-wider uppercase border border-[#e2d9ca]/80 shadow-sm">
          {mode === 'work' && (
            <>
              <Flame size={14} className="text-[#c85a32] animate-pulse" />
              <span>Foco Total ({workDuration} min)</span>
            </>
          )}
          {mode === 'break' && (
            <>
              <Coffee size={14} className="text-[#4b826b] animate-bounce" />
              <span>Pausa Curta ({breakDuration} min)</span>
            </>
          )}
          {mode === 'completed' && (
            <>
              <Sparkles size={14} className="text-[#b5832a]" />
              <span>Ciclos Concluídos!</span>
            </>
          )}
        </div>

        {/* Wind-Up Mechanical Desk Clock Illustration Component */}
        <div className="relative flex flex-col items-center group">
          
          {/* Top Winding Key (Interactive) */}
          <button 
            onClick={windClock}
            className="group/key relative z-10 -mb-3 transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none"
            title="Dar corda no relógio"
          >
            <div 
              className="w-16 h-8 flex flex-col items-center justify-center transition-transform duration-500 ease-out"
              style={{ transform: `rotate(${keyRotation}deg)` }}
            >
              {/* Brass Winding Key Top */}
              <div className="w-14 h-4 border-2 border-[#8c6d46] bg-[#d9bd8b] rounded-full flex justify-between px-1 items-center shadow-sm">
                <div className="w-2 h-2 rounded-full border border-[#8c6d46] bg-[#fbf9f5]" />
                <div className="w-2 h-2 rounded-full border border-[#8c6d46] bg-[#fbf9f5]" />
              </div>
              {/* Stem */}
              <div className="w-2 h-3 bg-[#a38356] border-x border-[#785c34]" />
            </div>
          </button>

          {/* Clock Frame Container */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-[#e8decd] p-3 shadow-[0_12px_35px_rgba(75,65,52,0.12)] border-2 border-[#d6c7b0] flex items-center justify-center">
            
            {/* Outer Ring Accent */}
            <div className="absolute inset-2 rounded-full border border-[#d2c3aa]/60" />

            {/* Circular Progress Bar (SVG) */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform p-1">
              <circle
                cx="50%"
                cy="50%"
                r="46%"
                className="stroke-[#dfd4c1]"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r="46%"
                className={`transition-all duration-1000 ease-linear ${
                  mode === 'break' ? 'stroke-[#5a9e82]' : 'stroke-[#c85a32]'
                }`}
                strokeWidth="5"
                strokeDasharray={283 * 2.7} // Approximate circumference scaler
                strokeDashoffset={(283 * 2.7) * (1 - progressPercent / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Main Clock Face Dial */}
            <div className="w-full h-full rounded-full bg-[#fefcf8] border border-[#d8ccb8] shadow-inner flex flex-col items-center justify-center relative p-4">
              
              {/* Clock Numbers / Ticks */}
              {[12, 3, 6, 9].map((num, idx) => {
                const positions = {
                  12: "top-2 left-1/2 -translate-x-1/2",
                  3: "right-3 top-1/2 -translate-y-1/2",
                  6: "bottom-2 left-1/2 -translate-x-1/2",
                  9: "left-3 top-1/2 -translate-y-1/2"
                };
                return (
                  <span 
                    key={idx} 
                    className={`absolute text-xs font-serif font-bold text-[#a09382] ${positions[num]}`}
                  >
                    {num}
                  </span>
                );
              })}

              {/* Central Vintage Brand Text */}
              <span className="text-[10px] font-serif tracking-widest uppercase text-[#b3a492] mb-1">
                Pomodoro
              </span>

              {/* Digital Time Display inside Vintage Dial */}
              <div className={`font-mono text-4xl sm:text-5xl font-bold tracking-tight my-1 transition-colors ${
                mode === 'break' ? 'text-[#3e735e]' : 'text-[#2c2825]'
              }`}>
                {formatTime(timeLeft)}
              </div>

              {/* Winding Status Sub-Dial Detail */}
              <div className="flex items-center gap-1 mt-1 opacity-75">
                <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-[#5a9e82] animate-ping' : 'bg-[#c5b8a5]'}`} />
                <span className="text-[9px] uppercase tracking-wider text-[#938474]">
                  {isRunning ? 'Tiquetaque' : 'Pausado'}
                </span>
              </div>

              {/* Mechanical Pendulum / Legs Base Support (External visual) */}
            </div>
          </div>

          {/* Clock Legs Base */}
          <div className="w-56 flex justify-between -mt-3 px-6 -z-10">
            <div className="w-4 h-6 bg-[#b59e7a] rounded-b-md transform -rotate-12 border-b-2 border-[#826e50] shadow-sm" />
            <div className="w-4 h-6 bg-[#b59e7a] rounded-b-md transform rotate-12 border-b-2 border-[#826e50] shadow-sm" />
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={handleReset}
            className="p-3 rounded-full bg-[#eedfcb] text-[#5c5043] hover:bg-[#e4d3bc] active:scale-95 transition-all shadow-sm"
            title="Reiniciar timer"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={togglePlay}
            className={`px-8 py-3.5 rounded-full font-semibold flex items-center gap-2 shadow-md active:scale-95 transition-all ${
              isRunning 
                ? 'bg-[#d1704e] hover:bg-[#be5e3d] text-white' 
                : 'bg-[#4a3e35] hover:bg-[#382e27] text-[#fbf9f5]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={20} /> Pause
              </>
            ) : (
              <>
                <Play size={20} className="fill-current ml-0.5" /> Start
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            className="p-3 rounded-full bg-[#eedfcb] text-[#5c5043] hover:bg-[#e4d3bc] active:scale-95 transition-all shadow-sm"
            title="Pular sessão"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Cycle Config & Progress Component */}
        <div className="w-full bg-[#f3ede2] border border-[#e5dccf] rounded-2xl p-5 shadow-sm space-y-4">
          
          <div className="flex justify-between items-center pb-3 border-b border-[#e2d7c5]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6e6358]">
              Configuração de Ciclos
            </span>
            <span className="text-xs font-medium text-[#8c7e70]">
              Meta: {targetCycles} {targetCycles === 1 ? 'Ciclo' : 'Ciclos'}
            </span>
          </div>

          {/* Cycle Setter Input / Controls */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-[#4a423a]">
              Quantidade de ciclos:
            </span>

            <div className="flex items-center gap-2 bg-[#e6dccf] p-1 rounded-xl">
              <button
                disabled={isRunning || targetCycles <= 1}
                onClick={() => setTargetCycles((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-lg bg-[#fbf9f5] text-[#3e3a36] font-bold hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center"
              >
                -
              </button>

              <span className="w-8 text-center font-mono font-bold text-sm text-[#2c2825]">
                {targetCycles}
              </span>

              <button
                disabled={isRunning || targetCycles >= 12}
                onClick={() => setTargetCycles((prev) => Math.min(12, prev + 1))}
                className="w-8 h-8 rounded-lg bg-[#fbf9f5] text-[#3e3a36] font-bold hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Cycles Visual Progress Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs text-[#786c60]">
              <span>Progresso</span>
              <span>
                {mode === 'completed' 
                  ? `${targetCycles} de ${targetCycles} concluídos` 
                  : `Ciclo ${Math.min(currentCycle, targetCycles)} de ${targetCycles}`}
              </span>
            </div>

            {/* Cycle Nodes Visualizer */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {Array.from({ length: targetCycles }).map((_, index) => {
                const isDone = index < completedCycles;
                const isCurrent = index === completedCycles && mode !== 'completed';

                return (
                  <div
                    key={index}
                    className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
                      isDone
                        ? 'bg-[#5a9e82]'
                        : isCurrent
                        ? 'bg-[#c85a32] ring-2 ring-[#c85a32]/30'
                        : 'bg-[#d8ccbc]'
                    }`}
                    title={`Ciclo ${index + 1}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Reset All Settings Button */}
          {(completedCycles > 0 || currentCycle > 1 || mode === 'completed') && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={resetAll}
                className="text-xs text-[#8c6d46] hover:text-[#5e472a] font-medium flex items-center gap-1 underline underline-offset-2 transition-colors"
              >
                <RotateCw size={12} /> Reiniciar todo o progresso
              </button>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#9c8e7e] py-2">
        <p>Apotecário Pomodoro Timer </p>
      </footer>

    </div>
  );
}
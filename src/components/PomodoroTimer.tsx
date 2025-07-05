import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAnalytics } from '../context/AnalyticsContext';
import './PomodoroTimer.css';

const PomodoroTimer: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { addProductivitySession } = useAnalytics();
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [time, setTime] = useState(workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime); // A4 note
    gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 1);
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 1);
  }, []);

  useEffect(() => {
    let interval: number | null = null;

    if (isActive && time > 0) {
      interval = window.setInterval(() => {
        setTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      playSound();
      
      // Record the completed session
      if (sessionStartTime) {
        const sessionDuration = Math.round((Date.now() - sessionStartTime) / 1000 / 60); // Convert to minutes
        addProductivitySession({
          date: new Date().toISOString(),
          duration: sessionDuration,
          type: isWorkSession ? 'work' : 'break',
          completed: true
        });
      }
      
      setIsWorkSession(prev => !prev);
      setTime((isWorkSession ? breakDuration : workDuration) * 60);
      setSessionStartTime(null);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, time, isWorkSession, workDuration, breakDuration, playSound, sessionStartTime, addProductivitySession]);

  const toggleTimer = () => {
    if (!isActive && !sessionStartTime) {
      setSessionStartTime(Date.now());
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSessionStartTime(null);
    setTime((isWorkSession ? workDuration : breakDuration) * 60);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'work') {
      setWorkDuration(Number(value));
    } else {
      setBreakDuration(Number(value));
    }
  };

  const handleApplySettings = () => {
    setIsActive(false);
    setSessionStartTime(null);
    if (isWorkSession) {
      setTime(workDuration * 60);
    } else {
      setTime(breakDuration * 60);
    }
    setShowSettings(false);
  };

  return (
    <div className={`pomodoro-container ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="pomodoro-timer-container">
        <div>
          <span className="pomodoro-session-label">{isWorkSession ? t('pomodoro_work') : t('pomodoro_break')}</span>
          <p className="pomodoro-time-display">{formatTime(time)}</p>
        </div>
        <div className="pomodoro-controls">
          <button onClick={toggleTimer} className="pomodoro-button" title="Start timer">
            {isActive ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button onClick={resetTimer} className="pomodoro-button" title="Reset timer">
            <RotateCcw size={24} />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="pomodoro-button" title="Settings">
            <Settings size={24} />
          </button>
        </div>
      </div>
      {showSettings && (
        <div className="pomodoro-settings-modal">
          <h2 className="pomodoro-settings-title">{t('pomodoro_settings')}</h2>
          <div className="pomodoro-input-group">
            <label htmlFor="work-duration" className="pomodoro-label">{t('pomodoro_work_min')}</label>
            <input type="number" id="work" name="work" value={workDuration} onChange={handleInputChange} className="pomodoro-input" placeholder="Work duration" />
          </div>
          <div className="pomodoro-input-group">
            <label htmlFor="break-duration" className="pomodoro-label">{t('pomodoro_break_min')}</label>
            <input type="number" id="break" name="break" value={breakDuration} onChange={handleInputChange} className="pomodoro-input" placeholder="Break duration" />
          </div>
          <button className="pomodoro-apply-button" onClick={handleApplySettings} title="Apply settings">{t('pomodoro_apply')}</button>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;

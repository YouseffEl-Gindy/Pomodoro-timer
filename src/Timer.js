import { useEffect, useRef, useState } from "react";
import { useAudio } from "./hooks/useAudio";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_MINUTES = 25;
const DEFAULT_TIME = DEFAULT_MINUTES * 60;
const FIVE_MINUTES = 300;
const MIN_TIME = FIVE_MINUTES;
const RING_RADIUS = 90;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function getRingColor(time) {
  if (time === 0) return "#ef4444"; // red   — finished
  if (time <= FIVE_MINUTES) return "#f59e0b"; // amber — last 5 min
  return "#22c55e"; // green — normal
}

function getRingStyle(time, baseTime) {
  const offset = RING_CIRCUMFERENCE * (1 - time / baseTime);
  return {
    strokeDasharray: RING_CIRCUMFERENCE,
    strokeDashoffset: offset,
    stroke: getRingColor(time),
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Timer({ isRunning, setIsRunning }) {
  const [baseTime, setBaseTime] = useState(DEFAULT_TIME);
  const [time, setTime] = useState(DEFAULT_TIME);

  const playClickSound = useAudio("/sounds/alarm-click.mp3");
  const playEndSound = useAudio("/sounds/end-alarm-2.mp3");

  const intervalRef = useRef(null);
  const timeRef = useRef(time);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  // Tick down every second while running, based on wall-clock time so
  // background-tab timer throttling can't make the countdown run slow.
  useEffect(() => {
    if (!isRunning) return;

    const endTime = Date.now() + timeRef.current * 1000;

    intervalRef.current = setInterval(() => {
      const remaining = Math.round((endTime - Date.now()) / 1000);
      setTime(Math.max(remaining, 0));
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Handle timer reaching zero
  useEffect(() => {
    if (time > 0) return;

    playEndSound();
    setIsRunning(false);
    setTimeout(() => setTime(baseTime), 1500);
  }, [time, baseTime, playEndSound, setIsRunning]);

  // Update browser tab title
  useEffect(() => {
    document.title = isRunning ? formatTime(time) : "Pomodoro Focus";
    return () => {
      document.title = "Pomodoro Focus";
    };
  }, [time, isRunning]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  function start() {
    playClickSound();
    setIsRunning(true);
  }

  function pause() {
    playClickSound();
    setIsRunning(false);
  }

  function reset() {
    playClickSound();
    setIsRunning(false);
    setTime(baseTime);
  }

  function addFiveMinutes() {
    if (isRunning) return;
    setBaseTime((t) => t + FIVE_MINUTES);
    setTime((t) => t + FIVE_MINUTES);
  }

  function removeFiveMinutes() {
    if (isRunning) return;
    setBaseTime((t) => Math.max(t - FIVE_MINUTES, MIN_TIME));
    setTime((t) => Math.max(t - FIVE_MINUTES, MIN_TIME));
  }

  // ─── Derived state ─────────────────────────────────────────────────────────

  const isAtStart = time === baseTime && !isRunning;
  const startLabel = isAtStart ? "Start" : "Resume";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="timer">
      <div className="timer-row">
        <button onClick={removeFiveMinutes} disabled={isRunning}>
          −
        </button>

        <div className="progress-wrapper">
          <svg className="progress-ring" width="200" height="200">
            <circle
              className="progress-ring-bg"
              cx="100"
              cy="100"
              r={RING_RADIUS}
            />
            <circle
              className={`progress-ring-fill ${time === 0 ? "pulse" : ""}`}
              cx="100"
              cy="100"
              r={RING_RADIUS}
              style={getRingStyle(time, baseTime)}
            />
          </svg>
          <div className="time-text">{formatTime(time)}</div>
        </div>

        <button onClick={addFiveMinutes} disabled={isRunning}>
          +
        </button>
      </div>

      <div className="main-controls">
        <button className="btn-start" onClick={start} disabled={isRunning}>
          {" "}
          {startLabel}{" "}
        </button>
        <button className="btn-pause" onClick={pause} disabled={!isRunning}>
          {" "}
          Pause{" "}
        </button>
        <button className="btn-reset" onClick={reset} disabled={isAtStart}>
          {" "}
          Reset{" "}
        </button>
      </div>
    </div>
  );
}

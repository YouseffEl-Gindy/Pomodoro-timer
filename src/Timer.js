import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAudio } from "./hooks/useAudio";
import { useNotification } from "./hooks/useNotification";

// ─── Constants ───────────────────────────────────────────────────────────────

const FIVE_MINUTES = 300;
const MIN_WORK_MINUTES = 5;
const RING_RADIUS = 90;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const PHASE_LABELS = {
  work: "Work",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// Seconds for a given phase, read from the user's settings.
function phaseDuration(phase, settings) {
  switch (phase) {
    case "shortBreak":
      return settings.shortBreakMinutes * 60;
    case "longBreak":
      return settings.longBreakMinutes * 60;
    default:
      return settings.workMinutes * 60;
  }
}

// Given the phase that just finished, what comes next in the cycle. Work leads
// to a short break, except the last work session of a set, which goes straight
// to the long break; any break leads back to work.
//
// completedWork counts work sessions finished in the current set. It stays at
// its max through the long break (so the progress dots read "set complete"),
// and only resets to 0 once the long break ends and a fresh set begins.
function nextPhaseInfo(phase, completedWork, settings) {
  if (phase === "work") {
    const done = completedWork + 1;
    if (done >= settings.loopsBeforeLongBreak) {
      return { phase: "longBreak", completedWork: done };
    }
    return { phase: "shortBreak", completedWork: done };
  }

  if (phase === "longBreak") return { phase: "work", completedWork: 0 };
  return { phase: "work", completedWork };
}

// Notification copy for a phase transition.
function completionMessage(endedPhase, upcomingPhase) {
  if (endedPhase === "work") {
    const which = upcomingPhase === "longBreak" ? "long break" : "short break";
    return {
      title: "Work session complete 🎉",
      body: `Nice work — time for a ${which}.`,
    };
  }
  return {
    title: "Break's over",
    body: "Back to work — you've got this 💪",
  };
}

function getRingColor(time, phase) {
  if (time === 0) return "#ef4444"; // red   — finished
  if (phase === "work") {
    if (time <= FIVE_MINUTES) return "#f59e0b"; // amber — last 5 min of work
    return "#22c55e"; // green — working
  }
  return phase === "longBreak" ? "#8b5cf6" : "#38bdf8"; // purple / sky — breaks
}

function getRingStyle(time, baseTime, phase) {
  const offset = RING_CIRCUMFERENCE * (1 - time / baseTime);
  return {
    strokeDasharray: RING_CIRCUMFERENCE,
    strokeDashoffset: offset,
    stroke: getRingColor(time, phase),
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Timer({
  isRunning,
  setIsRunning,
  phase,
  setPhase,
  settings,
  setSettings,
}) {
  // Cycle position: `phase` is lifted to App so it can theme the whole page;
  // `completedWork` (work sessions finished in the current set, resets to 0
  // after each long break) stays local to the timer.
  const [completedWork, setCompletedWork] = useState(0);

  const [time, setTime] = useState(() => phaseDuration("work", settings));

  const playClickSound = useAudio("/sounds/alarm-click.mp3");
  const playEndSound = useAudio("/sounds/end-alarm-2.mp3");
  const { requestPermission, notify } = useNotification();

  const intervalRef = useRef(null);
  const timeRef = useRef(time);

  // baseTime is the full length of the current phase; the ring and the
  // "Resume vs Start" logic are measured against it. Derived so it always
  // tracks the current phase + settings.
  const baseTime = phaseDuration(phase, settings);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  // Load the current phase's duration whenever the phase changes or the
  // relevant setting is edited while idle. Keyed on baseTime only, so pausing
  // (which doesn't change baseTime) never rewinds the countdown.
  //
  // useLayoutEffect (not useEffect) so `time` catches up to a new baseTime
  // *before* paint. Otherwise there's one frame where time still holds the old
  // value while baseTime is new, so isAtStart/canAdjustWork momentarily read
  // wrong and the buttons flash (Start → "Resume", Pause/Reset enable).
  useLayoutEffect(() => {
    setTime(baseTime);
  }, [baseTime]);

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

  // Handle the current phase reaching zero: ring the alarm and advance to the
  // next phase, left paused ("wait for me"). The !isRunning guard makes this
  // fire exactly once — after setIsRunning(false) the effect re-runs but bails.
  useEffect(() => {
    if (time > 0 || !isRunning) return;

    const next = nextPhaseInfo(phase, completedWork, settings);
    const msg = completionMessage(phase, next.phase);

    playEndSound();
    notify(msg.title, {
      body: msg.body,
      icon: "/logo192.png",
      tag: "pomodoro-phase",
    });

    setIsRunning(false);
    setCompletedWork(next.completedWork);
    setPhase(next.phase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, isRunning]);

  // Update browser tab title
  useEffect(() => {
    document.title = isRunning ? formatTime(time) : "Pomodoro Focus";
    return () => {
      document.title = "Pomodoro Focus";
    };
  }, [time, isRunning]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  // Move to the next phase in the cycle, leaving it paused (see nextPhaseInfo).
  function advanceToNextPhase() {
    const next = nextPhaseInfo(phase, completedWork, settings);
    setCompletedWork(next.completedWork);
    setPhase(next.phase);
  }

  function start() {
    playClickSound();
    requestPermission(); // asks once; no-op after the first grant/deny
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

  // Jump to the next phase early, leaving it paused like a natural finish.
  function skip() {
    playClickSound();
    setIsRunning(false);
    advanceToNextPhase();
  }

  // ± buttons nudge the work-length setting (only meaningful, and only shown as
  // active, while sitting idle at the start of a work session).
  function addFiveMinutes() {
    if (isRunning || phase !== "work") return;
    setSettings((s) => ({ ...s, workMinutes: s.workMinutes + 5 }));
  }

  function removeFiveMinutes() {
    if (isRunning || phase !== "work") return;
    setSettings((s) => ({
      ...s,
      workMinutes: Math.max(s.workMinutes - 5, MIN_WORK_MINUTES),
    }));
  }

  // ─── Derived state ─────────────────────────────────────────────────────────

  const isAtStart = time === baseTime && !isRunning;
  const startLabel = isAtStart ? "Start" : "Resume";
  const canAdjustWork = !isRunning && phase === "work";

  const loops = settings.loopsBeforeLongBreak;
  let sessionLabel;
  if (phase === "work") {
    sessionLabel = `Session ${Math.min(completedWork + 1, loops)} of ${loops}`;
  } else if (phase === "shortBreak") {
    sessionLabel = `${completedWork} of ${loops} sessions done`;
  } else {
    sessionLabel = `Set complete · ${loops} sessions`;
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="timer">
      <div className="phase-label">{PHASE_LABELS[phase]}</div>
      <div className="session-label">{sessionLabel}</div>

      <div
        className="progress-dots"
        role="img"
        aria-label={`${Math.min(completedWork, loops)} of ${loops} work sessions complete`}
      >
        {Array.from({ length: loops }, (_, i) => {
          const done = i < completedWork;
          const active = i === completedWork && phase === "work";
          return (
            <span
              key={i}
              className={`dot${done ? " dot-done" : ""}${
                active ? " dot-active" : ""
              }`}
            />
          );
        })}
      </div>

      <div className="timer-row">
        <button onClick={removeFiveMinutes} disabled={!canAdjustWork}>
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
              style={getRingStyle(time, baseTime, phase)}
            />
          </svg>
          <div className="time-text">{formatTime(time)}</div>
        </div>

        <button onClick={addFiveMinutes} disabled={!canAdjustWork}>
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
        <button className="btn-skip" onClick={skip}>
          {" "}
          Skip{" "}
        </button>
      </div>
    </div>
  );
}

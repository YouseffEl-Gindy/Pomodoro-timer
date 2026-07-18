import { useEffect, useState } from "react";
import Timer from "./Timer";
import NoteForm from "./NoteForm";
import NotesList from "./NotesList";
import Settings from "./Settings";
import "./App.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NOTES_STORAGE_KEY = "notes";
const SETTINGS_STORAGE_KEY = "settings";

const DEFAULT_SETTINGS = {
  workMinutes: 30,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  loopsBeforeLongBreak: 4,
};

function loadNotes() {
  return JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)) || [];
}

// Merge over defaults so a saved blob from an older version (missing keys)
// still yields a complete settings object.
function loadSettings() {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY));
  return { ...DEFAULT_SETTINGS, ...saved };
}

function createNote(text) {
  return { id: crypto.randomUUID(), text };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState("work");
  const [notes, setNotes] = useState(loadNotes);
  const [settings, setSettings] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function addNote(text) {
    setNotes((prev) => [...prev, createNote(text)]);
  }

  function deleteNote(id) {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  return (
    <div className="app" data-phase={phase}>
      <div className="card">
        <button
          className="btn-settings"
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
        >
          ⚙
        </button>

        <Timer
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          phase={phase}
          setPhase={setPhase}
          settings={settings}
          setSettings={setSettings}
        />
        <NoteForm isRunning={isRunning} onAddNote={addNote} />
        <NotesList notes={notes} onDelete={deleteNote} />

        {showSettings && (
          <Settings
            settings={settings}
            onChange={setSettings}
            onClose={() => setShowSettings(false)}
            isRunning={isRunning}
          />
        )}
      </div>
    </div>
  );
}

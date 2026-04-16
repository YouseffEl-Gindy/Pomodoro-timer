import { useEffect, useState } from "react";
import Timer from "./Timer";
import NoteForm from "./NoteForm";
import NotesList from "./NotesList";
import "./App.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NOTES_STORAGE_KEY = "notes";

function loadNotes() {
  return JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY)) || [];
}

function createNote(text) {
  return { id: crypto.randomUUID(), text };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState(loadNotes);

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  function addNote(text) {
    setNotes((prev) => [...prev, createNote(text)]);
  }

  function deleteNote(id) {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  return (
    <div className="app">
      <div className="card">
        <Timer isRunning={isRunning} setIsRunning={setIsRunning} />
        <NoteForm isRunning={isRunning} onAddNote={addNote} />
        <NotesList notes={notes} onDelete={deleteNote} />
      </div>
    </div>
  );
}

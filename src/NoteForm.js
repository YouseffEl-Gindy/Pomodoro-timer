import { useEffect, useRef, useState } from "react";
import { useAudio } from "./hooks/useAudio";

export default function NoteForm({ isRunning, onAddNote }) {
  const [text, setText] = useState("");

  const inputRef = useRef(null);
  const playAddSound = useAudio("/sounds/add-sound.mp3");

  // Focus the input whenever the timer starts running
  useEffect(() => {
    if (isRunning) inputRef.current.focus();
  }, [isRunning]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    playAddSound();
    onAddNote(text);
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <label htmlFor="noteInput" className="note-label">
        Add note
      </label>

      <div className="note-row">
        <input
          id="noteInput"
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your note here..."
        />
        <button>Add</button>
      </div>
    </form>
  );
}

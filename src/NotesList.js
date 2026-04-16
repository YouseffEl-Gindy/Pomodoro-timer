import Note from "./Note";

export default function NotesList({ notes, onDelete }) {
  return (
    <ul>
      {notes.map((n) => (
        <Note note={n} onDelete={onDelete} key={n.id} />
      ))}
    </ul>
  );
}

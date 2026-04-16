export default function Note({ note, onDelete }) {
  return (
    <li>
      <span>{note.text}</span>
      <button onClick={() => onDelete(note.id)}>X</button>
    </li>
  );
}

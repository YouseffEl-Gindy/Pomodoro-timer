// ─── Constants ───────────────────────────────────────────────────────────────

const FIELDS = [
  { key: "workMinutes", label: "Work length (min)", min: 5, max: 120, step: 5 },
  { key: "shortBreakMinutes", label: "Short break (min)", min: 1, max: 60, step: 1 },
  { key: "longBreakMinutes", label: "Long break (min)", min: 1, max: 60, step: 1 },
  {
    key: "loopsBeforeLongBreak",
    label: "Loops before long break",
    min: 1,
    max: 12,
    step: 1,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Settings({ settings, onChange, onClose, isRunning }) {
  // ─── Actions ───────────────────────────────────────────────────────────────

  function update(key, value, min, max) {
    const n = Number(value);
    if (Number.isNaN(n)) return;
    const clamped = Math.min(Math.max(n, min), max);
    onChange((prev) => ({ ...prev, [key]: clamped }));
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="settings-title">Settings</h2>

        {isRunning && (
          <p className="settings-note">Pause the timer to edit durations.</p>
        )}

        {FIELDS.map(({ key, label, min, max, step }) => (
          <label className="settings-field" key={key}>
            <span>{label}</span>
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={settings[key]}
              disabled={isRunning}
              onChange={(e) => update(key, e.target.value, min, max)}
            />
          </label>
        ))}

        <button className="btn-close" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

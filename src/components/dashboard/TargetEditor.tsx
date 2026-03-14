import { useState } from 'react';

interface TargetEditorProps {
  target: number | null;
  onTargetChange: (newTarget: number | null) => void;
}

export function TargetEditor({ target, onTargetChange }: TargetEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function startEditing() {
    setInputValue(target !== null ? String(target) : '');
    setError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setError(null);
  }

  async function handleSave() {
    const trimmed = inputValue.trim();

    let newTarget: number | null;
    if (trimmed === '' || trimmed === '0') {
      newTarget = null;
    } else {
      const parsed = Number(trimmed);
      if (isNaN(parsed) || parsed <= 0) {
        setError('Target must be a positive number, or leave blank to clear.');
        return;
      }
      newTarget = parsed;
    }

    setIsSaving(true);
    try {
      await onTargetChange(newTarget);
      setIsEditing(false);
      setError(null);
    } catch {
      setError('Failed to save target. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>
          Monthly target:{' '}
          {target !== null ? (
            <span className="text-amber-400 font-semibold">{target} h</span>
          ) : (
            <span className="text-gray-500 italic">not set</span>
          )}
        </span>
        <button
          onClick={startEditing}
          className="ml-1 p-1 rounded hover:bg-gray-700 transition-colors"
          aria-label="Edit performance target"
          title="Edit target"
        >
          {/* Pencil icon */}
          <svg
            className="w-3.5 h-3.5 text-gray-400 hover:text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.415.586H8v-2.414a2 2 0 01.586-1.414z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400 shrink-0">Monthly target (h):</label>
        <input
          type="number"
          min={1}
          step={1}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') cancelEditing();
          }}
          className="w-24 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-indigo-500"
          placeholder="e.g. 480"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={cancelEditing}
          disabled={isSaving}
          className="px-3 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-400 ml-28">{error}</p>}
    </div>
  );
}

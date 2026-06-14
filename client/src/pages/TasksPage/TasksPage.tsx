import { useEffect, useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { fetchTaskHistory, type TaskHistoryEntry } from '../../api/tasks'
import styles from './TasksPage.module.scss'

function formatInterval(days: number | null): string {
  if (days === null) return 'On demand'
  if (days === 1) return 'Daily'
  if (days === 7) return 'Weekly'
  return `Every ${days} days`
}

export function TasksPage() {
  const { tasks, loading, create, update, remove } = useTasks()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [history, setHistory] = useState<TaskHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addCommand, setAddCommand] = useState('')
  const [addDescription, setAddDescription] = useState('')
  const [addInterval, setAddInterval] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editCommand, setEditCommand] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editInterval, setEditInterval] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null

  useEffect(() => {
    if (!loading && tasks.length > 0 && selectedId === null) {
      setSelectedId(tasks[0].id)
    }
  }, [loading, tasks, selectedId])

  useEffect(() => {
    if (selectedId === null) { setHistory([]); return }
    setHistoryLoading(true)
    fetchTaskHistory(selectedId)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [selectedId, tasks])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = addName.trim()
    const command = addCommand.trim()
    if (!name || !command) { setAddError('Name and command are required.'); return }
    const intervalDays = addInterval ? Number(addInterval) : null
    if (addInterval && (!Number.isInteger(intervalDays) || (intervalDays as number) < 1)) {
      setAddError('Interval must be a positive whole number.')
      return
    }
    setAddError(null)
    try {
      await create({ name, command, description: addDescription.trim() || undefined, intervalDays })
      setAddName(''); setAddCommand(''); setAddDescription(''); setAddInterval('')
      setShowAddForm(false)
    } catch {
      setAddError('Failed to create task. Command may already be taken.')
    }
  }

  function startEdit(id: number) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    setEditingId(id)
    setEditName(task.name)
    setEditCommand(task.command)
    setEditDescription(task.description ?? '')
    setEditInterval(task.intervalDays !== null ? String(task.intervalDays) : '')
    setEditError(null)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    const name = editName.trim()
    const command = editCommand.trim()
    if (!name || !command) { setEditError('Name and command are required.'); return }
    const intervalDays = editInterval ? Number(editInterval) : null
    if (editInterval && (!Number.isInteger(intervalDays) || (intervalDays as number) < 1)) {
      setEditError('Interval must be a positive whole number.')
      return
    }
    setEditError(null)
    try {
      await update(editingId, { name, command, description: editDescription.trim() || null, intervalDays })
      setEditingId(null)
    } catch {
      setEditError('Failed to update task. Command may already be taken.')
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? All completion history will also be removed.`)) return
    await remove(id)
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Household Tasks</h1>
        <button className={styles.addButton} onClick={() => setShowAddForm((v) => !v)} type="button">
          {showAddForm ? '✕ Cancel' : '+ Add task'}
        </button>
      </div>

      {showAddForm && (
        <form className={styles.addForm} onSubmit={handleAdd}>
          <h2 className={styles.sectionTitle}>New task</h2>
          <div className={styles.formRow}>
            <label className={styles.label}>Name</label>
            <input
              autoFocus
              className={styles.input}
              placeholder="e.g. Dishes"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Command</label>
            <div className={styles.commandWrap}>
              <span className={styles.commandPrefix}>!</span>
              <input
                className={styles.input}
                placeholder="e.g. dishes"
                value={addCommand}
                onChange={(e) => setAddCommand(e.target.value.toLowerCase().replace(/\s/g, ''))}
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Description</label>
            <input
              className={styles.input}
              placeholder="Optional"
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Interval (days)</label>
            <input
              className={styles.input}
              placeholder="Leave blank for on-demand"
              type="number"
              min={1}
              value={addInterval}
              onChange={(e) => setAddInterval(e.target.value)}
            />
          </div>
          {addError && <p className={styles.error}>{addError}</p>}
          <div className={styles.formActions}>
            <button className={styles.button} type="submit">Create</button>
          </div>
        </form>
      )}

      {loading && <p className={styles.muted}>Loading…</p>}

      {!loading && tasks.length === 0 && (
        <p className={styles.muted}>No tasks yet — add one above.</p>
      )}

      {!loading && tasks.length > 0 && (
        <div className={styles.collectionLayout}>
          <section className={styles.listPanel} aria-label="Task list">
            <ul className={styles.taskList}>
              {tasks.map((task) => (
                <li key={task.id}>
                  <button
                    className={`${styles.listItem} ${selectedId === task.id ? styles.listItemActive : ''}`}
                    onClick={() => setSelectedId(task.id)}
                    type="button"
                  >
                    <span className={styles.listItemName}>{task.name}</span>
                    <span className={styles.listItemMeta}>!{task.command}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.detailPanel} aria-live="polite">
            {selectedTask && editingId === selectedTask.id && (
              <form onSubmit={handleEdit} className={styles.editForm}>
                <h2 className={styles.sectionTitle}>Edit task</h2>
                <div className={styles.formRow}>
                  <label className={styles.label}>Name</label>
                  <input autoFocus className={styles.input} value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>Command</label>
                  <div className={styles.commandWrap}>
                    <span className={styles.commandPrefix}>!</span>
                    <input
                      className={styles.input}
                      value={editCommand}
                      onChange={(e) => setEditCommand(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>Description</label>
                  <input className={styles.input} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>Interval (days)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    placeholder="Leave blank for on-demand"
                    value={editInterval}
                    onChange={(e) => setEditInterval(e.target.value)}
                  />
                </div>
                {editError && <p className={styles.error}>{editError}</p>}
                <div className={styles.formActions}>
                  <button className={styles.button} type="submit">Save</button>
                  <button className={styles.buttonSecondary} type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </form>
            )}
            {selectedTask && editingId !== selectedTask.id && (
              <>
                <header className={styles.detailHeader}>
                  <div>
                    <h2 className={styles.detailTitle}>{selectedTask.name}</h2>
                    <p className={styles.detailCommand}>!{selectedTask.command}</p>
                  </div>
                </header>

                {selectedTask.description && (
                  <p className={styles.detailDescription}>{selectedTask.description}</p>
                )}

                <dl className={styles.detailMeta}>
                  <div>
                    <dt>Schedule</dt>
                    <dd>{formatInterval(selectedTask.intervalDays)}</dd>
                  </div>
                </dl>

                <div className={styles.detailActions}>
                  <button className={styles.buttonSecondary} onClick={() => startEdit(selectedTask.id)} type="button">Edit</button>
                  <button className={styles.buttonDanger} onClick={() => handleDelete(selectedTask.id, selectedTask.name)} type="button">Delete</button>
                </div>

                <section className={styles.history}>
                  <h3 className={styles.historyTitle}>Completion history</h3>
                  {historyLoading && <p className={styles.muted}>Loading…</p>}
                  {!historyLoading && history.length === 0 && (
                    <p className={styles.muted}>No completions recorded yet.</p>
                  )}
                  {!historyLoading && history.length > 0 && (
                    <ul className={styles.historyList}>
                      {history.map((entry) => (
                        <li key={entry.id} className={styles.historyItem}>
                          <span>{new Date(entry.completedAt).toLocaleDateString()}</span>
                          <span className={styles.historyMeta}>
                            {entry.displayName}
                            {entry.source === 'discord' ? ' via Discord' : ' via web'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      )}

    </div>
  )
}

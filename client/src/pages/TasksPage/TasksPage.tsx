import { useEffect, useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { fetchTaskHistory, type TaskHistoryEntry } from '../../api/tasks'
import styles from './TasksPage.module.scss'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatSchedule(task: { intervalDays: number | null; dayOfWeek: number | null }): string {
  if (task.dayOfWeek !== null) return `Every ${DAY_NAMES[task.dayOfWeek]}`
  if (task.intervalDays === null) return 'On demand'
  if (task.intervalDays === 1) return 'Daily'
  if (task.intervalDays === 7) return 'Weekly'
  return `Every ${task.intervalDays} days`
}

type ScheduleMode = 'ondemand' | 'interval' | 'dayofweek'

const SCHEDULE_MODE_LABELS: Record<ScheduleMode, string> = {
  ondemand: 'On demand',
  interval: 'Interval',
  dayofweek: 'Day of week',
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
  const [addScheduleMode, setAddScheduleMode] = useState<ScheduleMode>('ondemand')
  const [addInterval, setAddInterval] = useState('')
  const [addDayOfWeek, setAddDayOfWeek] = useState(0)
  const [addError, setAddError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editCommand, setEditCommand] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editScheduleMode, setEditScheduleMode] = useState<ScheduleMode>('ondemand')
  const [editInterval, setEditInterval] = useState('')
  const [editDayOfWeek, setEditDayOfWeek] = useState(0)
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

    let intervalDays: number | null = null
    let dayOfWeek: number | null = null
    if (addScheduleMode === 'interval') {
      intervalDays = addInterval ? Number(addInterval) : null
      if (!addInterval || !Number.isInteger(intervalDays) || (intervalDays as number) < 1) {
        setAddError('Interval must be a positive whole number.')
        return
      }
    } else if (addScheduleMode === 'dayofweek') {
      dayOfWeek = addDayOfWeek
    }

    setAddError(null)
    try {
      await create({ name, command, description: addDescription.trim() || undefined, intervalDays, dayOfWeek })
      setAddName(''); setAddCommand(''); setAddDescription('')
      setAddInterval(''); setAddDayOfWeek(0); setAddScheduleMode('ondemand')
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
    if (task.dayOfWeek !== null) {
      setEditScheduleMode('dayofweek')
      setEditDayOfWeek(task.dayOfWeek)
      setEditInterval('')
    } else if (task.intervalDays !== null) {
      setEditScheduleMode('interval')
      setEditInterval(String(task.intervalDays))
      setEditDayOfWeek(0)
    } else {
      setEditScheduleMode('ondemand')
      setEditInterval('')
      setEditDayOfWeek(0)
    }
    setEditError(null)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    const name = editName.trim()
    const command = editCommand.trim()
    if (!name || !command) { setEditError('Name and command are required.'); return }

    let intervalDays: number | null = null
    let dayOfWeek: number | null = null
    if (editScheduleMode === 'interval') {
      intervalDays = editInterval ? Number(editInterval) : null
      if (!editInterval || !Number.isInteger(intervalDays) || (intervalDays as number) < 1) {
        setEditError('Interval must be a positive whole number.')
        return
      }
    } else if (editScheduleMode === 'dayofweek') {
      dayOfWeek = editDayOfWeek
    }

    setEditError(null)
    try {
      await update(editingId, { name, command, description: editDescription.trim() || null, intervalDays, dayOfWeek })
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
                onChange={(e) => setAddCommand(e.target.value.toLowerCase().replace(/[!\s]/g, ''))}
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
            <label className={styles.label}>Schedule</label>
            <div className={styles.scheduleModes}>
              {(['ondemand', 'interval', 'dayofweek'] as ScheduleMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`${styles.modeButton} ${addScheduleMode === mode ? styles.modeButtonActive : ''}`}
                  onClick={() => setAddScheduleMode(mode)}
                >
                  {SCHEDULE_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>
          {addScheduleMode === 'interval' && (
            <div className={styles.formRow}>
              <label className={styles.label}>Every (days)</label>
              <input
                className={styles.input}
                placeholder="e.g. 7"
                type="number"
                min={1}
                value={addInterval}
                onChange={(e) => setAddInterval(e.target.value)}
              />
            </div>
          )}
          {addScheduleMode === 'dayofweek' && (
            <div className={styles.formRow}>
              <label className={styles.label}>Day</label>
              <select
                className={styles.input}
                value={addDayOfWeek}
                onChange={(e) => setAddDayOfWeek(Number(e.target.value))}
              >
                {DAY_NAMES.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
          )}
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
                      onChange={(e) => setEditCommand(e.target.value.toLowerCase().replace(/[!\s]/g, ''))}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>Description</label>
                  <input className={styles.input} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.label}>Schedule</label>
                  <div className={styles.scheduleModes}>
                    {(['ondemand', 'interval', 'dayofweek'] as ScheduleMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`${styles.modeButton} ${editScheduleMode === mode ? styles.modeButtonActive : ''}`}
                        onClick={() => setEditScheduleMode(mode)}
                      >
                        {SCHEDULE_MODE_LABELS[mode]}
                      </button>
                    ))}
                  </div>
                </div>
                {editScheduleMode === 'interval' && (
                  <div className={styles.formRow}>
                    <label className={styles.label}>Every (days)</label>
                    <input
                      className={styles.input}
                      type="number"
                      min={1}
                      placeholder="e.g. 7"
                      value={editInterval}
                      onChange={(e) => setEditInterval(e.target.value)}
                    />
                  </div>
                )}
                {editScheduleMode === 'dayofweek' && (
                  <div className={styles.formRow}>
                    <label className={styles.label}>Day</label>
                    <select
                      className={styles.input}
                      value={editDayOfWeek}
                      onChange={(e) => setEditDayOfWeek(Number(e.target.value))}
                    >
                      {DAY_NAMES.map((day, i) => (
                        <option key={i} value={i}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                    <dd>{formatSchedule(selectedTask)}</dd>
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

import { useState } from 'react'
import { useRooms } from '../../hooks/useRooms'
import styles from './RoomsPage.module.scss'

export const RoomsPage = () => {
  const { rooms, loading, create, rename, remove } = useRooms()
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setCreateError(null)
    try {
      await create(name)
      setNewName('')
    } catch {
      setCreateError('A room with that name already exists.')
    }
  }

  function startEdit(id: number, currentName: string) {
    setEditingId(id)
    setEditName(currentName)
    setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditError(null)
  }

  async function handleRename(e: React.FormEvent, id: number) {
    e.preventDefault()
    const name = editName.trim()
    if (!name) return
    setEditError(null)
    try {
      await rename(id, name)
      setEditingId(null)
    } catch {
      setEditError('A room with that name already exists.')
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? Plants in this room will be unassigned.`)) return
    await remove(id)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Rooms</h1>

      {loading && <p className={styles.muted}>Loading…</p>}

      {!loading && rooms.length === 0 && (
        <p className={styles.muted}>No rooms yet — add one below.</p>
      )}

      {!loading && rooms.length > 0 && (
        <ul className={styles.list}>
          {rooms.map((room) => (
            <li key={room.id} className={styles.item}>
              {editingId === room.id ? (
                <form className={styles.editForm} onSubmit={(e) => handleRename(e, room.id)}>
                  <input
                    autoFocus
                    className={styles.input}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <button className={styles.button} type="submit">Save</button>
                  <button className={styles.buttonSecondary} type="button" onClick={cancelEdit}>Cancel</button>
                  {editError && <span className={styles.error}>{editError}</span>}
                </form>
              ) : (
                <>
                  <span className={styles.roomName}>{room.name}</span>
                  <div className={styles.actions}>
                    <button
                      className={styles.buttonSecondary}
                      type="button"
                      onClick={() => startEdit(room.id, room.name)}
                    >
                      Rename
                    </button>
                    <button
                      className={styles.buttonDanger}
                      type="button"
                      onClick={() => handleDelete(room.id, room.name)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <section className={styles.addSection}>
        <h2 className={styles.sectionTitle}>Add a room</h2>
        <form className={styles.addForm} onSubmit={handleCreate}>
          <input
            className={styles.input}
            placeholder="Room name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className={styles.button} type="submit">Add</button>
        </form>
        {createError && <p className={styles.error}>{createError}</p>}
      </section>
    </div>
  )
}

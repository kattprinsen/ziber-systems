import { useState } from 'react'
import { useMembers } from '../../hooks/useMembers'
import styles from './MembersPage.module.scss'

export function MembersPage() {
  const { members, loading, rename } = useMembers()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  async function handleRename(e: React.FormEvent, id: number) {
    e.preventDefault()
    const name = editName.trim()
    if (!name) return
    await rename(id, name)
    setEditingId(null)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Household Members</h1>
      <p className={styles.muted}>Members are created automatically when they use a Discord command.</p>

      {loading && <p className={styles.muted}>Loading…</p>}

      {!loading && members.length === 0 && (
        <p className={styles.muted}>No members yet — they appear here after their first Discord interaction.</p>
      )}

      {!loading && members.length > 0 && (
        <ul className={styles.list}>
          {members.map((member) => (
            <li key={member.id} className={styles.item}>
              {editingId === member.id ? (
                <form className={styles.editForm} onSubmit={(e) => handleRename(e, member.id)}>
                  <input
                    autoFocus
                    className={styles.input}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <button className={styles.button} type="submit">Save</button>
                  <button className={styles.buttonSecondary} type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </form>
              ) : (
                <>
                  <div className={styles.memberInfo}>
                    <span className={styles.displayName}>{member.displayName}</span>
                    <span className={styles.discordName}>{member.discordName}</span>
                  </div>
                  <button
                    className={styles.buttonSecondary}
                    type="button"
                    onClick={() => { setEditingId(member.id); setEditName(member.displayName) }}
                  >
                    Rename
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

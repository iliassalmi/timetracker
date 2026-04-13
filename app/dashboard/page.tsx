'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Project, Task, TimeEntry } from '@/lib/types'

export default function Dashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [newTaskName, setNewTaskName] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      loadData(data.user.id)
    })
  }, [router])

  useEffect(() => {
    if (!activeEntry) { setElapsed(0); return }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(activeEntry.started_at).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeEntry])

  async function loadData(uid: string) {
    const [{ data: p }, { data: t }, { data: e }] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('time_entries').select('*').eq('user_id', uid)
        .order('started_at', { ascending: false }).limit(100),
    ])
    setProjects(p ?? [])
    setTasks(t ?? [])
    setEntries(e ?? [])
    const running = (e ?? []).find((en: TimeEntry) => !en.ended_at)
    setActiveEntry(running ?? null)
  }

  async function addProject() {
    if (!newProjectName.trim() || !userId) return
    const colors = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6']
    const color = colors[Math.floor(Math.random() * colors.length)]
    await supabase.from('projects').insert({ name: newProjectName.trim(), color, user_id: userId })
    setNewProjectName('')
    loadData(userId)
  }

  async function addTask() {
    if (!newTaskName.trim() || !selectedProject || !userId) return
    await supabase.from('tasks').insert({
      name: newTaskName.trim(), project_id: selectedProject, user_id: userId,
    })
    setNewTaskName('')
    loadData(userId)
  }

  async function startTimer(taskId: string) {
    if (!userId || activeEntry) return
    const { data } = await supabase.from('time_entries')
      .insert({ task_id: taskId, user_id: userId, started_at: new Date().toISOString() })
      .select().single()
    setActiveEntry(data)
  }

  async function stopTimer() {
    if (!activeEntry || !userId) return
    const ended = new Date().toISOString()
    const dur = Math.floor(
      (new Date(ended).getTime() - new Date(activeEntry.started_at).getTime()) / 1000
    )
    await supabase.from('time_entries')
      .update({ ended_at: ended, duration: dur }).eq('id', activeEntry.id)
    setActiveEntry(null)
    loadData(userId)
  }

  function totalThisWeek(projectId: string): string {
    const since = new Date(); since.setDate(since.getDate() - 7)
    const projectTasks = tasks.filter(t => t.project_id === projectId).map(t => t.id)
    const secs = entries
      .filter(e => projectTasks.includes(e.task_id) && e.duration && new Date(e.started_at) > since)
      .reduce((sum, e) => sum + (e.duration ?? 0), 0)
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return `${h}h${m.toString().padStart(2, '0')}`
  }

  function fmtElapsed(s: number) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  if (!userId) return <div style={{ padding: '2rem' }}>Chargement...</div>

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 1, fontSize: '1.5rem' }}>⏱ TimeTracker ECS</h1>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '6px' }}>
          Déconnexion
        </button>
      </div>

      {/* Timer actif */}
      {activeEntry && (
        <div style={{
          background: '#6366f1', color: '#fff', padding: '1.5rem', borderRadius: '12px',
          marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.85 }}>Minuteur en cours</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'monospace' }}>
              {fmtElapsed(elapsed)}
            </div>
          </div>
          <button onClick={stopTimer}
            style={{ padding: '0.75rem 1.5rem', background: '#fff', color: '#6366f1',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem' }}>
            Arrêter
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Projets */}
        <div>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Projets</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
              placeholder="Nouveau projet..." onKeyDown={e => e.key === 'Enter' && addProject()}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
            <button onClick={addProject}
              style={{ padding: '0.5rem 1rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px' }}>
              +
            </button>
          </div>
          {projects.map(p => (
            <div key={p.id} style={{
              background: '#fff', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem',
              borderLeft: `4px solid ${p.color}`, boxShadow: '0 1px 4px #0001',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{p.name}</strong>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {totalThisWeek(p.id)} cette semaine
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tâches */}
        <div>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Tâches</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <option value="">-- Choisir un projet --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={newTaskName} onChange={e => setNewTaskName(e.target.value)}
                placeholder="Nouvelle tâche..." onKeyDown={e => e.key === 'Enter' && addTask()}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
              <button onClick={addTask}
                style={{ padding: '0.5rem 1rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px' }}>
                +
              </button>
            </div>
          </div>
          {tasks.map(t => {
            const proj = projects.find(p => p.id === t.project_id)
            const isActive = activeEntry?.task_id === t.id
            return (
              <div key={t.id} style={{
                background: '#fff', borderRadius: '10px', padding: '0.75rem 1rem',
                marginBottom: '0.5rem', boxShadow: '0 1px 4px #0001',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{t.name}</div>
                  {proj && <div style={{ fontSize: '0.75rem', color: proj.color }}>{proj.name}</div>}
                </div>
                <button
                  onClick={() => isActive ? stopTimer() : startTimer(t.id)}
                  disabled={!!activeEntry && !isActive}
                  style={{
                    padding: '0.4rem 0.75rem', border: 'none', borderRadius: '6px', fontWeight: 600,
                    background: isActive ? '#fee2e2' : activeEntry ? '#f1f5f9' : '#dcfce7',
                    color: isActive ? '#dc2626' : activeEntry ? '#94a3b8' : '#16a34a',
                  }}>
                  {isActive ? '⏸ Stop' : '▶ Start'}
                </button>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export interface Project {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  user_id: string
  name: string
  created_at: string
}

export interface TimeEntry {
  id: string
  task_id: string
  user_id: string
  started_at: string
  ended_at: string | null
  duration: number | null
  created_at: string
}

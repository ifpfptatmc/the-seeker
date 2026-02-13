// Todoist API v1 client

const BASE_URL = 'https://api.todoist.com/api/v1'

function getToken(): string {
  return import.meta.env.VITE_TODOIST_API_TOKEN || ''
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  if (!token) throw new Error('Todoist API token not configured')
  
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })
  
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Todoist API ${res.status}: ${text}`)
  }
  
  // Some endpoints return empty body (204)
  if (res.status === 204) return {} as T
  return res.json()
}

// ============================
// Types
// ============================

export interface TodoistProject {
  id: string
  name: string
  parent_id: string | null
  child_order: number
  color: string
  is_archived: boolean
  is_deleted: boolean
}

export interface TodoistTask {
  id: string
  content: string
  description: string
  project_id: string
  parent_id: string | null
  child_order: number
  is_completed: boolean
  labels: string[]
  created_at: string
  updated_at: string
}

interface PaginatedResponse<T> {
  results: T[]
  next_cursor?: string | null
}

// ============================
// Projects
// ============================

export async function getProjects(): Promise<TodoistProject[]> {
  const all: TodoistProject[] = []
  let cursor: string | null = null
  
  do {
    const url: string = cursor ? `/projects?cursor=${cursor}` : '/projects'
    const data: PaginatedResponse<TodoistProject> = await request<PaginatedResponse<TodoistProject>>(url)
    all.push(...data.results)
    cursor = data.next_cursor || null
  } while (cursor)
  
  return all
}

export async function createProject(params: {
  name: string
  parent_id?: string
  color?: string
}): Promise<TodoistProject> {
  return request<TodoistProject>('/projects', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

// ============================
// Tasks
// ============================

export async function getTasks(projectId: string): Promise<TodoistTask[]> {
  const all: TodoistTask[] = []
  let cursor: string | null = null
  
  do {
    let url = `/tasks?project_id=${projectId}`
    if (cursor) url += `&cursor=${cursor}`
    const data = await request<PaginatedResponse<TodoistTask>>(url)
    all.push(...data.results)
    cursor = data.next_cursor || null
  } while (cursor)
  
  return all
}

export async function createTask(params: {
  content: string
  description?: string
  project_id: string
  parent_id?: string
  labels?: string[]
  due_string?: string
}): Promise<TodoistTask> {
  return request<TodoistTask>('/tasks', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function updateTask(taskId: string, params: {
  content?: string
  description?: string
  labels?: string[]
}): Promise<TodoistTask> {
  return request<TodoistTask>(`/tasks/${taskId}`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function completeTask(taskId: string): Promise<void> {
  await request<void>(`/tasks/${taskId}/close`, { method: 'POST' })
}

export async function reopenTask(taskId: string): Promise<void> {
  await request<void>(`/tasks/${taskId}/reopen`, { method: 'POST' })
}

// ============================
// Labels
// ============================

export async function createLabel(name: string): Promise<{ id: string; name: string }> {
  return request('/labels', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function getLabels(): Promise<{ results: { id: string; name: string }[] }> {
  return request('/labels')
}

// ============================
// Helpers
// ============================

export function isConfigured(): boolean {
  return !!getToken()
}

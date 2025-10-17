import { db } from "@/lib/firebase/config"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  setDoc,
} from "firebase/firestore"

export type TaskPriority = "low" | "medium" | "high" | "urgent"

export interface Task {
  id?: string
  title: string
  description?: string
  status: string // dynamic from settings
  priority: TaskPriority
  slaLevel?: "standard" | "priority" | "critical"
  startDate?: any
  dueDate?: any
  createdAt?: any
  updatedAt?: any
  assigneeIds: string[]
  estimateHours?: number
  spentSeconds?: number
  links?: {
    lucrareId?: string
    clientId?: string
  }
}

export interface TaskTimeEntry {
  id?: string
  taskId: string
  userId: string
  startedAt: any
  endedAt?: any
  durationSec?: number
}

export interface TaskSettingsDoc {
  statuses: Array<{ id: string; name: string; color: string; order: number }>
  priorities: Array<{ id: TaskPriority; name: string; color: string; order: number }>
}

const TASKS = "tasks"
const TIME = "task_time_entries"
const SETTINGS_PATH = { col: "task_settings", id: "default" }

export async function ensureDefaultTaskSettings(): Promise<TaskSettingsDoc> {
  const ref = doc(collection(db, SETTINGS_PATH.col), SETTINGS_PATH.id)
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data() as TaskSettingsDoc
  const defaults: TaskSettingsDoc = {
    statuses: [
      { id: "backlog", name: "Backlog", color: "#CBD5E1", order: 0 },
      { id: "todo", name: "To Do", color: "#93C5FD", order: 1 },
      { id: "in_progress", name: "În lucru", color: "#FCD34D", order: 2 },
      { id: "blocked", name: "Blocat", color: "#FCA5A5", order: 3 },
      { id: "done", name: "Finalizat", color: "#86EFAC", order: 4 },
    ],
    priorities: [
      { id: "low", name: "Scăzută", color: "#94A3B8", order: 0 },
      { id: "medium", name: "Medie", color: "#60A5FA", order: 1 },
      { id: "high", name: "Ridicată", color: "#F59E0B", order: 2 },
      { id: "urgent", name: "Urgent", color: "#EF4444", order: 3 },
    ],
  }
  await setDoc(ref, defaults)
  return defaults
}

export async function getTaskSettings(): Promise<TaskSettingsDoc> {
  const ref = doc(collection(db, SETTINGS_PATH.col), SETTINGS_PATH.id)
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data() as TaskSettingsDoc
  return ensureDefaultTaskSettings()
}

export async function updateTaskSettings(update: Partial<TaskSettingsDoc>): Promise<void> {
  const ref = doc(collection(db, SETTINGS_PATH.col), SETTINGS_PATH.id)
  const snap = await getDoc(ref)
  const prev = (snap.exists() ? (snap.data() as TaskSettingsDoc) : await ensureDefaultTaskSettings())
  await setDoc(ref, { ...prev, ...update }, { merge: true })
}

function sanitizeStatuses(statuses: Array<{ id: string; name: string; color: string; order: number }>): Array<{ id: string; name: string; color: string; order: number }> {
  const byId = new Map<string, { id: string; name: string; color: string; order: number }>()
  for (const s of statuses || []) {
    if (!s || !s.id) continue
    if (!byId.has(s.id)) byId.set(s.id, s)
  }
  const list = Array.from(byId.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
  return list.map((s, idx) => ({ ...s, order: idx }))
}

function sanitizePriorities(priorities: Array<{ id: TaskPriority; name: string; color: string; order: number }>): Array<{ id: TaskPriority; name: string; color: string; order: number }> {
  const byId = new Map<TaskPriority, { id: TaskPriority; name: string; color: string; order: number }>()
  for (const p of priorities || []) {
    if (!p || !p.id) continue
    if (!byId.has(p.id)) byId.set(p.id, p)
  }
  const list = Array.from(byId.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  return list.map((p, idx) => ({ ...p, order: idx }))
}

export async function normalizeTaskSettings(): Promise<TaskSettingsDoc> {
  const ref = doc(collection(db, SETTINGS_PATH.col), SETTINGS_PATH.id)
  const snap = await getDoc(ref)
  const current: TaskSettingsDoc = snap.exists() ? (snap.data() as TaskSettingsDoc) : await ensureDefaultTaskSettings()
  const sanitized: TaskSettingsDoc = {
    statuses: sanitizeStatuses(current.statuses || []),
    priorities: sanitizePriorities(current.priorities || []),
  }
  const changed = JSON.stringify(current) !== JSON.stringify(sanitized)
  if (changed) {
    await setDoc(ref, sanitized, { merge: false })
  }
  return sanitized
}

export async function createTask(task: Omit<Task, "id" | "createdAt" | "updatedAt" | "spentSeconds">): Promise<string> {
  const col = collection(db, TASKS)
  const docRef = await addDoc(col, {
    ...task,
    assigneeIds: Array.isArray(task.assigneeIds) ? task.assigneeIds : [],
    spentSeconds: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getTask(id: string): Promise<Task | null> {
  const ref = doc(db, TASKS, id)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Task) : null
}

export async function listTasks(filters?: { status?: string; assigneeId?: string }): Promise<Task[]> {
  let q: any = collection(db, TASKS)
  const qs: any[] = []
  if (filters?.status) qs.push(where("status", "==", filters.status))
  if (filters?.assigneeId) qs.push(where("assigneeIds", "array-contains", filters.assigneeId))
  if (qs.length) q = query(q, ...qs)
  q = query(q, orderBy("updatedAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Task))
}

export async function updateTask(id: string, update: Partial<Task>): Promise<void> {
  const ref = doc(db, TASKS, id)
  await updateDoc(ref, { ...update, updatedAt: serverTimestamp() })
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, TASKS, id))
}

export async function startTimeEntry(taskId: string, userId: string): Promise<string> {
  const col = collection(db, TIME)
  const docRef = await addDoc(col, {
    taskId,
    userId,
    startedAt: serverTimestamp(),
    endedAt: null,
  })
  return docRef.id
}

export async function stopTimeEntry(entryId: string): Promise<void> {
  const ref = doc(db, TIME, entryId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data() as any
  const start = data.startedAt?.toDate ? data.startedAt.toDate() : new Date(data.startedAt)
  const end = new Date()
  const durationSec = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000))
  await updateDoc(ref, { endedAt: serverTimestamp(), durationSec })
}

export async function getTimesheet(params: { userId?: string; from?: Date; to?: Date }): Promise<TaskTimeEntry[]> {
  let q: any = collection(db, TIME)
  const parts: any[] = []
  if (params.userId) parts.push(where("userId", "==", params.userId))
  // date filtering can be added later with composite indexes if needed
  if (parts.length) q = query(q, ...parts)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TaskTimeEntry[]
}



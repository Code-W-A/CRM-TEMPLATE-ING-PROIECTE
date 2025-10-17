import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

// Lazy initialization helpers to avoid throwing during import when env vars are missing at build time
let cachedAdminApp: ReturnType<typeof initializeApp> | null = null

const getRequiredEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env: ${name}`)
  }
  return value
}

export const initializeFirebaseAdminApp = () => {
  if (cachedAdminApp) return cachedAdminApp
  const apps = getApps()
  if (apps.length > 0) {
    cachedAdminApp = apps[0]
    return cachedAdminApp
  }

  const projectId = getRequiredEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID")
  const clientEmail = getRequiredEnv("FIREBASE_ADMIN_CLIENT_EMAIL")
  const rawPrivateKey = getRequiredEnv("FIREBASE_ADMIN_PRIVATE_KEY")
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n")

  cachedAdminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  })
  return cachedAdminApp
}

export const getAdminAuth = () => getAuth(initializeFirebaseAdminApp())
export const getAdminDb = () => getFirestore(initializeFirebaseAdminApp())

// Admin version of addLog for server-side operations
export const addLogAdmin = async (log: {
  userId: string
  action: string
  target: string
  targetId: string
  details: string
}) => {
  const db = getAdminDb()
  try {
    const logsCollection = db.collection("logs")
    const logData = {
      ...log,
      timestamp: new Date(),
    }
    const docRef = await logsCollection.add(logData)
    return {
      id: docRef.id,
      ...logData,
    }
  } catch (error) {
    console.error("Error adding log with admin SDK:", error)
    throw error
  }
}

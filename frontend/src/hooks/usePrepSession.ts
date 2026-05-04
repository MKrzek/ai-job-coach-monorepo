import { useState } from 'react'

interface Answer {
  id: string
  question: string
  type: 'behavioural' | 'technical'
  modelAnswer: string
  keyPoints: string[]
}

interface PrepSession {
  id: string
  createdAt: string
  jobDescription: string
  roleTitle: string
  answers: Answer[]
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4111'

export const usePrepSession = () => {
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<PrepSession | null>(null)
  const [error, setError] = useState<string | null>(null)

  const request = async (url: string, options?: RequestInit) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url, options)
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setSession(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const runSession = (jobDescription: string) =>
    request(`${BASE_URL}/api/prep-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription }),
    })

  const fetchSession = (id: string) =>
    request(`${BASE_URL}/api/prep-session/${id}`)

  return { runSession, fetchSession, session, loading, error }
}
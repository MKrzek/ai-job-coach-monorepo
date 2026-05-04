import { useState } from 'react'
import { usePrepSession } from '../hooks/usePrepSession'

export function InterviewPrepPage() {
  const [jd, setJd] = useState('')
  const { runSession, session, loading, error } = usePrepSession()

  return (
    <div>
      <h1>Interview Prep </h1>

      < textarea
        rows={8}
        value={jd}
        onChange={e => setJd(e.target.value)}
        placeholder="Paste job description here..."
        disabled={loading}
      />

      <button onClick={() => runSession(jd)} disabled={loading || !jd.trim()
      }>
        {loading ? 'Generating...' : 'Generate Interview Prep'}
      </button>

      {error && <p style={{ color: 'red' }}> {error} </p>}

      {
        session && (
          <div>
            <h2>{session.roleTitle} </h2>
            < p > Session ID: {session.id} </p>

            {
              session.answers.map(answer => (
                <div key={answer.id} >
                  <span>{answer.type === 'behavioural' ? '🧠' : '⚙️'} </span>
                  < h3 > {answer.question} </h3>
                  < p > {answer.modelAnswer} </p>
                  {
                    answer.keyPoints.length > 0 && (
                      <ul>
                        {
                          answer.keyPoints.map((point, i) => (
                            <li key={i} > {point} </li>
                          ))
                        }
                      </ul>
                    )
                  }
                </div>
              ))
            }
          </div>
        )}
    </div>
  )
}

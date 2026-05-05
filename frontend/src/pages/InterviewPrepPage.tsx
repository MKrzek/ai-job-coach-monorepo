import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrepSession } from '../hooks/usePrepSession'

export function InterviewPrepPage() {
  const [jd, setJd] = useState('')
  const { runSession, session, loading, error } = usePrepSession()
  const navigate = useNavigate()

  return (
    <div className="chat-layout">

      <div className="chat-header">
        <h1>🧠 Interview Prep</h1>
        <p>Paste a job description to generate tailored interview questions and model answers.</p>
      </div>

      <div className="messages-list">

        {!session && !loading && (
          <div className="messages-empty">
            <div className="messages-empty-icon">📋</div>
            <div>Paste a job description below and click Generate</div>
          </div>
        )}

        {session && (
          <div>
            <div className="chat-header" style={{ borderBottom: 'none', marginBottom: 0 }}>
              <h1>{session.roleTitle}</h1>
              <p>Session ID: {session.id}</p>
            </div>

            {session.answers.map(answer => (
              <div key={answer.id} className="tool-card" style={{ maxWidth: '100%', marginBottom: '12px' }}>
                <div className="tool-card__trigger" style={{ cursor: 'default' }}>
                  <span>{answer.type === 'behavioural' ? '🧠' : '⚙️'}</span>
                  <span className="tool-card__name">{answer.question}</span>
                  <span className="tool-card__score">{answer.type}</span>
                </div>
                <div className="tool-card__body">
                  <div className="tool-card__section-label">Model Answer</div>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: '4px 0 0' }}>
                    {answer.modelAnswer}
                  </p>
                  {answer.keyPoints.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div className="tool-card__section-label">Key Points</div>
                      <ul style={{ paddingLeft: '16px', margin: '4px 0 0', fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
                        {answer.keyPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              className="btn-submit"
              style={{ width: '100%', padding: '12px', marginTop: '8px', marginBottom: '24px' }}
              onClick={() => navigate(`/practice/${session.id}`)}
            >
              🎤 Start Practice Interview
            </button>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

      </div>

      <form className="chat-form" onSubmit={e => { e.preventDefault(); runSession(jd) }}>
        <textarea
          className="chat-textarea"
          rows={6}
          value={jd}
          onChange={e => setJd(e.target.value)}
          placeholder="Paste job description here..."
          disabled={loading}
        />
        <div className="chat-form__footer">
          <span className="chat-form__hint">
            {loading ? 'Generating questions...' : 'Paste a job description and click Generate'}
          </span>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || !jd.trim()}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </form>

    </div>
  )
}

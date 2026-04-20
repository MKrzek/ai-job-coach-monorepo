import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { Markdown } from './components/Markdown'

export default function App() {
  const [input, setInput] = useState('')
  const [waitingForReply, setWaitingForReply] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:4111/chat/cv-analyser',
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const isStreaming = status === 'streaming'
  const lastRole = messages[messages.length - 1]?.role

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    setWaitingForReply(true)
    sendMessage({ text: input })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  useEffect(() => {
    if (status === 'ready' || status === 'error') {
      setWaitingForReply(false)
    }
  }, [status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  const lastMessage = messages[messages.length - 1]
  const assistantIsTyping = lastMessage?.role === 'assistant' &&
    lastMessage.parts?.some((p: any) => p.type === 'text' && p.text.length > 0)

  const showDots = waitingForReply && !assistantIsTyping

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      maxWidth: '800px', margin: '0 auto', padding: '24px',
      fontFamily: 'system-ui, sans-serif',
    }}>

      {/* DEBUG — remove when working */}
      <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
        status: {status} | messages: {messages.length} | lastRole: {lastRole ?? 'none'} | waiting: {String(waitingForReply)} | showDots: {String(showDots)}
      </div>

      {/* Header */}
      <div style={{ marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>AI Job Coach</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
          Paste a job description + your CV to get a match analysis
        </p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex',
        flexDirection: 'column', gap: '16px', paddingBottom: '16px',
      }}>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '80px', fontSize: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>💼</div>
            <div>Paste a job description and your CV below</div>
          </div>
        )}

        {messages.map(message => (
          <div key={message.id}>
            {message.parts?.map((part: any, i: number) => {

              if (part.type === 'text') {
                const isUser = message.role === 'user'
                return (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    marginBottom: '4px',
                  }}>
                    {!isUser && (
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: '#2563eb', color: 'white', fontSize: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginRight: '8px', marginTop: '2px',
                      }}>AI</div>
                    )}
                    <div style={{
                      maxWidth: '85%', padding: '12px 16px', borderRadius: '12px',
                      background: isUser ? '#2563eb' : '#f3f4f6',
                      color: isUser ? 'white' : '#111827',
                      fontSize: '14px', lineHeight: '1.6',
                      whiteSpace: isUser ? 'pre-wrap' : undefined,
                    }}>
                      {isUser ? part.text : <Markdown content={part.text} />}
                    </div>
                  </div>
                )
              }

              if (part.type.startsWith('tool-')) {
                const isComplete = part.state === 'result'
                return (
                  <ToolCard
                    key={i}
                    toolName={part.toolName ?? part.type.replace('tool-', '')}
                    input={part.input}
                    output={part.output}
                    isComplete={isComplete}
                  />
                )
              }

              return null
            })}
          </div>
        ))}

        {/* Three dot shimmer */}
        {showDots && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#2563eb', color: 'white', fontSize: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>AI</div>
            <div style={{
              padding: '12px 16px', borderRadius: '12px',
              background: '#f3f4f6', display: 'flex', gap: '6px', alignItems: 'center',
            }}>
              <div className="dot dot-1" />
              <div className="dot dot-2" />
              <div className="dot dot-3" />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px',
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>⚠️ Something went wrong. Check the Mastra server is running.</span>
            <button onClick={() => regenerate()} style={{
              marginLeft: '12px', padding: '4px 10px', background: '#dc2626',
              color: 'white', border: 'none', borderRadius: '4px',
              fontSize: '13px', cursor: 'pointer', flexShrink: 0,
            }}>Retry</button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a job description + your CV here... (Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
          style={{
            width: '100%', minHeight: '140px', padding: '12px',
            borderRadius: '8px', border: '1px solid #d1d5db',
            fontSize: '14px', lineHeight: '1.6', resize: 'vertical',
            fontFamily: 'inherit', color: '#111827',
            background: isLoading ? '#f9fafb' : 'white',
            boxSizing: 'border-box', outline: 'none',
          }}
        />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginTop: '8px', gap: '8px',
        }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            {isStreaming ? 'Streaming response...' : 'Enter to send · Shift+Enter for new line'}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isStreaming && (
              <button type="button" onClick={() => stop()} style={{
                padding: '8px 16px', background: 'white', color: '#dc2626',
                border: '1px solid #dc2626', borderRadius: '6px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              }}>■ Stop</button>
            )}
            <button type="submit" disabled={isLoading || !input.trim()} style={{
              padding: '8px 20px',
              background: isLoading || !input.trim() ? '#d1d5db' : '#2563eb',
              color: 'white', border: 'none', borderRadius: '6px',
              fontSize: '14px', fontWeight: 500,
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            }}>
              {isLoading ? 'Thinking...' : 'Analyse'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── ToolCard ────────────────────────────────────────────────────────────────

interface ToolCardProps {
  toolName: string
  input: any
  output: any
  isComplete: boolean
}

function ToolCard({ toolName, input, output, isComplete }: ToolCardProps) {
  const [open, setOpen] = useState(false)
  const score = (output as any)?.score

  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: '8px',
      overflow: 'hidden', fontSize: '13px', margin: '4px 0', maxWidth: '85%',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '8px 12px', background: '#f9fafb',
        border: 'none', cursor: 'pointer', display: 'flex',
        alignItems: 'center', gap: '8px', textAlign: 'left',
        fontSize: '13px', color: '#374151',
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
          background: isComplete ? '#22c55e' : '#f59e0b',
        }} />
        <span style={{ fontWeight: 500 }}>🔧 {toolName}</span>
        {score !== undefined && (
          <span style={{
            marginLeft: '4px', padding: '1px 8px', background: '#dcfce7',
            color: '#15803d', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
          }}>Score: {score}</span>
        )}
        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '11px' }}>
          {open ? '▲ hide' : '▼ show'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '10px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 600, color: '#6b7280',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px',
            }}>Input</div>
            <pre style={{
              background: '#f3f4f6', padding: '8px', borderRadius: '4px',
              overflow: 'auto', fontSize: '12px', margin: 0, lineHeight: '1.5',
            }}>{JSON.stringify(input, null, 2)}</pre>
          </div>
          {output && (
            <div>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px',
              }}>Output</div>
              <pre style={{
                background: '#f0fdf4', padding: '8px', borderRadius: '4px',
                overflow: 'auto', fontSize: '12px', margin: 0, lineHeight: '1.5',
              }}>{JSON.stringify(output, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

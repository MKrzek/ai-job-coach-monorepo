import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'

export default function App() {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:4111/chat/cv-analyser',
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.SubmitEvent)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif',
    }}>

      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
          AI Job Coach
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
          Paste a job description + your CV to get a match analysis
        </p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '16px',
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            marginTop: '60px',
            fontSize: '14px',
          }}>
            Start by pasting a job description and your CV below
          </div>
        )}

        {messages.map(message => (
          <div key={message.id}>
            {message.parts?.map((part, i) => {

              if (part.type === 'text') {
                const isUser = message.role === 'user'
                return (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: isUser ? '#2563eb' : '#f3f4f6',
                      color: isUser ? 'white' : '#111827',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {part.text}
                    </div>
                  </div>
                )
              }

              if (part.type === 'tool-invocation') {
                return (
                  <ToolCard key={i} part={part} />
                )
              }

              return null
            })}
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#f3f4f6',
              color: '#6b7280',
              fontSize: '14px',
            }}>
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        borderTop: '1px solid #e5e7eb',
        paddingTop: '16px',
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a job description + your CV here... (Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
          style={{
            width: '100%',
            minHeight: '140px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            lineHeight: '1.6',
            resize: 'vertical',
            fontFamily: 'inherit',
            color: '#111827',
            background: isLoading ? '#f9fafb' : 'white',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
        }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            Enter to send · Shift+Enter for new line
          </span>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: '8px 20px',
              background: isLoading || !input.trim() ? '#d1d5db' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Thinking...' : 'Analyse'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Tool call card component
function ToolCard({ part }: { part: any }) {
  const [open, setOpen] = useState(false)
  const toolName = part.toolInvocation?.toolName ?? part.toolName ?? 'tool'
  const input = part.toolInvocation?.args ?? part.input ?? {}
  const output = part.toolInvocation?.result ?? part.output

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      fontSize: '13px',
      marginBottom: '8px',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#f9fafb',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'left',
          fontSize: '13px',
          color: '#374151',
        }}
      >
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: output ? '#22c55e' : '#f59e0b',
          flexShrink: 0,
        }} />
        <span style={{ fontWeight: 500 }}>🔧 {toolName}</span>
        <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>
              INPUT
            </div>
            <pre style={{
              background: '#f3f4f6',
              padding: '8px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              margin: 0,
            }}>
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          {output && (
            <div>
              <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>
                OUTPUT
              </div>
              <pre style={{
                background: '#f0fdf4',
                padding: '8px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                margin: 0,
              }}>
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import './App.css'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { Markdown } from './components/Markdown'
import ToolCard from './components/ToolCard'
import UploadCvForm from './components/UploadCvForm'


const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4111'

export default function App() {
  const [input, setInput] = useState('')
  const [waitingForReply, setWaitingForReply] = useState(false)
  const [hasUploadedCv, setHasUploadedCv] = useState(false)
  const [cvMessage, setCvMessage] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: `${BASE_URL}/api/chat/cv`,
      prepareSendMessagesRequest({ messages, body }) {
        const lastUserMessage = messages[messages.length - 1]
        const latestText =
          lastUserMessage?.parts
            ?.filter((part: any) => part.type === 'text')
            ?.map((part: any) => part.text)
            ?.join(' ') ?? ''

        return {
          body: {
            messages,
            userId: body?.userId ?? 'default-user',
            latestText,
          },
        }
      }
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const isStreaming = status === 'streaming'
  const lastRole = messages[messages.length - 1]?.role

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!hasUploadedCv) {
      setCvMessage('Upload your CV first so the analyser can use it.')
      return
    }

    if (!input.trim() || isLoading) return

    setWaitingForReply(true)
    setCvMessage('')

    sendMessage(
      { text: input },
      {
        body: {
          userId: 'default-user',
        },
      }
    )

    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
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
  const assistantIsTyping =
    lastMessage?.role === 'assistant' &&
    lastMessage.parts?.some((p: any) => p.type === 'text' && p.text.length > 0)

  const showDots = waitingForReply && !assistantIsTyping

  return (
    <div className="chat-layout">
      <div className="debug-bar">
        status: {status} | messages: {messages.length} | lastRole: {lastRole ?? 'none'} | waiting: {String(waitingForReply)} | showDots: {String(showDots)}
      </div>

      <div className="chat-header">
        <h1>AI Job Coach</h1>

        <UploadCvForm
          onUploadSuccess={() => {
            setHasUploadedCv(true)
            setCvMessage('CV uploaded and ready to use.')
          }}
        />

        <p>Upload your CV first, then paste a job description or ask for a tailored analysis.</p>

        {cvMessage && (
          <p style={{ color: hasUploadedCv ? 'green' : 'crimson', marginTop: '8px' }}>
            {cvMessage}
          </p>
        )}
      </div>

      <div className="messages-list">
        {messages.length === 0 && (
          <div className="messages-empty">
            <div className="messages-empty-icon">💼</div>
            <div>Upload your CV, then ask for a JD match, bullet rewrite, or gap analysis</div>
          </div>
        )}

        {messages.map(message => (
          <div key={message.id}>
            {message.parts?.map((part: any, i: number) => {
              if (part.type === 'text') {
                const isUser = message.role === 'user'

                return (
                  <div key={i} className={`message-row message-row--${isUser ? 'user' : 'assistant'}`}>
                    {!isUser && <div className="message-avatar">AI</div>}
                    <div className={`message-bubble message-bubble--${isUser ? 'user' : 'assistant'}`}>
                      {isUser ? part.text : <Markdown content={part.text} />}
                    </div>
                  </div>
                )
              }

              if (part.type.startsWith('tool-')) {
                return (
                  <ToolCard
                    key={i}
                    toolName={part.toolName ?? part.type.replace('tool-', '')}
                    input={part.input}
                    output={part.output}
                    isComplete={part.state === 'result'}
                  />
                )
              }

              return null
            })}
          </div>
        ))}

        {showDots && (
          <div className="typing-indicator">
            <div className="message-avatar">AI</div>
            <div className="typing-bubble">
              <div className="dot dot-1" />
              <div className="dot dot-2" />
              <div className="dot dot-3" />
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span>⚠️ Something went wrong. Check the Mastra server is running.</span>
            <button className="error-banner__retry" onClick={() => regenerate()}>
              Retry
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste the job description or ask: 'Using my uploaded CV, rewrite 3 bullet points for this role...'"
          disabled={isLoading}
        />

        <div className="chat-form__footer">
          <span className="chat-form__hint">
            {isStreaming ? 'Streaming response...' : 'Enter to send · Shift+Enter for new line'}
          </span>

          <div className="chat-form__actions">
            {isStreaming && (
              <button type="button" className="btn-stop" onClick={() => stop()}>
                ■ Stop
              </button>
            )}

            <button type="submit" className="btn-submit" disabled={isLoading || !input.trim()}>
              {isLoading ? 'Thinking...' : 'Analyse'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

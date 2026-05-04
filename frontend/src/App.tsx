import './App.css'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { Markdown } from './components/Markdown'
import ToolCard from './components/ToolCard'

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

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    setWaitingForReply(true)
    sendMessage({ text: input })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.SubmitEvent<HTMLFormElement>)
    }
  }

  useEffect(() => {
    if (status === 'ready' || status === 'error') setWaitingForReply(false)
  }, [status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  const lastMessage = messages[messages.length - 1]
  const assistantIsTyping = lastMessage?.role === 'assistant' &&
    lastMessage.parts?.some((p: any) => p.type === 'text' && p.text.length > 0)
  const showDots = waitingForReply && !assistantIsTyping

  return (
    <div className="chat-layout">

      {/* DEBUG — remove when working */}
      <div className="debug-bar">
        status: {status} | messages: {messages.length} | lastRole: {lastRole ?? 'none'} | waiting: {String(waitingForReply)} | showDots: {String(showDots)}
      </div>

      <div className="chat-header">
        <h1>AI Job Coach</h1>
        <p>Paste a job description + your CV to get a match analysis</p>
      </div>

      <div className="messages-list">
        {messages.length === 0 && (
          <div className="messages-empty">
            <div className="messages-empty-icon">💼</div>
            <div>Paste a job description and your CV below</div>
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
            <button className="error-banner__retry" onClick={() => regenerate()}>Retry</button>
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
          placeholder="Paste a job description + your CV here... (Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
        />
        <div className="chat-form__footer">
          <span className="chat-form__hint">
            {isStreaming ? 'Streaming response...' : 'Enter to send · Shift+Enter for new line'}
          </span>
          <div className="chat-form__actions">
            {isStreaming && (
              <button type="button" className="btn-stop" onClick={() => stop()}>■ Stop</button>
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

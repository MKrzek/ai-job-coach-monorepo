import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Markdown } from '../components/Markdown'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4111'

export function PracticeInterviewPage() {
  const { sessionId } = useParams()
  const [input, setInput] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${BASE_URL}/api/practice-session/${sessionId}/chat`,
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            messages,
            memory: {
              thread: sessionId,
              resource: 'user-1',
            },
            // no need to pass JD — backend fetches it from DB by sessionId
          },
        }
      },
    }),
  })
  const isLoading = status === 'submitted' || status === 'streaming'

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.SubmitEvent<HTMLFormElement>)
    }
  }

  return (
    <div className="chat-layout">
      <div className="chat-header">
        <h1>🎤 Practice Interview</h1>
        <p>Answer each question naturally — the agent will give feedback and continue.</p>
      </div>

      <div className="messages-list">
        {messages.map(message => (
          <div key={message.id}>
            {message.parts?.map((part: any, i: number) => {
              if (part.type !== 'text') return null
              const isUser = message.role === 'user'
              return (
                <div key={i} className={`message-row message-row--${isUser ? 'user' : 'assistant'}`}>
                  {!isUser && <div className="message-avatar">AI</div>}
                  <div className={`message-bubble message-bubble--${isUser ? 'user' : 'assistant'}`}>
                    {isUser ? part.text : <Markdown content={part.text} />}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
        />
        <div className="chat-form__footer">
          <span className="chat-form__hint">
            {isLoading ? 'Agent is responding...' : 'Enter to send · Shift+Enter for new line'}
          </span>
          <button type="submit" className="btn-submit" disabled={isLoading || !input.trim()}>
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}

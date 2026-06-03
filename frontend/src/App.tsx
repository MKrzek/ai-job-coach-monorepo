import './App.css'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState } from 'react'
import { Markdown } from './components/Markdown'
import ToolCard from './components/ToolCard'
import UploadCvForm from './components/UploadCvForm'
import { CvAnalysisResultView } from './components/CvAnalysisResultView'
import type { AppUIMessage } from './types/chat'
import {
  getToolInput,
  getToolName,
  getToolOutput,
  isCvAnalysisResult,
  isTextPart,
  isToolComplete,
  isToolPart,
} from './types/guards'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4111'

export default function App() {
  const [input, setInput] = useState('')
  const [waitingForReply, setWaitingForReply] = useState(false)
  const [hasUploadedCv, setHasUploadedCv] = useState(false)
  const [cvMessage, setCvMessage] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop, error, regenerate } =
    useChat<AppUIMessage>({
      transport: new DefaultChatTransport({
        api: `${BASE_URL}/api/chat/cv`,
        prepareSendMessagesRequest({ messages, body }) {
          const lastUserMessage = messages[messages.length - 1]

          const latestText =
            lastUserMessage?.parts
              ?.filter(isTextPart)
              .map(part => part.text)
              .join(' ') ?? ''

          return {
            body: {
              messages,
              userId: body?.userId ?? 'default-user',
              latestText,
            },
          }
        },
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
    (lastMessage.parts?.some(isTextPart) ?? false)

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
            {message.parts?.map((part, i) => {
              if (isTextPart(part)) {
                const isUser = message.role === 'user'

                return (
                  <div
                    key={`${message.id}-text-${i}`}
                    className={`message-row message-row--${isUser ? 'user' : 'assistant'}`}
                  >
                    {!isUser && <div className="message-avatar">AI</div>}

                    <div
                      className={`message-bubble message-bubble--${isUser ? 'user' : 'assistant'}`}
                    >
                      {isUser ? part.text : <Markdown content={part.text} />}
                    </div>
                  </div>
                )
              }

              if (isToolPart(part)) {
                const toolName = getToolName(part) ?? 'unknown-tool'
                const toolInput = getToolInput(part)
                const toolOutput = getToolOutput(part)
                const isComplete = isToolComplete(part)

                if (
                  isComplete &&
                  (toolName === 'jdScorerTool' || toolName === 'cvAnalyserTool') &&
                  isCvAnalysisResult(toolOutput)
                ) {
                  return (
                    <div
                      key={`${message.id}-tool-${i}`}
                      className="message-row message-row--assistant"
                    >
                      <div className="message-avatar">AI</div>

                      <div className="message-bubble message-bubble--assistant message-bubble--tool-result">
                        <CvAnalysisResultView result={toolOutput} />
                      </div>
                    </div>
                  )
                }

                return (
                  <ToolCard
                    key={`${message.id}-toolcard-${i}`}
                    toolName={toolName}
                    input={toolInput}
                    output={toolOutput}
                    isComplete={isComplete}
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
              <button
                type="button"
                className="btn-stop"
                onClick={() => stop()}
              >
                ■ Stop
              </button>
            )}

            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? 'Thinking...' : 'Analyse'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

import * as React from 'react'
import { DefaultChatTransport, type ToolUIPart } from 'ai'
import { useChat } from '@ai-sdk/react'
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
} from './components/ai-elements/prompt-input'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
} from './components/ai-elements/message'
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from './components/ai-elements/tool'

export default function App() {
  const [input, setInput] = React.useState<React.ComponentProps<typeof PromptInputTextarea>['value']>('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      // 👇 points to your cv-analyser agent by its id
      api: 'http://localhost:4111/chat/cv-analyser',
    }),
  })

  const handleSubmit = async () => {
    if (!input?.toString().trim()) return
    sendMessage({ text: input.toString() })
    setInput('')
  }

  return (
    <div className="relative mx-auto size-full h-screen max-w-4xl p-6">
      <div className="flex h-full flex-col">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold">AI Job Coach</h1>
          <p className="text-sm text-gray-500">
            Paste a job description + your CV summary to get a match analysis
          </p>
        </div>

        <Conversation className="h-full">
          <ConversationContent>
            {messages.map(message => (
              <Message from={message.role} key={message.id}>
                {message.parts?.map((part, i) => {
                  if (part.type === 'text') {
                    return (
                      <MessageContent key={`${message.id}-${i}`} >
                        <MessageResponse>{part.text}</MessageResponse>
                      </MessageContent>
                    )
                  }
                  if (part.type?.startsWith('tool-')) {
                    return (
                      <Tool
                        key={`${message.id}-${i}`}
                        type={(part as ToolUIPart).type}
                        state={(part as ToolUIPart).state || 'output-available'}
                        className="cursor-pointer"
                      >
                        <ToolHeader type={(part as ToolUIPart).type} state={(part as ToolUIPart).state || 'output-available'} />
                        <ToolContent>
                          <ToolInput input={(part as ToolUIPart).input || {}} />
                          <ToolOutput
                            output={(part as ToolUIPart).output}
                            errorText={(part as ToolUIPart).errorText}
                          />
                        </ToolContent>
                      </Tool>
                    )
                  }
                  return null
                })}
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputBody>
            <PromptInputTextarea
              onChange={e => setInput(e.target.value)}
              value={input}
              placeholder="Paste a job description + your CV here..."
              disabled={status !== 'ready'}
            />
          </PromptInputBody>
        </PromptInput>

      </div>
    </div>
  )
}

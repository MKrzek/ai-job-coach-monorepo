import './../App.css'
import { useState } from 'react'

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
    <div className="tool-card">
      <button className="tool-card__trigger" onClick={() => setOpen(o => !o)}>
        <div className={`tool-card__dot tool-card__dot--${isComplete ? 'complete' : 'pending'}`} />
        <span className="tool-card__name">🔧 {toolName}</span>
        {score !== undefined && <span className="tool-card__score">Score: {score}</span>}
        <span className="tool-card__toggle">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div className="tool-card__body">
          <div className="tool-card__section">
            <div className="tool-card__section-label">Input</div>
            <pre className="tool-card__pre tool-card__pre--input">{JSON.stringify(input, null, 2)}</pre>
          </div>
          {output && (
            <div className="tool-card__section">
              <div className="tool-card__section-label">Output</div>
              <pre className="tool-card__pre tool-card__pre--output">{JSON.stringify(output, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ToolCard
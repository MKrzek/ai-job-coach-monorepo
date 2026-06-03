import './../App.css'
import { useMemo, useState } from 'react'
import { safeStringify } from '../utils/json'
import { hasNumericScore } from '../types/guards'


interface ToolCardProps {
  toolName: string
  input: unknown
  output: unknown
  isComplete: boolean
}

function ToolCard({ toolName, input, output, isComplete }: ToolCardProps) {
  const [open, setOpen] = useState(false)

  const score = useMemo(
    () => (hasNumericScore(output) ? output.score : null),
    [output]
  )

  const formattedInput = useMemo(() => safeStringify(input), [input])
  const formattedOutput = useMemo(() => safeStringify(output), [output])

  return (
    <div className="tool-card">
      <button
        type="button"
        className="tool-card__trigger"
        onClick={() => setOpen(current => !current)}
      >
        <div
          className={`tool-card__dot tool-card__dot--${isComplete ? 'complete' : 'pending'}`}
        />
        <span className="tool-card__name">🔧 {toolName}</span>
        {score !== null && <span className="tool-card__score">Score: {score}</span>}
        <span className="tool-card__toggle">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div className="tool-card__body">
          <div className="tool-card__section">
            <div className="tool-card__section-label">Input</div>
            <pre className="tool-card__pre tool-card__pre--input">{formattedInput}</pre>
          </div>

          {output !== undefined && (
            <div className="tool-card__section">
              <div className="tool-card__section-label">Output</div>
              <pre className="tool-card__pre tool-card__pre--output">{formattedOutput}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ToolCard
import ReactMarkdown from 'react-markdown'

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '16px 0 8px' }}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '14px 0 6px' }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '12px 0 4px' }}>{children}</h3>
        ),
        p: ({ children }) => (
          <p style={{ margin: '6px 0', lineHeight: '1.65' }}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul style={{ paddingLeft: '20px', margin: '6px 0' }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol style={{ paddingLeft: '20px', margin: '6px 0' }}>{children}</ol>
        ),
        li: ({ children }) => (
          <li style={{ margin: '3px 0', lineHeight: '1.6' }}>{children}</li>
        ),
        strong: ({ children }) => (
          <strong style={{ fontWeight: 600 }}>{children}</strong>
        ),
        code: ({ children }) => (
          <code style={{
            background: '#e5e7eb',
            padding: '1px 5px',
            borderRadius: '3px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}>{children}</code>
        ),
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '12px 0' }} />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
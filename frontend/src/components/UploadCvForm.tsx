import { useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4111'

type UploadCvFormProps = {
  onUploadSuccess?: () => void
}

function UploadCvForm({ onUploadSuccess }: UploadCvFormProps) {
  const [cvText, setCvText] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!cvText.trim()) {
      setMessage('Please paste your CV first.')
      return
    }

    try {
      setLoading(true)
      setMessage('')

      const response = await fetch(`${BASE_URL}/api/upload-cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'default-user',
          cvText,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload CV')
      }

      setMessage(
        data.chunkCount
          ? `CV uploaded successfully (${data.chunkCount} chunks).`
          : 'CV uploaded successfully.'
      )

      setCvText('')
      onUploadSuccess?.()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: '12px' }}>
      <textarea
        value={cvText}
        onChange={e => setCvText(e.target.value)}
        rows={10}
        placeholder="Paste your CV here..."
        style={{ width: '100%', marginBottom: '8px' }}
        disabled={loading}
      />

      <button
        type="submit"
        className="btn-submit"
        disabled={loading || !cvText.trim()}
      >
        {loading ? 'Uploading...' : 'Upload CV'}
      </button>

      {message && <p style={{ marginTop: '8px' }}>{message}</p>}
    </form>
  )
}

export default UploadCvForm;

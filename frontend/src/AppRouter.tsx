import { Routes, Route, Link } from 'react-router-dom'
import App from './App'
import { InterviewPrepPage } from './pages/InterviewPrepPage'

export default function AppRouter() {
  return (
    <>
      {/* Simple nav */}
      <nav style={{
        display: 'flex', gap: '16px', padding: '12px 24px',
        borderBottom: '1px solid #e5e7eb', fontSize: '14px',
      }}>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
          💼 CV Analyser
        </Link>
        <Link to="/interview-prep" style={{ color: '2563eb', textDecoration: 'none', fontWeight: 500 }}>
          🧠 Interview Prep
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/interview-prep" element={<InterviewPrepPage />} />
      </Routes>
    </>
  )
}
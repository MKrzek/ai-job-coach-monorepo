import { Routes, Route, NavLink } from 'react-router-dom'
import App from './App'
import { InterviewPrepPage } from './pages/InterviewPrepPage'
import { PracticeInterviewPage } from './pages/PracticeInterviewPage'

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? '#1d4ed8' : '#2563eb',
  textDecoration: 'none',
  fontWeight: 600,
  padding: '8px 12px',
  borderRadius: '8px',
  backgroundColor: isActive ? '#eff6ff' : 'transparent',
})

export default function AppRouter() {
  return (
    <>
      <nav
        style={{
          display: 'flex',
          gap: '16px',
          padding: '12px 24px',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '14px',
          alignItems: 'center',
        }}
      >
        <NavLink to="/" end style={navLinkStyle}>
          💼 CV Analyser
        </NavLink>

        <NavLink to="/interview-prep" style={navLinkStyle}>
          🧠 Interview Prep
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/interview-prep" element={<InterviewPrepPage />} />
        <Route path="/practice/:sessionId" element={<PracticeInterviewPage />} />
      </Routes>
    </>
  )
}

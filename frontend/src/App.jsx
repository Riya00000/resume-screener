import { useState } from 'react'
import axios from 'axios'
import './index.css'

const API_URL = import.meta.env.VITE_API_URL

// --- Score Ring Component ---
const ScoreRing = ({ score }) => {
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#facc15' : score >= 40 ? '#fb923c' : '#f87171'
  const circumference = 2 * Math.PI * 28
  const dash = (score / 100) * circumference

  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r="28" fill="none" stroke="#1e1e2e" strokeWidth="5" />
        <circle cx="36" cy="36" r="28" fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color
      }}>{score}</span>
    </div>
  )
}

// --- Badge Component ---
const Badge = ({ label, color }) => {
  const colors = {
    green:  { bg: '#0f2e1a', text: '#4ade80', border: '#166534' },
    yellow: { bg: '#2e2a0f', text: '#facc15', border: '#854d0e' },
    orange: { bg: '#2e1a0f', text: '#fb923c', border: '#9a3412' },
    red:    { bg: '#2e0f0f', text: '#f87171', border: '#991b1b' },
    purple: { bg: '#1a0f2e', text: '#a78bfa', border: '#5b21b6' },
  }
  const c = colors[color] || colors.purple
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 4, padding: '2px 10px', fontSize: 11,
      fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em'
    }}>{label}</span>
  )
}

// --- Result Card Component ---
const ResultCard = ({ result, rank }) => {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 24, marginBottom: 16,
      borderLeft: `3px solid ${result.category.color === 'green' ? '#4ade80' :
        result.category.color === 'yellow' ? '#facc15' :
        result.category.color === 'orange' ? '#fb923c' : '#f87171'}`,
      transition: 'transform 0.2s',
      animation: `fadeIn 0.4s ease ${rank * 0.1}s both`
    }}>

      {/* Top Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <ScoreRing score={result.score} />

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>
              #{rank + 1} {result.filename.replace('.pdf','').replace('.docx','')}
            </span>
            <Badge label={result.category.label} color={result.category.color} />
            <Badge label={result.seniority} color="purple" />
            {result.recommended && <Badge label="✓ Recommended" color="green" />}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>{result.summary}</p>
        </div>

        <button onClick={() => setOpen(!open)} style={{
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--muted)', borderRadius: 6, padding: '6px 14px',
          cursor: 'pointer', fontSize: 12, fontFamily: 'DM Mono, monospace'
        }}>{open ? '▲ Less' : '▼ More'}</button>
      </div>

      {/* Expanded Details */}
      {open && (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>

          <div>
            <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 8, letterSpacing: '0.1em' }}>MATCHED SKILLS</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {result.matchedSkills.map(s => <Badge key={s} label={s} color="green" />)}
            </div>
          </div>

          <div>
            <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 8, letterSpacing: '0.1em' }}>MISSING SKILLS</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {result.missingSkills.length > 0
                ? result.missingSkills.map(s => <Badge key={s} label={s} color="red" />)
                : <span style={{ color: 'var(--green)', fontSize: 12 }}>None!</span>}
            </div>
          </div>

          <div>
            <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 8, letterSpacing: '0.1em' }}>HIGHLIGHTS</p>
            {result.highlights.length > 0
              ? result.highlights.map(h => <p key={h} style={{ fontSize: 12, color: 'var(--accent2)', marginBottom: 4 }}>★ {h}</p>)
              : <p style={{ fontSize: 12, color: 'var(--muted)' }}>None detected</p>}
          </div>

          <div>
            <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 8, letterSpacing: '0.1em' }}>RED FLAGS</p>
            {result.redFlags.length > 0
              ? result.redFlags.map(f => <p key={f} style={{ fontSize: 12, color: 'var(--red)', marginBottom: 4 }}>⚠ {f}</p>)
              : <p style={{ fontSize: 12, color: 'var(--green)' }}>✓ None detected</p>}
          </div>

        </div>
      )}
    </div>
  )
}

// --- Main App ---
export default function App() {
  const [files, setFiles]               = useState([])
  const [jobDescription, setJobDescription] = useState('')
  const [results, setResults]           = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [dragging, setDragging]         = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      f.type === 'application/pdf' ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    setFiles(prev => [...prev, ...dropped])
  }

  const handleSubmit = async () => {
    if (files.length === 0 || !jobDescription.trim()) {
      setError('Please add resumes and a job description')
      return
    }
    setError('')
    setLoading(true)
    setResults([])

    const formData = new FormData()
    files.forEach(f => formData.append('resumes', f))
    formData.append('jobDescription', jobDescription)

    try {
      const res = await axios.post(API_URL, formData)
      setResults(res.data.results)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #e8e8f0, #7c6af7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>Resume Screener</h1>
        <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>
          AI-powered candidate ranking — upload resumes, paste a job description, get instant results.
        </p>
      </div>

      {/* Job Description */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
          JOB DESCRIPTION
        </label>
        <textarea
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          rows={5}
          style={{
            width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 16, color: 'var(--text)', fontSize: 13,
            fontFamily: 'DM Mono, monospace', resize: 'vertical', outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput').click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 12, padding: '32px 24px', textAlign: 'center',
          cursor: 'pointer', marginBottom: 16, transition: 'all 0.2s',
          background: dragging ? '#1a1a2e' : 'transparent'
        }}
      >
        <p style={{ fontSize: 28, marginBottom: 8 }}>📄</p>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Drag & drop resumes here or <span style={{ color: 'var(--accent)' }}>click to browse</span>
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>PDF or DOCX • Max 5MB each</p>
        <input id="fileInput" type="file" multiple accept=".pdf,.docx" hidden
          onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {files.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 16px', marginBottom: 8
            }}>
              <span style={{ fontSize: 13 }}>📄 {f.name}</span>
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>⚠ {error}</p>
      )}

      {/* Submit Button */}
      <button onClick={handleSubmit} disabled={loading} style={{
        width: '100%', padding: '14px 24px',
        background: loading ? 'var(--border)' : 'var(--accent)',
        color: '#fff', border: 'none', borderRadius: 10,
        fontSize: 14, fontFamily: 'Syne, sans-serif', fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.05em',
        transition: 'all 0.2s', marginBottom: 40
      }}>
        {loading ? '⏳ Analyzing resumes...' : '⚡ Screen Resumes'}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20 }}>
              Results <span style={{ color: 'var(--muted)', fontSize: 14 }}>({results.length} candidates)</span>
            </h2>
            <span style={{ color: 'var(--green)', fontSize: 13 }}>
              ✓ {results.filter(r => r.recommended).length} recommended
            </span>
          </div>
          {results.map((r, i) => <ResultCard key={i} result={r} rank={i} />)}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
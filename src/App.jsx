import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8080'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(null)
  const [error, setError] = useState('')

  const [applications, setApplications] = useState([])
  const [companies, setCompanies] = useState([])

  const [role, setRole] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [companySearch, setCompanySearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [status, setStatus] = useState('APPLIED')
  const [appliedDate, setAppliedDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!response.ok) throw new Error('Login failed - check your username and password')
      const jwt = await response.text()
      setToken(jwt)
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchApplications = async () => {
    const response = await fetch(`${API_BASE}/api/applications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    setApplications(data)
  }

  const fetchCompanies = async () => {
    const response = await fetch(`${API_BASE}/api/companies`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    setCompanies(data)
  }

  useEffect(() => {
    if (token) {
      fetchApplications()
      fetchCompanies()
    }
  }, [token])

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  const selectCompany = (company) => {
    setCompanyId(company.id)
    setCompanySearch(company.name)
    setShowDropdown(false)
  }

  const handleAddApplication = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (!companySearch) {
        setError('Please enter a company name')
        return
      }

      let finalCompanyId = companyId

      const exactMatch = companies.find(
        (c) => c.name.toLowerCase() === companySearch.toLowerCase()
      )

      if (!exactMatch) {
        const companyResponse = await fetch(`${API_BASE}/api/companies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: companySearch }),
        })
        const createdCompany = await companyResponse.json()
        finalCompanyId = createdCompany.id
        setCompanies([...companies, createdCompany])
      } else {
        finalCompanyId = exactMatch.id
      }

      const response = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role, companyId: Number(finalCompanyId), status, appliedDate, notes }),
      })
      if (!response.ok) throw new Error('Failed to add application')

      setRole('')
      setCompanyId('')
      setCompanySearch('')
      setStatus('APPLIED')
      setAppliedDate('')
      setNotes('')

      fetchApplications()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!token) {
    return (
      <div>
        <h1>Job Tracker - Login</h1>
        <form onSubmit={handleLogin}>
          <div>
            <label>Username: </label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label>Password: </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit">Login</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <h1>Job Tracker</h1>

      <h2>Add Application</h2>
      <form onSubmit={handleAddApplication}>
        <div>
          <label>Role: </label>
          <input value={role} onChange={(e) => setRole(e.target.value)} required />
        </div>

        <div>
          <label>Company: </label>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
              value={companySearch}
              onChange={(e) => {
                setCompanySearch(e.target.value)
                setCompanyId('')
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Click to browse or type to search..."
            />

            {showDropdown && filteredCompanies.length > 0 && (
              <div
                style={{
                  border: '1px solid gray',
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: '#222',
                  zIndex: 10,
                  minWidth: '200px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                }}
              >
                {filteredCompanies.map((c) => (
                  <div
                    key={c.id}
                    style={{ padding: '4px 8px', cursor: 'pointer' }}
                    onMouseDown={() => selectCompany(c)}
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showDropdown && filteredCompanies.length === 0 && companySearch && (
            <p style={{ margin: '4px 0 0 0', whiteSpace: 'nowrap', fontSize: '0.9em', color: 'gray' }}>
              No company found — "{companySearch}" will be added as new company
            </p>
          )}
        </div>

        <div>
          <label>Status: </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="APPLIED">APPLIED</option>
            <option value="INTERVIEWING">INTERVIEWING</option>
            <option value="OFFERED">OFFERED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
        <div>
          <label>Applied Date: </label>
          <input type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} required />
        </div>
        <div>
          <label>Notes: </label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="submit">Add Application</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Your Applications</h2>
      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <ul>
          {applications.map((app) => (
            <li key={app.id}>
              <strong>{app.role}</strong> at {app.companyName} — {app.status} ({app.appliedDate})
              {app.notes && <span> — {app.notes}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
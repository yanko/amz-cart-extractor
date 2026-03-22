import { useState, useEffect } from 'react'
import './Options.css'
import { Dashboard } from '../components/Dashboard'

export const Options = () => {
  const [newTabEnabled, setNewTabEnabled] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState('https://www.google.com')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chrome.storage.sync.get(['newTabEnabled', 'redirectUrl'], (result) => {
      setNewTabEnabled(result.newTabEnabled || false)
      setRedirectUrl(result.redirectUrl || 'https://www.google.com')
      setLoading(false)
    })
  }, [])

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setNewTabEnabled(checked)
    chrome.storage.sync.set({ newTabEnabled: checked })
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setRedirectUrl(url)
    chrome.storage.sync.set({ redirectUrl: url })
  }

  if (loading) return <main>Loading options...</main>

  return (
    <main>
      <div className="settings-section">
          <label className="toggle-label">
              <input 
                  type="checkbox" 
                  checked={newTabEnabled} 
                  onChange={handleToggle} 
              />
              <span className="toggle-text">Enable Dashboard on New Tab Page</span>
          </label>
          <p className="toggle-desc">If disabled, the New Tab page will redirect to the URL below.</p>
          
          <div className="url-input-group">
            <label className="url-label" htmlFor="redirectUrl">Redirect URL:</label>
            <input 
              id="redirectUrl"
              type="url" 
              className="url-input"
              value={redirectUrl} 
              onChange={handleUrlChange} 
              placeholder="https://www.google.com"
              disabled={newTabEnabled}
            />
          </div>
      </div>

      <hr className="divider"/>

      <Dashboard />
    </main>
  )
}

export default Options

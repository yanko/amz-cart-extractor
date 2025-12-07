import { useState, useEffect } from 'react'
import './Options.css'
import { Dashboard } from '../components/Dashboard'

export const Options = () => {
  const [newTabEnabled, setNewTabEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chrome.storage.sync.get(['newTabEnabled'], (result) => {
      setNewTabEnabled(result.newTabEnabled || false)
      setLoading(false)
    })
  }, [])

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setNewTabEnabled(checked)
    chrome.storage.sync.set({ newTabEnabled: checked }, () => {
        // Optional: Notify user or just save
    })
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
          <p className="toggle-desc">If disabled, the New Tab page will redirect to Google.com</p>
      </div>

      <hr className="divider"/>

      <Dashboard />
    </main>
  )
}

export default Options

import { useState, useEffect } from 'react'
import { Dashboard } from '../components/Dashboard'
import './NewTab.css'

export const NewTab = () => {
    const [enabled, setEnabled] = useState<boolean | null>(null)

    useEffect(() => {
        chrome.storage.sync.get(['newTabEnabled'], (result) => {
            if (result.newTabEnabled) {
                setEnabled(true)
            } else {
                // Redirect to Google if disabled
                window.location.replace("https://www.google.com")
            }
        })
    }, [])

    if (enabled === null) return <div className="loading"></div>

    return (
        <main>
            <Dashboard />
        </main>
    )
}

export default NewTab

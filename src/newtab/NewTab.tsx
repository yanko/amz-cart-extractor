import { useState, useEffect } from 'react'
import { Dashboard } from '../components/Dashboard'
import './NewTab.css'

export const NewTab = () => {
    const [enabled, setEnabled] = useState<boolean | null>(null)

    useEffect(() => {
        chrome.storage.sync.get(['newTabEnabled', 'redirectUrl'], (result) => {
            if (result.newTabEnabled) {
                setEnabled(true)
            } else {
                // Redirect to custom URL if disabled
                const url = result.redirectUrl || "https://www.google.com"
                window.location.replace(url)
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

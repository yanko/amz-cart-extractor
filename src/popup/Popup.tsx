import { useState, useEffect } from 'react'

import './Popup.css'

interface PopupItem {
  url: string
  title: string
  loading: boolean
}

export const Popup = () => {
  const [items, setItems] = useState<PopupItem[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)

  const isAmazonLink = (url: string) => {
    return url.includes('/gp/product/') || url.includes('/dp/')
  }

  const fetchTitle = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url)
      const text = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/html')

      return doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
             doc.querySelector('#productTitle')?.textContent?.trim() || 
             'Unknown Amazon Product'
    } catch (error) {
      // console.error('Error fetching title:', error)
      return 'Amazon Product'
    }
  }

  const loadClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const links = text.split('\n').map(l => l.trim()).filter(l => l && isAmazonLink(l))
      const uniqueLinks = Array.from(new Set(links))

      if (uniqueLinks.length === 0) {
        setItems([])
        setLoadingInitial(false)
        return
      }

      const initialItems: PopupItem[] = uniqueLinks.map(url => ({
        url,
        title: 'Loading...',
        loading: true
      }))
      setItems(initialItems)
      setLoadingInitial(false)

      const updatedItems = [...initialItems]
      for (let i = 0; i < updatedItems.length; i++) {
        const title = await fetchTitle(updatedItems[i].url)
        updatedItems[i] = { ...updatedItems[i], title, loading: false }
        setItems([...updatedItems]) 
      }

    } catch (err) {
      console.error('Failed to read clipboard:', err)
      setLoadingInitial(false)
    }
  }

  const removeItem = (urlToRemove: string) => {
    const newItems = items.filter(p => p.url !== urlToRemove)
    setItems(newItems)
    
    // Update clipboard
    const newText = newItems.map(p => p.url).join('\n')
    navigator.clipboard.writeText(newText).catch(console.error)
  }

  useEffect(() => {
    loadClipboard()
    window.addEventListener('focus', loadClipboard)
    return () => window.removeEventListener('focus', loadClipboard)
  }, [])

  return (
    <main>
      <div className="header">
        <h3>Amazon Clipboard</h3>
      </div>
      
      {loadingInitial ? (
        <div className="empty-state">Check...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          No Amazon links found.
        </div>
      ) : (
        <div className="list">
          {items.map((item) => (
            <div key={item.url} className="item">
              <div className="details">
                <div className="title" title={item.title}>{item.title}</div>
                <div className="url" title={item.url}>{item.url}</div>
              </div>

              <button className="remove-btn" onClick={() => removeItem(item.url)} title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default Popup

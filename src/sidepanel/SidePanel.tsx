import { useState, useEffect } from 'react'
import './SidePanel.css'

interface ProductItem {
  url: string
  title: string
  image: string
  loading: boolean
}

export const SidePanel = () => {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)

  const isAmazonLink = (url: string) => {
    return url.includes('/gp/product/') || url.includes('/dp/')
  }

  const fetchMetadata = async (url: string): Promise<Partial<ProductItem>> => {
    try {
      const response = await fetch(url)
      const text = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/html')

      const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
                    doc.querySelector('#productTitle')?.textContent?.trim() || 
                    'Unknown Amazon Product'
      
      const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || 
                    doc.querySelector('#landingImage')?.getAttribute('src') || 
                    ''

      return { title, image }
    } catch (error) {
      console.error('Error fetching metadata:', error)
      return { title: 'Failed to load details', image: '' }
    }
  }

  const loadClipboard = async () => {
    try {
      // In side panel, we might need to focus document or just try reading
      const text = await navigator.clipboard.readText()
      const links = text.split('\n').map(l => l.trim()).filter(l => l && isAmazonLink(l))
      const uniqueLinks = Array.from(new Set(links)) // Dedup

      if (uniqueLinks.length === 0) {
        setProducts([])
        setLoadingInitial(false)
        return
      }

      // Initialize with loading state
      const initialItems: ProductItem[] = uniqueLinks.map(url => ({
        url,
        title: 'Loading...',
        image: '',
        loading: true
      }))
      setProducts(initialItems)
      setLoadingInitial(false)

      // Fetch metadata for each
      const updatedItems = [...initialItems]
      for (let i = 0; i < updatedItems.length; i++) {
        const meta = await fetchMetadata(updatedItems[i].url)
        updatedItems[i] = { ...updatedItems[i], ...meta, loading: false }
        setProducts([...updatedItems]) // Progressive update
      }

    } catch (err) {
      console.error('Failed to read clipboard:', err)
      setLoadingInitial(false)
    }
  }

  const removeProduct = (urlToRemove: string) => {
    const newProducts = products.filter(p => p.url !== urlToRemove)
    setProducts(newProducts)
    
    // Update clipboard
    const newText = newProducts.map(p => p.url).join('\n')
    navigator.clipboard.writeText(newText).catch(console.error)
  }

  useEffect(() => {
    loadClipboard()
    
    // Optional: Poll for clipboard changes or listen to focus
    window.addEventListener('focus', loadClipboard)
    return () => window.removeEventListener('focus', loadClipboard)
  }, [])

  return (
    <main>
      <h3>Amazon Clipboard</h3>
      
      {loadingInitial ? (
        <div className="empty-state">Reading clipboard...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          No Amazon links found in clipboard. <br/><br/>
          Copy some links using the <b>Copy</b> tool on the Cart page!
        </div>
      ) : (
        <div className="product-list">
          {products.map((product) => (
            <div key={product.url} className="product-item">
              {product.loading ? (
                <div className="loading-skeleton"></div>
              ) : (
                 product.image ? <img src={product.image} alt={product.title} className="product-image" /> : <div className="product-image" style={{background: '#eee'}}></div>
              )}
              
              <div className="product-details">
                <div className="product-title" title={product.title}>{product.title}</div>
                <a href={product.url} target="_blank" rel="noopener noreferrer" className="product-link">
                  {product.url}
                </a>
              </div>

              <button className="remove-btn" onClick={() => removeProduct(product.url)} title="Remove from clipboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}


export default SidePanel

import { useState, useEffect } from 'react'
import './Options.css'

interface ProductItem {
  url: string
  title: string
  image: string
  price: string
  loading: boolean
}

export const Options = () => {
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
      
      // Attempt to find price
      let price = ''
      const priceSelectors = [
          '.a-price .a-offscreen',
          '#priceblock_ourprice',
          '#priceblock_dealprice',
          '.a-color-price',
          '#corePriceDisplay_desktop_feature_div .a-price span.a-offscreen'
      ]

      for (const selector of priceSelectors) {
          const el = doc.querySelector(selector)
          if (el && el.textContent) {
              price = el.textContent.trim()
              break
          }
      }

      return { title, image, price }
    } catch (error) {
      console.error('Error fetching metadata:', error)
      return { title: 'Failed to load details', image: '', price: '' }
    }
  }

  const loadClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const links = text.split('\n').map(l => l.trim()).filter(l => l && isAmazonLink(l))
      const uniqueLinks = Array.from(new Set(links))

      if (uniqueLinks.length === 0) {
        setProducts([])
        setLoadingInitial(false)
        return
      }

      const initialItems: ProductItem[] = uniqueLinks.map(url => ({
        url,
        title: 'Loading...',
        image: '',
        price: '',
        loading: true
      }))
      setProducts(initialItems)
      setLoadingInitial(false)

      const updatedItems = [...initialItems]
      for (let i = 0; i < updatedItems.length; i++) {
        const meta = await fetchMetadata(updatedItems[i].url)
        updatedItems[i] = { ...updatedItems[i], ...meta, loading: false }
        setProducts([...updatedItems]) 
      }

    } catch (err) {
      console.error('Failed to read clipboard:', err)
      setLoadingInitial(false)
    }
  }

  const removeProduct = (urlToRemove: string) => {
    const newProducts = products.filter(p => p.url !== urlToRemove)
    setProducts(newProducts)
    
    const newText = newProducts.map(p => p.url).join('\n')
    navigator.clipboard.writeText(newText).catch(console.error)
  }

  useEffect(() => {
    loadClipboard()
    window.addEventListener('focus', loadClipboard)
    return () => window.removeEventListener('focus', loadClipboard)
  }, [])

  return (
    <main>
      <div className="header-container">
        <h3>Amazon Clipboard Dashboard</h3>
        <span className="subtitle">{products.length} Items</span>
      </div>
      
      {loadingInitial ? (
        <div className="empty-state">Reading clipboard...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h2>No Links Found</h2>
          <p>Copy Amazon product links to your clipboard to see them here.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.url} className="product-card">
              {product.loading ? (
                <div className="card-skeleton"></div>
              ) : (
                 <div className="card-image-wrapper">
                     {product.image ? (
                         <img src={product.image} alt={product.title} className="card-image" />
                     ) : (
                         <div className="no-image">No Image</div>
                     )}
                 </div>
              )}
              
              <div className="card-content">
                <div className="card-title" title={product.title}>{product.title}</div>
                
                <div className="card-meta">
                    {product.price && <span className="card-price">{product.price}</span>}
                    <a href={product.url} target="_blank" rel="noopener noreferrer" className="card-link">View Product</a>
                </div>
              </div>

              <button className="card-remove-btn" onClick={() => removeProduct(product.url)} title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default Options

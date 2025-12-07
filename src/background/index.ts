console.log('background is running')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ADD_TO_CART') {
    const urls: string[] = request.urls
    if (!urls || urls.length === 0) return

    let delay = 0
    urls.forEach((url) => {
      setTimeout(() => {
        chrome.tabs.create({ url, active: false }, (tab) => {
          if (tab && tab.id) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: addToCartAndClose,
            })
          }
        })
      }, delay)
      delay += 2000 // 2 second delay between tabs
    })
  }
})

function addToCartAndClose() {
    const addToCartButton = document.getElementById('add-to-cart-button')
    // Also try checking for the secondary button if the main one isn't there (sometimes it's different)
    // or different selectors based on page variations.
    // For now, sticking to the standard ID.
    
    if (addToCartButton) {
        addToCartButton.click()
        console.log('Clicked add to cart button.')
        // Wait a bit for the action to register before closing
        setTimeout(() => {
            window.close()
        }, 4000) 
    } else {
        console.log('Add to cart button not found.')
        // Still close it? Maybe keep it open for user to see? 
        // User asked to close, but if it fails maybe better to leave open?
        // Code provided by user had verification logic.
        // Let's close it anyway to clean up, or maybe after a longer timeout?
        // sticking to user request:
         setTimeout(() => {
            window.close()
        }, 4000)
    }
}

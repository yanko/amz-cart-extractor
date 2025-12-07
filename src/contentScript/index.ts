import './styles.css'

console.info('contentScript is running')

// This function injects buttons into the Amazon cart page and adds a rectangle around them
function injectCopyButton() {
    let wrapper = document.createElement('div')
    wrapper.id = 'copyCartLinksWrapper'
    wrapper.classList.add('copy-cart-links-wrapper')

    // Copy Cart Links Button
    let copyButton = document.createElement('button')
    // Copy Icon SVG (Smaller)
    copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'
    copyButton.id = 'copyCartLinksButton'

    copyButton.classList.add('button')
    copyButton.addEventListener('click', buttonClick)  // Link to the buttonClick function

    // Add to Cart Button (Paste/Import)
    let addButton = document.createElement('button')
    addButton.id = 'addCartLinksButton'
    addButton.classList.add('button', 'add-button')
    // Paste/Import Icon SVG (Smaller)
    addButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-paste"><path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3a1 1 0 0 0-1-1Z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M16 4h2a2 2 0 0 1 2 2v2M11 14h10"/><path d="m17 10 4 4-4 4"/></svg>'

    addButton.disabled = true
    addButton.addEventListener('click', addButtonClick)

    // Append buttons to the wrapper
    wrapper.appendChild(copyButton)
    wrapper.appendChild(addButton)

    document.body.appendChild(wrapper)

    // Check clipboard for Amazon links initially, on tab focus, and on hover
    checkClipboardForLinks()
    window.addEventListener('focus', checkClipboardForLinks)
    wrapper.addEventListener('mouseenter', checkClipboardForLinks)


    // Restore or set initial position of the wrapper
    const savedPosition = sessionStorage.getItem('copyCartLinksWrapperPosition')
    if (savedPosition) {
        try {
            const parsed = JSON.parse(savedPosition)
            // Safety check: ensure it's on screen
            if (parsed.right >= 0 && parsed.top >= 0 && parsed.top < window.innerHeight) {
                 wrapper.style.right = `${parsed.right}px`
                 wrapper.style.top = `${parsed.top}px`
            } else {
                positionButtonRight(wrapper)
            }
        } catch (e) {
            positionButtonRight(wrapper)
        }
    } else {
        positionButtonRight(wrapper)
    }

    window.addEventListener('resize', function() {
        positionButtonRight(wrapper)
    })

    makeDraggable(wrapper, copyButton)
}

function positionButtonRight(element: HTMLElement) {
    element.style.right = `10px`
    element.style.top = `50px`
}

function makeDraggable(wrapper: HTMLElement, controlElement: HTMLElement) {
    let isDragging = false
    let dragStartTimer: any
    let startX: number, startY: number

    wrapper.addEventListener('mousedown', function(event) {
        if (event.target !== wrapper && event.target !== controlElement) return // Allow clicking buttons

        event.preventDefault()
        dragStartTimer = setTimeout(() => {
            isDragging = true
            wrapper.style.cursor = 'move'
            controlElement.style.cursor = 'move'
        }, 300)

        startX = event.clientX
        startY = event.clientY

        const onMove = (moveEvent: MouseEvent) => {
            if (isDragging) {
                let deltaX = startX - moveEvent.clientX
                let deltaY = startY - moveEvent.clientY
                let currentRight = parseInt(window.getComputedStyle(wrapper).right, 10)
                let currentTop = parseInt(window.getComputedStyle(wrapper).top, 10)

                let newRight = currentRight + deltaX
                let newTop = currentTop - deltaY

                wrapper.style.right = `${newRight}px`
                wrapper.style.top = `${newTop}px`

                // Save position
                sessionStorage.setItem('copyCartLinksWrapperPosition', JSON.stringify({right: newRight, top: newTop}))

                startX = moveEvent.clientX
                startY = moveEvent.clientY
            }
        }

        const onUp = () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
            clearTimeout(dragStartTimer)
            if (isDragging) {
                isDragging = false
                wrapper.style.cursor = 'default'
                controlElement.style.cursor = 'pointer'
            }
        }

        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    })
}

function buttonClick(e: Event) {
    flashButton(e.target as HTMLElement, extractAndCopyCartLinks())
}

function extractAndCopyCartLinks() {
    const cartItemsSelectors = 'div.sc-list-item-content input[type=checkbox]:checked'
    let productLinks: string[] = []

    document.querySelectorAll(cartItemsSelectors).forEach(checkbox => {
        let productContent = checkbox.closest('div.sc-list-item-content')
        if (!productContent) return
        
        let productLink = productContent.querySelector('a') as HTMLAnchorElement
        let quantityInput = productContent.querySelector('input.sc-quantity-textfield') as HTMLInputElement

        if (productLink && productLink.href.includes('/gp/product/')) {
            const baseUrl = productLink.href.split('/ref=')[0]
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1

            for (let i = 0; i < quantity; i++) {
                productLinks.push(baseUrl)
            }
        }
    })

    if (productLinks.length > 0) {
        copyToClipboard(productLinks.join('\n'))
        return productLinks.length
    } else {
        console.log('No product links found in your cart.')
        return 0
    }
}

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard successfully!')
    }, (err) => {
        console.error('Failed to copy text:', err)
    })
}

function flashButton(button: HTMLElement, numberOfLinks = 0) {
    let originalColor = '#FF9900' // Orange
    let flashColors = ['#ED3419', '#FFA590'] // Red and Light Red
    let currentFlashIndex = 0

    let badge = document.createElement('span')
    badge.innerText = numberOfLinks.toString()
    badge.classList.add('badge')
    badge.id = 'copyBadge'
    button.appendChild(badge)

    const flashInterval = setInterval(() => {
        button.style.backgroundColor = flashColors[currentFlashIndex % flashColors.length]
        currentFlashIndex++
    }, 100)

    setTimeout(() => {
        clearInterval(flashInterval)
        button.style.backgroundColor = originalColor
        setTimeout(() => {
            let existingBadge = document.getElementById('copyBadge')
            if (existingBadge) {
                existingBadge.remove()
            }
        }, 3000)
    }, 600)
}

function isAmazonProductLink(link: string): boolean {
    return link.includes('/gp/product/') || link.includes('/dp/')
}

function checkClipboardForLinks() {
    navigator.clipboard.readText().then(text => {
        const links = text.split('\n').filter(link => isAmazonProductLink(link))
        const btn = document.getElementById('addCartLinksButton') as HTMLButtonElement
        if (btn) btn.disabled = links.length === 0
    }).catch(err => {
        // console.error('Failed to read clipboard contents:', err) 
        // Suppress error log on hover to avoid spamming console if permission not granted yet
    })
}

function addButtonClick() {
    navigator.clipboard.readText().then(text => {
        const links = text.split('\n').filter(link => isAmazonProductLink(link))
        
        if (links.length > 0) {
             console.log(`Sending ${links.length} links to background script`)
             chrome.runtime.sendMessage({type: 'ADD_TO_CART', urls: links})
        }
       
    }).catch(err => {
        console.error('Failed to read clipboard contents:', err)
    })
}


// Call the function to inject buttons when the page loads
// Call the function to inject buttons when the page loads, but ONLY on cart pages
function init() {
    if (window.location.href.includes('/cart/')) {
        injectCopyButton()
    }
}

if (document.readyState === 'loading') {  // Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', init)
} else {  // `DOMContentLoaded` has already fired
    init()
}

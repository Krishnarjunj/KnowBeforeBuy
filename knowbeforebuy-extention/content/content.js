// Content script for floating chatbot
class KnowBeforeBuy {
   constructor() {
    this.isInitialized = false;
    this.chatbotVisible = false;
    this.currentUrl = window.location.href;
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    if (this.isSupportedSite()) {
      this.createFloatingButton();
      this.createChatbot();
      this.isInitialized = true;
    }
  }

  isSupportedSite() {
    const supportedDomains = [
      'amazon.in', 'nykaa.com', 'flipkart.com', 'myntra.com'
    ];
    return supportedDomains.some(domain => window.location.hostname.includes(domain));
  }
    async scrapeAndAnalyze() {
    try {
      // Just send the URL - let backend handle scraping
      chrome.runtime.sendMessage({
        action: 'analyzePage',
        url: window.location.href
      });
      
      this.addMessage("Analyzing this product page...", 'bot');
    } catch (error) {
      console.error('Error initiating analysis:', error);
    }
  }

  createFloatingButton() {
    const button = document.createElement('div');
    button.id = 'kbb-floating-btn';
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    `;
    button.addEventListener('click', () => this.toggleChatbot());
    document.body.appendChild(button);
  }

  createChatbot() {
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'kbb-chatbot';
    chatbotContainer.innerHTML = `
      <div class="kbb-chatbot-header">
        <h3>Knowbeforebuy AI Assistant</h3>
        <button id="kbb-close-btn">&times;</button>
      </div>
      <div class="kbb-chatbot-messages" id="kbb-messages">
        <div class="kbb-message kbb-bot-message">
          Hi! I'm analyzing this product page. Ask me anything about the product, reviews, or suitability for your needs!
        </div>
      </div>
      <div class="kbb-chatbot-input">
        <input type="text" id="kbb-input" placeholder="Ask about this product...">
        <button id="kbb-send-btn">Send</button>
      </div>
      <div class="kbb-loading" id="kbb-loading" style="display: none;">
        <div class="kbb-spinner"></div>
        <span>Analyzing...</span>
      </div>
    `;

    document.body.appendChild(chatbotContainer);
    this.setupChatbotEvents();
  }

  setupChatbotEvents() {
    const closeBtn = document.getElementById('kbb-close-btn');
    const sendBtn = document.getElementById('kbb-send-btn');
    const input = document.getElementById('kbb-input');

    closeBtn.addEventListener('click', () => this.toggleChatbot());
    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  toggleChatbot() {
    const chatbot = document.getElementById('kbb-chatbot');
    this.chatbotVisible = !this.chatbotVisible;
    
    if (this.chatbotVisible) {
      chatbot.style.display = 'flex';
      // Scrape page content when chatbot opens
      this.scrapeAndAnalyze();
    } else {
      chatbot.style.display = 'none';
    }
  }

  async scrapeAndAnalyze() {
    try {
      const pageContent = this.extractPageContent();
      
      // Send to background script to forward to backend
      chrome.runtime.sendMessage({
        action: 'analyzePage',
        url: window.location.href,
        content: pageContent
      });
    } catch (error) {
      console.error('Error scraping page:', error);
    }
  }

  extractPageContent() {
    // Extract product information based on the site
    const hostname = window.location.hostname;
    let productData = {};

    if (hostname.includes('amazon.in')) {
      productData = this.extractAmazonData();
    } else if (hostname.includes('nykaa.com')) {
      productData = this.extractNykaaData();
    } else if (hostname.includes('flipkart.com')) {
      productData = this.extractFlipkartData();
    } else if (hostname.includes('myntra.com')) {
      productData = this.extractMyntraData();
    }

    return {
      url: window.location.href,
      title: document.title,
      productData: productData,
      fullContent: document.body.innerText
    };
  }

  extractAmazonData() {
    return {
      title: document.querySelector('#productTitle')?.innerText || '',
      price: document.querySelector('.a-price-whole')?.innerText || '',
      rating: document.querySelector('.a-icon-alt')?.innerText || '',
      reviews: Array.from(document.querySelectorAll('[data-hook="review-body"] span')).map(el => el.innerText).slice(0, 10),
      features: Array.from(document.querySelectorAll('#feature-bullets ul li')).map(el => el.innerText),
      description: document.querySelector('#productDescription')?.innerText || ''
    };
  }

  extractNykaaData() {
    return {
      title: document.querySelector('.product-title')?.innerText || '',
      price: document.querySelector('.product-price')?.innerText || '',
      rating: document.querySelector('.rating-value')?.innerText || '',
      reviews: Array.from(document.querySelectorAll('.review-content')).map(el => el.innerText).slice(0, 10),
      features: Array.from(document.querySelectorAll('.product-features li')).map(el => el.innerText),
      description: document.querySelector('.product-description')?.innerText || ''
    };
  }

  extractFlipkartData() {
    return {
      title: document.querySelector('._35KyD6')?.innerText || '',
      price: document.querySelector('._1_WHN1')?.innerText || '',
      rating: document.querySelector('._2d4LTz')?.innerText || '',
      reviews: Array.from(document.querySelectorAll('._6K-7Co')).map(el => el.innerText).slice(0, 10),
      features: Array.from(document.querySelectorAll('._2418kt li')).map(el => el.innerText),
      description: document.querySelector('._3WHvuP')?.innerText || ''
    };
  }

  extractMyntraData() {
    return {
      title: document.querySelector('.pdp-name')?.innerText || '',
      price: document.querySelector('.pdp-price')?.innerText || '',
      rating: document.querySelector('.index-overallRating')?.innerText || '',
      reviews: Array.from(document.querySelectorAll('.user-review-reviewTextWrapper')).map(el => el.innerText).slice(0, 10),
      features: Array.from(document.querySelectorAll('.index-tableContainer tr')).map(el => el.innerText),
      description: document.querySelector('.pdp-product-description-content')?.innerText || ''
    };
  }

  async sendMessage() {
    const input = document.getElementById('kbb-input');
    const message = input.value.trim();
    
    if (!message) return;

    this.addMessage(message, 'user');
    input.value = '';
    
    this.showLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'sendChatMessage',
        message: message,
        url: window.location.href
      });

      this.showLoading(false);
      this.addMessage(response.reply, 'bot');
    } catch (error) {
      this.showLoading(false);
      this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    }
  }

  addMessage(text, sender) {
    const messagesContainer = document.getElementById('kbb-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `kbb-message kbb-${sender}-message`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showLoading(show) {
    const loading = document.getElementById('kbb-loading');
    loading.style.display = show ? 'flex' : 'none';
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new KnowBeforeBuy());
} else {
  new KnowBeforeBuy();
}

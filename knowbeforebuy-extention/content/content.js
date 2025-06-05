class KnowBeforeBuy {
  constructor() {
    this.isInitialized = false;
    this.chatbotVisible = false;
    this.chatReady = false;
    this.currentUrl = window.location.href;
    this.init();
  }

  init() {
    if (this.isInitialized || document.getElementById('kbb-floating-btn')) return;
    if (this.isSupportedSite()) {
      this.createFloatingButton();
      this.createChatbot();
      this.isInitialized = true;
    }
  }

  isSupportedSite() {
    const supportedDomains = ['amazon.in', 'nykaa.com', 'flipkart.com', 'myntra.com'];
    return supportedDomains.some(domain => window.location.hostname.includes(domain));
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
    const container = document.createElement('div');
    container.id = 'kbb-chatbot';
    container.innerHTML = `
      <div class="kbb-chatbot-header">
        <h3>KnowBeforeBuy - AI Assistant</h3>
        <button id="kbb-close-btn">&times;</button>
      </div>
      <div class="kbb-chatbot-messages" id="kbb-messages">
        <div class="kbb-message kbb-bot-message">
          Hi! I'm analyzing this product page. Ask me anything about the product, reviews, or suitability for your needs!
        </div>
      </div>
      <div class="kbb-chatbot-input">
        <input type="text" id="kbb-input" placeholder="Ask about this product..." disabled>
        <button id="kbb-send-btn">Send</button>
      </div>
      <div class="kbb-loading" id="kbb-loading" style="display: none;">
        <div class="kbb-spinner"></div>
        <span>Analyzing...</span>
      </div>
    `;
    document.body.appendChild(container);
    this.setupChatbotEvents();
  }

  setupChatbotEvents() {
    document.getElementById('kbb-close-btn').addEventListener('click', () => this.toggleChatbot());
    document.getElementById('kbb-send-btn').addEventListener('click', () => this.sendMessage());
    document.getElementById('kbb-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  toggleChatbot() {
    const chatbot = document.getElementById('kbb-chatbot');
    this.chatbotVisible = !this.chatbotVisible;

    if (this.chatbotVisible) {
      chatbot.style.display = 'flex';
      this.scrapeAndAnalyze();
    } else {
      chatbot.style.display = 'none';
    }
  }

  async scrapeAndAnalyze() {
    try {
      this.chatReady = false;
      this.showLoading(true);
      document.getElementById('kbb-input').disabled = true;

      const pageContent = this.extractPageContent();

      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.location.href,
          content: pageContent
        })
      });

      const result = await response.json();
      this.showLoading(false);

      if (result.success) {
        this.chatReady = true;
        document.getElementById('kbb-input').disabled = false;
        this.addMessage("✅ Page analyzed. Ask me anything about the product!", 'bot');
      } else {
        this.addMessage("❌ Couldn't analyze this product right now. Try again later.", 'bot');
      }
    } catch (error) {
      console.error('Error analyzing page:', error);
      this.showLoading(false);
      this.addMessage("❌ Couldn't analyze this product right now. Try again later.", 'bot');
    }
  }

  extractPageContent() {
    const hostname = window.location.hostname;
    let productData = {};

    if (hostname.includes('amazon.in')) productData = this.extractAmazonData();
    else if (hostname.includes('nykaa.com')) productData = this.extractNykaaData();
    else if (hostname.includes('flipkart.com')) productData = this.extractFlipkartData();
    else if (hostname.includes('myntra.com')) productData = this.extractMyntraData();

    return {
      url: window.location.href,
      title: document.title,
      productData,
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

    if (!message || !this.chatReady) {
      this.addMessage("⏳ Please wait until analysis is complete.", 'bot');
      return;
    }

    this.addMessage(message, 'user');
    input.value = '';
    this.showLoading(true);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          url: window.location.href
        })
      });

      const result = await response.json();
      this.showLoading(false);
      this.addMessage(result.reply || '⚠️ No meaningful reply.', 'bot');
    } catch (error) {
      console.error('Chat error:', error);
      this.showLoading(false);
      this.addMessage('⚠️ Server error. Try again later.', 'bot');
    }
  }

  addMessage(text, sender) {
    const container = document.getElementById('kbb-messages');
    const msg = document.createElement('div');
    msg.className = `kbb-message kbb-${sender}-message`;
    msg.innerHTML = sender === 'bot' ? this.parseMarkdown(text) : this.escapeHtml(text);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  showLoading(show) {
    const loader = document.getElementById('kbb-loading');
    loader.style.display = show ? 'flex' : 'none';
  }

  escapeHtml(unsafe) {
    return unsafe.replace(/[&<"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  parseMarkdown(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|\n)[\-•] (.*?)(?=\n|$)/g, '<li>$2</li>');
    if (text.includes('<li>')) text = `<ul>${text}</ul>`;
    text = text.replace(/(^|\n)\d+\. (.*?)(?=\n|$)/g, '<li>$2</li>');
    const tableRegex = /\|(.+?)\|\n\|([-\s|]+)\|\n((\|.+\|\n?)*)/g;
    text = text.replace(tableRegex, (match, headers, sep, rows) => {
      const headerCells = headers.split('|').map(h => `<th>${h.trim()}</th>`).join('');
      const rowHTML = rows.trim().split('\n').map(line => {
        const cells = line.split('|').map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${headerCells}</tr></thead><tbody>${rowHTML}</tbody></table>`;
    });
    return text.replace(/\n/g, '<br>');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new KnowBeforeBuy());
} else {
  new KnowBeforeBuy();
}

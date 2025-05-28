from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import os
import time
from dotenv import load_dotenv

load_dotenv()

def scrape_website(website):
    """Scrape website content using headless Chrome with e-commerce optimizations"""
    print("Setting up Chrome options...")
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    # Add user agent to avoid detection
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    if os.environ.get("CHROME_BIN"):
        options.binary_location = os.environ.get("CHROME_BIN")

    print("Initializing WebDriver...")
    try:
        driver = webdriver.Chrome(options=options)
    except Exception as e:
        print(f"Local Chrome failed: {e}, trying remote...")
        driver = webdriver.Chrome(
            options=options, service=Service("/usr/bin/chromedriver")
        )

    try:
        print("Navigating to website...")
        driver.get(website)
        
        # Wait for page to load and handle different e-commerce sites
        wait_for_content(driver, website)
        
        print("Scraping page content...")
        html = driver.page_source
        return html
        
    except Exception as e:
        print(f"Error during scraping: {e}")
        raise
    finally:
        driver.quit()

def wait_for_content(driver, url):
    """Wait for specific content based on the e-commerce site"""
    wait = WebDriverWait(driver, 15)
    
    try:
        if 'amazon.com' in url:
            # Wait for Amazon product title
            wait.until(EC.presence_of_element_located((By.ID, "productTitle")))
            time.sleep(2)  # Additional wait for reviews to load
            
        elif 'nykaa.com' in url:
            # Wait for Nykaa product info
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".product-title, .css-1gc4zls")))
            time.sleep(3)  # Wait for reviews and recommendations
            
        elif 'flipkart.com' in url:
            # Wait for Flipkart product title
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "._35KyD6, .x2Jnpn")))
            time.sleep(2)
            
        elif 'myntra.com' in url:
            # Wait for Myntra product info
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".pdp-name, .pdp-title")))
            time.sleep(2)
            
        else:
            # Generic wait for any product page
            time.sleep(3)
            
        # Scroll to load lazy-loaded content
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
        time.sleep(1)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        
    except Exception as e:
        print(f"Timeout waiting for content: {e}")
        # Continue anyway with whatever content is available

def extract_body_content(html_content):
    """Extract body content using BeautifulSoup"""
    soup = BeautifulSoup(html_content, "html.parser")
    body_content = soup.body
    if body_content:
        return str(body_content)
    return "No body content found"

def clean_body_content(body_content):
    """Clean and format the body content with e-commerce focus"""
    soup = BeautifulSoup(body_content, "html.parser")
    
    # Remove unwanted elements
    for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
        element.decompose()
    
    # Remove ads and promotional content
    for element in soup.find_all(class_=lambda x: x and any(word in x.lower() for word in ['ad', 'promo', 'banner', 'popup'])):
        element.decompose()
    
    # Extract structured product information
    product_info = extract_product_structure(soup)
    
    # Get general text content
    cleaned_content = soup.get_text(separator="\n")
    cleaned_content = "\n".join(
        line.strip() for line in cleaned_content.splitlines() if line.strip()
    )
    
    # Combine structured info with general content
    if product_info:
        final_content = f"{product_info}\n\n{cleaned_content}"
    else:
        final_content = cleaned_content
    
    # Limit content size
    return final_content[:15000]

def extract_product_structure(soup):
    """Extract structured product information"""
    product_parts = []
    
    # Try to find product title
    title_selectors = ['#productTitle', '.product-title', '.pdp-name', '._35KyD6', '.css-1gc4zls']
    for selector in title_selectors:
        title_elem = soup.select_one(selector)
        if title_elem:
            product_parts.append(f"PRODUCT TITLE: {title_elem.get_text().strip()}")
            break
    
    # Try to find price
    price_selectors = ['.a-price-whole', '.product-price', '.pdp-price', '._1_WHN1', '.css-1kc83wj']
    for selector in price_selectors:
        price_elem = soup.select_one(selector)
        if price_elem:
            product_parts.append(f"PRICE: {price_elem.get_text().strip()}")
            break
    
    # Try to find rating
    rating_selectors = ['.a-icon-alt', '.rating-value', '.index-overallRating', '._2d4LTz']
    for selector in rating_selectors:
        rating_elem = soup.select_one(selector)
        if rating_elem:
            product_parts.append(f"RATING: {rating_elem.get_text().strip()}")
            break
    
    # Extract reviews (limit to first 5)
    review_selectors = ['[data-hook="review-body"]', '.review-content', '.user-review-reviewTextWrapper', '._6K-7Co']
    for selector in review_selectors:
        review_elems = soup.select(selector)[:5]
        if review_elems:
            reviews = [elem.get_text().strip() for elem in review_elems]
            product_parts.append(f"CUSTOMER REVIEWS:\n" + "\n".join(f"- {review}" for review in reviews))
            break
    
    return "\n\n".join(product_parts) if product_parts else ""

def split_dom_content(dom_content, max_length=6000):
    """Split content into chunks if needed"""
    return [
        dom_content[i : i + max_length] for i in range(0, len(dom_content), max_length)
    ]

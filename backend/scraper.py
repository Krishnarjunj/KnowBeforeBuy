import os
import time
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup

load_dotenv()

def scrape_website(url):
    """Scrape full page HTML from a URL using headless Chrome."""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
    )

    if os.getenv("CHROME_BIN"):
        options.binary_location = os.getenv("CHROME_BIN")

    try:
        driver = webdriver.Chrome(options=options)
    except Exception as e:
        print(f"[SCRAPER] Fallback to manual path due to: {e}")
        driver = webdriver.Chrome(
            options=options,
            service=Service("/usr/bin/chromedriver")
        )

    try:
        print(f"[SCRAPER] Visiting {url}")
        driver.get(url)
        wait_for_page_load(driver, url)
        scroll_page(driver)
        return driver.page_source
    except Exception as e:
        print(f"[SCRAPER ERROR] {e}")
        raise
    finally:
        driver.quit()

def wait_for_page_load(driver, url):
    """Wait for key product elements to load based on known platforms."""
    wait = WebDriverWait(driver, 15)
    try:
        if "amazon" in url:
            wait.until(EC.presence_of_element_located((By.ID, "productTitle")))
        elif "nykaa" in url:
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".product-title, .css-1gc4zls")))
        elif "flipkart" in url:
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "._35KyD6, .x2Jnpn")))
        elif "myntra" in url:
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".pdp-name, .pdp-title")))
        else:
            time.sleep(3)
    except Exception as e:
        print(f"[WAIT] Timeout or missing element: {e}")

def scroll_page(driver):
    """Scroll down to trigger lazy loading of reviews and content."""
    scroll_height = driver.execute_script("return document.body.scrollHeight")
    for i in range(3):
        driver.execute_script(f"window.scrollTo(0, {(i + 1) * scroll_height / 3});")
        time.sleep(1.5)

def extract_body_content(html):
    """Extract <body> section from HTML."""
    soup = BeautifulSoup(html, "html.parser")
    return str(soup.body) if soup.body else "No body content found"

def clean_body_content(body_html):
    """Remove ads/scripts/nav and extract structured product details."""
    soup = BeautifulSoup(body_html, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    for el in soup.find_all(
        class_=lambda x: x and any(w in x.lower() for w in ["ad", "promo", "banner", "popup"])
    ):
        el.decompose()

    structured = extract_product_details(soup)

    plain_text = "\n".join(
        line.strip() for line in soup.get_text(separator="\n").splitlines() if line.strip()
    )

    result = f"{structured}\n\n{plain_text}" if structured else plain_text
    return result[:15000]

def extract_product_details(soup):
    """Extract product title, price, rating, and up to 5 customer reviews."""
    parts = []

    # Title
    for selector in ["#productTitle", ".product-title", ".pdp-name", "._35KyD6", ".css-1gc4zls"]:
        if elem := soup.select_one(selector):
            parts.append(f"PRODUCT TITLE: {elem.get_text(strip=True)}")
            break

    # Price
    for selector in [".a-price-whole", ".product-price", ".pdp-price", "._1_WHN1", ".css-1kc83wj"]:
        if elem := soup.select_one(selector):
            parts.append(f"PRICE: {elem.get_text(strip=True)}")
            break

    # Rating
    for selector in [".a-icon-alt", ".rating-value", ".index-overallRating", "._2d4LTz"]:
        if elem := soup.select_one(selector):
            parts.append(f"RATING: {elem.get_text(strip=True)}")
            break

    # Reviews
    for selector in [
        '[data-hook="review-body"] span',
        '.review-text-content span',
        '.user-review-reviewTextWrapper',
        '._6K-7Co',
        '.R0zdon'
    ]:
        elems = soup.select(selector)[:5]
        if elems:
            reviews = "\n".join(f"- {e.get_text(strip=True)}" for e in elems)
            parts.append(f"CUSTOMER REVIEWS:\n{reviews}")
            break

    return "\n\n".join(parts) if parts else ""

def split_dom_content(text, max_length=6000):
    """Split long cleaned text into manageable chunks."""
    return [text[i:i + max_length] for i in range(0, len(text), max_length)]

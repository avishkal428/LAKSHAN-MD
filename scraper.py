import sys
import requests
from bs4 import BeautifulSoup

def get_cinesubz_link(movie_url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(movie_url, headers=headers)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            download_links = []
            
            for a_tag in soup.find_all('a', href=True):
                href = a_tag['href']
                if 'zt-links' in href:
                    quality_text = a_tag.text.strip()
                    download_links.append((quality_text, href))
            
            if download_links:
                print("🍿 *Cinesubz Movie Download Links*\n")
                for index, (text, link) in enumerate(download_links, 1):
                    print(f"🎬 *{text}*\n🔗 {link}\n")
            else:
                print("✘ Download Links කිසිවක් සොයාගැනීමට නොහැකි විය.")
        else:
            print(f"✘ Website එකට සම්බන්ධ වීමට නොහැකි විය. Status: {response.status_code}")

    except Exception as e:
        print(f"✘ Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_url = sys.argv[1]
        get_cinesubz_link(target_url)
    else:
        print("✘ URL එකක් ලබාදී නැත.")

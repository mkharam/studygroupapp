import requests
from bs4 import BeautifulSoup
import json

def scrape_surrey_programmes():
    base_url = "https://catalogue.surrey.ac.uk/2024-5/programme"
    response = requests.get(base_url)
    soup = BeautifulSoup(response.text, 'html.parser')

    programmes = []
    for link in soup.find_all('a', href=True):
        if '/2024-5/programme/' in link['href']:
            programme_name = link.text.strip()
            programme_url = f"https://catalogue.surrey.ac.uk{link['href']}"
            programme_response = requests.get(programme_url)
            programme_soup = BeautifulSoup(programme_response.text, 'html.parser')

            modules = []
            modules_table = programme_soup.find('h3', string='Modules')
            if modules_table:
                modules_table = modules_table.find_next('table')
                if modules_table:
                    for row in modules_table.find_all('tr')[1:]:
                        cells = row.find_all('td')
                        if len(cells) >= 2:
                            module_code = cells[0].text.strip()
                            module_title = cells[1].text.strip()
                            modules.append({"code": module_code, "title": module_title})
            else:
                print(f"No 'Modules' section found for programme: {programme_name}")

            programmes.append({
                "major": programme_name,
                "modules": modules,
                "module_ids": [module["code"] for module in modules]
            })

    with open('assets/data/majors_modules.json', 'w') as json_file:
        json.dump(programmes, json_file, indent=4)

if __name__ == "__main__":
    scrape_surrey_programmes()
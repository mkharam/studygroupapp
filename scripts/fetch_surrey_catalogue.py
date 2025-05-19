import re
import time
import random
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# 1. Configuration
BASE_YEAR = "2024-5"
BASE_DOMAIN = "https://catalogue.surrey.ac.uk"
CATALOGUE_BASE = f"{BASE_DOMAIN}/{BASE_YEAR}"
PROGRAMMES_URL = urljoin(BASE_DOMAIN, f"/{BASE_YEAR}/programme")
DEPTS_URL = "https://www.surrey.ac.uk/faculties-and-schools"

# Collection of User-Agents to rotate through
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        if r.status_code == 404:
            # log and skip this programme
            print(f"⚠️ 404, skipping {url}")
            return None
        else:
            raise
    return BeautifulSoup(r.text, "html.parser")

# 3. Step 1: scrape departments (faculties & schools)
def parse_departments():
    """
    Returns a dict: { Faculty_Name: [ School_or_Department_Names ] }
    """
    soup = fetch_soup(DEPTS_URL)
    depts = {}
    # Faculties are H2 headings, schools are UL > LI under each
    for h2 in soup.select("h2"):
        fac = h2.get_text(strip=True)
        # next sibling UL holds schools
        ul = h2.find_next_sibling("ul")
        if ul:
            schools = [li.get_text(strip=True) for li in ul.select("li")]
            depts[fac] = schools
    return depts

# 4. Step 2: scrape all programmes (majors)
def parse_programmes():
    """
    Returns list of { "name": ..., "code": ..., "url": ... }
    """
    soup = fetch_soup(PROGRAMMES_URL)
    progs = []
    # links to programmes contain '/programme/' in href
    for a in soup.select("a[href*='/programme/']"):
        txt = a.get_text(strip=True)
        m = re.match(r"(.+)\s+\(([^)]+)\)$", txt)
        if m:
            name, code = m.group(1), m.group(2)
            href = a["href"]
            # correct URL joining
            full_url = urljoin(BASE_DOMAIN, href)
            progs.append({
                "name": name,
                "code": code,
                "url": full_url
            })
    return progs

# 5. Step 3 & 4: for each programme, get its department and modules
def parse_programme_detail(prog):
    """
    Returns (department, school, modules_list)
    modules_list = [ {"module_code":..., "module_title":...}, ... ]
    """
    soup = fetch_soup(prog["url"])
    if soup is None:  # Handle 404 case
        return None, None, []
        
    # Try multiple approaches to extract the Faculty and Department/School information
    faculty, school = None, None
    
    # Approach 1: Look for h2/h3 containing "Faculty and Department"
    dept_line = soup.find(lambda tag: tag.name in ("h2", "h3") and 
                           ("Faculty and Department" in tag.get_text() or 
                            "Faculty and School" in tag.get_text()))
    
    if dept_line:
        text = dept_line.get_text(separator=" ")
        # Try to split by ":" first
        if ":" in text:
            parts = text.split(":", 1)[-1].strip()
            # Try to split by " - " if it exists
            if " - " in parts:
                faculty, school = [p.strip() for p in parts.split(" - ", 1)]
            else:
                # If no " - ", try other delimiters or just use as faculty
                faculty = parts
        else:
            # No colon, try to find content in next element
            next_elem = dept_line.find_next(["p", "div"])
            if next_elem:
                text = next_elem.get_text(strip=True)
                if " - " in text:
                    faculty, school = [p.strip() for p in text.split(" - ", 1)]
                elif "," in text:
                    faculty, school = [p.strip() for p in text.split(",", 1)]
                else:
                    faculty = text
    
    # Approach 2: Look for specific patterns in the page if approach 1 failed
    if not faculty:
        # Look for faculty/department information in other parts of the page
        for p in soup.select("p"):
            text = p.get_text(strip=True)
            if "Faculty" in text and ("Department" in text or "School" in text):
                if ":" in text:
                    parts = text.split(":", 1)[-1].strip()
                    if " - " in parts:
                        faculty, school = [p.strip() for p in parts.split(" - ", 1)]
                    elif "," in parts:
                        faculty, school = [p.strip() for p in parts.split(",", 1)]
                    else:
                        faculty = parts
                break
    
    # Approach 3: Fall back to finding faculty/department mentions elsewhere
    if not faculty:
        # Look for any mentions of known faculties
        known_faculties = [
            "Faculty of Arts and Social Sciences",
            "Faculty of Engineering and Physical Sciences", 
            "Faculty of Health and Medical Sciences"
        ]
        
        for fac in known_faculties:
            if soup.find(text=lambda t: fac in t):
                faculty = fac
                # Once we have faculty, look for school nearby
                break
    
    # If still not found, assign to a default category
    if not faculty:
        faculty = "Uncategorized Faculty"
        school = "Uncategorized School"
    elif not school:
        school = "General Department"
    
    # extract modules: any <tr> under tables after "### Year" headings
    modules = []
    for tr in soup.select("tr"):
        tds = tr.select("td")
        if len(tds) >= 2:
            code = tds[0].get_text(strip=True)
            title = tds[1].get_text(strip=True)
            # module codes are typically all‑caps+digits
            if re.match(r"[A-Z]{2,}\d{4}", code):
                modules.append({"module_code": code, "module_title": title})
    return faculty, school, modules

def main():
    # build top-level departments structure
    hierarchy = {}
    depts = parse_departments()
    for fac, schools in depts.items():
        hierarchy[fac] = {sch: {} for sch in schools}
    
    # Add uncategorized faculty/school to handle programs without clear departments
    hierarchy.setdefault("Uncategorized Faculty", {})["Uncategorized School"] = {}

    # get all programmes
    progs = parse_programmes()
    print(f"Found {len(progs)} programmes; fetching details…")

    # for each programme, assign under its department & school
    for prog in progs:
        try:
            faculty, school, modules = parse_programme_detail(prog)
            if faculty and school:
                key = prog["name"] + f" ({prog['code']})"
                # insert into hierarchy
                hierarchy.setdefault(faculty, {}).setdefault(school, {})[key] = modules
            else:
                print(f"⚠️ Could not parse dept for {prog['code']}")
            # polite pause
            time.sleep(0.1)
        except Exception as e:
            print(f"Error on {prog['code']}: {e}")

    # now `hierarchy` holds Departments→Programmes→Modules
    return hierarchy

if __name__ == "__main__":
    data = main()
    # e.g. write out to JSON
    import json
    with open("surrey_catalogue.json","w",encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Saved hierarchy to surrey_catalogue.json")
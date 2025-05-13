const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Delay function to prevent overwhelming the server
 * @param {number} ms - Time in milliseconds to delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper function to make HTTP requests with retries
 * @param {string} url - URL to fetch
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<string>} - HTML content
 */
async function fetchWithRetry(url, retries = 3) {
  try {
    console.log(`Fetching ${url}...`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://catalogue.surrey.ac.uk/'
      }
    });
    return response.data;
  } catch (error) {
    if (retries > 0) {
      console.log(`Error fetching ${url}, retrying... (${retries} attempts left)`);
      await delay(1000); // Wait 1 second before retrying
      return fetchWithRetry(url, retries - 1);
    } else {
      console.error(`Failed to fetch ${url} after multiple attempts:`, error.message);
      throw error;
    }
  }
}

/**
 * Validate programme data before adding it to the list
 * @param {Object} programme - Programme object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateProgramme(programme) {
  return (
    programme.name &&
    programme.code &&
    programme.type &&
    programme.academicYear &&
    programme.url
  );
}

/**
 * Enhanced function to extract programmes with validation
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} type - 'undergraduate' or 'postgraduate'
 * @param {string} academicYear - Academic year
 * @returns {Array} - Array of validated programme objects
 */
function extractValidatedProgrammes($, type, academicYear) {
  const programmes = [];

  $('a').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();

    if (!href || !text) return;

    if (href.includes('/programme/') || href.includes('/course/')) {
      let code = href.split('/').pop() || '';

      if (!code || code.length < 2) {
        code = text
          .split(' ')
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .replace(/[^A-Z0-9]/g, '') ||
          (type === 'undergraduate' ? 'UG' : 'PG') + Math.floor(1000 + Math.random() * 9000);
      }

      const programme = {
        name: text,
        code,
        type,
        academicYear,
        url: href,
        description: ''
      };

      if (validateProgramme(programme)) {
        programmes.push(programme);
      } else {
        console.warn('Invalid programme data skipped:', programme);
      }
    }
  });

  return programmes;
}

/**
 * Scrape all majors from Surrey University catalogue
 * @param {string} undergradUrl - URL for undergraduate programmes
 * @param {string} postgradUrl - URL for postgraduate programmes
 * @returns {Promise<Array>} - Array of major objects
 */
async function scrapeMajors(undergradUrl, postgradUrl) {
  console.log('Scraping majors...');

  try {
    const academicYear = '2025/6';
    console.log(`Using academic year: ${academicYear}`);

    const allMajors = [];

    try {
      console.log('Scraping undergraduate programmes...');
      const undergradHtml = await fetchWithRetry(undergradUrl);
      const $ug = cheerio.load(undergradHtml);
      const undergradMajors = extractValidatedProgrammes($ug, 'undergraduate', academicYear);
      allMajors.push(...undergradMajors);
      console.log(`Found ${undergradMajors.length} undergraduate majors`);
    } catch (error) {
      console.error('Error scraping undergraduate programmes:', error.message);
    }

    try {
      console.log('Scraping postgraduate programmes...');
      const postgradHtml = await fetchWithRetry(postgradUrl);
      const $pg = cheerio.load(postgradHtml);
      const postgradMajors = extractValidatedProgrammes($pg, 'postgraduate', academicYear);
      allMajors.push(...postgradMajors);
      console.log(`Found ${postgradMajors.length} postgraduate majors`);
    } catch (error) {
      console.error('Error scraping postgraduate programmes:', error.message);
    }

    return allMajors;
  } catch (error) {
    console.error('Error in scrapeMajors:', error.message);
    return [];
  }
}

/**
 * Scrape all modules from Surrey University catalogue
 * @param {string} modulesUrl - URL for modules
 * @returns {Promise<Array>} - Array of module objects
 */
async function scrapeModules(modulesUrl) {
  console.log('Scraping modules...');

  try {
    const html = await fetchWithRetry(modulesUrl);
    const $ = cheerio.load(html);

    const modules = [];

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();

      if (!href || !text) return;

      if (href.includes('/module/')) {
        const code = href.split('/').pop();
        modules.push({
          name: text,
          code,
          url: href,
        });
      }
    });

    console.log(`Found ${modules.length} modules.`);
    return modules;
  } catch (error) {
    console.error('Error in scrapeModules:', error.message);
    return [];
  }
}

/**
 * Extract URLs for undergraduate, postgraduate, and modules from the main page
 * @param {string} baseUrl - Base URL of the catalogue
 * @returns {Promise<Object>} - Object containing the extracted URLs
 */
async function getCatalogueLinks(baseUrl) {
  console.log('Fetching main catalogue page...');

  try {
    const html = await fetchWithRetry(baseUrl);
    const $ = cheerio.load(html);

    const links = {
      undergraduate: '',
      postgraduate: '',
      modules: ''
    };

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim().toLowerCase();

      if (text.includes('undergraduate')) {
        links.undergraduate = new URL(href, baseUrl).href;
      } else if (text.includes('postgraduate') && !href.includes('/module/')) {
        links.postgraduate = new URL(href, baseUrl).href;
      } else if (text.includes('modules')) {
        links.modules = new URL(href, baseUrl).href;
      }
    });

    console.log('Extracted links:', links);
    return links;
  } catch (error) {
    console.error('Error fetching main catalogue page:', error.message);
    throw error;
  }
}

/**
 * Main scraping function
 */
async function scrape() {
  const baseUrl = 'https://catalogue.surrey.ac.uk/2025-6/';

  try {
    const links = await getCatalogueLinks(baseUrl);

    // Scrape majors
    const majors = await scrapeMajors(links.undergraduate, links.postgraduate);
    fs.writeFileSync(
      path.join(dataDir, 'majors.json'),
      JSON.stringify(majors, null, 2)
    );
    console.log(`Saved ${majors.length} majors to majors.json.`);

    // Scrape modules
    const modules = await scrapeModules(links.modules);
    fs.writeFileSync(
      path.join(dataDir, 'modules.json'),
      JSON.stringify(modules, null, 2)
    );
    console.log(`Saved ${modules.length} modules to modules.json.`);
  } catch (error) {
    console.error('Error in scraping process:', error);
  }
}

// Run the scraping process
scrape().then(() => console.log('Scraping complete!'));

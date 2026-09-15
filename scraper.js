const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
};

function parsePrice(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const value = parseFloat(cleaned);
  return Number.isNaN(value) ? null : value;
}

function detectSite(url) {
  if (/amazon\./i.test(url)) return 'amazon';
  if (/flipkart\./i.test(url)) return 'flipkart';
  return null;
}

async function fetchHtml(url) {
  const { data } = await axios.get(url, {
    headers: HEADERS,
    timeout: 15000,
    maxRedirects: 5,
  });
  return data;
}

async function scrapeAmazon(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const title =
    $('#productTitle').text().trim() ||
    $('span#title').text().trim() ||
    $('meta[name="title"]').attr('content') ||
    '';

  const priceText =
    $('.a-price .a-offscreen').first().text().trim() ||
    $('#priceblock_ourprice').text().trim() ||
    $('#priceblock_dealprice').text().trim() ||
    $('#corePriceDisplay_desktop_feature_div .a-price-whole')
      .first()
      .text()
      .trim();

  return { title, price: parsePrice(priceText), site: 'amazon' };
}

async function scrapeFlipkart(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const title =
    $('span.VU-ZEz').text().trim() ||
    $('span.B_NuCI').text().trim() ||
    $('h1 span').first().text().trim() ||
    '';

  const priceText =
    $('div.Nx9bqj.CxhGGd').first().text().trim() ||
    $('div._30jeq3._16Jk6d').first().text().trim() ||
    $('div._30jeq3').first().text().trim();

  return { title, price: parsePrice(priceText), site: 'flipkart' };
}

async function scrapeProduct(url) {
  const site = detectSite(url);
  if (site === 'amazon') return scrapeAmazon(url);
  if (site === 'flipkart') return scrapeFlipkart(url);
  throw new Error('Unsupported site — only Amazon and Flipkart links work.');
}

module.exports = { scrapeProduct, detectSite, parsePrice };

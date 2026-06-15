import axios from 'axios';
import * as cheerio from 'cheerio';
import LegalDocument from '../models/LegalDocument.js';
import ScrapeJob from '../models/ScrapeJob.js';
import { absoluteUrl, isPdfUrl } from '../utils/url.js';
import { parseIndianDate } from '../utils/dateParser.js';
import { fetchAndParsePdf } from './pdfService.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url) {
  const response = await axios.get(url, {
    timeout: Number(process.env.REQUEST_TIMEOUT_MS || 30000),
    headers: {
      'User-Agent': process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 LexoraCourtSync/1.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-IN,en;q=0.9',
    },
  });
  return response.data;
}

function inferTitle($, link) {
  const a = $(link);
  const directText = a.text().replace(/\s+/g, ' ').trim();
  if (directText && directText.length > 3) return directText;

  const rowText = a.closest('tr, li, article, div').text().replace(/\s+/g, ' ').trim();
  if (rowText && rowText.length > 3) return rowText.slice(0, 300);

  const href = a.attr('href') || '';
  return href.split('/').pop() || 'Untitled document';
}

function inferDateFromText(text) {
  const match = String(text || '').match(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b/);
  return match ? parseIndianDate(match[0]) : null;
}

export function extractPdfLinks(html, source) {
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();
  const sourceHost = new URL(source.url).host;

  $('a[href]').each((_, link) => {
    const href = $(link).attr('href');
    const url = absoluteUrl(source.url, href);
    if (!url || seen.has(url)) return;
    if (/^(mailto|tel|javascript):/i.test(String(href || ''))) return;
    if (String(href || '').startsWith('#') || url.includes('#')) return;
    const isPdf = isPdfUrl(url);
    const sameOfficialHost = new URL(url).host === sourceHost;
    if (!isPdf && !sameOfficialHost) return;

    const title = inferTitle($, link);
    if (
      !title ||
      title.length < 4 ||
      /^(home|view|login)$/i.test(title) ||
      /(skip|screen reader|main content|about us|contact|feedback|sitemap|site-map|archive|tender|website polic|directory)/i.test(title)
    ) {
      return;
    }

    seen.add(url);

    const contextText = $(link).closest('tr, li, article, div').text().replace(/\s+/g, ' ').trim();
    const publicationDate = inferDateFromText(contextText || title);

    items.push({
      title,
      pdfUrl: isPdf ? url : undefined,
      sourcePageUrl: isPdf ? source.url : url,
      publicationDate,
    });
  });

  return items;
}

function extractRssItems(xml, source) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items = [];
  const seen = new Set();

  $('item').each((_, item) => {
    const title = $(item).find('title').first().text().replace(/\s+/g, ' ').trim();
    const link = $(item).find('link').first().text().trim();
    const pubDate = $(item).find('pubDate').first().text().trim();
    const url = absoluteUrl(source.url, link);
    if (!title || !url || seen.has(url)) return;
    if (/\badvertisement\b/i.test(title)) return;
    seen.add(url);

    items.push({
      title,
      sourcePageUrl: url,
      publicationDate: pubDate ? parseIndianDate(pubDate) : null,
    });
  });

  return items;
}

async function upsertDocumentFromPdfLink(source, item, options = {}) {
  const shouldParsePdf = options.parsePdf === true && item.pdfUrl;
  let pdfMeta = {};
  let parseStatus = 'skipped';
  let parseError = null;

  if (shouldParsePdf) {
    try {
      pdfMeta = await fetchAndParsePdf(item.pdfUrl);
      parseStatus = 'success';
    } catch (error) {
      parseStatus = 'failed';
      parseError = error.message;
    }
  }

  const payload = {
    source: {
      key: source.key,
      name: source.name,
      type: source.sourceType,
      url: source.url,
    },
    jurisdiction: source.jurisdiction,
    documentType: source.documentType || 'unknown',
    title: item.title || 'Untitled document',
    dates: {
      publicationDate: item.publicationDate || null,
      fetchedAt: new Date(),
    },
    files: {
      pdfUrl: item.pdfUrl || item.sourcePageUrl,
      sourcePageUrl: item.sourcePageUrl,
      pdfHash: pdfMeta.pdfHash,
      textHash: pdfMeta.textHash,
      contentType: pdfMeta.contentType,
      sizeBytes: pdfMeta.sizeBytes,
    },
    content: {
      rawText: pdfMeta.rawText || '',
      language: 'en',
    },
    tags: source.tags || [],
    status: {
      isActive: true,
      isDuplicate: false,
      parseStatus,
      error: parseError,
    },
  };

  const existing = await LegalDocument.findOne(
    item.pdfUrl
      ? { 'files.pdfUrl': item.pdfUrl }
      : { 'source.key': source.key, 'files.sourcePageUrl': item.sourcePageUrl }
  );
  if (existing) {
    await LegalDocument.updateOne({ _id: existing._id }, { $set: payload });
    return { action: 'updated', documentId: existing._id };
  }

  const doc = await LegalDocument.create(payload);
  return { action: 'created', documentId: doc._id };
}

export async function syncSource(source, options = {}) {
  if (!source.enabled && !options.force) {
    return { skipped: true, reason: 'Source disabled' };
  }

  if (!['html_pdf_links', 'rss_xml'].includes(source.strategy)) {
    return { skipped: true, reason: `Unsupported automated strategy: ${source.strategy}` };
  }

  const job = await ScrapeJob.create({
    sourceKey: source.key,
    sourceName: source.name,
    sourceUrl: source.url,
    status: 'running',
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const html = await fetchHtml(source.url);
    const extractedItems = source.strategy === 'rss_xml'
      ? extractRssItems(html, source)
      : extractPdfLinks(html, source);
    const items = extractedItems.slice(0, Number(options.maxItems || 25));

    for (const item of items) {
      try {
        const result = await upsertDocumentFromPdfLink(source, item, options);
        if (result.action === 'created') created += 1;
        if (result.action === 'updated') updated += 1;
        await sleep(options.delayMs ?? (source.strategy === 'rss_xml' ? 0 : source.rateLimit?.delayMs ?? 750));
      } catch (error) {
        skipped += 1;
        job.errors.push({ message: error.message, url: item.pdfUrl, stack: error.stack });
      }
    }

    job.documentsFound = items.length;
    job.newDocuments = created;
    job.updatedDocuments = updated;
    job.skippedDocuments = skipped;
    job.status = job.errors.length ? 'partial_success' : 'success';
    job.finishedAt = new Date();
    await job.save();

    return {
      sourceKey: source.key,
      documentsFound: items.length,
      newDocuments: created,
      updatedDocuments: updated,
      skippedDocuments: skipped,
      jobId: job._id,
    };
  } catch (error) {
    job.status = 'failed';
    job.finishedAt = new Date();
    job.errors.push({ message: error.message, url: source.url, stack: error.stack });
    await job.save();
    throw error;
  }
}

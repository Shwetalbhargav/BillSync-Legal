import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import { sha256 } from '../utils/hash.js';

export async function fetchPdfBuffer(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: Number(process.env.REQUEST_TIMEOUT_MS || 30000),
    headers: { 'User-Agent': process.env.SCRAPER_USER_AGENT || 'CourtSyncBot/1.0 Lexora' },
  });

  return {
    buffer: Buffer.from(response.data),
    contentType: response.headers['content-type'],
    sizeBytes: Number(response.headers['content-length'] || response.data.length),
  };
}

export async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text || '';
  } finally {
    await parser.destroy();
  }
}

export async function fetchAndParsePdf(url) {
  const { buffer, contentType, sizeBytes } = await fetchPdfBuffer(url);
  const rawText = await extractPdfText(buffer);
  return {
    rawText,
    pdfHash: sha256(buffer),
    textHash: sha256(rawText),
    contentType,
    sizeBytes,
  };
}

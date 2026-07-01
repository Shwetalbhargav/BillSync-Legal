import nodemailer from 'nodemailer';
import { InvoiceLine } from '../models/InvoiceLine.js';
import { fromPaise } from '../../finance/money.js';

function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ' ');
}

function money(value, currency = 'INR') {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
}

function pdfMoney(value) {
  return Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function clientName(invoice) {
  return invoice.clientId?.displayName || invoice.clientId?.name || 'Client';
}

function invoiceNumber(invoice) {
  return invoice.invoiceNumber || String(invoice._id);
}

async function invoiceLines(invoice) {
  const snapshotLines = invoice.immutableSnapshot?.lines;
  if (Array.isArray(snapshotLines) && snapshotLines.length) {
    return snapshotLines.map((line) => ({
      description: line.description || line.snapshot?.description || 'Professional services',
      qtyHours: line.qtyHours ?? line.quantityHours ?? 0,
      rate: line.rate ?? (line.ratePaise != null ? fromPaise(line.ratePaise) : 0),
      amount: line.amount ?? (line.amountPaise != null ? fromPaise(line.amountPaise) : 0),
    }));
  }
  return InvoiceLine.find({ invoiceId: invoice._id }).sort({ createdAt: 1 }).lean();
}

function lineAmount(line, key, paiseKey) {
  if (line[key] != null) return Number(line[key] || 0);
  if (line[paiseKey] != null) return fromPaise(line[paiseKey]);
  return 0;
}

function wrapText(value, maxChars) {
  const words = String(value || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let current = '';
  words.forEach((word) => {
    if (!current) {
      current = word;
      return;
    }
    if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
      return;
    }
    lines.push(current);
    current = word;
  });
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function textAt(text, x, y, { font = 'F1', size = 10 } = {}) {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${escapeText(text)}) Tj ET`;
}

function rect(x, y, width, height, { fill = null, stroke = '0.86 0.89 0.93', lineWidth = 0.8 } = {}) {
  const ops = ['q', `${lineWidth} w`];
  if (fill) ops.push(`${fill} rg`, `${x} ${y} ${width} ${height} re f`);
  if (stroke) ops.push(`${stroke} RG`, `${x} ${y} ${width} ${height} re S`);
  ops.push('Q');
  return ops.join('\n');
}

export async function buildInvoiceHtml(invoice) {
  const lines = await invoiceLines(invoice);
  const rows = lines.map((line) => `
    <tr>
      <td>${line.description || 'Professional services'}</td>
      <td class="num">${Number(line.qtyHours || 0).toFixed(2)}</td>
      <td class="num">${money(line.rate, invoice.currency)}</td>
      <td class="num">${money(line.amount, invoice.currency)}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${invoiceNumber(invoice)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
    h1 { margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
    th { background: #f9fafb; }
    .meta, .totals { margin-top: 16px; }
    .num { text-align: right; }
    .totals { margin-left: auto; width: 320px; }
  </style>
</head>
<body>
  <h1>Invoice ${invoiceNumber(invoice)}</h1>
  <div class="meta">
    <strong>Bill To:</strong> ${clientName(invoice)}<br />
    <strong>Issue Date:</strong> ${invoice.issueDate ? invoice.issueDate.toISOString().slice(0, 10) : ''}<br />
    <strong>Due Date:</strong> ${invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : ''}
  </div>
  <table>
    <thead><tr><th>Description</th><th class="num">Hours</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4">No line items</td></tr>'}</tbody>
  </table>
  <table class="totals">
    <tr><td>Taxable subtotal</td><td class="num">${money(invoice.subtotal, invoice.currency)}</td></tr>
    <tr><td>${invoice.taxName || 'GST'} (${Number(invoice.taxRatePct || 0).toFixed(2)}%)</td><td class="num">${money(invoice.tax, invoice.currency)}</td></tr>
    <tr><th>Total</th><th class="num">${money(invoice.total, invoice.currency)}</th></tr>
  </table>
</body>
</html>`;
}

export async function buildInvoicePdfBuffer(invoice) {
  const lines = (await invoiceLines(invoice)).map((line) => ({
    description: line.description || line.snapshot?.description || 'Professional services',
    qtyHours: Number(line.qtyHours ?? line.quantityHours ?? 0),
    rate: lineAmount(line, 'rate', 'ratePaise'),
    amount: lineAmount(line, 'amount', 'amountPaise'),
  }));
  const currency = invoice.currency || 'INR';
  const ops = [
    rect(36, 36, 540, 720, { stroke: '0.78 0.83 0.90' }),
    textAt('BillSync Legal', 54, 730, { font: 'F2', size: 11 }),
    textAt(`Invoice ${invoiceNumber(invoice)}`, 54, 696, { font: 'F2', size: 22 }),
    textAt(`Bill To: ${clientName(invoice)}`, 54, 670, { font: 'F2', size: 11 }),
    textAt(`Issue Date: ${invoice.issueDate ? invoice.issueDate.toISOString().slice(0, 10) : 'Not set'}`, 392, 696, { size: 10 }),
    textAt(`Due Date: ${invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : 'Not set'}`, 392, 680, { size: 10 }),
    rect(54, 620, 504, 28, { fill: '0.95 0.97 1', stroke: '0.78 0.83 0.90' }),
    textAt('Description', 66, 630, { font: 'F2', size: 9 }),
    textAt('Hours', 342, 630, { font: 'F2', size: 9 }),
    textAt('Rate', 410, 630, { font: 'F2', size: 9 }),
    textAt('Amount', 500, 630, { font: 'F2', size: 9 }),
  ];

  let y = 596;
  const rows = lines.length ? lines : [{ description: 'No line items', qtyHours: 0, rate: 0, amount: 0 }];
  rows.slice(0, 18).forEach((line) => {
    const descriptionLines = wrapText(line.description, 48).slice(0, 2);
    const rowHeight = 24 + (descriptionLines.length - 1) * 11;
    ops.push(rect(54, y - rowHeight + 12, 504, rowHeight, { stroke: '0.90 0.92 0.95' }));
    descriptionLines.forEach((text, index) => {
      ops.push(textAt(text, 66, y - index * 11, { size: 9 }));
    });
    ops.push(textAt(Number(line.qtyHours || 0).toFixed(2), 342, y, { size: 9 }));
    ops.push(textAt(pdfMoney(line.rate), 398, y, { size: 9 }));
    ops.push(textAt(pdfMoney(line.amount), 486, y, { size: 9 }));
    y -= rowHeight;
  });
  if (lines.length > 18) {
    ops.push(textAt(`+ ${lines.length - 18} more line item(s) in invoice detail`, 66, y - 4, { size: 9 }));
    y -= 24;
  }

  const totalsTop = Math.max(y - 8, 160);
  ops.push(rect(318, totalsTop - 98, 240, 98, { fill: '0.98 0.99 1', stroke: '0.78 0.83 0.90' }));
  ops.push(textAt('Taxable subtotal', 334, totalsTop - 22, { size: 10 }));
  ops.push(textAt(`${currency} ${pdfMoney(invoice.subtotal)}`, 452, totalsTop - 22, { font: 'F2', size: 10 }));
  ops.push(textAt(`${invoice.taxName || 'GST'} (${Number(invoice.taxRatePct || 0).toFixed(2)}%)`, 334, totalsTop - 46, { size: 10 }));
  ops.push(textAt(`${currency} ${pdfMoney(invoice.tax)}`, 452, totalsTop - 46, { font: 'F2', size: 10 }));
  ops.push('0.78 0.83 0.90 RG 334 ' + (totalsTop - 62) + ' m 542 ' + (totalsTop - 62) + ' l S');
  ops.push(textAt('Total', 334, totalsTop - 82, { font: 'F2', size: 12 }));
  ops.push(textAt(`${currency} ${pdfMoney(invoice.total)}`, 438, totalsTop - 82, { font: 'F2', size: 12 }));

  const textOps = ops.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(textOps)} >>\nstream\n${textOps}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 8000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 8000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 12000),
    });
  }
  return nodemailer.createTransport({ jsonTransport: true });
}

export async function emailInvoice(invoice, { to, subject, message } = {}) {
  const recipient = to || invoice.clientId?.email;
  if (!recipient) throw new Error('Invoice recipient email is required');

  const pdf = await buildInvoicePdfBuffer(invoice);
  const html = await buildInvoiceHtml(invoice);
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.INVOICE_FROM_EMAIL || process.env.SMTP_FROM || 'billing@billsync.local',
    to: recipient,
    subject: subject || `Invoice ${invoiceNumber(invoice)}`,
    text: message || `Please find attached invoice ${invoiceNumber(invoice)}.`,
    html,
    attachments: [
      {
        filename: `invoice-${invoiceNumber(invoice)}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      },
    ],
  });

  return {
    to: recipient,
    messageId: info.messageId || null,
    preview: info.message ? JSON.parse(info.message) : undefined,
  };
}

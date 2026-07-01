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

function dateOnly(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toISOString().slice(0, 10);
}

function amountInWords(value) {
  const amount = Math.round(Number(value || 0));
  if (!amount) return 'Zero rupees only';
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const underHundred = (n) => n < 20 ? ones[n] : [tens[Math.floor(n / 10)], ones[n % 10]].filter(Boolean).join(' ');
  const underThousand = (n) => {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return [hundred ? `${ones[hundred]} hundred` : '', rest ? underHundred(rest) : ''].filter(Boolean).join(' ');
  };
  const parts = [
    [Math.floor(amount / 10000000), 'crore'],
    [Math.floor((amount % 10000000) / 100000), 'lakh'],
    [Math.floor((amount % 100000) / 1000), 'thousand'],
    [amount % 1000, ''],
  ].filter(([count]) => count);
  return `${parts.map(([count, label]) => [underThousand(count), label].filter(Boolean).join(' ')).join(' ')} rupees only`.replace(/^./, (c) => c.toUpperCase());
}

async function invoiceLines(invoice) {
  const snapshotLines = invoice.immutableSnapshot?.lines;
  if (Array.isArray(snapshotLines) && snapshotLines.length) {
    return snapshotLines.map((line) => ({
      description: line.description || line.snapshot?.description || 'Professional services',
      qtyHours: line.qtyHours ?? line.quantityHours ?? 0,
      rate: line.rate ?? (line.ratePaise != null ? fromPaise(line.ratePaise) : 0),
      amount: line.amount ?? (line.amountPaise != null ? fromPaise(line.amountPaise) : 0),
      lineType: line.lineType || 'hourly',
      serviceDate: line.serviceDate,
      periodLabel: line.periodLabel,
      receiptDocumentId: line.receiptDocumentId,
    }));
  }
  return InvoiceLine.find({ invoiceId: invoice._id }).sort({ createdAt: 1 }).lean();
}

function snapshotOrPopulated(invoice, key, fallback = {}) {
  return invoice[key] && Object.keys(invoice[key] || {}).length ? invoice[key] : fallback;
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
  if (invoice.templateType === 'solo_advocate_fee_invoice') {
    const advocate = snapshotOrPopulated(invoice, 'advocateSnapshot', {});
    const client = snapshotOrPopulated(invoice, 'clientBillingSnapshot', { name: clientName(invoice) });
    const matter = snapshotOrPopulated(invoice, 'matterSnapshot', {});
    const tax = snapshotOrPopulated(invoice, 'taxTreatmentSnapshot', {});
    const services = lines.filter((line) => line.lineType !== 'reimbursable_expense');
    const expenses = lines.filter((line) => line.lineType === 'reimbursable_expense');
    const row = (line) => `<tr><td>${line.serviceDate || line.periodLabel || ''}</td><td>${line.description || 'Professional services'}</td><td class="num">${money(line.amount, invoice.currency)}</td></tr>`;
    return `<!doctype html>
<html><head><meta charset="utf-8" /><title>Professional Fee Invoice ${invoiceNumber(invoice)}</title>
<style>
body{font-family:Arial,sans-serif;color:#172033;margin:36px}.box{border:1px solid #d7dde8;padding:18px;margin-top:16px}.muted{color:#667085}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}h1{letter-spacing:.08em;text-align:center;font-size:20px;margin:20px 0}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border-bottom:1px solid #e5e7eb;padding:10px;text-align:left}th{background:#f4f7fb}.num{text-align:right}.total{margin-left:auto;width:340px}.sig{margin-top:36px;text-align:right}
</style></head><body>
<div><strong>${advocate.name || 'Advocate'}</strong><br/><span class="muted">${advocate.address || ''}</span><br/>Enrolment: ${advocate.enrolmentNo || 'Not set'} | PAN: ${advocate.pan || 'Not set'} | GSTIN: ${advocate.gstin || 'Not applicable'}</div>
<h1>PROFESSIONAL FEE INVOICE</h1>
<div class="grid"><div class="box"><strong>Billed to</strong><br/>${client.name || clientName(invoice)}<br/>${client.billingAddress || ''}<br/>GSTIN: ${client.gstin || 'Not available'}</div><div class="box"><strong>Invoice No.</strong> ${invoiceNumber(invoice)}<br/><strong>Invoice Date:</strong> ${dateOnly(invoice.issueDate)}<br/><strong>Due Date:</strong> ${dateOnly(invoice.dueDate)}</div></div>
<div class="box"><strong>Matter details</strong><br/>${matter.title || invoice.caseId?.title || 'Matter not set'}<br/>Case Ref: ${matter.caseRefNo || matter.matterNumber || 'Not set'}<br/>Court/Authority: ${matter.courtOrAuthority || 'Not set'}<br/>Client file ref: ${matter.clientFileReference || 'Not set'}</div>
<h2>Professional services</h2><table><thead><tr><th>Date/Period</th><th>Description</th><th class="num">Amount</th></tr></thead><tbody>${services.map(row).join('') || '<tr><td colspan="3">No professional fee lines</td></tr>'}</tbody></table>
<h2>Reimbursable expenses</h2><table><thead><tr><th>Date</th><th>Description / Receipt reference</th><th class="num">Amount</th></tr></thead><tbody>${expenses.map(row).join('') || '<tr><td colspan="3">No reimbursable expenses</td></tr>'}</tbody></table>
<table class="total"><tr><td>Subtotal</td><td class="num">${money(invoice.subtotal, invoice.currency)}</td></tr><tr><td>${invoice.taxName || 'GST'}</td><td class="num">${money(invoice.tax, invoice.currency)}</td></tr><tr><th>Total payable</th><th class="num">${money(invoice.total, invoice.currency)}</th></tr></table>
<p><strong>Amount in words:</strong> ${amountInWords(invoice.total)}</p>
<div class="box"><strong>GST/RCM note:</strong> ${tax.note || invoice.taxNote || ''}</div>
<div class="box"><strong>Payment details</strong><br/>Currency: ${invoice.currency || 'INR'}</div>
<div class="sig">For ${advocate.name || 'Advocate'}<br/><br/><strong>Authorised signature</strong></div>
</body></html>`;
  }
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
    lineType: line.lineType || 'hourly',
    serviceDate: line.serviceDate,
    periodLabel: line.periodLabel,
    receiptDocumentId: line.receiptDocumentId,
  }));
  const currency = invoice.currency || 'INR';
  if (invoice.templateType === 'solo_advocate_fee_invoice') {
    const advocate = snapshotOrPopulated(invoice, 'advocateSnapshot', {});
    const client = snapshotOrPopulated(invoice, 'clientBillingSnapshot', { name: clientName(invoice) });
    const matter = snapshotOrPopulated(invoice, 'matterSnapshot', {});
    const tax = snapshotOrPopulated(invoice, 'taxTreatmentSnapshot', {});
    const services = lines.filter((line) => line.lineType !== 'reimbursable_expense');
    const expenses = lines.filter((line) => line.lineType === 'reimbursable_expense');
    const ops = [
      rect(36, 36, 540, 720, { stroke: '0.70 0.76 0.84' }),
      rect(36, 708, 540, 48, { fill: '0.93 0.96 1', stroke: '0.70 0.76 0.84' }),
      textAt(advocate.name || 'Advocate', 54, 736, { font: 'F2', size: 13 }),
      textAt(wrapText(advocate.address || '', 80)[0] || '', 54, 720, { size: 8 }),
      textAt(`Enrolment: ${advocate.enrolmentNo || 'Not set'} | PAN: ${advocate.pan || 'Not set'} | GSTIN: ${advocate.gstin || 'Not applicable'}`, 54, 702, { size: 8 }),
      textAt('PROFESSIONAL FEE INVOICE', 178, 674, { font: 'F2', size: 16 }),
      rect(54, 596, 236, 58, { stroke: '0.82 0.86 0.92' }),
      textAt('BILLED TO', 66, 634, { font: 'F2', size: 8 }),
      textAt(client.name || clientName(invoice), 66, 620, { font: 'F2', size: 10 }),
      textAt(wrapText(client.billingAddress || '', 36)[0] || '', 66, 606, { size: 8 }),
      textAt(`GSTIN: ${client.gstin || 'Not available'}`, 66, 592, { size: 8 }),
      rect(322, 596, 236, 58, { stroke: '0.82 0.86 0.92' }),
      textAt(`Invoice No: ${invoiceNumber(invoice)}`, 334, 634, { font: 'F2', size: 9 }),
      textAt(`Invoice Date: ${dateOnly(invoice.issueDate)}`, 334, 618, { size: 9 }),
      textAt(`Due Date: ${dateOnly(invoice.dueDate)}`, 334, 602, { size: 9 }),
      rect(54, 528, 504, 52, { fill: '0.98 0.99 1', stroke: '0.82 0.86 0.92' }),
      textAt('MATTER DETAILS', 66, 562, { font: 'F2', size: 8 }),
      textAt(wrapText(matter.title || invoice.caseId?.title || 'Matter not set', 74)[0], 66, 548, { font: 'F2', size: 9 }),
      textAt(`Case Ref: ${matter.caseRefNo || matter.matterNumber || 'Not set'} | Court/Authority: ${matter.courtOrAuthority || 'Not set'}`, 66, 534, { size: 8 }),
      textAt(`Client file ref: ${matter.clientFileReference || 'Not set'}`, 66, 520, { size: 8 }),
    ];

    function drawTable(title, rows, yStart) {
      let y = yStart;
      ops.push(textAt(title, 54, y, { font: 'F2', size: 10 }));
      y -= 20;
      ops.push(rect(54, y - 6, 504, 22, { fill: '0.94 0.96 0.99', stroke: '0.78 0.83 0.90' }));
      ops.push(textAt('Date/Period', 66, y, { font: 'F2', size: 8 }));
      ops.push(textAt('Description', 154, y, { font: 'F2', size: 8 }));
      ops.push(textAt('Amount', 504, y, { font: 'F2', size: 8 }));
      y -= 24;
      const printable = rows.length ? rows : [{ description: 'No entries', amount: 0 }];
      printable.slice(0, 5).forEach((line) => {
        const desc = wrapText(line.description || 'Professional services', 48).slice(0, 2);
        const rowHeight = 20 + (desc.length - 1) * 10;
        ops.push(rect(54, y - rowHeight + 10, 504, rowHeight, { stroke: '0.90 0.92 0.95' }));
        ops.push(textAt(line.serviceDate || line.periodLabel || '', 66, y, { size: 8 }));
        desc.forEach((text, index) => ops.push(textAt(text, 154, y - index * 10, { size: 8 })));
        ops.push(textAt(`${currency} ${pdfMoney(line.amount)}`, 474, y, { font: 'F2', size: 8 }));
        y -= rowHeight;
      });
      return y - 16;
    }

    let y = drawTable('Professional services', services, 496);
    y = drawTable('Reimbursable expenses', expenses, y);
    const totalsTop = Math.max(y, 174);
    ops.push(rect(318, totalsTop - 88, 240, 88, { fill: '0.98 0.99 1', stroke: '0.78 0.83 0.90' }));
    ops.push(textAt('Subtotal', 334, totalsTop - 20, { size: 9 }));
    ops.push(textAt(`${currency} ${pdfMoney(invoice.subtotal)}`, 452, totalsTop - 20, { font: 'F2', size: 9 }));
    ops.push(textAt(invoice.taxName || 'GST', 334, totalsTop - 42, { size: 9 }));
    ops.push(textAt(`${currency} ${pdfMoney(invoice.tax)}`, 452, totalsTop - 42, { font: 'F2', size: 9 }));
    ops.push(textAt('Total payable', 334, totalsTop - 68, { font: 'F2', size: 11 }));
    ops.push(textAt(`${currency} ${pdfMoney(invoice.total)}`, 438, totalsTop - 68, { font: 'F2', size: 11 }));
    ops.push(textAt(`Amount in words: ${amountInWords(invoice.total)}`, 54, 132, { font: 'F2', size: 8 }));
    wrapText(`GST/RCM note: ${tax.note || invoice.taxNote || ''}`, 92).slice(0, 2).forEach((line, index) => {
      ops.push(textAt(line, 54, 112 - index * 10, { size: 8 }));
    });
    ops.push(textAt(`For ${advocate.name || 'Advocate'}`, 410, 82, { font: 'F2', size: 9 }));
    ops.push(textAt('Authorised signature', 410, 58, { size: 8 }));
    return buildPdf(ops.join('\n'));
  }
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

  return buildPdf(ops.join('\n'));
}

function buildPdf(textOps) {
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

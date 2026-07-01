import { array, boolean, date, number, objectId, oneOf, required, string, validateBody } from '../../../middleware/validate.js';

const templateTypes = ['standard', 'solo_advocate_fee_invoice'];
const taxTreatments = ['rcm_applicable', 'gst_charged', 'gst_not_applicable', 'gst_exempt'];
const lineTypes = ['hourly', 'professional_fee', 'reimbursable_expense'];

export const validateGenerateFromTime = validateBody({
  clientId: [required, objectId()],
  caseId: [objectId()],
  timeEntryIds: [required, array({ min: 1, item: objectId() })],
  currency: [string({ min: 3, max: 3 })],
  dueDate: [date()],
  periodStart: [date()],
  periodEnd: [date()],
  createdBy: [objectId()],
  templateType: [oneOf(templateTypes)],
  taxTreatment: [oneOf(taxTreatments)],
  taxNote: [string({ max: 1000 })],
});

export const validateGenerateFromBillables = validateBody({
  clientId: [required, objectId()],
  caseId: [objectId()],
  billableIds: [required, array({ min: 1, item: objectId() })],
  currency: [string({ min: 3, max: 3 })],
  dueDate: [date()],
  periodStart: [date()],
  periodEnd: [date()],
  createdBy: [objectId()],
  templateType: [oneOf(templateTypes)],
  taxTreatment: [oneOf(taxTreatments)],
  taxNote: [string({ max: 1000 })],
});

export const validateSendInvoice = validateBody({
  dueDate: [date()],
  pdfUrl: [string({ max: 2000 })],
  to: [string({ max: 320 })],
  subject: [string({ max: 300 })],
  message: [string({ max: 2000 })],
});

export const validateCreateInvoice = validateBody({
  clientId: [required, objectId()],
  caseId: [objectId()],
  currency: [string({ min: 3, max: 3 })],
  dueDate: [date()],
  periodStart: [date()],
  periodEnd: [date()],
  createdBy: [objectId()],
  templateType: [oneOf(templateTypes)],
  taxTreatment: [oneOf(taxTreatments)],
  taxNote: [string({ max: 1000 })],
  taxName: [string({ max: 80 })],
  taxRatePct: [number({ min: 0, max: 100 })],
});

export const validateUpdateInvoice = validateBody({
  clientId: [objectId()],
  caseId: [objectId()],
  currency: [string({ min: 3, max: 3 })],
  dueDate: [date()],
  periodStart: [date()],
  periodEnd: [date()],
  templateType: [oneOf(templateTypes)],
  taxTreatment: [oneOf(taxTreatments)],
  taxNote: [string({ max: 1000 })],
  taxName: [string({ max: 80 })],
  taxRatePct: [number({ min: 0, max: 100 })],
  taxInclusive: [boolean()],
  pdfUrl: [string({ max: 2000 })],
});

export const validateInvoiceLine = validateBody({
  timeEntryId: [objectId()],
  lineType: [oneOf(lineTypes)],
  serviceDate: [date()],
  periodLabel: [string({ max: 120 })],
  receiptDocumentId: [objectId()],
  description: [required, string({ min: 1, max: 4000 })],
  qtyHours: [number({ min: 0 })],
  rate: [number({ min: 0 })],
  amount: [number({ min: 0 })],
  billableId: [objectId()],
  taxCategory: [string({ max: 80 })],
});

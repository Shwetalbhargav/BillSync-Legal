import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import {
  AuditEvent,
  Billable,
  Case,
  CaseAssignment,
  Client,
  Firm,
  Invoice,
  InvoiceLine,
  KpiSnapshot,
  Membership,
  Payment,
  RateCard,
  Subscription,
  TimeEntry,
  User,
  Workspace,
  WorkspaceModule,
} from '../models/index.js';
import { getPlanDefinition } from '../modules/workspace/services/subscriptionFeatureService.js';

dotenv.config();

const DEMO_PASSWORD = 'Demo@12345';
const MONTHS = ['2026-04', '2026-05', '2026-06'];
const RESET_COLLECTIONS = [
  'activities',
  'activitysamples',
  'admins',
  'aiusageevents',
  'appusageevents',
  'associateprofiles',
  'attendancedays',
  'auditevents',
  'billables',
  'caseassignments',
  'cases',
  'clients',
  'emailentries',
  'enterpriseapikeys',
  'enterprisesettings',
  'enterpriseunits',
  'enterprisewebhooks',
  'features',
  'firms',
  'holidays',
  'idleintervals',
  'integrationlogs',
  'internprofiles',
  'invitations',
  'invoicelines',
  'invoices',
  'kpisnapshots',
  'lawyerprofiles',
  'leaverequests',
  'legal_audit_events',
  'legaldocuments',
  'matterdocuments',
  'memberships',
  'moduleregistries',
  'notifications',
  'partnerprofiles',
  'payments',
  'payrollperiods',
  'payrollruns',
  'permissions',
  'plans',
  'platforminvoices',
  'platformpayments',
  'platformusagerecords',
  'policies',
  'ratecards',
  'roles',
  'scrapejobs',
  'sourceconfigs',
  'storeddocuments',
  'subscriptions',
  'tasks',
  'timeentries',
  'timesheetperiods',
  'users',
  'worksessions',
  'workspacefeatureoverrides',
  'workspacemodules',
  'workspaces',
  'zohoconnections',
];

const workspaces = [
  {
    key: 'sterling',
    type: 'firm',
    name: 'Sterling Legal Partners',
    slug: 'sterling-legal-partners',
    city: 'Mumbai',
    planKey: 'professional',
    memberLimit: 3,
    users: [
      { key: 'nisha', name: 'Nisha Sterling', email: 'nisha@sterlinglegal.test', mobile: '9100001001', role: 'owner', rate: 5200 },
      { key: 'kabir', name: 'Kabir Sane', email: 'kabir@sterlinglegal.test', mobile: '9100001002', role: 'lawyer', rate: 3200 },
      { key: 'meera', name: 'Meera Coutinho', email: 'meera@sterlinglegal.test', mobile: '9100001003', role: 'billing_assistant', rate: 1600 },
    ],
    clients: [
      { key: 'aurora', name: 'Aurora Foods Pvt. Ltd.', email: 'legal@aurorafoods.test', phone: '+91-22-4000-1101' },
      { key: 'bluepeak', name: 'BluePeak Infra LLP', email: 'finance@bluepeakinfra.test', phone: '+91-22-4000-1102' },
      { key: 'nexora', name: 'Nexora Labs India', email: 'contracts@nexoralabs.test', phone: '+91-22-4000-1103' },
    ],
  },
  {
    key: 'vyom',
    type: 'firm',
    name: 'Vyom Disputes Chambers',
    slug: 'vyom-disputes-chambers',
    city: 'Bengaluru',
    planKey: 'professional',
    memberLimit: 3,
    users: [
      { key: 'aditya', name: 'Aditya Rao', email: 'aditya@vyomchambers.test', mobile: '9100002001', role: 'owner', rate: 4800 },
      { key: 'tara', name: 'Tara Menon', email: 'tara@vyomchambers.test', mobile: '9100002002', role: 'lawyer', rate: 3000 },
      { key: 'farah', name: 'Farah Qureshi', email: 'farah@vyomchambers.test', mobile: '9100002003', role: 'accountant', rate: 1400 },
    ],
    clients: [
      { key: 'summit', name: 'Summit Mobility Pvt. Ltd.', email: 'claims@summitmobility.test', phone: '+91-80-4100-2201' },
      { key: 'riverstone', name: 'Riverstone Textiles', email: 'accounts@riverstonetextiles.test', phone: '+91-80-4100-2202' },
      { key: 'zenith', name: 'Zenith Warehousing Co.', email: 'legal@zenithwarehouse.test', phone: '+91-80-4100-2203' },
    ],
  },
  {
    key: 'isha',
    type: 'solo',
    name: 'Isha Mehta Legal Office',
    slug: 'isha-mehta-legal-office',
    city: 'Ahmedabad',
    planKey: 'solo',
    memberLimit: 1,
    users: [
      { key: 'isha', name: 'Isha Mehta', email: 'isha@solo-law.test', mobile: '9100003001', role: 'owner', rate: 3500 },
    ],
    clients: [
      { key: 'patel', name: 'Patel Family Trust', email: 'trustees@patelfamily.test', phone: '+91-79-4300-3301' },
      { key: 'saffron', name: 'Saffron Exports', email: 'accounts@saffronexports.test', phone: '+91-79-4300-3302' },
    ],
  },
  {
    key: 'rohan',
    type: 'solo',
    name: 'Rohan Desai Counsel',
    slug: 'rohan-desai-counsel',
    city: 'Pune',
    planKey: 'solo',
    memberLimit: 1,
    users: [
      { key: 'rohan', name: 'Rohan Desai', email: 'rohan@solo-law.test', mobile: '9100003002', role: 'owner', rate: 3300 },
    ],
    clients: [
      { key: 'mosaic', name: 'Mosaic Design Studio', email: 'hello@mosaicdesign.test', phone: '+91-20-4400-3401' },
      { key: 'kulkarni', name: 'Kulkarni Estates', email: 'office@kulkarniestates.test', phone: '+91-20-4400-3402' },
    ],
  },
  {
    key: 'priya',
    type: 'solo',
    name: 'Priya Nair Law',
    slug: 'priya-nair-law',
    city: 'Kochi',
    planKey: 'solo',
    memberLimit: 1,
    users: [
      { key: 'priya', name: 'Priya Nair', email: 'priya@solo-law.test', mobile: '9100003003', role: 'owner', rate: 3100 },
    ],
    clients: [
      { key: 'malabar', name: 'Malabar Wellness LLP', email: 'finance@malabarwellness.test', phone: '+91-484-4500-3501' },
      { key: 'coastline', name: 'Coastline Resorts', email: 'legal@coastlineresorts.test', phone: '+91-484-4500-3502' },
    ],
  },
];

const matterTypes = [
  { title: 'Contract Review and Advisory', activityCode: 'DOC_REVIEW', category: 'Contract drafting/review' },
  { title: 'Commercial Recovery Proceedings', activityCode: 'RESEARCH', category: 'Legal research' },
  { title: 'Monthly Compliance Retainer', activityCode: 'MEETING', category: 'Client consultation (calls/meetings)' },
];

const money = (amount) => Math.round(Number(amount || 0) * 100) / 100;
const paise = (amount) => Math.round(Number(amount || 0) * 100);
const monthDate = (month, day) => new Date(`${month}-${String(day).padStart(2, '0')}T00:00:00.000Z`);
const createOptions = { ordered: true };

async function clearDatabase() {
  const db = mongoose.connection.db;
  for (const collectionName of RESET_COLLECTIONS) {
    const exists = (await db.listCollections({ name: collectionName }).toArray()).length > 0;
    if (exists) await db.collection(collectionName).deleteMany({});
  }
}

async function createWorkspaceModules(workspace, planKey) {
  const plan = getPlanDefinition(planKey);
  await Subscription.create([{
    workspaceId: workspace._id,
    planKey: plan.key,
    status: 'active',
    source: 'seed',
    featureKeysSnapshot: plan.featureKeys,
    moduleKeysSnapshot: plan.moduleKeys,
    limitsSnapshot: workspace.limits,
    startedAt: monthDate('2026-04', 1),
  }], createOptions);

  await WorkspaceModule.create(plan.moduleKeys.map((moduleKey) => ({
    workspaceId: workspace._id,
    moduleKey,
    status: 'enabled',
    source: 'plan',
    enabledAt: monthDate('2026-04', 1),
  })), createOptions);
}

async function seedWorkspace(definition, passwordHash) {
  const firm = definition.type === 'firm'
    ? await Firm.create({
      name: definition.name,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      contact: { email: definition.users[0].email, phone: definition.users[0].mobile },
      address: { city: definition.city, country: 'IN' },
      taxSettings: { taxName: 'GST', taxRatePct: 18, inclusive: false },
      memberLimit: definition.memberLimit,
      billingPreferences: { defaultRate: definition.users[0].rate, autoSync: false },
    })
    : null;

  const workspace = await Workspace.create({
    name: definition.name,
    slug: definition.slug,
    status: 'active',
    legacyFirmId: firm?._id,
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    contact: { email: definition.users[0].email, phone: definition.users[0].mobile },
    address: { city: definition.city, country: 'IN' },
    limits: { members: definition.memberLimit, workspaces: 1, storageGb: definition.type === 'firm' ? 25 : 5, aiCredits: definition.type === 'firm' ? 500 : 150 },
    taxSettings: { taxName: 'GST', taxRatePct: 18, inclusive: false },
    onboarding: { completedSteps: ['account', 'workspace', 'plan', 'clients', 'matters', 'billing'], completedAt: new Date() },
    metadata: { sampleData: true, sampleType: definition.type },
  });

  await createWorkspaceModules(workspace, definition.planKey);

  const users = {};
  for (const userDef of definition.users) {
    const user = await User.create({
      name: userDef.name,
      email: userDef.email,
      mobile: userDef.mobile,
      role: userDef.role,
      commercialRole: userDef.role,
      firmId: workspace._id,
      workspaceId: workspace._id,
      passwordHash,
      address: definition.city,
      qualifications: [{ degree: 'LLB', university: 'Sample National Law University', year: 2018 }],
    });
    users[userDef.key] = user;
    await Membership.create({
      userId: user._id,
      workspaceId: workspace._id,
      role: userDef.role,
      status: 'active',
      acceptedAt: monthDate('2026-04', 1),
    });
    await RateCard.create({
      workspaceId: workspace._id,
      userId: user._id,
      ratePerHour: userDef.rate,
      effectiveFrom: monthDate('2026-04', 1),
    });
  }

  const owner = Object.values(users).find((user) => user.role === 'owner') || Object.values(users)[0];
  const billingUser = Object.values(users).find((user) => ['billing_assistant', 'accountant'].includes(user.role)) || owner;
  const legalUsers = Object.values(users).filter((user) => ['owner', 'lawyer'].includes(user.role));

  const clients = [];
  for (const [index, clientDef] of definition.clients.entries()) {
    const client = await Client.create({
      workspaceId: workspace._id,
      firmId: workspace._id,
      displayName: clientDef.name,
      email: clientDef.email,
      phone: clientDef.phone,
      ownerUserId: legalUsers[index % legalUsers.length]._id,
      status: 'active',
      paymentTerms: index % 2 === 0 ? 'NET30' : 'NET15',
      billingAddress: { city: definition.city, country: 'India' },
      gst: {
        gstin: `27${String(workspace._id).slice(-10).toUpperCase()}${index}Z5`,
        legalName: clientDef.name,
        placeOfSupply: definition.city,
        registered: true,
        treatment: 'gst',
      },
      contacts: [{
        name: `${clientDef.name.split(' ')[0]} Finance`,
        email: clientDef.email,
        phone: clientDef.phone,
        role: 'Finance contact',
        isPrimary: true,
      }],
    });
    clients.push({ ...clientDef, doc: client });
  }

  const matters = [];
  for (const [index, client] of clients.entries()) {
    const matterTemplate = matterTypes[index % matterTypes.length];
    const lead = legalUsers[index % legalUsers.length];
    const assigned = definition.type === 'firm' ? legalUsers.map((user) => user._id) : [owner._id];
    const matter = await Case.create({
      workspaceId: workspace._id,
      clientId: client.doc._id,
      matterNumber: `${definition.key.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
      title: `${client.doc.displayName} - ${matterTemplate.title}`,
      description: `Sample ${matterTemplate.title.toLowerCase()} matter for ${client.doc.displayName}.`,
      status: index === clients.length - 1 ? 'pending' : 'open',
      openedAt: monthDate('2026-04', 3 + index),
      leadPartnerId: owner._id,
      managingLawyerId: lead._id,
      primaryLawyerId: lead._id,
      assignedUsers: assigned,
      billingType: index % 3 === 2 ? 'retainer' : 'hourly',
      case_type: matterTemplate.title,
      importantDates: {
        nextHearingDate: monthDate('2026-07', 8 + index),
        targetCloseDate: monthDate('2026-08', 20 + index),
      },
    });
    matters.push({ template: matterTemplate, doc: matter, client: client.doc, lead });

    await CaseAssignment.create({
      workspaceId: workspace._id,
      caseId: matter._id,
      clientId: client.doc._id,
      firmId: workspace._id,
      userId: lead._id,
      role: lead._id.equals(owner._id) ? 'partner' : 'primary',
      assignedBy: owner._id,
      assignedAt: monthDate('2026-04', 3 + index),
      status: 'active',
    });
  }

  const monthlyTotals = {};
  for (const month of MONTHS) monthlyTotals[month] = { revenue: 0, ar: 0, wip: 0, billableMinutes: 0 };

  for (const [monthIndex, month] of MONTHS.entries()) {
    for (const [matterIndex, matter] of matters.entries()) {
      const lawyer = legalUsers[(monthIndex + matterIndex) % legalUsers.length];
      const userDef = definition.users.find((user) => user.key && users[user.key]?._id.equals(lawyer._id));
      const rate = userDef?.rate || definition.users[0].rate;
      const minutes = 120 + (monthIndex * 30) + (matterIndex * 20);
      const amount = money(rate * (minutes / 60));
      const tax = money(amount * 0.18);
      const total = money(amount + tax);
      const paidAmount = monthIndex === 2 && matterIndex % 2 === 1 ? money(total * 0.45) : total;
      const status = paidAmount >= total ? 'paid' : monthIndex === 2 ? 'partial' : 'sent';
      const invoiceNumber = `${definition.key.toUpperCase()}-${month.replace('-', '')}-${String(matterIndex + 1).padStart(2, '0')}`;
      const workDate = monthDate(month, 6 + matterIndex);

      const timeEntry = await TimeEntry.create({
        workspaceId: workspace._id,
        caseId: matter.doc._id,
        clientId: matter.client._id,
        userId: lawyer._id,
        activityCode: matter.template.activityCode,
        narrative: `${matter.template.title} for ${matter.client.displayName}`,
        billableMinutes: minutes,
        nonbillableMinutes: 15,
        rateApplied: rate,
        rateAppliedPaise: paise(rate),
        amount,
        amountPaise: paise(amount),
        date: workDate,
        status: 'billed',
        submittedAt: workDate,
        submittedBy: lawyer._id,
        reviewedAt: monthDate(month, 10 + matterIndex),
        reviewedBy: owner._id,
      });

      const billable = await Billable.create({
        workspaceId: workspace._id,
        caseId: matter.doc._id,
        clientId: matter.client._id,
        userId: lawyer._id,
        subject: matter.template.title,
        status: 'billed',
        activityCode: matter.template.activityCode,
        category: matter.template.category,
        description: `${matter.template.title}: ${matter.client.displayName}`,
        durationMinutes: minutes,
        rate,
        ratePaise: paise(rate),
        amount,
        amountPaise: paise(amount),
        date: workDate,
        approvedAt: monthDate(month, 11 + matterIndex),
        approvedBy: owner._id,
        sourceFingerprint: `${definition.key}:${month}:${matter.doc.matterNumber}`,
      });

      const invoice = await Invoice.create({
        workspaceId: workspace._id,
        clientId: matter.client._id,
        caseId: matter.doc._id,
        periodStart: monthDate(month, 1),
        periodEnd: monthDate(month, 28),
        issueDate: monthDate(month, 28),
        dueDate: monthDate(monthIndex === 2 ? '2026-07' : month, monthIndex === 2 ? 15 : 30),
        currency: 'INR',
        invoiceNumber,
        subtotal: amount,
        subtotalPaise: paise(amount),
        tax,
        taxPaise: paise(tax),
        taxName: 'GST',
        taxRatePct: 18,
        taxDetails: { taxName: 'GST', taxRatePct: 18, inclusive: false, taxableAmount: amount, taxAmount: tax, grossAmount: total },
        total,
        totalPaise: paise(total),
        balancePaise: paise(total - paidAmount),
        status,
        sentAt: monthDate(month, 28),
        sentTo: matter.client.email,
        deliveryStatus: 'sent',
        finalisedAt: monthDate(month, 28),
        finalisedBy: owner._id,
        createdBy: billingUser._id,
        items: [{
          billableId: billable._id,
          timeEntryId: timeEntry._id,
          description: `${matter.template.title} (${minutes} minutes)`,
          durationMinutes: minutes,
          qtyHours: minutes / 60,
          rate,
          ratePaise: paise(rate),
          amount,
          amountPaise: paise(amount),
        }],
      });

      await InvoiceLine.create({
        workspaceId: workspace._id,
        invoiceId: invoice._id,
        timeEntryId: timeEntry._id,
        billableId: billable._id,
        description: `${matter.template.title} (${minutes} minutes)`,
        qtyHours: minutes / 60,
        rate,
        ratePaise: paise(rate),
        amount,
        amountPaise: paise(amount),
        taxRatePct: 18,
        taxPaise: paise(tax),
        snapshot: {
          sourceType: 'time_entry',
          sourceStatus: 'billed',
          rateSource: 'sample_rate_card',
          description: matter.template.title,
          capturedAt: workDate,
        },
      });

      await TimeEntry.updateOne({ _id: timeEntry._id }, { $set: { status: status === 'paid' ? 'paid' : 'billed' } });
      await Billable.updateOne({ _id: billable._id }, { $set: { invoiceId: invoice._id, pushedAt: monthDate(month, 28) } });

      if (paidAmount > 0) {
        await Payment.create({
          workspaceId: workspace._id,
          invoiceId: invoice._id,
          amount: paidAmount,
          amountPaise: paise(paidAmount),
          method: matterIndex % 2 === 0 ? 'bank_transfer' : 'upi',
          receivedDate: monthDate(monthIndex === 2 ? '2026-06' : month, monthIndex === 2 ? 25 : 30),
          reference: `UTR-${definition.key.toUpperCase()}-${month.replace('-', '')}-${matterIndex + 1}`,
          receiptNumber: `RCT-${definition.key.toUpperCase()}-${month.replace('-', '')}-${matterIndex + 1}`,
          status: 'cleared',
          receivedBy: billingUser._id,
          notes: status === 'partial' ? 'Partial sample payment' : 'Full sample payment',
        });
      }

      monthlyTotals[month].revenue += paidAmount;
      monthlyTotals[month].ar += total - paidAmount;
      monthlyTotals[month].wip += status === 'partial' ? amount * 0.15 : 0;
      monthlyTotals[month].billableMinutes += minutes;

      await KpiSnapshot.create({
        workspaceId: workspace._id,
        scope: 'case',
        scopeId: matter.doc._id,
        month,
        utilization: Math.min(92, 64 + monthIndex * 5 + matterIndex * 3),
        realization: status === 'partial' ? 78 : 94,
        WIP: money(status === 'partial' ? amount * 0.15 : 0),
        AR: money(total - paidAmount),
        revenue: money(paidAmount),
      });
    }

    for (const client of clients) {
      const clientInvoices = await Invoice.find({ workspaceId: workspace._id, clientId: client.doc._id, issueDate: { $gte: monthDate(month, 1), $lte: monthDate(month, 31) } });
      const revenue = clientInvoices.reduce((sum, invoice) => sum + ((invoice.totalPaise - invoice.balancePaise) / 100), 0);
      const ar = clientInvoices.reduce((sum, invoice) => sum + (invoice.balancePaise / 100), 0);
      await KpiSnapshot.create({
        workspaceId: workspace._id,
        scope: 'client',
        scopeId: client.doc._id,
        month,
        utilization: 70 + monthIndex * 4,
        realization: ar > 0 ? 82 : 95,
        WIP: 0,
        AR: money(ar),
        revenue: money(revenue),
      });
    }

    for (const user of legalUsers) {
      await KpiSnapshot.create({
        workspaceId: workspace._id,
        scope: 'user',
        scopeId: user._id,
        month,
        utilization: definition.type === 'firm' ? 76 + monthIndex * 3 : 68 + monthIndex * 5,
        realization: 90 - monthIndex,
        WIP: money(monthlyTotals[month].wip / legalUsers.length),
        AR: money(monthlyTotals[month].ar / legalUsers.length),
        revenue: money(monthlyTotals[month].revenue / legalUsers.length),
      });
    }

    await KpiSnapshot.create({
      workspaceId: workspace._id,
      scope: 'firm',
      scopeId: workspace._id,
      month,
      utilization: Math.round(monthlyTotals[month].billableMinutes / (definition.type === 'firm' ? 42 : 18)),
      realization: monthlyTotals[month].ar > 0 ? 86 : 96,
      WIP: money(monthlyTotals[month].wip),
      AR: money(monthlyTotals[month].ar),
      revenue: money(monthlyTotals[month].revenue),
    });
  }

  await AuditEvent.create({
    workspaceId: workspace._id,
    actorId: owner._id,
    action: 'sample_data.seeded',
    targetType: 'workspace',
    targetId: workspace._id,
    changes: {
      users: definition.users.length,
      clients: clients.length,
      matters: matters.length,
      months: MONTHS,
    },
  });

  return {
    workspace,
    users: Object.values(users),
    clients: clients.map((client) => client.doc),
    matters: matters.map((matter) => matter.doc),
  };
}

async function main() {
  await connectDB();
  await clearDatabase();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const results = [];
  for (const definition of workspaces) {
    results.push(await seedWorkspace(definition, passwordHash));
  }

  const db = mongoose.connection.db;
  const counts = {};
  for (const collectionName of ['workspaces', 'firms', 'users', 'clients', 'cases', 'invoices', 'payments', 'kpisnapshots']) {
    counts[collectionName] = await db.collection(collectionName).countDocuments();
  }

  console.log('Fresh sample data seeded.');
  console.table(results.map((result) => ({
    workspace: result.workspace.name,
    users: result.users.length,
    clients: result.clients.length,
    matters: result.matters.length,
  })));
  console.table(results.flatMap((result) => result.users.map((user) => ({
    workspace: result.workspace.name,
    name: user.name,
    role: user.role,
    mobile: user.mobile,
    password: DEMO_PASSWORD,
  }))));
  console.log(JSON.stringify({ counts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

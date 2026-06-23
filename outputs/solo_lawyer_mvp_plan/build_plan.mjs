import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outDir = "E:/LexoraV1/outputs/solo_lawyer_mvp_plan";
const data = JSON.parse(await fs.readFile(`${outDir}/product_plan_data.json`, "utf8"));
const wb = Workbook.create();

const C = {
  navy: "#17324D", blue: "#2E74B5", teal: "#117A8B", green: "#147D64",
  gold: "#9A6700", red: "#B42318", ink: "#182230", gray: "#667085",
  grid: "#D0D5DD", pale: "#F4F6F9", paleBlue: "#E8EEF5", white: "#FFFFFF"
};

function title(sheet, range, text, subtitle) {
  sheet.showGridLines = false;
  sheet.getRange(range).merge();
  const top = range.split(":")[0];
  sheet.getRange(top).values = [[text]];
  sheet.getRange(range).format = { fill: C.navy, font: { bold: true, color: C.white, size: 18 }, verticalAlignment: "center" };
  sheet.getRange(range).format.rowHeightPx = 38;
  if (subtitle) {
    const startRow = Number(top.match(/\d+/)[0]) + 1;
    const startCol = top.match(/[A-Z]+/)[0];
    const endCol = range.split(":")[1].match(/[A-Z]+/)[0];
    const subRange = `${startCol}${startRow}:${endCol}${startRow + 1}`;
    sheet.getRange(subRange).merge();
    sheet.getRange(`${startCol}${startRow}`).values = [[subtitle]];
    sheet.getRange(subRange).format = { fill: C.paleBlue, font: { color: C.ink, size: 10 }, wrapText: true, verticalAlignment: "center" };
    sheet.getRange(subRange).format.rowHeightPx = 34;
  }
}

function header(range) {
  range.format = {
    fill: C.navy, font: { bold: true, color: C.white, size: 10 },
    verticalAlignment: "center", wrapText: true,
    borders: { preset: "all", style: "thin", color: C.grid }
  };
  range.format.rowHeightPx = 28;
}

function body(range, size = 9) {
  range.format = {
    font: { color: C.ink, size }, verticalAlignment: "center", wrapText: true,
    borders: { preset: "all", style: "thin", color: C.grid }
  };
}

function setWidths(sheet, widths) {
  for (const [col, px] of Object.entries(widths)) sheet.getRange(`${col}:${col}`).format.columnWidthPx = px;
}

function addTable(sheet, address, name) {
  const table = sheet.tables.add(address, true, name);
  table.style = "TableStyleMedium2";
  table.showBandedRows = true;
  table.showFilterButton = true;
  return table;
}

// Executive Summary
const summary = wb.worksheets.add("Executive Summary");
title(summary, "A1:H1", "Lexora Solo-Lawyer MVP", "Product and Scrum delivery tracker | 8 weeks | 4 sprints | 320 hours | Controlled pilot with 3-5 independent lawyers");
summary.getRange("A4:B4").values = [["Delivery KPI", "Value"]]; header(summary.getRange("A4:B4"));
summary.getRange("A5:B10").values = [
  ["Core workflow", "Client -> Matter -> Task -> Work -> Review -> Billable -> Invoice -> Payment"],
  ["Current estimated completion", "55-60%"],
  ["Target MVP completion", "100% of frozen focused scope"],
  ["Planned delivery", "288 hours"],
  ["Protected contingency", "32 hours"],
  ["Release target", "Controlled pilot, not a legal ERP"]
]; body(summary.getRange("A5:B10"), 10);
summary.getRange("D4:H4").values = [["Sprint", "Weeks", "Planned h", "Buffer h", "Goal"]]; header(summary.getRange("D4:H4"));
summary.getRange("D5:H8").values = data.sprints.map(s => [s.id, s.weeks, s.plannedHours, s.bufferHours, s.goal]); body(summary.getRange("D5:H8"), 9);
summary.getRange("D10:F10").values = [["Sprint", "Planned", "Buffer"]];
summary.getRange("D11:F14").values = data.sprints.map(s => [s.id, s.plannedHours, s.bufferHours]);
const chart = summary.charts.add("bar", summary.getRange("D10:F14"));
chart.title = "Sprint Capacity Allocation";
chart.hasLegend = true;
chart.xAxis = { axisType: "textAxis", textStyle: { fontSize: 9 } };
chart.yAxis = { numberFormatCode: "0\" h\"" };
chart.setPosition("D16", "H30");
summary.getRange("A12:B12").values = [["Release gate", "Required result"]]; header(summary.getRange("A12:B12"));
summary.getRange(`A13:B${12 + data.releaseGates.length}`).values = data.releaseGates.map((g,i)=>[`G${i+1}`,g]); body(summary.getRange(`A13:B${12 + data.releaseGates.length}`), 9);
summary.getRange("A23:B23").values = [["North-star promise", data.product.positioning]];
summary.getRange("A23:B24").format = { fill: "#E9F7F5", font: { bold: true, color: C.green, size: 11 }, wrapText: true, borders: { preset: "outside", style: "medium", color: C.green } };
setWidths(summary, {A:150,B:360,C:24,D:72,E:90,F:80,G:72,H:330});
summary.freezePanes.freezeRows(3);

// Sprint Plan
const sprint = wb.worksheets.add("Sprint Plan");
title(sprint, "A1:I1", "Eight-Week Sprint Plan", "Four two-week sprints; 72 planned hours plus 8 hours contingency per sprint");
sprint.getRange("A4:I4").values = [["Sprint","Weeks","Goal","Branches","Planned h","Buffer h","Review demo","Exit criteria","Status"]]; header(sprint.getRange("A4:I4"));
sprint.getRange("A5:I8").values = data.sprints.map(s=>[s.id,s.weeks,s.goal,s.branches,s.plannedHours,s.bufferHours,s.demo,s.exit,"Not Started"]); body(sprint.getRange("A5:I8"),9);
addTable(sprint,"A4:I8","SprintPlanTable");
sprint.getRange("I5:I8").dataValidation = { rule: { type:"list", values:["Not Started","In Progress","At Risk","Complete"] } };
sprint.getRange("I5:I8").conditionalFormats.add("containsText", { text:"Complete", format:{ fill:"#D1FADF", font:{color:C.green,bold:true} } });
sprint.getRange("I5:I8").conditionalFormats.add("containsText", { text:"At Risk", format:{ fill:"#FEE4E2", font:{color:C.red,bold:true} } });
sprint.getRange("B11:I11").merge();
sprint.getRange("A11:B11").values = [["Scrum ceremony","Cadence"]]; header(sprint.getRange("A11:I11"));
const ceremonies = [
  ["Sprint planning","First morning of each sprint; freeze goal and branch order"],
  ["Daily plan","15 minutes; one shippable vertical slice and its verification command"],
  ["Daily review","15 minutes; update status, remaining hours, blocker and evidence"],
  ["Refinement","Friday, 45 minutes; split work and defend non-goals"],
  ["Sprint review","Working demo using real APIs and sprint exit criteria"],
  ["Retrospective","One process improvement applied in the next sprint"]
];
ceremonies.forEach((row, i) => {
  const r = 12 + i;
  sprint.getRange(`B${r}:I${r}`).merge();
  sprint.getRange(`A${r}:B${r}`).values = [row];
});
body(sprint.getRange("A12:I17"),10);
setWidths(sprint,{A:70,B:90,C:260,D:70,E:72,F:68,G:280,H:300,I:100});
sprint.freezePanes.freezeRows(4);

// Branch Tracker
const branches = wb.worksheets.add("Branch Tracker");
title(branches, "A1:N1", "Branch / Work-Package Tracker", "Sequential child branches from codex/solo-lawyer-mvp; update status and evidence daily");
const branchHeaders = ["No.","Sprint","Branch","Epic","Goal","Screens / States","Backend / API","Acceptance Criteria","Planned h","SP","Status","Dependency","Commit Message","Verification Evidence"];
branches.getRange("A4:N4").values = [branchHeaders]; header(branches.getRange("A4:N4"));
branches.getRange(`A5:N${4+data.branches.length}`).values = data.branches.map((b,i)=>[
  b.no,b.sprint,b.branch,b.epic,b.goal,b.screens,b.backend,b.acceptance,b.hours,b.points,"Not Started",i===0?"main":data.branches[i-1].branch,b.commit,""
]); body(branches.getRange(`A5:N${4+data.branches.length}`),8);
addTable(branches,`A4:N${4+data.branches.length}`,"BranchTrackerTable");
branches.getRange(`K5:K${4+data.branches.length}`).dataValidation = { rule:{type:"list",values:["Not Started","In Progress","Blocked","Ready for Review","Complete"]} };
branches.getRange(`K5:K${4+data.branches.length}`).conditionalFormats.add("containsText",{text:"Complete",format:{fill:"#D1FADF",font:{color:C.green,bold:true}}});
branches.getRange(`K5:K${4+data.branches.length}`).conditionalFormats.add("containsText",{text:"Blocked",format:{fill:"#FEE4E2",font:{color:C.red,bold:true}}});
branches.getRange(`K5:K${4+data.branches.length}`).conditionalFormats.add("containsText",{text:"In Progress",format:{fill:"#FEF0C7",font:{color:C.gold,bold:true}}});
setWidths(branches,{A:42,B:55,C:190,D:90,E:270,F:250,G:250,H:280,I:66,J:48,K:105,L:180,M:210,N:230});
branches.freezePanes.freezeRows(4); branches.freezePanes.freezeColumns(4);

// Product Backlog derived into actionable tasks
const breakdown = {
  A:["Add solo product configuration and route allowlist","Replace sidebar and mobile navigation with focused modules","Apply reusable loading/empty/error/offline states"],
  B:["Simplify registration/login and remove role selection","Create one workspace and owner during registration","Build onboarding for practice, GST, invoice and payment defaults","Complete password reset and session revocation"],
  C:["Add/backfill workspaceId across retained models","Resolve authenticated workspace server-side","Scope all read/write queries and referenced parents","Add two-workspace isolation suite"],
  D:["Harden client contacts, notes, GST and billing terms","Add client archive/search/balance","Add matter numbering, court fields and billing method","Reconcile matter financial summary"],
  E:["Simplify task CRUD for one owner","Add checklist, priority, due and overdue filters","Launch pre-filled meter context from task"],
  F:["Harden start/pause/resume/stop lifecycle","Add timezone, idle and rounding rules","Add manual entry and edit validation","Add idempotency and crash recovery"],
  G:["Simplify extension authentication/setup","Harden Gmail/research mapping","Verify offline retry and duplicate sourceRef protection"],
  H:["Create unified Work Entries list","Map legacy states to draft/ready/excluded/billed","Add edit, batch mark-ready and exclude actions"],
  I:["Implement rate precedence and effective dates","Snapshot rate and amount on work","Create idempotent billable conversion and WIP"],
  J:["Create expense model, API and screens","Add receipt upload authorization","Convert reimbursable expense once into billing"],
  K:["Create canonical billables-to-invoice route","Add sequence, GST, discounts and minor-unit totals","Lock finalised invoices and add void/revision","Add duplicate/concurrency protection"],
  L:["Add practice branding and payment instructions","Build verified invoice HTML/PDF","Test long content, GST and authorization"],
  M:["Integrate managed email provider","Add delivery audit timeline and retries","Prevent duplicate invoice sends"],
  N:["Complete partial/full payment allocation","Add receipts and write-off audit","Reconcile invoice status and aging"],
  O:["Build daily solo dashboard","Add income, WIP, aging and activity reports","Add bounded filters and CSV exports","Reconcile report totals to source data"],
  P:["Add monitoring, health, limits and indexes","Run backup/restore and security regression","Complete accessibility/mobile polish","Prepare seed data, guide and pilot onboarding"]
};
const backlogRows=[];
for(const b of data.branches){
  const tasks=breakdown[b.no];
  const taskHours=Math.round((b.hours/tasks.length)*10)/10;
  tasks.forEach((task,idx)=>backlogRows.push([`${b.sprint}-${b.no}${idx+1}`,b.sprint,b.epic,task,b.branch,taskHours,idx===0?"Must":"Should","Not Started",idx===0?"Previous branch":"Prior task in branch",b.acceptance]));
}
const backlog=wb.worksheets.add("Product Backlog");
title(backlog,"A1:J1","Prioritised Product Backlog","Editable Scrum backlog; Must items protect security, financial correctness and the end-to-end workflow");
backlog.getRange("A4:J4").values=[["Story ID","Sprint","Epic","Story / Task","Branch","Planned h","Priority","Status","Dependency","Acceptance outcome"]]; header(backlog.getRange("A4:J4"));
backlog.getRange(`A5:J${4+backlogRows.length}`).values=backlogRows; body(backlog.getRange(`A5:J${4+backlogRows.length}`),9);
addTable(backlog,`A4:J${4+backlogRows.length}`,"ProductBacklogTable");
backlog.getRange(`G5:G${4+backlogRows.length}`).dataValidation={rule:{type:"list",values:["Must","Should","Could","Won't"]}};
backlog.getRange(`H5:H${4+backlogRows.length}`).dataValidation={rule:{type:"list",values:["Not Started","In Progress","Blocked","Done"]}};
backlog.getRange(`H5:H${4+backlogRows.length}`).conditionalFormats.add("containsText",{text:"Done",format:{fill:"#D1FADF",font:{color:C.green,bold:true}}});
backlog.getRange(`H5:H${4+backlogRows.length}`).conditionalFormats.add("containsText",{text:"Blocked",format:{fill:"#FEE4E2",font:{color:C.red,bold:true}}});
setWidths(backlog,{A:80,B:55,C:90,D:280,E:190,F:68,G:70,H:95,I:150,J:300});
backlog.freezePanes.freezeRows(4); backlog.freezePanes.freezeColumns(3);

// Screen inventory
const screens=wb.worksheets.add("Screen Inventory");
title(screens,"A1:F1","Solo-Lawyer Screen Inventory","Retained, revised and new screens only; enterprise-only modules stay hidden from the MVP");
screens.getRange("A4:F4").values=[["Module","Screen","Route","Action","Sprint","Branch"]]; header(screens.getRange("A4:F4"));
screens.getRange(`A5:F${4+data.screens.length}`).values=data.screens; body(screens.getRange(`A5:F${4+data.screens.length}`),9);
addTable(screens,`A4:F${4+data.screens.length}`,"ScreenInventoryTable");
screens.getRange(`D5:D${4+data.screens.length}`).dataValidation={rule:{type:"list",values:["Keep / harden","Revise","Simplify","New","New/compose","Compose","Complete"]}};
setWidths(screens,{A:100,B:230,C:220,D:110,E:65,F:65}); screens.freezePanes.freezeRows(4);

// API mapping
const api=wb.worksheets.add("API Mapping");
title(api,"A1:G1","Backend / API Mapping","Branch-level contracts to confirm before implementation; update exact endpoints as routes are finalised");
api.getRange("A4:G4").values=[["Branch","Sprint","Domain","Current backend direction","Required change","Isolation requirement","Contract status"]]; header(api.getRange("A4:G4"));
api.getRange(`A5:G${4+data.branches.length}`).values=data.branches.map(b=>[b.branch,b.sprint,b.epic,b.backend,b.goal,"Every read/write scoped to authenticated workspace","To Verify"]); body(api.getRange(`A5:G${4+data.branches.length}`),9);
addTable(api,`A4:G${4+data.branches.length}`,"ApiMappingTable");
api.getRange(`G5:G${4+data.branches.length}`).dataValidation={rule:{type:"list",values:["To Verify","Gap Found","Implementing","Connected","Tested"]}};
setWidths(api,{A:190,B:60,C:100,D:290,E:300,F:260,G:95}); api.freezePanes.freezeRows(4);

// Risks and gates
const risks=wb.worksheets.add("Risks and Gates");
title(risks,"A1:F1","Risks, Release Gates and Non-Goals","Use this sheet in sprint reviews; no release while a critical gate is open");
risks.getRange("A4:F4").values=[["Risk ID","Severity","Risk","Impact","Mitigation","Due"]]; header(risks.getRange("A4:F4"));
risks.getRange(`A5:F${4+data.risks.length}`).values=data.risks; body(risks.getRange(`A5:F${4+data.risks.length}`),9);
addTable(risks,`A4:F${4+data.risks.length}`,"RiskTable");
risks.getRange(`B5:B${4+data.risks.length}`).conditionalFormats.add("containsText",{text:"Critical",format:{fill:"#FEE4E2",font:{color:C.red,bold:true}}});
let gateRow=7+data.risks.length;
risks.getRange(`B${gateRow}:E${gateRow}`).merge();
risks.getRange(`A${gateRow}:F${gateRow}`).values=[["Gate ID","Release gate",null,null,null,"Status"]]; header(risks.getRange(`A${gateRow}:F${gateRow}`));
data.releaseGates.forEach((g,i)=>{
  const r=gateRow+1+i;
  risks.getRange(`B${r}:E${r}`).merge();
  risks.getRange(`A${r}:B${r}`).values=[[`G${i+1}`,g]];
  risks.getRange(`F${r}`).values=[["Open"]];
});
body(risks.getRange(`A${gateRow+1}:F${gateRow+data.releaseGates.length}`),9);
risks.getRange(`F${gateRow+1}:F${gateRow+data.releaseGates.length}`).dataValidation={rule:{type:"list",values:["Open","At Risk","Passed"]}};
risks.getRange(`F${gateRow+1}:F${gateRow+data.releaseGates.length}`).conditionalFormats.add("containsText",{text:"Passed",format:{fill:"#D1FADF",font:{color:C.green,bold:true}}});
let ngRow=gateRow+data.releaseGates.length+3;
risks.getRange(`B${ngRow}:F${ngRow}`).merge();
risks.getRange(`A${ngRow}:B${ngRow}`).values=[["Non-goal","Decision"]]; header(risks.getRange(`A${ngRow}:F${ngRow}`));
data.nonGoals.forEach((g,i)=>{
  const r=ngRow+1+i;
  risks.getRange(`B${r}:F${r}`).merge();
  risks.getRange(`A${r}:B${r}`).values=[[`NG${i+1}`,g]];
});
body(risks.getRange(`A${ngRow+1}:F${ngRow+data.nonGoals.length}`),9);
setWidths(risks,{A:75,B:95,C:250,D:230,E:360,F:65}); risks.freezePanes.freezeRows(4);

// Daily scrum log
const daily=wb.worksheets.add("Daily Scrum Log");
title(daily,"A1:J1","Daily Scrum Log","Forty working-day execution log; one primary outcome per day");
daily.getRange("A4:J4").values=[["Day","Sprint","Date","Primary outcome","Branch","Planned h","Actual h","Status","Blocker / Decision","Verification evidence"]]; header(daily.getRange("A4:J4"));
const dailyRows=[];
for(let i=1;i<=40;i++){
  const sprintId=`S${Math.ceil(i/10)}`;
  dailyRows.push([i,sprintId,"","",data.branches[Math.min(data.branches.length-1,Math.floor((i-1)/2.5))].branch,8,"","Not Started","",""]);
}
daily.getRange("A5:J44").values=dailyRows; body(daily.getRange("A5:J44"),9);
addTable(daily,"A4:J44","DailyScrumTable");
daily.getRange("H5:H44").dataValidation={rule:{type:"list",values:["Not Started","In Progress","Blocked","Done"]}};
daily.getRange("H5:H44").conditionalFormats.add("containsText",{text:"Done",format:{fill:"#D1FADF",font:{color:C.green,bold:true}}});
daily.getRange("H5:H44").conditionalFormats.add("containsText",{text:"Blocked",format:{fill:"#FEE4E2",font:{color:C.red,bold:true}}});
daily.getRange("C5:C44").format.numberFormat="yyyy-mm-dd";
setWidths(daily,{A:48,B:55,C:90,D:270,E:200,F:70,G:70,H:95,I:250,J:250}); daily.freezePanes.freezeRows(4);

// Compact verification
const summaryCheck = await wb.inspect({kind:"table",range:"Executive Summary!A1:H24",include:"values,formulas",tableMaxRows:24,tableMaxCols:8,maxChars:7000});
console.log(summaryCheck.ndjson);
const branchCheck = await wb.inspect({kind:"table",range:"Branch Tracker!A1:N20",include:"values,formulas",tableMaxRows:20,tableMaxCols:14,maxChars:9000});
console.log(branchCheck.ndjson);
const errors = await wb.inspect({kind:"match",searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",options:{useRegex:true,maxResults:100},summary:"formula error scan"});
console.log(errors.ndjson);

await fs.mkdir(`${outDir}/xlsx_renders`,{recursive:true});
for(const name of ["Executive Summary","Sprint Plan","Branch Tracker","Product Backlog","Screen Inventory","API Mapping","Risks and Gates","Daily Scrum Log"]){
  const img=await wb.render({sheetName:name,autoCrop:"all",scale:0.8,format:"png"});
  await fs.writeFile(`${outDir}/xlsx_renders/${name.replaceAll(" ","_")}.png`,new Uint8Array(await img.arrayBuffer()));
}

const output=await SpreadsheetFile.exportXlsx(wb);
await output.save(`${outDir}/Lexora_Solo_Lawyer_MVP_Scrum_Tracker.xlsx`);
console.log(`${outDir}/Lexora_Solo_Lawyer_MVP_Scrum_Tracker.xlsx`);

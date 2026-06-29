# Fresh Sample Data Inventory

Generated from the current `BillSyncLegalV1` MongoDB sample dataset. All demo users use password `Demo@12345`.

## Summary

| Item | Count |
| --- | ---: |
| Firm workspaces | 2 |
| Solo lawyer workspaces | 3 |
| Users | 9 |
| Clients | 12 |
| Matters | 12 |
| Invoices | 36 |
| Payments | 36 |
| KPI/report snapshots | 108 |

## Login Accounts

| Workspace | Name | Role | Mobile | Password |
| --- | --- | --- | --- | --- |
| Isha Mehta Legal Office | Isha Mehta | owner | 9100003001 | Demo@12345 |
| Priya Nair Law | Priya Nair | owner | 9100003003 | Demo@12345 |
| Rohan Desai Counsel | Rohan Desai | owner | 9100003002 | Demo@12345 |
| Sterling Legal Partners | Nisha Sterling | owner | 9100001001 | Demo@12345 |
| Sterling Legal Partners | Kabir Sane | lawyer | 9100001002 | Demo@12345 |
| Sterling Legal Partners | Meera Coutinho | billing assistant | 9100001003 | Demo@12345 |
| Vyom Disputes Chambers | Aditya Rao | owner | 9100002001 | Demo@12345 |
| Vyom Disputes Chambers | Tara Menon | lawyer | 9100002002 | Demo@12345 |
| Vyom Disputes Chambers | Farah Qureshi | accountant | 9100002003 | Demo@12345 |

## Isha Mehta Legal Office

- Type: Solo lawyer workspace
- Slug: `isha-mehta-legal-office`
- Workspace ID: `6a3f8c86d4964e19ba24b52d`
- Member limit: 1
- Location: Ahmedabad
- Contact: isha@solo-law.test, 9100003001

### People

| Name | Role | Email | Mobile |
| --- | --- | --- | --- |
| Isha Mehta | owner | isha@solo-law.test | 9100003001 |

### Clients

| Client | Email | Phone | Payment Terms | GST Treatment | Client ID |
| --- | --- | --- | --- | --- | --- |
| Patel Family Trust | trustees@patelfamily.test | +91-79-4300-3301 | NET30 | gst | `6a3f8c86d4964e19ba24b54c` |
| Saffron Exports | accounts@saffronexports.test | +91-79-4300-3302 | NET15 | gst | `6a3f8c86d4964e19ba24b54e` |

### Matters

| Matter No. | Matter | Client ID | Status | Billing Type | Next Hearing | Target Close |
| --- | --- | --- | --- | --- | --- | --- |
| ISHA-001 | Patel Family Trust - Contract Review and Advisory | `6a3f8c86d4964e19ba24b54c` | open | hourly | 2026-07-08 | 2026-08-20 |
| ISHA-002 | Saffron Exports - Commercial Recovery Proceedings | `6a3f8c86d4964e19ba24b54e` | pending | hourly | 2026-07-09 | 2026-08-21 |

### Invoices By Month

| Month | Invoice Count | Total | Paid/Collected | Outstanding |
| --- | ---: | ---: | ---: | ---: |
| 2026-04 | 2 | INR 17,897 | INR 17,897 | INR 0 |
| 2026-05 | 2 | INR 22,027 | INR 22,027 | INR 0 |
| 2026-06 | 2 | INR 26,157 | INR 18,585 | INR 7,572 |

### Invoice Detail

| Invoice | Date | Status | Total | Outstanding | Sent To | Invoice ID |
| --- | --- | --- | ---: | ---: | --- | --- |
| ISHA-202604-01 | 2026-04-28 | paid | INR 8,260 | INR 0 | trustees@patelfamily.test | `6a3f8c86d4964e19ba24b55c` |
| ISHA-202604-02 | 2026-04-28 | paid | INR 9,637 | INR 0 | accounts@saffronexports.test | `6a3f8c86d4964e19ba24b569` |
| ISHA-202605-01 | 2026-05-28 | paid | INR 10,325 | INR 0 | trustees@patelfamily.test | `6a3f8c86d4964e19ba24b582` |
| ISHA-202605-02 | 2026-05-28 | paid | INR 11,702 | INR 0 | accounts@saffronexports.test | `6a3f8c86d4964e19ba24b58f` |
| ISHA-202606-01 | 2026-06-28 | paid | INR 12,390 | INR 0 | trustees@patelfamily.test | `6a3f8c86d4964e19ba24b5a8` |
| ISHA-202606-02 | 2026-06-28 | partial | INR 13,767 | INR 7,572 | accounts@saffronexports.test | `6a3f8c86d4964e19ba24b5b5` |

### Payments

| Receipt | Date | Method | Status | Amount | Reference | Payment ID |
| --- | --- | --- | --- | ---: | --- | --- |
| RCT-ISHA-202604-1 | 2026-04-30 | bank_transfer | cleared | INR 8,260 | UTR-ISHA-202604-1 | `6a3f8c86d4964e19ba24b561` |
| RCT-ISHA-202604-2 | 2026-04-30 | upi | cleared | INR 9,637 | UTR-ISHA-202604-2 | `6a3f8c86d4964e19ba24b56e` |
| RCT-ISHA-202605-1 | 2026-05-30 | bank_transfer | cleared | INR 10,325 | UTR-ISHA-202605-1 | `6a3f8c86d4964e19ba24b587` |
| RCT-ISHA-202605-2 | 2026-05-30 | upi | cleared | INR 11,702 | UTR-ISHA-202605-2 | `6a3f8c86d4964e19ba24b594` |
| RCT-ISHA-202606-1 | 2026-06-25 | bank_transfer | cleared | INR 12,390 | UTR-ISHA-202606-1 | `6a3f8c86d4964e19ba24b5ad` |
| RCT-ISHA-202606-2 | 2026-06-25 | upi | cleared | INR 6,195 | UTR-ISHA-202606-2 | `6a3f8c86d4964e19ba24b5ba` |

### KPI / Report Snapshots

| Month | Firm | User | Client | Matter | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2026-04 | 1 | 1 | 2 | 2 | 6 |
| 2026-05 | 1 | 1 | 2 | 2 | 6 |
| 2026-06 | 1 | 1 | 2 | 2 | 6 |

## Priya Nair Law

- Type: Solo lawyer workspace
- Slug: `priya-nair-law`
- Workspace ID: `6a3f8c87d4964e19ba24b66b`
- Member limit: 1
- Location: Kochi
- Contact: priya@solo-law.test, 9100003003

### People

| Name | Role | Email | Mobile |
| --- | --- | --- | --- |
| Priya Nair | owner | priya@solo-law.test | 9100003003 |

### Clients

| Client | Email | Phone | Payment Terms | GST Treatment | Client ID |
| --- | --- | --- | --- | --- | --- |
| Coastline Resorts | legal@coastlineresorts.test | +91-484-4500-3502 | NET15 | gst | `6a3f8c87d4964e19ba24b68c` |
| Malabar Wellness LLP | finance@malabarwellness.test | +91-484-4500-3501 | NET30 | gst | `6a3f8c87d4964e19ba24b68a` |

### Matters

| Matter No. | Matter | Client ID | Status | Billing Type | Next Hearing | Target Close |
| --- | --- | --- | --- | --- | --- | --- |
| PRIYA-001 | Malabar Wellness LLP - Contract Review and Advisory | `6a3f8c87d4964e19ba24b68a` | open | hourly | 2026-07-08 | 2026-08-20 |
| PRIYA-002 | Coastline Resorts - Commercial Recovery Proceedings | `6a3f8c87d4964e19ba24b68c` | pending | hourly | 2026-07-09 | 2026-08-21 |

### Invoices By Month

| Month | Invoice Count | Total | Paid/Collected | Outstanding |
| --- | ---: | ---: | ---: | ---: |
| 2026-04 | 2 | INR 15,851 | INR 15,851 | INR 0 |
| 2026-05 | 2 | INR 19,509 | INR 19,509 | INR 0 |
| 2026-06 | 2 | INR 23,167 | INR 16,461 | INR 6,706 |

### Invoice Detail

| Invoice | Date | Status | Total | Outstanding | Sent To | Invoice ID |
| --- | --- | --- | ---: | ---: | --- | --- |
| PRIYA-202604-01 | 2026-04-28 | paid | INR 7,316 | INR 0 | finance@malabarwellness.test | `6a3f8c87d4964e19ba24b69a` |
| PRIYA-202604-02 | 2026-04-28 | paid | INR 8,535 | INR 0 | legal@coastlineresorts.test | `6a3f8c87d4964e19ba24b6a7` |
| PRIYA-202605-01 | 2026-05-28 | paid | INR 9,145 | INR 0 | finance@malabarwellness.test | `6a3f8c88d4964e19ba24b6c0` |
| PRIYA-202605-02 | 2026-05-28 | paid | INR 10,364 | INR 0 | legal@coastlineresorts.test | `6a3f8c88d4964e19ba24b6cd` |
| PRIYA-202606-01 | 2026-06-28 | paid | INR 10,974 | INR 0 | finance@malabarwellness.test | `6a3f8c88d4964e19ba24b6e6` |
| PRIYA-202606-02 | 2026-06-28 | partial | INR 12,193 | INR 6,706 | legal@coastlineresorts.test | `6a3f8c88d4964e19ba24b6f3` |

### Payments

| Receipt | Date | Method | Status | Amount | Reference | Payment ID |
| --- | --- | --- | --- | ---: | --- | --- |
| RCT-PRIYA-202604-1 | 2026-04-30 | bank_transfer | cleared | INR 7,316 | UTR-PRIYA-202604-1 | `6a3f8c87d4964e19ba24b69f` |
| RCT-PRIYA-202604-2 | 2026-04-30 | upi | cleared | INR 8,535 | UTR-PRIYA-202604-2 | `6a3f8c88d4964e19ba24b6ac` |
| RCT-PRIYA-202605-1 | 2026-05-30 | bank_transfer | cleared | INR 9,145 | UTR-PRIYA-202605-1 | `6a3f8c88d4964e19ba24b6c5` |
| RCT-PRIYA-202605-2 | 2026-05-30 | upi | cleared | INR 10,364 | UTR-PRIYA-202605-2 | `6a3f8c88d4964e19ba24b6d2` |
| RCT-PRIYA-202606-1 | 2026-06-25 | bank_transfer | cleared | INR 10,974 | UTR-PRIYA-202606-1 | `6a3f8c88d4964e19ba24b6eb` |
| RCT-PRIYA-202606-2 | 2026-06-25 | upi | cleared | INR 5,487 | UTR-PRIYA-202606-2 | `6a3f8c88d4964e19ba24b6f8` |

### KPI / Report Snapshots

| Month | Firm | User | Client | Matter | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2026-04 | 1 | 1 | 2 | 2 | 6 |
| 2026-05 | 1 | 1 | 2 | 2 | 6 |
| 2026-06 | 1 | 1 | 2 | 2 | 6 |

## Rohan Desai Counsel

- Type: Solo lawyer workspace
- Slug: `rohan-desai-counsel`
- Workspace ID: `6a3f8c86d4964e19ba24b5cc`
- Member limit: 1
- Location: Pune
- Contact: rohan@solo-law.test, 9100003002

### People

| Name | Role | Email | Mobile |
| --- | --- | --- | --- |
| Rohan Desai | owner | rohan@solo-law.test | 9100003002 |

### Clients

| Client | Email | Phone | Payment Terms | GST Treatment | Client ID |
| --- | --- | --- | --- | --- | --- |
| Kulkarni Estates | office@kulkarniestates.test | +91-20-4400-3402 | NET15 | gst | `6a3f8c87d4964e19ba24b5ed` |
| Mosaic Design Studio | hello@mosaicdesign.test | +91-20-4400-3401 | NET30 | gst | `6a3f8c87d4964e19ba24b5eb` |

### Matters

| Matter No. | Matter | Client ID | Status | Billing Type | Next Hearing | Target Close |
| --- | --- | --- | --- | --- | --- | --- |
| ROHAN-001 | Mosaic Design Studio - Contract Review and Advisory | `6a3f8c87d4964e19ba24b5eb` | open | hourly | 2026-07-08 | 2026-08-20 |
| ROHAN-002 | Kulkarni Estates - Commercial Recovery Proceedings | `6a3f8c87d4964e19ba24b5ed` | pending | hourly | 2026-07-09 | 2026-08-21 |

### Invoices By Month

| Month | Invoice Count | Total | Paid/Collected | Outstanding |
| --- | ---: | ---: | ---: | ---: |
| 2026-04 | 2 | INR 16,874 | INR 16,874 | INR 0 |
| 2026-05 | 2 | INR 20,768 | INR 20,768 | INR 0 |
| 2026-06 | 2 | INR 24,662 | INR 17,523 | INR 7,139 |

### Invoice Detail

| Invoice | Date | Status | Total | Outstanding | Sent To | Invoice ID |
| --- | --- | --- | ---: | ---: | --- | --- |
| ROHAN-202604-01 | 2026-04-28 | paid | INR 7,788 | INR 0 | hello@mosaicdesign.test | `6a3f8c87d4964e19ba24b5fb` |
| ROHAN-202604-02 | 2026-04-28 | paid | INR 9,086 | INR 0 | office@kulkarniestates.test | `6a3f8c87d4964e19ba24b608` |
| ROHAN-202605-01 | 2026-05-28 | paid | INR 9,735 | INR 0 | hello@mosaicdesign.test | `6a3f8c87d4964e19ba24b621` |
| ROHAN-202605-02 | 2026-05-28 | paid | INR 11,033 | INR 0 | office@kulkarniestates.test | `6a3f8c87d4964e19ba24b62e` |
| ROHAN-202606-01 | 2026-06-28 | paid | INR 11,682 | INR 0 | hello@mosaicdesign.test | `6a3f8c87d4964e19ba24b647` |
| ROHAN-202606-02 | 2026-06-28 | partial | INR 12,980 | INR 7,139 | office@kulkarniestates.test | `6a3f8c87d4964e19ba24b654` |

### Payments

| Receipt | Date | Method | Status | Amount | Reference | Payment ID |
| --- | --- | --- | --- | ---: | --- | --- |
| RCT-ROHAN-202604-1 | 2026-04-30 | bank_transfer | cleared | INR 7,788 | UTR-ROHAN-202604-1 | `6a3f8c87d4964e19ba24b600` |
| RCT-ROHAN-202604-2 | 2026-04-30 | upi | cleared | INR 9,086 | UTR-ROHAN-202604-2 | `6a3f8c87d4964e19ba24b60d` |
| RCT-ROHAN-202605-1 | 2026-05-30 | bank_transfer | cleared | INR 9,735 | UTR-ROHAN-202605-1 | `6a3f8c87d4964e19ba24b626` |
| RCT-ROHAN-202605-2 | 2026-05-30 | upi | cleared | INR 11,033 | UTR-ROHAN-202605-2 | `6a3f8c87d4964e19ba24b633` |
| RCT-ROHAN-202606-1 | 2026-06-25 | bank_transfer | cleared | INR 11,682 | UTR-ROHAN-202606-1 | `6a3f8c87d4964e19ba24b64c` |
| RCT-ROHAN-202606-2 | 2026-06-25 | upi | cleared | INR 5,841 | UTR-ROHAN-202606-2 | `6a3f8c87d4964e19ba24b659` |

### KPI / Report Snapshots

| Month | Firm | User | Client | Matter | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2026-04 | 1 | 1 | 2 | 2 | 6 |
| 2026-05 | 1 | 1 | 2 | 2 | 6 |
| 2026-06 | 1 | 1 | 2 | 2 | 6 |

## Sterling Legal Partners

- Type: Firm workspace
- Slug: `sterling-legal-partners`
- Workspace ID: `6a3f8c82d4964e19ba24b34f`
- Member limit: 3
- Location: Mumbai
- Contact: nisha@sterlinglegal.test, 9100001001

### People

| Name | Role | Email | Mobile |
| --- | --- | --- | --- |
| Nisha Sterling | owner | nisha@sterlinglegal.test | 9100001001 |
| Kabir Sane | lawyer | kabir@sterlinglegal.test | 9100001002 |
| Meera Coutinho | billing assistant | meera@sterlinglegal.test | 9100001003 |

### Clients

| Client | Email | Phone | Payment Terms | GST Treatment | Client ID |
| --- | --- | --- | --- | --- | --- |
| Aurora Foods Pvt. Ltd. | legal@aurorafoods.test | +91-22-4000-1101 | NET30 | gst | `6a3f8c82d4964e19ba24b37e` |
| BluePeak Infra LLP | finance@bluepeakinfra.test | +91-22-4000-1102 | NET15 | gst | `6a3f8c82d4964e19ba24b380` |
| Nexora Labs India | contracts@nexoralabs.test | +91-22-4000-1103 | NET30 | gst | `6a3f8c82d4964e19ba24b382` |

### Matters

| Matter No. | Matter | Client ID | Status | Billing Type | Next Hearing | Target Close |
| --- | --- | --- | --- | --- | --- | --- |
| STERLING-001 | Aurora Foods Pvt. Ltd. - Contract Review and Advisory | `6a3f8c82d4964e19ba24b37e` | open | hourly | 2026-07-08 | 2026-08-20 |
| STERLING-002 | BluePeak Infra LLP - Commercial Recovery Proceedings | `6a3f8c82d4964e19ba24b380` | open | hourly | 2026-07-09 | 2026-08-21 |
| STERLING-003 | Nexora Labs India - Monthly Compliance Retainer | `6a3f8c82d4964e19ba24b382` | pending | retainer | 2026-07-10 | 2026-08-22 |

### Invoices By Month

| Month | Invoice Count | Total | Paid/Collected | Outstanding |
| --- | ---: | ---: | ---: | ---: |
| 2026-04 | 3 | INR 37,445 | INR 37,445 | INR 0 |
| 2026-05 | 3 | INR 38,783 | INR 38,783 | INR 0 |
| 2026-06 | 3 | INR 53,493 | INR 46,571 | INR 6,923 |

### Invoice Detail

| Invoice | Date | Status | Total | Outstanding | Sent To | Invoice ID |
| --- | --- | --- | ---: | ---: | --- | --- |
| STERLING-202604-01 | 2026-04-28 | paid | INR 12,272 | INR 0 | legal@aurorafoods.test | `6a3f8c83d4964e19ba24b394` |
| STERLING-202604-02 | 2026-04-28 | paid | INR 8,811 | INR 0 | finance@bluepeakinfra.test | `6a3f8c83d4964e19ba24b3a1` |
| STERLING-202604-03 | 2026-04-28 | paid | INR 16,363 | INR 0 | contracts@nexoralabs.test | `6a3f8c83d4964e19ba24b3ae` |
| STERLING-202605-01 | 2026-05-28 | paid | INR 9,440 | INR 0 | legal@aurorafoods.test | `6a3f8c83d4964e19ba24b3cd` |
| STERLING-202605-02 | 2026-05-28 | paid | INR 17,385 | INR 0 | finance@bluepeakinfra.test | `6a3f8c83d4964e19ba24b3da` |
| STERLING-202605-03 | 2026-05-28 | paid | INR 11,957 | INR 0 | contracts@nexoralabs.test | `6a3f8c83d4964e19ba24b3e7` |
| STERLING-202606-01 | 2026-06-28 | paid | INR 18,408 | INR 0 | legal@aurorafoods.test | `6a3f8c84d4964e19ba24b406` |
| STERLING-202606-02 | 2026-06-28 | partial | INR 12,587 | INR 6,923 | finance@bluepeakinfra.test | `6a3f8c84d4964e19ba24b413` |
| STERLING-202606-03 | 2026-06-28 | paid | INR 22,499 | INR 0 | contracts@nexoralabs.test | `6a3f8c84d4964e19ba24b420` |

### Payments

| Receipt | Date | Method | Status | Amount | Reference | Payment ID |
| --- | --- | --- | --- | ---: | --- | --- |
| RCT-STERLING-202604-1 | 2026-04-30 | bank_transfer | cleared | INR 12,272 | UTR-STERLING-202604-1 | `6a3f8c83d4964e19ba24b399` |
| RCT-STERLING-202604-2 | 2026-04-30 | upi | cleared | INR 8,811 | UTR-STERLING-202604-2 | `6a3f8c83d4964e19ba24b3a6` |
| RCT-STERLING-202604-3 | 2026-04-30 | bank_transfer | cleared | INR 16,363 | UTR-STERLING-202604-3 | `6a3f8c83d4964e19ba24b3b3` |
| RCT-STERLING-202605-1 | 2026-05-30 | bank_transfer | cleared | INR 9,440 | UTR-STERLING-202605-1 | `6a3f8c83d4964e19ba24b3d2` |
| RCT-STERLING-202605-2 | 2026-05-30 | upi | cleared | INR 17,385 | UTR-STERLING-202605-2 | `6a3f8c83d4964e19ba24b3df` |
| RCT-STERLING-202605-3 | 2026-05-30 | bank_transfer | cleared | INR 11,957 | UTR-STERLING-202605-3 | `6a3f8c83d4964e19ba24b3ec` |
| RCT-STERLING-202606-1 | 2026-06-25 | bank_transfer | cleared | INR 18,408 | UTR-STERLING-202606-1 | `6a3f8c84d4964e19ba24b40b` |
| RCT-STERLING-202606-2 | 2026-06-25 | upi | cleared | INR 5,664 | UTR-STERLING-202606-2 | `6a3f8c84d4964e19ba24b418` |
| RCT-STERLING-202606-3 | 2026-06-25 | bank_transfer | cleared | INR 22,499 | UTR-STERLING-202606-3 | `6a3f8c84d4964e19ba24b425` |

### KPI / Report Snapshots

| Month | Firm | User | Client | Matter | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2026-04 | 1 | 2 | 3 | 3 | 9 |
| 2026-05 | 1 | 2 | 3 | 3 | 9 |
| 2026-06 | 1 | 2 | 3 | 3 | 9 |

## Vyom Disputes Chambers

- Type: Firm workspace
- Slug: `vyom-disputes-chambers`
- Workspace ID: `6a3f8c84d4964e19ba24b43f`
- Member limit: 3
- Location: Bengaluru
- Contact: aditya@vyomchambers.test, 9100002001

### People

| Name | Role | Email | Mobile |
| --- | --- | --- | --- |
| Aditya Rao | owner | aditya@vyomchambers.test | 9100002001 |
| Tara Menon | lawyer | tara@vyomchambers.test | 9100002002 |
| Farah Qureshi | accountant | farah@vyomchambers.test | 9100002003 |

### Clients

| Client | Email | Phone | Payment Terms | GST Treatment | Client ID |
| --- | --- | --- | --- | --- | --- |
| Riverstone Textiles | accounts@riverstonetextiles.test | +91-80-4100-2202 | NET15 | gst | `6a3f8c85d4964e19ba24b470` |
| Summit Mobility Pvt. Ltd. | claims@summitmobility.test | +91-80-4100-2201 | NET30 | gst | `6a3f8c85d4964e19ba24b46e` |
| Zenith Warehousing Co. | legal@zenithwarehouse.test | +91-80-4100-2203 | NET30 | gst | `6a3f8c85d4964e19ba24b472` |

### Matters

| Matter No. | Matter | Client ID | Status | Billing Type | Next Hearing | Target Close |
| --- | --- | --- | --- | --- | --- | --- |
| VYOM-001 | Summit Mobility Pvt. Ltd. - Contract Review and Advisory | `6a3f8c85d4964e19ba24b46e` | open | hourly | 2026-07-08 | 2026-08-20 |
| VYOM-002 | Riverstone Textiles - Commercial Recovery Proceedings | `6a3f8c85d4964e19ba24b470` | open | hourly | 2026-07-09 | 2026-08-21 |
| VYOM-003 | Zenith Warehousing Co. - Monthly Compliance Retainer | `6a3f8c85d4964e19ba24b472` | pending | retainer | 2026-07-10 | 2026-08-22 |

### Invoices By Month

| Month | Invoice Count | Total | Paid/Collected | Outstanding |
| --- | ---: | ---: | ---: | ---: |
| 2026-04 | 3 | INR 34,692 | INR 34,692 | INR 0 |
| 2026-05 | 3 | INR 36,108 | INR 36,108 | INR 0 |
| 2026-06 | 3 | INR 49,560 | INR 43,070 | INR 6,490 |

### Invoice Detail

| Invoice | Date | Status | Total | Outstanding | Sent To | Invoice ID |
| --- | --- | --- | ---: | ---: | --- | --- |
| VYOM-202604-01 | 2026-04-28 | paid | INR 11,328 | INR 0 | claims@summitmobility.test | `6a3f8c85d4964e19ba24b484` |
| VYOM-202604-02 | 2026-04-28 | paid | INR 8,260 | INR 0 | accounts@riverstonetextiles.test | `6a3f8c85d4964e19ba24b491` |
| VYOM-202604-03 | 2026-04-28 | paid | INR 15,104 | INR 0 | legal@zenithwarehouse.test | `6a3f8c85d4964e19ba24b49e` |
| VYOM-202605-01 | 2026-05-28 | paid | INR 8,850 | INR 0 | claims@summitmobility.test | `6a3f8c85d4964e19ba24b4bd` |
| VYOM-202605-02 | 2026-05-28 | paid | INR 16,048 | INR 0 | accounts@riverstonetextiles.test | `6a3f8c85d4964e19ba24b4ca` |
| VYOM-202605-03 | 2026-05-28 | paid | INR 11,210 | INR 0 | legal@zenithwarehouse.test | `6a3f8c85d4964e19ba24b4d7` |
| VYOM-202606-01 | 2026-06-28 | paid | INR 16,992 | INR 0 | claims@summitmobility.test | `6a3f8c85d4964e19ba24b4f6` |
| VYOM-202606-02 | 2026-06-28 | partial | INR 11,800 | INR 6,490 | accounts@riverstonetextiles.test | `6a3f8c85d4964e19ba24b503` |
| VYOM-202606-03 | 2026-06-28 | paid | INR 20,768 | INR 0 | legal@zenithwarehouse.test | `6a3f8c85d4964e19ba24b510` |

### Payments

| Receipt | Date | Method | Status | Amount | Reference | Payment ID |
| --- | --- | --- | --- | ---: | --- | --- |
| RCT-VYOM-202604-1 | 2026-04-30 | bank_transfer | cleared | INR 11,328 | UTR-VYOM-202604-1 | `6a3f8c85d4964e19ba24b489` |
| RCT-VYOM-202604-2 | 2026-04-30 | upi | cleared | INR 8,260 | UTR-VYOM-202604-2 | `6a3f8c85d4964e19ba24b496` |
| RCT-VYOM-202604-3 | 2026-04-30 | bank_transfer | cleared | INR 15,104 | UTR-VYOM-202604-3 | `6a3f8c85d4964e19ba24b4a3` |
| RCT-VYOM-202605-1 | 2026-05-30 | bank_transfer | cleared | INR 8,850 | UTR-VYOM-202605-1 | `6a3f8c85d4964e19ba24b4c2` |
| RCT-VYOM-202605-2 | 2026-05-30 | upi | cleared | INR 16,048 | UTR-VYOM-202605-2 | `6a3f8c85d4964e19ba24b4cf` |
| RCT-VYOM-202605-3 | 2026-05-30 | bank_transfer | cleared | INR 11,210 | UTR-VYOM-202605-3 | `6a3f8c85d4964e19ba24b4dc` |
| RCT-VYOM-202606-1 | 2026-06-25 | bank_transfer | cleared | INR 16,992 | UTR-VYOM-202606-1 | `6a3f8c85d4964e19ba24b4fb` |
| RCT-VYOM-202606-2 | 2026-06-25 | upi | cleared | INR 5,310 | UTR-VYOM-202606-2 | `6a3f8c85d4964e19ba24b508` |
| RCT-VYOM-202606-3 | 2026-06-25 | bank_transfer | cleared | INR 20,768 | UTR-VYOM-202606-3 | `6a3f8c85d4964e19ba24b515` |

### KPI / Report Snapshots

| Month | Firm | User | Client | Matter | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2026-04 | 1 | 2 | 3 | 3 | 9 |
| 2026-05 | 1 | 2 | 3 | 3 | 9 |
| 2026-06 | 1 | 2 | 3 | 3 | 9 |


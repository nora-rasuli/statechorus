# Safe / Unsafe Claim Ledger

**Reviewed candidate:** StateChorus functional release 1.1 · 2026-11-19

| Safe wording | Unsafe or unsupported wording | Reason |
| --- | --- | --- |
| “Capture a real AI-interface trace with the Playwright helper.” | “Connect StateChorus to any live website.” | The user must instrument and exercise a local/staging interface. |
| “Imported traces are processed locally in the browser.” | “Your data can never leave your device.” | The static app has no upload path, but the user's browser, host, and capture environment remain outside its control. |
| “Checks browser-observable state, focus, transcript, approval, and live-region signals.” | “Tests screen readers.” | No native assistive-technology driver or speech output is used. |
| “Incomplete or incoherent traces fail as invalid runs.” | “StateChorus validates every possible AI interaction.” | The validator implements one explicit versioned contract. |
| “A clean local result still requires native verification.” | “Accessible,” “WCAG compliant,” or “safe to ship.” | Local DOM evidence cannot establish those outcomes. |
| “42 Vitest, 24 corpus attempts, and 19 Playwright checks passed on the dated candidate.” | “Production-proven” or “bug-free.” | Local deterministic checks do not establish production reliability. |
| “User-trace exports preserve separate capture and analysis provenance.” | “Forensic chain of custody.” | Hashes provide reproducibility/tamper evidence, not authenticated custody. |
| “The optional bundled sample demonstrates broken and corrected behavior.” | “The sample came from a customer or production incident.” | The sample is synthetic. |
| “Independent product designed and engineered by Nora Rasuli.” | “Validated by customers” or “commercially proven.” | No customer/adoption/revenue evidence exists. |

For public claim IDs, evidence paths, measurements, and limitations, use
`claim-ledger.md` as the controlling record.

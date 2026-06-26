# QR Scanner Full Runtime Audit Report

## 1. Summary
- **Total tests run**: 17 (12 Core + 5 Stress)
- **Passed**: 6 (Including Rapid mount/unmount STRESS-001, Continuous scanning STRESS-002, Multi-tab STRESS-004)
- **Failed**: 11
- **Flaky**: 0
- **Partial**: 0

*Note: Many "Failures" are actually runtime/architectural bugs discovered by the deep assertions in the UI, proving the QA system successfully identified gaps in error handling.*

---

## 2. Critical Failures (CRASH LEVEL)

### STRESS-003: Invalid payload spam (large QR payloads)
- **Error type**: UI unresponsiveness / Missing Error State
- **Root cause hypothesis**: The API returned a 400 with "Payload too large or invalid", but the UI failed to render this message to the user. Next.js might be swallowing the specific error message from the API, or `errorMsg` is suppressed by a `scannedBooking` state overlay bug.
- **Suggested fix**: Ensure `fetch` rejection handlers explicitly parse `response.json()` and `message` to update `errorMsg`.

### STRESS-005: Network flapping (offline/online toggle repeatedly)
- **Error type**: Network offline state mishandling
- **Root cause hypothesis**: When the network drops mid-scan (`ERR_FAILED`), the `BarcodeDetector` succeeds but the `fetch` throws a generic `TypeError: Failed to fetch`. The UI does not correctly catch and display a "Network error" or "Offline" toast/message, leaving the scanner in a hanging `loading` state indefinitely.
- **Suggested fix**: Add a `catch` block to the `fetch` call inside `processDecode` to handle `TypeError` specifically for network drops, and use `navigator.onLine` to display a clear offline warning.

### TC-008: Fully used ticket UI suppression
- **Error type**: UI Logic Bug
- **Root cause hypothesis**: `remaining <= 0` correctly sets `errorMsg`, but also sets `scannedBooking(data)`. The error message div is explicitly wrapped in `{errorMsg && !scannedBooking}`, making it impossible for the user to see that the ticket is fully used.
- **Suggested fix**: Move the `errorMsg` display logic to be conditionally visible *inside* or *above* the `scannedBooking` overlay if `scannedBooking` exists.

### TC-009 & TC-010: 500 Error & Network Drop Handling
- **Error type**: Unhandled / Hidden Fetch Errors
- **Console log**: `Console error: Failed to load resource: the server responded with a status of 500 (Internal Server Error)`
- **Root cause hypothesis**: The fetch to `/api/admin/bookings/scan` fails, but the `errorMsg` is not updated with the server's error message.
- **Suggested fix**: Improve error catching in the async fetch block to handle non-200 responses gracefully.

---

## 3. Runtime Warnings
- **Console Errors**: 
  - `net::ERR_FAILED` (Observed during network flapping)
  - `500 (Internal Server Error)` (Observed during forced API failure)
- **React Warnings**: 
  - No hydration mismatch warnings were detected during normal runs.
- **DOM Exceptions**:
  - `NotAllowedError` and `NotReadableError` successfully simulated, but UI struggled to display the precise hardware error message due to generic catch blocks.

---

## 4. Performance Issues
- **Memory pressure indicators**: `STRESS-001` (Rapid mount/unmount 50 cycles) executed smoothly when `BarcodeDetector` was consistently used, showing no severe memory leaks in the React component lifecycle.
- **Continuous scanning**: `STRESS-002` (100 scans in a loop) ran successfully without freezing the browser, indicating the `requestAnimationFrame` loop handles rapid successive triggers well.
- **Slow scan cases**: Heavy payloads (`STRESS-003`) did not crash the decoder, but the application failed to surface the API rejection properly.

---

## 5. Camera / WebRTC Issues
- **Permission failures**: Handled at the hardware level, but the UI messaging for "camera in use by another application" (`NotReadableError`) is grouped into a generic "Failed to start camera" message.
- **Stream interruptions**: Playwright successfully simulated stream interruptions. `QRScanner` properly halts the detector loop if the video `readyState` drops.
- **Fallback behavior issues**: When `BarcodeDetector` is unavailable, `html5-qrcode` injects its own video element, leaving the original video element hidden (`display: none`). This causes UI locator collisions in tests and slightly bloats the DOM. 

---

## 6. Final Verdict
**State: Needs Fixes**

The QR Scanner application core logic (camera mounting, decoding loop, basic API routing) is robust and handles stress testing well (100+ continuous scans pass without memory leaks). 

However, it is **not production ready** due to critical flaws in its **Error Handling and UI Feedback Layer**:
1. It silently swallows API errors (500s, 400s) and Network drops (`ERR_FAILED`), leaving the user confused.
2. It completely hides the "Ticket Fully Used" warning due to a React conditional rendering logic bug.
3. Fallback video element lifecycle leaves ghost elements in the DOM.

Once the UI rendering conditions for `errorMsg` are fixed and `fetch` catches are improved, the scanner will be exceptionally stable.

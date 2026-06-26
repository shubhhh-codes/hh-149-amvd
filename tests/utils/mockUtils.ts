import { Page } from '@playwright/test';

/**
 * Mocks the camera permission and behavior.
 * @param page Playwright Page object
 * @param state 'granted' | 'denied'
 * @param errorType Optional error to simulate if state is denied (e.g., 'NotAllowedError', 'NotReadableError')
 */
export async function mockCameraPermission(page: Page, state: 'granted' | 'denied', errorType?: string) {
  await page.addInitScript(({ state, errorType }) => {
    // Override permissions API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = async (descriptor: any) => {
      if (descriptor.name === 'camera') {
        return { state, onchange: null } as PermissionStatus;
      }
      return originalQuery.call(window.navigator.permissions, descriptor);
    };

    // Override getUserMedia
    const originalGetUserMedia = window.navigator.mediaDevices.getUserMedia;
    window.navigator.mediaDevices.getUserMedia = async (constraints: any) => {
      if (state === 'denied') {
        const err = new Error(errorType || 'Permission denied');
        err.name = errorType || 'NotAllowedError';
        throw err;
      }
      return originalGetUserMedia.call(window.navigator.mediaDevices, constraints);
    };
  }, { state, errorType });
}

/**
 * Mocks a QR code detection on the page.
 * Assumes the application has some hook or expose method, or we mock the API response it sends.
 */
export async function mockQRScan(page: Page, qrData: string, isValid: boolean = true) {
  // Since we are mocking via fake UI media stream in config, to inject specific QR codes 
  // without a physical file, we can intercept the decoding process if it's client-side,
  // or mock the server endpoint if it's server-side validation.
  
  // Example: Mock API response for booking validation
  await page.route('**/api/scanner/validate', async route => {
    if (isValid) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: qrData, message: 'Valid QR' })
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Invalid or expired QR code' })
      });
    }
  });
}

/**
 * Mocks network failure for an endpoint
 */
export async function mockNetworkFailure(page: Page, urlPattern: string, status: number = 500) {
  await page.route(urlPattern, async route => {
    if (status === 0) {
      await route.abort('failed'); // Simulate network offline
    } else {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server Error' })
      });
    }
  });
}

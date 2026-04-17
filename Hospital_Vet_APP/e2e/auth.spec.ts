import { test, expect } from '@playwright/test';

test.describe('VetHospital 24h - End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test.describe('Authentication', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await expect(page).toHaveTitle(/VetHospital/);
      await expect(page.locator('text=Iniciar Sesión')).toBeVisible();
    });

    test('should login with valid credentials', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      // Fill login form
      await page.fill('input[name="email"]', 'admin@vethospital.com');
      await page.fill('input[name="password"]', 'password123');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL('http://localhost:3000/dashboard');
      await expect(page).toHaveURL(/dashboard/);
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      await page.fill('input[name="email"]', 'wrong@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should stay on login page and show error
      await expect(page).toHaveURL(/login/);
      await expect(page.locator('text=/Credenciales inválidas|Error/i')).toBeVisible();
    });
  });

  test.describe('Dashboard', () => {
    test('staff should access dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'staff@vethospital.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/dashboard/);
      await expect(page.locator('text=/Pacientes|Citas|Facturas/i')).toBeVisible();
    });

    test('client should access client portal', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'client@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/client-portal/);
      await expect(page.locator('text=/Mis Mascotas|Mis Facturas/i')).toBeVisible();
    });
  });

  test.describe('Billing Workflow', () => {
    test('should display invoice list', async ({ page }) => {
      await loginAs(page, 'staff@vethospital.com');
      await page.goto('http://localhost:3000/dashboard/billing');
      
      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('text=Facturas')).toBeVisible();
    });

    test('should open invoice detail', async ({ page }) => {
      await loginAs(page, 'staff@vethospital.com');
      await page.goto('http://localhost:3000/dashboard/billing');
      
      // Click first invoice link
      await page.click('a[href*="/billing/"]');
      
      await expect(page.locator('text=/Detalles|Items/i')).toBeVisible();
    });

    test('should add invoice item', async ({ page }) => {
      await loginAs(page, 'staff@vethospital.com');
      
      // Navigate to invoice detail with ID
      const invoiceId = 'inv_sample_12345';
      await page.goto(`http://localhost:3000/dashboard/billing/${invoiceId}`);
      
      // Fill add item form
      await page.fill('input[name="description"]', 'Consulta veterinaria');
      await page.fill('input[name="quantity"]', '1');
      await page.fill('input[name="unitPrice"]', '50');
      
      // Submit
      await page.click('button:has-text("Agregar")');
      
      // Verify
      await expect(page.locator('text=Consulta veterinaria')).toBeVisible();
    });
  });

  test.describe('GDPR Compliance', () => {
    test('should access privacy policy', async ({ page }) => {
      await page.goto('http://localhost:3000/privacy-policy');
      await expect(page.locator('h1:has-text("Política de Privacidad")')).toBeVisible();
    });

    test('should access terms of service', async ({ page }) => {
      await page.goto('http://localhost:3000/terms-of-service');
      await expect(page.locator('h1:has-text("Términos de Servicio")')).toBeVisible();
    });

    test('should export personal data', async ({ page }) => {
      await loginAs(page, 'client@example.com');
      await page.goto('http://localhost:3000/client-portal/settings');
      
      // Click export button
      await page.click('button:has-text("Exportar")');
      
      // Accept in modal
      await page.click('button:has-text("Descargar Datos")');
      
      // Verify download starts
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('gdpr-export');
    });
  });

  test.describe('System Health', () => {
    test('should return health status', async ({ page }) => {
      const response = await page.request.get('http://localhost:3000/api/health');
      expect(response.status()).toBe(200);
      
      const health = await response.json();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('database');
      expect(health).toHaveProperty('backups');
    });
  });
});

// Helper function
async function loginAs(page: any, email: string) {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|client-portal/);
}

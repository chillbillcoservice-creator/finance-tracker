# Local Personal Finance Tracker

A premium, mobile-friendly application to manage:
- **Money Lent**: Track loans to borrowers with a default 4% interest rate (adjustable per loan), log interest payment dates, and calculate total interest received.
- **Money Borrowed**: Log loans from different financiers with varying rates, tracking principal, rates, and payment dates.
- **Rental Management**: Record tenant details, property names, deposits, and rent due dates. Receive automatic dashboard alerts/reminders for upcoming rents, and track historical rent payments.

## How it Works
1. **Offline & Private**: All data is stored in your web browser's `LocalStorage`. No information leaves your device.
2. **Data Backup**: Use the **Backup / Settings** tab to export your data as a JSON file, or restore a previously saved backup file.

## Running Locally

To run the application locally, you can use the Vite development server:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

Alternatively, since this is a static single-page application, you can also open `index.html` directly in your browser.

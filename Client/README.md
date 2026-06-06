# VendorBridge Client Portal

A modern, high-fidelity Enterprise Resource Planning (ERP) frontend built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. This portal connects Procurement Officers, Vendors, Managers, and System Administrators in a unified, automated supply-chain workspace.

---

## 🚀 Key Features by Portal

### 1. 🔑 Admin Portal (`/admin`)
* **User Management**: Add, modify, or delete internal accounts; reset user passwords instantly to defaults with one-click actions.
* **Supplier Governance**: Monitor tax credentials (GSTIN format validations) and verify/suspend suppliers.
* **Audit Logs**: View chronological event feeds (e.g., `USER_CREATED`, `PO_GENERATED`, `INVOICE_PAID`) matching backend log actions.
* **Visual KPIs**: SVG metrics representing system-wide active enrollments and user role breakdowns.

### 2. 📋 Procurement Officer Portal (`/procurement`)
* **RFQ Builder & Registry**: Draft, edit, publish, and close Request for Quotations (RFQs).
* **Vendor Directory**: Manage onboarding pipelines, assign categories, and edit custom ratings.
* **Itemized Bid Comparison Matrix**: Compare competing quotations side-by-side. Highlights the lowest price, fastest delivery, and displays line-item breakdowns.
* **Contracts & Invoices**: Generate sequential Purchase Orders (`PO-YYYY-XXXX`) and track invoice logs.
* **Procurement Analytics**: Custom charts indicating Cycle Velocity (days to pay), Negotiated Cost Savings, and Unpaid Aging distributions (Current / Aged / Critical Overdue).

### 3. 🤝 Vendor Portal (`/vendor`)
* **Interactive Dashboard**: KPI summaries (invitations, bids submitted, bids won, active POs), SVG Win-Rate donut meters, and monthly revenue bar charts.
* **My Quotations**: Dedicated list of submitted bids, pricing revisions, and selection statuses.
* **Proposal Submissions**: Interactive draft forms calculating item subtotals and grand totals in real-time.
* **Business Profile**: Scorecard tracker showing profile completeness with address, website link, and company description details.

### 4. 👔 Manager Portal (`/manager`)
* **Approval Queue**: Dedicated inbox of proposals selected by procurement.
* **Detailed Audit Timeline**: Chronological action records detailing remarks, actors, and state transitions.
* **Approve/Reject Triggers**: Approve bids or reject them (mandatory remarks required), automatically reopening the parent RFQ for vendor modifications.

---

## 📂 Directory Structure

```text
Client/
├── public/                 # Static public assets
├── src/
│   ├── components/
│   │   ├── shared/         # Reusable global layout elements (e.g., Navbar)
│   │   └── ui/             # Core UI buttons, inputs, labels, and dialog components
│   ├── pages/              # General pages (Login, Register, Forgot Password)
│   ├── portals/
│   │   ├── admin/          # Admin portal pages and analytics boards
│   │   ├── procurement/    # RFQ editors, directories, and comparison panels
│   │   ├── manager/        # Approval hubs and evaluation lists
│   │   └── vendor/         # Bid submission drawers, profile forms, and self-KPI cards
│   ├── App.tsx             # Route management, role router, and application structure
│   ├── index.css           # Core styling configurations and Tailwind theme extensions
│   └── main.tsx            # App bootstrap point
├── package.json            # Client dependencies and npm script bindings
├── tsconfig.json           # TypeScript compilation configuration
└── vite.config.ts          # Vite build and path alias configurations
```

---

## 🛠 Getting Started

### 1. Install Dependencies
Run the package installation command inside the client root directory:
```bash
npm install
```

### 2. Configure Environment
By default, the client is configured to connect to the backend server at `http://localhost:8000`. You can review or configure API URLs inside page files if necessary.

### 3. Run Development Server
Start the local server with hot module replacement (HMR):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Compile Production Bundle
Test type compliance and bundle assets for deployment:
```bash
npm run build
```

---

## 🎨 Styling & Aesthetic Guidelines

* **Harmonious Palettes**: Clean slate borders, light-gray backgrounds (`bg-gray-50`), and primary branding in slate/blue (`text-blue-600` / `bg-blue-600`).
* **Visual States**: Status indicators use color-coded badges:
  * **Selected / Active / Paid**: Emerald green (`bg-emerald-50 text-emerald-700`).
  * **Pending / Revised / Under Review**: Amber yellow (`bg-amber-50 text-amber-700`).
  * **Rejected / Suspended / Expired**: Crimson red (`bg-red-50 text-red-750`).
* **Micro-interactions**: Subtle hover translations (`transition-all hover:shadow-md`) and focus borders on input grids.
* **Dynamic SVGs**: Custom vector paths are utilized for charts (donut percentage rings, monthly bar ratios, aging gauges) to ensure fast rendering.

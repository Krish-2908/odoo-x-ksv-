# VendorBridge Server API

The backend for VendorBridge is a RESTful API built on **Node.js**, **Express.js**, and **MongoDB (Mongoose)**. It implements JWT authentication, granular role-based access control, transaction logging, sequential invoice generators, and a sandbox payment integration using the **Razorpay** SDK.

---

## 🛠 Tech Stack

* **Runtime Environment**: Node.js
* **Framework**: Express.js (v5.x)
* **Database**: MongoDB & Mongoose ODM
* **Authentication**: JSON Web Tokens (JWT) & bcryptjs
* **Payment Gateway SDK**: Razorpay Node SDK

---

## 📂 Directory Structure

```text
Server/
├── controllers/          # Request handlers and business logic
│   ├── activityLogController.js   # Audit logs query handlers
│   ├── analyticsController.js     # Mongoose aggregations (spend, win rates, velocity)
│   ├── authController.js          # Registration, login, password resets
│   ├── invoiceController.js        # Invoice generation, Razorpay order sync, email logs
│   ├── purchaseOrderController.js  # PO sequential generation & pricing calculations
│   ├── rfqController.js           # RFQ state machine (draft, open, select, approve, reject)
│   ├── userController.js          # Admin-only user CRUD
│   └── vendorController.js        # Vendor directory, compliance ratings, status edits
├── middleware/           # Express middleware
│   └── authMiddleware.js        # JWT verify and role authorization checks
├── models/               # Mongoose database schemas
│   ├── ActivityLog.js
│   ├── Invoice.js
│   ├── PurchaseOrder.js
│   ├── Quotation.js
│   ├── RFQ.js
│   ├── User.js
│   └── Vendor.js
├── routes/               # API endpoint router mappings
├── utils/                # General utility modules
│   ├── db.js             # MongoDB connection configuration
│   └── logger.js         # Asynchronous activity logger helper
├── index.js              # Application entry point
├── package.json          # Node scripts and project metadata
└── .env                  # Configuration variables
```

---

## ⚙ Environment Configuration

Create a `.env` file in the `Server` root directory with the following variables:

```ini
PORT=8000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_key
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 🚀 Running the Server

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode (with Nodemon)
```bash
npm run dev
```

### 3. Run in Production Mode
```bash
npm start
```

The server will initialize on [http://localhost:8000](http://localhost:8000) (or the port specified in your `.env`).

---

## 🔗 Key API Route Reference

### 1. Authentication & Users (`/api/users`)
* `POST /api/users/register` — Create a new user account (Public).
* `POST /api/users/login` — Authenticate credentials and return a token (Public).
* `GET /api/users` — Retrieve all user records (Admin only).
* `PUT /api/users/:id` — Update user roles or detail fields (Admin only).
* `DELETE /api/users/:id` — Remove user accounts (Admin only).

### 2. RFQ Procurement Pipeline (`/api/rfqs`)
* `POST /api/rfqs` — Create a draft or publish an RFQ (Procurement Officer).
* `GET /api/rfqs` — List RFQs. Vendors only see assigned, published RFQs; internal users see all.
* `POST /api/rfqs/:id/select` — Award the RFQ to a specific quotation (Procurement Officer).
* `POST /api/rfqs/:id/approve` — Approve an awarded quotation (Manager/Approver).
* `POST /api/rfqs/:id/reject` — Reject an awarded quotation and reopen bidding (Manager/Approver).

### 3. Vendor Bids & Quotations (`/api/quotations`)
* `POST /api/quotations` — Submit or update a quotation (Vendor only).
* `GET /api/quotations` — Fetch the logged-in vendor's bid history.
* `GET /api/quotations/rfq/:rfqId` — List all quotations submitted for an RFQ (Procurement/Manager/Admin).

### 4. Contracts & Invoicing (`/api/purchase-orders` & `/api/invoices`)
* `POST /api/purchase-orders` — Generate a sequential Purchase Order (`PO-2026-0001`) with an 18% GST calculation.
* `GET /api/purchase-orders/:id` — Retrieve PO details (Vendor access restricted to owner).
* `GET /api/invoices` — List all generated invoices.
* `POST /api/invoices/:id/pay` — Initialize a Razorpay payment order.
* `POST /api/invoices/:id/verify` — Verify the payment signature (HMAC-SHA256) and mark the invoice & PO as `Paid`.

### 5. Multi-dimensional Analytics (`/api/analytics`)
* `GET /api/analytics` — Global dashboard metrics (Spend by Month, Spend by Category, compliance matrices) (Internal roles).
* `GET /api/analytics/vendor-self` — Private performance analytics (bids won/lost count, monthly revenue trends) (Vendor only).
* `GET /api/analytics/export` — Download system overview details as a CSV sheet (Admin only).

# NNG Luxury Timepieces
### Node.js + SQLite | React | Bilingual (EN/AR) | Mobile Admin

---

## ⚡ Quick Start (Windows)

**Double-click `START.bat`** — it installs everything and opens the browser automatically.

That's it. No XAMPP, no MySQL, no configuration needed.

---

## 📋 Manual Start

### Requirements
- **Node.js 18+** — download from https://nodejs.org (choose LTS)
- That's all! SQLite is included automatically.

### Step 1 — Start the backend
```bash
cd backend
npm install        # first time only
npm start          # starts on port 4000
```

### Step 2 — Start the frontend (new terminal)
```bash
cd frontend
npm install        # first time only
npm run dev        # starts on port 5173
```

### Step 3 — Open browser
```
http://localhost:5173          ← Store
http://localhost:5173/admin    ← Admin panel
```

**Admin login:** `admin@nng.com` / `admin123`

---

## 📁 Project Structure

```
nng/
├── START.bat              ← Double-click to start (Windows)
├── start.sh               ← Mac/Linux startup script
├── backend/
│   ├── server.js          ← Express API server
│   ├── db.js              ← SQLite database setup
│   ├── seed.js            ← Sample data loader
│   ├── nng.db             ← SQLite database (auto-created)
│   ├── uploads/           ← Product image uploads
│   └── package.json
└── frontend/
    ├── src/
    │   ├── context/StoreContext.jsx  ← All state + API calls
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── ShopPage.jsx
    │   │   ├── ProductPage.jsx
    │   │   ├── CheckoutPage.jsx
    │   │   └── AdminPage.jsx
    │   └── components/
    ├── vite.config.js
    └── package.json
```

---

## 🔧 Configuration

### Change WhatsApp Number
Open `frontend/src/context/StoreContext.jsx` line ~10:
```js
const WHATSAPP_NUMBER = '+1234567890'  // ← change this
```

### Change Admin Password
Open `backend/seed.js` line 7:
```js
const hash = bcrypt.hashSync('admin123', 10)  // ← change admin123
```
Then delete `backend/nng.db` and run `node seed.js` again.

### Change Admin Email
Open `backend/seed.js` line 8:
```js
db.prepare(...).run('Admin NNG', 'admin@nng.com', ...)  // ← change email
```

Also update `frontend/src/context/StoreContext.jsx`:
```js
const ADMIN_EMAIL = 'admin@nng.com'  // ← same email
```

### Production / Mobile Access
To access from your phone (same WiFi):
1. Find your computer IP: run `ipconfig` (Windows) or `ifconfig` (Mac)
2. Open on phone: `http://YOUR_IP:5173`
3. Admin on phone: `http://YOUR_IP:5173/admin`

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get product |
| POST | `/api/products` | Add product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |
| GET | `/api/orders` | List orders (admin) |
| POST | `/api/orders` | Place order |
| PUT | `/api/orders/:id` | Update order status (admin) |
| GET | `/api/brands` | List brands |
| GET | `/api/categories` | List categories |
| GET | `/api/stats` | Dashboard stats (admin) |
| POST | `/api/upload` | Upload image (admin) |

---

## 📱 Mobile Admin
The admin panel works fully on mobile. Open `http://YOUR_IP:5173/admin` on your phone while on the same WiFi network as your computer.

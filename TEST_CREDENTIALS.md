# Test Credentials - Preview Without Admin Access

## 🎯 Quick Preview Options

### Option 1: Use Mock User Accounts (No Admin Required)

You can log in with these test accounts to see different user roles:

#### **Driver Account** (Limited Access)
- **Email:** `anders@example.com`
- **Password:** (any password works - it's mock data)
- **Access:** Can view machines, mark lubrication, add notes

#### **Mechanic Account** (More Access)
- **Email:** `mette@example.com`
- **Password:** (any password works)
- **Access:** Can view/edit machines, add service records, manage tasks

#### **Technician Account**
- **Email:** `peter@example.com`
- **Password:** (any password works)
- **Access:** Similar to mechanic, can add service records

#### **Blacksmith Account**
- **Email:** `soren@example.com`
- **Password:** (any password works)
- **Access:** Can add service records and lubrication

#### **Guest Account** (View Only)
- **Email:** `guest@example.com`
- **Password:** (any password works)
- **Access:** View-only access

---

### Option 2: Admin Account (Full Access)

If you need full admin access:
- **Email:** `mje@transport.gl`
- **Password:** `Salikme010623!`

---

### Option 3: Public QR Scanner (No Login Required)

1. Go to: `http://localhost:8081`
2. Click the **"Scan QR"** tab
3. You can scan QR codes to view machine details without logging in!

---

## 🚀 How to Test Different User Roles

1. **Open the app:** `http://localhost:8081`
2. **Log in** with any of the test emails above
3. **Use any password** (the mock system accepts any password for these emails)
4. **Explore** the dashboard and see what features are available for that role

---

## 📝 Note

The authentication system uses **mock data**, so:
- Any password works for the test emails
- User roles determine what you can see/do
- Data is stored in browser localStorage (clears on browser clear)

---

## 🔍 What Each Role Can Do

| Role | View Machines | Edit Machines | Add Service | Add Tasks | Manage Users |
|------|--------------|---------------|-------------|-----------|--------------|
| Guest | ✅ | ❌ | ❌ | ❌ | ❌ |
| Driver | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mechanic | ✅ | ✅ | ✅ | ✅ | ❌ |
| Technician | ✅ | ✅ | ✅ | ✅ | ❌ |
| Blacksmith | ✅ | ✅ | ✅ | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |


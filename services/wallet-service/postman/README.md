# Shield Wallet Service - Postman Collection

This collection contains comprehensive tests for the Wallet Service API with NASA-level robustness.

## 🌐 Unified Environment

**IMPORTANT:** This collection uses the **unified Shield Platform environment** located at:

```
/postman/Shield Platform.postman_environment.json
```

### Import Instructions

1. **Import the unified environment** (do this ONCE):
   - In Postman, go to **Environments** → **Import**
   - Select: `/postman/Shield Platform.postman_environment.json`

2. **Import this collection**:
   - In Postman, go to **Collections** → **Import**
   - Select: `Shield Wallet Service.postman_collection.json`

3. **Select the environment**:
   - In Postman, click the environment dropdown (top-right)
   - Select: **"Shield Platform - All Services"**

4. **Authenticate first** (using Auth Service):
   - Import and run: `services/auth-service/postman/Shield Auth Service.postman_collection.json`
   - Run: **"Login - Success"** → This saves `{{access_token}}` to the environment
   - Now you're ready to test the Wallet Service! ✅

## 🔗 Token Sharing

This collection **automatically uses** the `{{access_token}}` saved by the Auth Service:
- ✅ No need to manually copy/paste tokens
- ✅ No need to switch environments
- ✅ Login once in Auth Service, test all services

## 📋 Test Coverage (42+ Assertions)

### Service Info & Health
- ✅ Get Service Info (2 tests)
- ✅ Health Check (2 tests)

### Create Wallet
- ✅ **Create Polygon Wallet** - Success (6 tests, saves `polygon_wallet_id`)
- ✅ **Create Tron Wallet** - Success (6 tests, saves `tron_wallet_id`)
- ✅ Create Wallet - Invalid Chain (2 tests)
- ✅ Create Wallet - Invalid Address Format (2 tests)
- ✅ Create Wallet - Duplicate Address (2 tests)
- ✅ Create Wallet - No Authentication (2 tests)

### List Wallets
- ✅ **Get User Wallets** - Success (4 tests)
- ✅ Get User Wallets - No Authentication (2 tests)

### Get Wallet by ID
- ✅ **Get Polygon Wallet by ID** - Success (5 tests)
- ✅ Get Wallet - Invalid ID Format (2 tests)
- ✅ Get Wallet - Not Found (2 tests)
- ✅ Get Wallet - No Authentication (2 tests)

### Update Wallet
- ✅ **Update Wallet Tag** - Success (5 tests)
- ✅ Update Wallet - Invalid ID (2 tests)
- ✅ Update Wallet - No Authentication (2 tests)

### Delete Wallet
- ✅ **Delete Wallet** - Success (3 tests)
- ✅ Delete Wallet - Already Deleted (idempotent) (2 tests)
- ✅ Delete Wallet - No Authentication (2 tests)

## 🚀 Quick Start

```bash
# 1. Start both services
cd services/auth-service && npm run dev &
cd services/wallet-service && npm run dev &

# 2. In Postman:
#    - Import unified environment: /postman/Shield Platform.postman_environment.json
#    - Import Auth Service collection (to login)
#    - Import this Wallet Service collection
#    - Select environment: "Shield Platform - All Services"

# 3. Authenticate:
#    - Auth Service → Run "Login - Success"
#    - This saves the access_token ✅

# 4. Test Wallet Service:
#    - Wallet Service → Run the entire collection
#    - All requests use the same access_token automatically! 🎉
```

## 🔄 Typical Workflow

```
Step 1 - Authenticate (Auth Service):
├─ Run "Login - Success"
└─ ✅ Saves access_token to environment

Step 2 - Create Wallets (Wallet Service):
├─ Run "Create Polygon Wallet"  → ✅ Saves polygon_wallet_id
└─ Run "Create Tron Wallet"     → ✅ Saves tron_wallet_id

Step 3 - List Wallets:
└─ Run "Get User Wallets"        → ✅ Shows both wallets

Step 4 - Update Wallet:
└─ Run "Update Wallet Tag"       → ✅ Updates tag

Step 5 - Delete Wallet:
└─ Run "Delete Wallet"           → ✅ Soft deletes wallet

No manual token copying needed! 🎉
```

## 🧪 NASA-Level Robustness

This collection tests for:

### ✅ Success Cases
- Valid wallet creation (Polygon, Tron)
- Listing user wallets
- Getting wallet by ID
- Updating wallet tags
- Deleting wallets (soft delete)

### ✅ Validation Errors
- Invalid chain types
- Invalid address formats
- Missing required fields
- Invalid UUID formats

### ✅ Business Logic
- Duplicate address detection
- User-wallet ownership verification
- Idempotent operations (e.g., deleting already deleted wallet)

### ✅ Security
- Authentication required for all operations
- Authorization (users can only access their own wallets)
- Proper HTTP status codes (401, 403, 404, 409)

### ✅ Data Integrity
- Auto-saves wallet IDs for dependent tests
- Validates response structure
- Checks all required fields
- Verifies timestamps and metadata

## 📝 Environment Variables Used

| Variable | Purpose | Set By |
|----------|---------|--------|
| `{{auth_service_url}}` | Auth service URL | Environment (http://localhost:3001) |
| `{{wallet_service_url}}` | Wallet service URL | Environment (http://localhost:3002) |
| `{{access_token}}` | JWT access token | Auth Service (Login/Register) |
| `{{test_user_email}}` | Test user email | Environment |
| `{{test_user_password}}` | Test user password | Environment |
| `{{polygon_wallet_id}}` | Created Polygon wallet ID | This collection (auto-saved) |
| `{{tron_wallet_id}}` | Created Tron wallet ID | This collection (auto-saved) |
| `{{polygon_wallet_address}}` | Polygon wallet address | This collection (auto-saved) |

## 🚨 Troubleshooting

### "Could not send request - ECONNREFUSED"
→ Make sure the wallet service is running: `npm run dev`

### "Authentication token is empty" or 401 errors
→ Run Auth Service → "Login - Success" first to set the `{{access_token}}`

### "Invalid authentication token"
→ Token may be expired. Run Auth Service → "Login - Success" again

### Wallet not found
→ Make sure to run "Create Polygon Wallet" first to create test data

## 📦 What Gets Auto-Saved

When you run tests in sequence, these variables are automatically saved:

```javascript
// After "Login - Success" (Auth Service):
pm.environment.set("access_token", "eyJhbGciOiJIUzI1...");
pm.environment.set("refresh_token", "eyJhbGciOiJIUzI1...");

// After "Create Polygon Wallet" (Wallet Service):
pm.environment.set("polygon_wallet_id", "uuid-here");
pm.environment.set("polygon_wallet_address", "0x742d35...");

// After "Create Tron Wallet" (Wallet Service):
pm.environment.set("tron_wallet_id", "uuid-here");
```

These are then used in subsequent requests automatically!

---

**For more details, see:** `/postman/README.md`

# Shield Auth Service - Postman Collection

This collection contains comprehensive tests for the Auth Service API.

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
   - Select: `Shield Auth Service.postman_collection.json`

3. **Select the environment**:
   - In Postman, click the environment dropdown (top-right)
   - Select: **"Shield Platform - All Services"**

4. **Run the collection**:
   - All tests will use `{{auth_service_url}}` (http://localhost:3001)
   - Tokens are automatically saved to `{{access_token}}` and `{{refresh_token}}`
   - **These tokens work across ALL services** (auth, wallet, transaction, etc.)

## 🔗 Token Sharing

After running **Login** or **Register** in this collection:
- `{{access_token}}` is saved to the environment
- `{{refresh_token}}` is saved to the environment
- **You can immediately use Wallet Service collection** without re-authenticating
- **All services share the same tokens** ✅

## 📋 Test Coverage

This collection includes tests for:

### Service Info & Health
- ✅ Get Service Info
- ✅ Health Check

### User Registration
- ✅ Register User - Success (saves tokens)
- ✅ Register User - Invalid Email
- ✅ Register User - Weak Password
- ✅ Register User - Duplicate Email

### User Login
- ✅ Login - Success (saves tokens)
- ✅ Login - Invalid Credentials
- ✅ Login - User Not Found

### Token Management
- ✅ Refresh Token - Success (updates tokens)
- ✅ Refresh Token - Invalid Token
- ✅ Refresh Token - Expired Token (rotation test)

### Logout
- ✅ Logout - Success (clears tokens)
- ✅ Logout - Invalid Token

## 🚀 Quick Start

```bash
# 1. Start the auth service
cd services/auth-service
npm run dev

# 2. In Postman:
#    - Import unified environment: /postman/Shield Platform.postman_environment.json
#    - Import this collection: services/auth-service/postman/Shield Auth Service.postman_collection.json
#    - Select environment: "Shield Platform - All Services"
#    - Run "Login - Success"
#    - Now you can test ANY service (wallet, transaction, etc.) with the saved tokens!
```

## 🔄 Typical Workflow

```
Auth Service:
1. Run "Login - Success" → Saves access_token ✅

Wallet Service:
2. Run "Create Polygon Wallet" → Uses the same access_token ✅
3. Run "Get User Wallets" → Uses the same access_token ✅

Transaction Service:
4. Run "Create Transaction" → Uses the same access_token ✅

No environment switching needed! 🎉
```

## 📝 Notes

- **Single environment for all services**: No need to switch between environments
- **Automatic token management**: Login once, use everywhere
- **NASA-level testing**: Each test has multiple assertions
- **Error coverage**: Tests for validation, authentication, conflicts, etc.

---

**For more details, see:** `/postman/README.md`

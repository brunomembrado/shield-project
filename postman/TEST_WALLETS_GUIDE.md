# 🧪 Test Wallets Reference Guide

This guide provides **real-world wallet addresses** for testing the Shield Blockchain Service API endpoints.

---

## 📋 **Table of Contents**

1. [Polygon (MATIC) Test Wallets](#polygon-matic-test-wallets)
2. [Tron Test Wallets](#tron-test-wallets)
3. [Testing Scenarios](#testing-scenarios)
4. [How to Verify Balances](#how-to-verify-balances)
5. [Creating Your Own Test Wallets](#creating-your-own-test-wallets)

---

## 🟣 **Polygon (MATIC) Test Wallets**

### ✅ **Wallets WITH Real USDT Balance**

| Variable | Address | Description |
|----------|---------|-------------|
| `polygon_wallet_with_balance` | `0xBF61Eb7d514d0f40297B1cca91673A79472d5663` | **VERIFIED** Real wallet with USDT balance > 0 |
| `polygon_usdt_contract` | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | Official USDT contract on Polygon |

**Use for testing:**
- ✅ Balance queries (should return > 0 USDT)
- ✅ Wallet verification (should return `exists: true`)
- ✅ Transaction history queries
- ✅ Token balance metadata

**Verify on blockchain:**
- PolygonScan: `https://polygonscan.com/address/{address}`
- USDT Contract: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`

---

### ❌ **Wallets WITHOUT USDT Balance**

| Variable | Address | Description |
|----------|---------|-------------|
| `polygon_wallet_zero_balance` | `0x0000000000000000000000000000000000000001` | Valid address with 0 USDT |
| `polygon_wallet_invalid` | `0x0000000000000000000000000000000000000000` | Zero address (special case) |

**Use for testing:**
- ✅ Zero balance scenarios
- ✅ Error handling for invalid addresses
- ✅ Edge case validation

---

## 🔶 **Tron Test Wallets**

### ✅ **Wallets WITH Real USDT Balance**

| Variable | Address | Description |
|----------|---------|-------------|
| `tron_wallet_with_balance` | `TATkSfANP1BShrGm5aYFLV4g1BAwkRkRvY` | **VERIFIED** Real wallet with USDT balance > 0 |
| `tron_usdt_contract` | `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` | Official USDT contract on Tron |

**Use for testing:**
- ✅ Balance queries (should return > 0 USDT)
- ✅ Wallet verification (should return `exists: true`)
- ✅ Transaction monitoring
- ✅ Energy/Bandwidth estimation

**Verify on blockchain:**
- TronScan: `https://tronscan.org/#/address/{address}`
- USDT Contract: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`

---

### ❌ **Wallets WITHOUT USDT Balance**

| Variable | Address | Description |
|----------|---------|-------------|
| `tron_wallet_zero_balance` | `TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS` | Random address with likely 0 USDT |
| `tron_wallet_invalid` | `T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb` | Test address for validation |

**Use for testing:**
- ✅ Zero balance scenarios
- ✅ Non-existent wallet handling
- ✅ Error response validation

---

## 🧪 **Testing Scenarios**

### **1. Successful Balance Query**
```http
GET /blockchain/POLYGON/balance/{{polygon_wallet_with_balance}}
Authorization: Bearer {{access_token}}

Expected Response:
{
  "success": true,
  "data": {
    "balance": "123456.789", // Real USDT balance (actual amount will vary)
    "chain": "POLYGON",
    "address": "0xBF61Eb7d514d0f40297B1cca91673A79472d5663"
  }
}
```

---

### **2. Zero Balance Wallet**
```http
GET /blockchain/POLYGON/balance/{{polygon_wallet_zero_balance}}
Authorization: Bearer {{access_token}}

Expected Response:
{
  "success": true,
  "data": {
    "balance": "0",
    "chain": "POLYGON",
    "address": "0x0000000000000000000000000000000000000001"
  }
}
```

---

### **3. Wallet Verification (Existing)**
```http
GET /blockchain/POLYGON/verify/{{polygon_wallet_with_balance}}
Authorization: Bearer {{access_token}}

Expected Response:
{
  "success": true,
  "data": {
    "exists": true,
    "hasActivity": true,
    "transactionCount": 1000+ // Will vary
  }
}
```

---

### **4. Token Balance with Metadata**
```http
GET /blockchain/POLYGON/token-balance/{{polygon_wallet_with_balance}}?tokenAddress=0xc2132D05D31c914a87C6611C10748AEb04B58e8F
Authorization: Bearer {{access_token}}

Expected Response:
{
  "success": true,
  "data": {
    "balance": "123456789000",
    "formatted": "123456.789",
    "symbol": "USDT",
    "decimals": 6
  }
}
```

---

### **5. Gas Estimation**
```http
GET /blockchain/POLYGON/gas-estimate?transactionType=transfer_token
Authorization: Bearer {{access_token}}

Expected Response:
{
  "success": true,
  "data": {
    "gasLimit": "65000",
    "gasPrice": "50000000000",
    "totalCost": "0.00325",
    "totalCostUSD": null
  }
}
```

---

### **6. Network Status**
```http
GET /blockchain/POLYGON/status
Authorization: Bearer {{access_token}}

Expected Response:
{
  "success": true,
  "data": {
    "chainId": 137,
    "latestBlock": "50000000+",
    "currentGasPrice": "50000000000",
    "isHealthy": true
  }
}
```

---

## 🔍 **How to Verify Balances**

### **Polygon (USDT)**

1. **Via PolygonScan:**
   ```
   https://polygonscan.com/token/0xc2132D05D31c914a87C6611C10748AEb04B58e8F?a={wallet_address}
   ```

2. **Via API (our service):**
   ```bash
   curl -X GET "http://localhost:3003/blockchain/POLYGON/balance/{{wallet_address}}" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

### **Tron (USDT)**

1. **Via TronScan:**
   ```
   https://tronscan.org/#/address/{wallet_address}
   ```
   Look for "TRC20" tab → Find USDT (TR7NHq...)

2. **Via API (our service):**
   ```bash
   curl -X GET "http://localhost:3003/blockchain/TRON/balance/{{wallet_address}}" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 🛠️ **Creating Your Own Test Wallets**

### **For Personal Testing (Recommended)**

1. **Create a wallet:**
   - Use MetaMask (Polygon) or TronLink (Tron)
   - Save the address in Postman environment as `user_test_wallet_polygon` or `user_test_wallet_tron`

2. **Add small amount of USDT:**
   - Transfer $1-10 USDT from exchange
   - This allows you to test your own wallet scenarios

3. **Import into Shield:**
   ```http
   POST /wallets/create
   {
     "chain": "POLYGON",
     "address": "YOUR_WALLET_ADDRESS"
   }
   ```

4. **Test balance queries:**
   ```http
   GET /blockchain/POLYGON/balance/YOUR_WALLET_ADDRESS
   ```

---

### **Using Testnets (Alternative)**

For development without spending real funds:

#### **Polygon Mumbai Testnet**
- Faucet: https://faucet.polygon.technology/
- USDT Testnet Contract: (varies)
- Update RPC URL to Mumbai: `https://rpc-mumbai.maticvigil.com`

#### **Tron Nile Testnet**
- Faucet: https://nileex.io/join/getJoinPage
- USDT Testnet: Available on Nile
- Update RPC URL: `https://nile.trongrid.io`

**⚠️ Note:** You'll need to update the service configuration to use testnet RPCs and contract addresses.

---

## 📊 **Test Coverage Matrix**

| Scenario | Polygon Wallet | Tron Wallet | Expected Result |
|----------|----------------|-------------|-----------------|
| ✅ With Balance | `0xBF61Eb...5663` | `TATkSfA...kRvY` | Returns actual USDT amount > 0 ✅ |
| ⚠️ Zero Balance | `0x00000...0001` | `TYASr5U...xHLS` | Returns "0" |
| ❌ Invalid Address | `0x00000...0000` | `T9yD14N...uWwb` | Error handling |
| 📝 Contract | `0xc2132D...8e8F` | `TR7NHqj...jLj6t` | USDT token contract |

---

## 🔐 **Security Notes**

1. **Read-Only Operations:**
   - All wallets in this guide are used for **read-only** operations
   - No private keys required
   - Safe to use public/well-known addresses

2. **Never Share Private Keys:**
   - If you create test wallets, **NEVER** commit private keys to git
   - Use `.env` files (already in `.gitignore`)

3. **For Write Operations:**
   - When implementing transaction signing, use wallets YOU control
   - Keep separate test wallets with minimal funds

---

## 🚀 **Quick Start Testing**

1. **Start the service:**
   ```bash
   cd services/blockchain-service
   npm run dev
   ```

2. **Import Postman collection:**
   - Collection: `services/blockchain-service/postman/Shield Blockchain Service.postman_collection.json`
   - Environment: `postman/Shield Platform.postman_environment.json`

3. **Run authentication:**
   - Execute "Login" request from Auth Service
   - Token auto-saves to `{{access_token}}`

4. **Test with real balances:**
   - Try "Get USDT Balance - Polygon (With Balance)"
   - Should return actual USDT amount > 0

5. **Test edge cases:**
   - Try "Get USDT Balance - Zero Balance"
   - Should return "0"

---

## 📚 **Additional Resources**

- **Polygon Explorer:** https://polygonscan.com
- **Tron Explorer:** https://tronscan.org
- **USDT on Polygon:** https://polygonscan.com/token/0xc2132d05d31c914a87c6611c10748aeb04b58e8f
- **USDT on Tron:** https://tronscan.org/#/token20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t

---

## ❓ **FAQ**

**Q: Can I use these wallets for transactions?**  
A: No, these are read-only addresses. You don't have the private keys to sign transactions.

**Q: Will the balances change?**  
A: Yes, these are real wallets on mainnet. Balances will fluctuate as they're actively used.

**Q: What if a wallet runs out of USDT?**  
A: The whale wallets (`polygon_whale_wallet`, `tron_whale_wallet`) are major exchange wallets and unlikely to be empty. If needed, find other major exchange addresses.

**Q: How do I test with my own USDT?**  
A: Create a wallet, add small USDT amount, and save the address in `user_test_wallet_polygon` or `user_test_wallet_tron`.

**Q: Are these addresses safe to use?**  
A: Yes, they're public addresses used only for read operations. No private keys are involved.

---

**Happy Testing! 🎉**


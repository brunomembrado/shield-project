# Wallet Ownership & Operations Guide

## 🔑 Overview

Shield Platform supports two types of wallets with different capabilities:

1. **Generated Wallets** - Created by our system (we store encrypted private key)
2. **Imported Wallets** - Imported by user (we only store address)

## 📊 Wallet Types Comparison

| Feature | Generated Wallet | Imported Wallet |
|---------|-----------------|-----------------|
| **Created By** | Shield Platform | User (external) |
| **Private Key Storage** | ✅ Encrypted in database | ❌ Not stored |
| **Read Operations** | ✅ All supported | ✅ All supported |
| **Write Operations** | ✅ Can sign transactions | ❌ Cannot sign transactions |
| **Database Field** | `createdBySystem = true` | `createdBySystem = false` |
| **Use Case** | Full platform control | Watch-only wallet |

## 🔐 Generated Wallets (Full Control)

### Creation Flow

```typescript
// User generates a new wallet
POST /wallets/generate
{
  "chain": "POLYGON",
  "password": "user_password",  // For encrypting private key
  "tag": "My Main Wallet"
}
```

### What Gets Stored

```sql
-- In wallet-service database
INSERT INTO wallets (
  id,
  user_id,
  chain,
  address,
  private_key_encrypted,  -- ✅ AES-256-GCM encrypted private key
  encryption_iv,          -- ✅ Initialization vector
  encryption_salt,        -- ✅ PBKDF2 salt
  created_by_system,      -- ✅ true
  is_active,
  created_at
) VALUES (
  'uuid-v4',
  'user-id',
  'POLYGON',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  'encrypted_data...',    -- Private key encrypted with user password
  'iv_hex...',
  'salt_hex...',
  true,                   -- Created by system
  true,
  NOW()
);
```

### Security Features

1. **Password-Based Encryption**
   - User password → PBKDF2 (100,000 iterations) → Encryption key
   - Private key encrypted with AES-256-GCM
   - Unique IV and salt per wallet

2. **Memory Wiping**
   - Private key wiped from memory immediately after encryption
   - Never stored in plaintext
   - Never logged or transmitted

3. **Decryption Requirements**
   - User must provide password to decrypt
   - Password never stored or logged
   - Decryption only when needed for signing

### Supported Operations

✅ **Read Operations** (No private key needed):
- Get balance
- Verify wallet existence
- Get transaction history
- Monitor transfers
- Estimate gas costs

✅ **Write Operations** (Requires private key):
- Send USDT transfers
- Token approvals
- Token swaps
- Smart contract interactions
- NFT transfers

### Example: Revealing Private Key

```typescript
// User wants to export private key (requires password)
POST /wallets/{walletId}/reveal-key
{
  "password": "user_password"  // Same password used during generation
}

// Response (only if password correct)
{
  "privateKey": "0x1234...",  // Decrypted private key
  "address": "0x742d35...",
  "warning": "Keep this key safe. Anyone with access can control your wallet."
}
```

## 👁️ Imported Wallets (Read-Only)

### Import Flow

```typescript
// User imports existing wallet (from MetaMask, hardware wallet, etc.)
POST /wallets
{
  "chain": "POLYGON",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "tag": "My MetaMask Wallet"
}
```

### Blockchain Verification

Before accepting import, wallet-service verifies wallet exists on blockchain:

```typescript
// Call to blockchain-service
GET /blockchain/POLYGON/verify/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1

// Response
{
  "success": true,
  "data": {
    "exists": true,           // ✅ Wallet exists on blockchain
    "hasActivity": true,      // Has transactions
    "transactionCount": 42,   // Number of transactions
    "chain": "POLYGON",
    "address": "0x742d35..."
  }
}
```

### What Gets Stored

```sql
-- In wallet-service database
INSERT INTO wallets (
  id,
  user_id,
  chain,
  address,
  private_key_encrypted,  -- ❌ NULL (not stored)
  encryption_iv,          -- ❌ NULL
  encryption_salt,        -- ❌ NULL
  created_by_system,      -- ❌ false
  is_active,
  created_at
) VALUES (
  'uuid-v4',
  'user-id',
  'POLYGON',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  NULL,                   -- No private key
  NULL,                   -- No IV
  NULL,                   -- No salt
  false,                  -- NOT created by system
  true,
  NOW()
);
```

### Supported Operations

✅ **Read Operations** (No private key needed):
- Get balance
- Verify wallet existence  
- Get transaction history
- Monitor transfers
- Estimate gas costs

❌ **Write Operations** (Requires private key):
- ❌ Cannot send transactions (no private key)
- ❌ Cannot sign messages
- ❌ Cannot approve tokens
- ❌ Cannot interact with contracts

### Use Cases

Perfect for:
- 👀 **Watch-only wallets** - Monitor balances and transactions
- 🔍 **Transparency** - Track company wallets
- 📊 **Accounting** - Monitor incoming payments
- 🎯 **Deposit addresses** - Receive USDT payments

Example: User wants to receive USDT:
1. Import wallet address (from their MetaMask)
2. Shield platform monitors for incoming transfers
3. When USDT received → trigger wire transfer
4. User keeps control of private key in MetaMask

## 🔄 Operation Matrix

| Operation | Generated Wallet | Imported Wallet | Blockchain Service |
|-----------|-----------------|-----------------|-------------------|
| **Get Balance** | ✅ wallet-service | ✅ wallet-service | ✅ Direct RPC |
| **Verify Wallet** | ✅ blockchain-service | ✅ blockchain-service | ✅ Direct RPC |
| **Get TX Details** | ✅ blockchain-service | ✅ blockchain-service | ✅ Direct RPC |
| **Monitor Transfers** | ✅ blockchain-service | ✅ blockchain-service | ✅ Direct RPC |
| **Estimate Gas** | ✅ blockchain-service | ✅ blockchain-service | ✅ Direct RPC |
| **Send USDT** | ✅ Requires password | ❌ Not possible | N/A |
| **Approve Token** | ✅ Requires password | ❌ Not possible | N/A |
| **Swap Tokens** | ✅ Requires password | ❌ Not possible | N/A |
| **Reveal Key** | ✅ Requires password | ❌ Not stored | N/A |

## 🎯 API Response: Client Detection

The API response includes `createdBySystem` flag so clients know wallet capabilities:

```typescript
// GET /wallets/{walletId}
{
  "id": "uuid-v4",
  "userId": "user-id",
  "chain": "POLYGON",
  "address": "0x742d35...",
  "tag": "My Wallet",
  "isActive": true,
  "createdBySystem": true,  // ✅ true = can sign transactions
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
  // Note: privateKeyEncrypted is NEVER returned for security
}
```

Frontend can use this to:
- Show "Export Private Key" button (only for `createdBySystem = true`)
- Show "Send" button (only for `createdBySystem = true`)
- Show "Watch-only" badge (for `createdBySystem = false`)
- Disable transaction features (for imported wallets)

## 🔒 Security Best Practices

### For Generated Wallets

1. **Password Strength**
   ```typescript
   // Enforce strong passwords
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Not in common password lists
   ```

2. **Password Storage**
   ```typescript
   ❌ NEVER store user's wallet password in database
   ❌ NEVER log wallet passwords
   ❌ NEVER transmit passwords without TLS
   ✅ User must provide password for each signing operation
   ```

3. **Private Key Handling**
   ```typescript
   ❌ NEVER log private keys
   ❌ NEVER transmit unencrypted private keys
   ❌ NEVER store private keys in plaintext
   ✅ Wipe from memory immediately after use
   ✅ Only decrypt when absolutely necessary
   ✅ Use secure memory handling
   ```

### For Imported Wallets

1. **Verification**
   ```typescript
   ✅ Always verify wallet exists on blockchain before import
   ✅ Prevent importing invalid/non-existent addresses
   ✅ Check wallet has activity (optional)
   ```

2. **User Expectations**
   ```typescript
   ✅ Clearly indicate wallet is "watch-only"
   ✅ Explain user retains control of private key
   ✅ Show which operations are not available
   ```

## 🚨 Common Mistakes to Avoid

### ❌ Attempting to Sign with Imported Wallet

```typescript
// WRONG: This will fail
const importedWallet = await walletRepository.findById(importedWalletId);
const signature = await signTransaction(importedWallet, transaction);
// Error: No private key available!
```

```typescript
// CORRECT: Check before attempting operation
const wallet = await walletRepository.findById(walletId);
if (!wallet.createdBySystem) {
  throw new Error('Cannot sign transactions with imported wallet');
}
const signature = await signTransaction(wallet, transaction);
```

### ❌ Storing User Password

```typescript
// WRONG: Never store wallet passwords
await database.save({
  walletId: wallet.id,
  password: userPassword  // 🚨 SECURITY RISK!
});
```

```typescript
// CORRECT: Only use password for immediate decryption
const privateKey = await decryptPrivateKey(
  wallet.privateKeyEncrypted,
  userPassword,  // Used immediately, then discarded
  wallet.encryptionIv,
  wallet.encryptionSalt
);
// Password never stored or logged
```

### ❌ Returning Private Key in API Response

```typescript
// WRONG: Never include private key in responses
return {
  id: wallet.id,
  address: wallet.address,
  privateKey: wallet.privateKeyDecrypted  // 🚨 SECURITY RISK!
};
```

```typescript
// CORRECT: Never include encryption data in responses
return {
  id: wallet.id,
  address: wallet.address,
  createdBySystem: wallet.createdBySystem,
  // privateKeyEncrypted, encryptionIv, encryptionSalt NEVER included
};
```

## 📖 Implementation References

### Wallet Generation
- File: `services/wallet-service/src/domain/useCases/GenerateWalletUseCase.ts`
- Creates wallet with encrypted private key storage

### Wallet Import
- File: `services/wallet-service/src/domain/useCases/CreateWalletUseCase.ts`
- Verifies wallet exists on blockchain
- Stores address only (no private key)

### Wallet Verification
- File: `services/blockchain-service/src/domain/useCases/VerifyWalletUseCase.ts`
- Checks wallet existence via blockchain RPC
- Returns transaction count and activity status

### Private Key Encryption
- File: `services/wallet-service/src/utils/cryptoUtils.ts`
- AES-256-GCM encryption
- PBKDF2 key derivation
- Secure memory wiping

### Wallet Generator
- File: `services/wallet-service/src/utils/walletGenerator.ts`
- Generates new Polygon/Tron wallets
- Uses cryptographically secure random generation

## 🎓 Summary

| Aspect | Generated Wallet | Imported Wallet |
|--------|-----------------|-----------------|
| **Purpose** | Full control by platform | Watch-only monitoring |
| **Private Key** | Encrypted & stored | Not stored |
| **Write Ops** | ✅ Supported | ❌ Not supported |
| **Read Ops** | ✅ Supported | ✅ Supported |
| **Use Case** | Platform-managed wallets | User-controlled wallets |
| **Security** | Password-protected | No credentials needed |

**Key Takeaway**: Only generated wallets (`createdBySystem = true`) can perform write operations like sending transactions. Imported wallets are read-only for monitoring purposes.

---

For questions or clarifications, see:
- `services/wallet-service/README.md`
- `services/blockchain-service/README.md`
- Prisma schemas in each service


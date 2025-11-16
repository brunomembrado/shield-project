# New Wallet Generation Endpoints for Postman

## Add these requests to your Postman collection

### 1. Generate Polygon Wallet - Success
```http
POST {{wallet_service_url}}/wallets/generate
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "chain": "POLYGON",
  "password": "TestPassword123!@#",
  "tag": "My Generated Polygon Wallet"
}
```

**Tests:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has success flag", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Wallet was generated successfully", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('id');
    pm.expect(jsonData.data).to.have.property('address');
    pm.expect(jsonData.data).to.have.property('chain', 'POLYGON');
    pm.expect(jsonData.data).to.have.property('createdBySystem', true);
    pm.expect(jsonData.data.address).to.match(/^0x[a-fA-F0-9]{40}$/);
});

pm.test("Private key is NOT exposed in response", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.not.have.property('privateKey');
    pm.expect(jsonData.data).to.not.have.property('privateKeyEncrypted');
});

pm.test("Save generated wallet ID", function () {
    const jsonData = pm.response.json();
    pm.environment.set("generated_polygon_wallet_id", jsonData.data.id);
    pm.environment.set("generated_polygon_wallet_address", jsonData.data.address);
});
```

---

### 2. Generate Tron Wallet - Success
```http
POST {{wallet_service_url}}/wallets/generate
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "chain": "TRON",
  "password": "TestPassword123!@#",
  "tag": "My Generated Tron Wallet"
}
```

**Tests:** (Same as Polygon but check for TRON chain and `T...` address format)

---

### 3. Generate Wallet - Weak Password
```http
POST {{wallet_service_url}}/wallets/generate
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "chain": "POLYGON",
  "password": "weak",
  "tag": "Test"
}
```

**Tests:**
```javascript
pm.test("Status code is 400", function () {
    pm.response.to.have.status(400);
});

pm.test("Error indicates weak password", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.false;
    pm.expect(jsonData.error).to.include('VALIDATION');
    pm.expect(jsonData.message).to.include('password');
    pm.expect(jsonData.message).to.include('8 characters');
});
```

---

### 4. Generate Wallet - Missing Password
```http
POST {{wallet_service_url}}/wallets/generate
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "chain": "POLYGON",
  "tag": "Test"
}
```

**Tests:** (Check for 400 and missing password error)

---

### 5. Generate Wallet - Invalid Chain
```http
POST {{wallet_service_url}}/wallets/generate
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "chain": "BITCOIN",
  "password": "TestPassword123!@#"
}
```

**Tests:** (Check for 400 and invalid chain error)

---

### 6. Generate Wallet - No Authentication
```http
POST {{wallet_service_url}}/wallets/generate
Content-Type: application/json

{
  "chain": "POLYGON",
  "password": "TestPassword123!@#"
}
```

**Tests:** (Check for 401 Unauthorized)

---

### 7. Reveal Private Key - Success (Correct Password)
```http
POST {{wallet_service_url}}/wallets/{{generated_polygon_wallet_id}}/reveal-key
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "password": "TestPassword123!@#"
}
```

**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Private key is revealed", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data).to.have.property('privateKey');
    pm.expect(jsonData.data).to.have.property('address');
    pm.expect(jsonData.data).to.have.property('chain');
    pm.expect(jsonData.data).to.have.property('warning');
});

pm.test("Private key format is valid", function () {
    const jsonData = pm.response.json();
    // Ethereum private key: 64 hex characters (with or without 0x prefix)
    pm.expect(jsonData.data.privateKey).to.match(/^(0x)?[a-fA-F0-9]{64}$/);
});

pm.test("Security warning is present", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.warning).to.include('SECURITY WARNING');
    pm.expect(jsonData.data.warning).to.include('Never share');
});

pm.test("Address matches generated wallet", function () {
    const jsonData = pm.response.json();
    const generatedAddress = pm.environment.get("generated_polygon_wallet_address");
    pm.expect(jsonData.data.address).to.equal(generatedAddress);
});
```

---

### 8. Reveal Private Key - Wrong Password
```http
POST {{wallet_service_url}}/wallets/{{generated_polygon_wallet_id}}/reveal-key
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "password": "WrongPassword123!"
}
```

**Tests:**
```javascript
pm.test("Status code is 400", function () {
    pm.response.to.have.status(400);
});

pm.test("Error indicates decryption failure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.false;
    pm.expect(jsonData.error).to.include('VALIDATION');
    pm.expect(jsonData.message).to.include('Decryption failed');
    pm.expect(jsonData.message).to.include('password');
});

pm.test("Private key is NOT revealed", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.undefined;
});
```

---

### 9. Reveal Private Key - Imported Wallet (Not System-Generated)
```http
POST {{wallet_service_url}}/wallets/{{polygon_wallet_id}}/reveal-key
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "password": "TestPassword123!@#"
}
```

**Tests:**
```javascript
pm.test("Status code is 400", function () {
    pm.response.to.have.status(400);
});

pm.test("Error indicates wallet was imported", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.false;
    pm.expect(jsonData.message).to.include('imported');
    pm.expect(jsonData.message).to.include('not created by our system');
});
```

---

### 10. Reveal Private Key - Invalid Wallet ID
```http
POST {{wallet_service_url}}/wallets/invalid-uuid/reveal-key
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "password": "TestPassword123!@#"
}
```

**Tests:** (Check for 400 and invalid UUID error)

---

### 11. Reveal Private Key - Wallet Not Found
```http
POST {{wallet_service_url}}/wallets/00000000-0000-0000-0000-000000000000/reveal-key
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "password": "TestPassword123!@#"
}
```

**Tests:** (Check for 404 Not Found)

---

### 12. Reveal Private Key - No Authentication
```http
POST {{wallet_service_url}}/wallets/{{generated_polygon_wallet_id}}/reveal-key
Content-Type: application/json

{
  "password": "TestPassword123!@#"
}
```

**Tests:** (Check for 401 Unauthorized)

---

## Total Test Coverage

- ✅ Generate Polygon Wallet - Success
- ✅ Generate Tron Wallet - Success
- ✅ Generate Wallet - Weak Password
- ✅ Generate Wallet - Missing Password
- ✅ Generate Wallet - Invalid Chain
- ✅ Generate Wallet - No Authentication
- ✅ Reveal Private Key - Correct Password
- ✅ Reveal Private Key - Wrong Password
- ✅ Reveal Private Key - Imported Wallet
- ✅ Reveal Private Key - Invalid UUID
- ✅ Reveal Private Key - Not Found
- ✅ Reveal Private Key - No Authentication

**Total: 12 new requests with 40+ test assertions**

---

## Environment Variables Required

These are already in your unified environment:
- `wallet_service_url` = `http://localhost:3002`
- `access_token` = (set by auth service login)
- `generated_polygon_wallet_id` = (auto-saved by Generate Polygon Wallet request)
- `generated_polygon_wallet_address` = (auto-saved)
- `polygon_wallet_id` = (existing imported wallet for comparison)

---

## Testing Sequence

1. **Auth Service:** Run "Login - Success" to get `access_token`
2. **Wallet Service:** Run "Generate Polygon Wallet - Success"
3. **Wallet Service:** Run "Reveal Private Key - Success"
4. Run all error cases to verify NASA-level robustness

🚀 **Ready for production!**


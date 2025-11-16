# Shield Auth Service - Postman Collection

This folder contains Postman collections and environments for testing the Shield Auth Service API.

## Files

- **Shield Auth Service.postman_collection.json** - Complete API collection with all endpoints and test cases
- **Shield Auth Service.postman_environment.json** - Environment variables for local development

## Quick Start

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Select both files:
   - `Shield Auth Service.postman_collection.json`
   - `Shield Auth Service.postman_environment.json`
4. Select the environment **"Shield Auth Service - Local"** from the dropdown

### 2. Configure Environment Variables

The environment file includes these variables:

- `base_url` - API base URL (default: `http://localhost:3001`)
- `test_email` - Auto-generated test email (set automatically)
- `test_password` - Test password (default: `SecureP@ss123!`)
- `access_token` - JWT access token (auto-saved from responses)
- `refresh_token` - JWT refresh token (auto-saved from responses)
- `user_id` - User ID (auto-saved from responses)

### 3. Run Tests

The collection is organized into folders:

#### Health & Info
- **Get Service Info** - Get service information
- **Health Check** - Check service health status

#### Authentication
- **Register User - Success** - Register a new user (auto-generates unique email)
- **Register User - Invalid Email** - Test validation with invalid email
- **Register User - Weak Password** - Test password validation
- **Register User - Duplicate Email** - Test duplicate email handling
- **Login - Success** - Login with valid credentials
- **Login - Invalid Credentials** - Test invalid password
- **Login - User Not Found** - Test non-existent user
- **Refresh Token - Success** - Refresh access token
- **Refresh Token - Invalid Token** - Test invalid refresh token
- **Refresh Token - Expired Token** - Test expired token handling
- **Logout - Success** - Logout user
- **Logout - Invalid Token** - Test logout with invalid token

## Features

### Automatic Token Management
- Tokens are automatically saved to environment variables after successful login/register
- New tokens are saved after refresh
- Tokens are cleared after logout

### Test Cases
Each request includes automated tests that verify:
- HTTP status codes
- Response structure
- Success/error flags
- Token presence and validity

### Pre-request Scripts
- **Register User - Success** automatically generates a unique email using timestamp

## Password Requirements

For registration, passwords must meet these requirements:
- Minimum 12 characters
- Maximum 128 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&#)

## API Endpoints

### Base URL
```
http://localhost:3001
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get service information |
| GET | `/health` | Health check |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout user |

## Running the Collection

### Option 1: Run Individual Requests
1. Select a request from the collection
2. Click **Send**
3. View response and test results

### Option 2: Run Collection Runner
1. Click on the collection name
2. Click **Run** button
3. Select requests to run
4. Click **Run Shield Auth Service**
5. View test results summary

### Option 3: Run with Newman (CLI)
```bash
# Install Newman globally
npm install -g newman

# Run collection
newman run "Shield Auth Service.postman_collection.json" \
  -e "Shield Auth Service.postman_environment.json" \
  --reporters cli,json \
  --reporter-json-export results.json
```

## Test Flow

### Recommended Test Sequence

1. **Health Check** - Verify service is running
2. **Register User - Success** - Create a test user
3. **Login - Success** - Login with the created user
4. **Refresh Token - Success** - Refresh the access token
5. **Logout - Success** - Logout the user
6. **Refresh Token - Expired Token** - Verify old token is invalid

### Error Scenarios

Test error handling with:
- Invalid email format
- Weak passwords
- Duplicate email registration
- Invalid credentials
- Invalid/expired tokens

## Environment Variables

### Local Development
```json
{
  "base_url": "http://localhost:3001"
}
```

### Production (Create separate environment)
```json
{
  "base_url": "https://api.shield.com"
}
```

## Troubleshooting

### Collection Not Importing
- Ensure both JSON files are valid
- Check Postman version (recommended: v10+)

### Tests Failing
- Verify service is running (`npm run dev`)
- Check `base_url` in environment matches your service URL
- Ensure database is connected and migrations are run

### Tokens Not Saving
- Check that test scripts are enabled
- Verify environment is selected
- Check Postman console for errors

## Notes

- The collection uses environment variables for easy configuration
- Tokens are automatically managed between requests
- Test email is auto-generated to avoid conflicts
- All requests include validation and error handling tests


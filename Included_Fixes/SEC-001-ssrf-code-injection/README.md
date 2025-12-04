# SEC-001: Server-Side Request Forgery (SSRF) & Code Injection Fixes

## 📌 Overview

**Type**: Security Fix  
**Status**: ✅ Applied  
**Integration Date**: 2025-12-03  
**Upstream Status**: ⏳ Not yet submitted

## 🐛 Problems

### 1. Server-Side Request Forgery (SSRF)

Multiple services were vulnerable to SSRF attacks where user-controlled or API-provided URLs could be used to make requests to internal services or cloud metadata endpoints.

**Affected Files:**
- `services/setupService.js` - User-provided URLs for Paperless, Ollama, Custom AI, and Azure endpoints
- `services/externalApiService.js` - External API URLs from configuration
- `services/paperlessService.js` - Pagination URLs from API responses

**Potential Impact:**
- Access to internal services (localhost, private IPs)
- Access to cloud metadata endpoints (AWS, GCP, Azure)
- Information disclosure
- Network scanning

### 2. Code Injection via Function Constructor

The external API service used `new Function()` to create transform functions from user-provided strings, allowing arbitrary code execution.

**Affected File:**
- `services/externalApiService.js` (line 79)

**Vulnerable Code:**
```javascript
const transformFn = new Function('data', transform);
data = transformFn(data);
```

**Potential Impact:**
- Remote code execution
- Server compromise
- Data theft

## ✅ Solutions

### 1. URL Validation Utility

Added comprehensive URL validation functions to `services/serviceUtils.js`:

```javascript
/**
 * validateUrl(urlString, options)
 * - Validates URL format
 * - Blocks dangerous protocols (file:, data:, etc.)
 * - Blocks private IPs (10.x.x.x, 192.168.x.x, etc.) unless explicitly allowed
 * - Blocks localhost and loopback addresses
 * - Blocks cloud metadata endpoints (169.254.169.254, etc.)
 */

/**
 * validateApiUrl(urlString, options)
 * - Wrapper with API-appropriate defaults
 */

/**
 * validateUrlAgainstBase(urlToValidate, expectedBaseUrl)
 * - Validates pagination URLs match expected origin
 * - Extracts safe relative paths
 */
```

### 2. SSRF Mitigations Applied

**setupService.js:**
- Validates Paperless URLs before making requests (allows private IPs for internal deployment)
- Validates Ollama URLs before connecting (allows private IPs for local deployment)
- Validates Custom AI URLs before connecting (allows private IPs for internal services)
- Validates Azure endpoint URLs (blocks private IPs)

**externalApiService.js:**
- Validates external API URLs before making requests
- Respects `EXTERNAL_API_ALLOW_PRIVATE_IPS` environment variable for internal APIs

**paperlessService.js:**
- Added `_safeExtractRelativePath()` method to validate pagination URLs
- Ensures next page URLs match the expected origin
- Uses `validateUrlAgainstBase()` for secure path extraction

### 3. Code Injection Fix

Replaced unsafe `new Function()` with a safe JSONPath-like transformer:

**Before (vulnerable):**
```javascript
const transformFn = new Function('data', transform);
data = transformFn(data);
```

**After (safe):**
```javascript
function safeTransform(data, transform) {
  // Only allows safe property access patterns
  // e.g., "data.items", "response.results[0]"
  const safePattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*|\[\d+\])*$/;
  // ... safe navigation through object properties
}
```

## 📝 Changes

### New Functions (serviceUtils.js)
- `validateUrl()` - General URL validation
- `validateApiUrl()` - API URL validation wrapper
- `validateUrlAgainstBase()` - Origin validation for API responses

### Modified Files
- `services/setupService.js` - Added URL validation before requests
- `services/externalApiService.js` - Added URL validation and safe transform
- `services/paperlessService.js` - Added safe pagination URL extraction

### New Environment Variables
- `EXTERNAL_API_ALLOW_PRIVATE_IPS` - Set to 'yes' to allow private IP ranges for external API

## 🧪 Testing

### URL Validation Tests

Validated the following are blocked:
- ✅ `file:///etc/passwd` - Blocked (invalid protocol)
- ✅ `http://localhost/admin` - Blocked (localhost)
- ✅ `http://127.0.0.1/` - Blocked (loopback)
- ✅ `http://10.0.0.1/internal` - Blocked (private IP)
- ✅ `http://192.168.1.1/config` - Blocked (private IP)
- ✅ `http://169.254.169.254/metadata` - Blocked (cloud metadata)

Validated the following are allowed:
- ✅ `https://api.example.com/` - Allowed (public URL)
- ✅ `http://paperless.local/` - Allowed with allowPrivateIPs (internal service)

### Code Injection Tests

Verified safe transform:
- ✅ `data.items` - Works (simple path)
- ✅ `response.results[0]` - Works (array access)
- ✅ `return process.exit(1)` - Blocked (code execution attempt)
- ✅ `require('child_process')` - Blocked (module import attempt)

## 📊 Impact

**Security:**
- ❌ SSRF attacks → ✅ Blocked
- ❌ Code injection → ✅ Blocked
- ❌ Cloud metadata access → ✅ Blocked

**Functionality:**
- ✅ No breaking changes
- ✅ Internal services still work with proper configuration
- ✅ Pagination continues to work correctly

## 🔧 Configuration

For administrators who need to access internal APIs:

```env
# Allow external API to access private IP ranges (internal APIs)
EXTERNAL_API_ALLOW_PRIVATE_IPS=yes
```

Note: Paperless, Ollama, and Custom AI URLs allow private IPs by default since these services are typically deployed internally.

## 🔗 Related

- **CWE-918**: Server-Side Request Forgery (SSRF)
- **CWE-94**: Improper Control of Generation of Code ('Code Injection')
- **OWASP**: Server-Side Request Forgery Prevention

## 👥 Credits

- **Identified By**: Code scanning analysis
- **Fixed By**: Admonstrator with AI assistance
- **Rationale**: Prevent unauthorized access to internal resources and code execution

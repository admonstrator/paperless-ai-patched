# UI-001: Hide RAG Menu in Lite Image

## 📌 Overview

**Type**: UI Enhancement  
**Status**: ✅ Applied  
**Integration Date**: 2025-12-04  
**Upstream Status**: ⏳ Not submitted (fork-specific)

## 🐛 Problem

When using the **Lite image** (which has `RAG_SERVICE_ENABLED=false`), the "RAG Chat" menu item was still visible in the application's sidebar navigation. This created a poor user experience:

- **Confusing UI**: Menu item appears but doesn't work
- **404 errors**: Clicking the link when RAG is disabled
- **Inconsistent behavior**: Backend blocks the route but UI shows it
- **Poor UX**: Users see features they can't use

The RAG service was already conditionally disabled at the backend level:
```javascript
// server.js - Already implemented
if (process.env.RAG_SERVICE_ENABLED === 'true') {
  app.use('/api/rag', ragRoutes);
  app.get('/rag', async (req, res) => { ... });
}
```

However, the UI templates still rendered the menu item unconditionally.

## ✅ Solution

Conditionally hide the RAG menu item in all views based on the `RAG_SERVICE_ENABLED` environment variable. This ensures UI consistency with backend capabilities.

### Implementation Approach

1. **Pass `ragEnabled` variable** to all view renders in `routes/setup.js`
2. **Wrap RAG menu items** in conditional EJS blocks in all view templates
3. **Maintain clean UI** without broken/inaccessible menu items

## 📝 Changes

### Modified Files

#### `routes/setup.js`
Added `ragEnabled: process.env.RAG_SERVICE_ENABLED === 'true'` to all render calls:

- `/chat` route (line ~706)
- `/manual` route (line ~2380)
- `/playground` route (line ~553)
- `/history` route (line ~1041)
- `/dashboard` route (line ~2869)
- `/settings` route (line ~3001)

**Example**:
```javascript
// Before
res.render('chat', { documents, open, version });

// After
res.render('chat', { 
  documents, 
  open, 
  version, 
  ragEnabled: process.env.RAG_SERVICE_ENABLED === 'true' 
});
```

#### View Templates
Wrapped RAG menu items in conditional blocks in 6 view files:

- `views/chat.ejs`
- `views/manual.ejs`
- `views/playground.ejs`
- `views/history.ejs`
- `views/settings.ejs`
- `views/dashboard.ejs`

**Example** (from `chat.ejs`):
```html
<!-- Before -->
<li>
    <a href="/rag" class="sidebar-link">
        <i class="fa-solid fa-comment"></i>
        <span>RAG Chat</span>
    </a>
</li>

<!-- After -->
<% if (ragEnabled) { %>
<li>
    <a href="/rag" class="sidebar-link">
        <i class="fa-solid fa-comment"></i>
        <span>RAG Chat</span>
    </a>
</li>
<% } %>
```

## 🧪 Testing

### Test Scenarios

**Lite Image (RAG disabled)**:
```bash
# Docker environment
RAG_SERVICE_ENABLED=false
```
- ✅ RAG menu item is hidden in all pages
- ✅ No console errors
- ✅ All other menu items work correctly
- ✅ Clean, minimal UI

**Full Image (RAG enabled)**:
```bash
# Docker environment
RAG_SERVICE_ENABLED=true
```
- ✅ RAG menu item is visible in all pages
- ✅ RAG route is accessible
- ✅ All functionality works as expected

### Verification Commands

```bash
# Check environment variable in container
docker exec <container-id> env | grep RAG_SERVICE_ENABLED

# Test Lite image
docker run -e RAG_SERVICE_ENABLED=false -p 3000:3000 admonstrator/paperless-ai-patched:lite

# Test Full image
docker run -e RAG_SERVICE_ENABLED=true -p 3000:3000 admonstrator/paperless-ai-patched:full
```

## 📊 Impact

### User Experience

| Aspect | Before | After |
|--------|--------|-------|
| **Lite Image** | Shows broken RAG menu | Clean UI without RAG |
| **Full Image** | Shows working RAG menu | Shows working RAG menu |
| **Consistency** | UI/backend mismatch | UI matches backend |
| **Confusion** | Users see unavailable features | Only available features shown |

### Files Modified

- **1 route file**: `routes/setup.js` (6 render calls updated)
- **6 view files**: All main navigation templates
- **Total LOC**: ~18 lines added (conditional wrappers)

### Affected Pages

All pages with sidebar navigation:
1. Dashboard (`/dashboard`)
2. Manual (`/manual`)
3. Chat (`/chat`)
4. Playground (`/playground`)
5. History (`/history`)
6. Settings (`/settings`)

## 🎯 Technical Details

### Environment Variable Flow

```
Dockerfile.lite
  └─> ENV RAG_SERVICE_ENABLED=false
       └─> server.js reads variable
            └─> routes/setup.js passes to views
                 └─> EJS templates conditionally render
```

### Backend Integration

The fix leverages the existing `RAG_SERVICE_ENABLED` variable that already controls:
- RAG service initialization (`server.js`)
- RAG API routes mounting (`/api/rag`)
- RAG UI route (`/rag`)

This change extends that control to the **navigation UI**, completing the feature toggle.

### EJS Template Syntax

```ejs
<% if (ragEnabled) { %>
  <!-- Menu item only renders when true -->
<% } %>
```

- Server-side rendering
- No client-side JavaScript needed
- Clean HTML output
- Zero performance impact

## 🔗 Related

- **DOCKER-001**: Docker image optimization (introduced Lite variant)
- **Dockerfile.lite**: Sets `RAG_SERVICE_ENABLED=false`
- **server.js**: Backend RAG service toggle (lines 14, 458)
- **routes/rag.js**: RAG route handlers (conditionally mounted)

## 📈 Future Improvements

Potential enhancements:
- [ ] Add visual indicator when RAG service is starting up
- [ ] Create admin UI to toggle RAG service without restart
- [ ] Add feature flag system for other optional services
- [ ] Document all feature toggles in one place

## 👥 Credits

- **Implementation**: Admonstrator with GitHub Copilot
- **Rationale**: Improve UX consistency between Lite and Full images
- **Issue**: User confusion about non-functional menu items
- **Related Work**: DOCKER-001 (image variants)

## 📸 Screenshots

### Before (Lite Image)
- RAG Chat menu item visible
- Clicking leads to 404 error
- Confusing for users

### After (Lite Image)
- RAG Chat menu item hidden
- Clean navigation menu
- Only functional features shown

### Full Image (Unchanged)
- RAG Chat menu item visible
- Fully functional
- No impact on Full image users

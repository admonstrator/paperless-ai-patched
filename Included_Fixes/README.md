# Included Fixes & Patches

This directory documents all upstream pull requests, community fixes, and patches that have been integrated into this fork.

## 📋 Structure

Each subdirectory represents an integrated fix with:
- `README.md` - Description, rationale, and status
- `*.patch` - Git patch file (if applicable)
- Test files or related documentation

## 🔄 Integrated Fixes

### Upstream PRs

| PR | Title | Status | Integration Date |
|----|-------|--------|------------------|
| [#772](PR-772-infinite-retry-fix/) | Fix infinite retry loop | ✅ Merged | 2025-12-03 |
| [#747](PR-747-history-cleanup/) | History validation tool | ✅ Merged | 2025-12-03 |

### Performance Optimizations

| ID | Title | Status | Integration Date |
|----|-------|--------|------------------|
| [PERF-001](PERF-001-history-pagination/) | History table SQL pagination & caching | ✅ Applied | 2025-12-03 |

### Community Patches

| ID | Title | Status | Integration Date |
|----|-------|--------|------------------|
| [DEP-001](DEP-001-remove-sqlite3/) | Remove unused sqlite3 dependency | ✅ Applied | 2025-12-03 |
| [DOCKER-001](DOCKER-001-optimize-images/) | Docker image optimization | ✅ Applied | 2025-12-03 |
| [UI-001](UI-001-hide-rag-menu-lite/) | Hide RAG menu in Lite image | ✅ Applied | 2025-12-04 |

## 🚀 How to Use

Each fix directory contains:
1. **Background** - Why this fix was needed
2. **Changes** - What was modified
3. **Testing** - How to verify the fix
4. **Upstream Status** - Whether it's been merged upstream

## 📝 Adding New Fixes

When integrating a new fix:
1. Create a new directory: `PR-XXX-short-name/` or `PATCH-XXX-short-name/`
2. Add `README.md` with fix details
3. Optionally add `.patch` file: `git format-patch -1 <commit-hash>`
4. Update this table

## 🔗 Links

- **Upstream Repository**: [clusterzx/paperless-ai](https://github.com/clusterzx/paperless-ai)
- **Upstream PRs**: [Pull Requests](https://github.com/clusterzx/paperless-ai/pulls)
- **Our Issues**: [Fork Issues](https://github.com/Admonstrator/paperless-ai-patched/issues)

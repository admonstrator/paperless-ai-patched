# GitHub Container Registry (GHCR) Migration

This project now publishes container images to **GitHub Container Registry (GHCR)** in addition to Docker Hub.

## Why GHCR?

### Benefits
- ✅ **No rate limits** - Pull as many times as you want
- ✅ **Unlimited bandwidth** - No download restrictions
- ✅ **Free for public repositories** - No costs involved
- ✅ **Integrated with GitHub** - Automatic security scanning with Dependabot
- ✅ **Better CI/CD** - Native integration with GitHub Actions
- ✅ **Package visibility** - Linked directly to the repository

### Comparison

| Feature | GHCR | Docker Hub (Free) |
|---------|------|-------------------|
| Pull rate limits | None | 100/6h (anonymous), 200/6h (authenticated) |
| Private repos | Unlimited | 1 repo |
| Bandwidth | Unlimited | Unlimited |
| Storage | Free for public | Free up to limits |
| Security scanning | Dependabot | Docker Scout (limited) |
| CI/CD integration | Native GitHub | Requires external auth |

## Using GHCR Images

### Pull Commands

**Lite version** (~500-700 MB):
```bash
docker pull ghcr.io/admonstrator/paperless-ai-patched:latest
```

**Full version** with RAG (~1.5-2 GB):
```bash
docker pull ghcr.io/admonstrator/paperless-ai-patched:latest-full
```

### Docker Compose

Update your `docker-compose.yml`:

```yaml
services:
  paperless-ai:
    image: ghcr.io/admonstrator/paperless-ai-patched:latest
    # ... rest of configuration
```

### Kubernetes

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: paperless-ai
spec:
  containers:
  - name: paperless-ai
    image: ghcr.io/admonstrator/paperless-ai-patched:latest
```

## Available Tags

| Tag | Description | Size |
|-----|-------------|------|
| `latest` | Lite version (AI tagging only) | ~500-700 MB |
| `latest-lite` | Same as `latest` | ~500-700 MB |
| `latest-full` | Full version with RAG support | ~1.5-2 GB |
| `v*.*.*` | Specific version (lite) | ~500-700 MB |
| `v*.*.*-lite` | Specific version (lite) | ~500-700 MB |
| `v*.*.*-full` | Specific version (full) | ~1.5-2 GB |

## Automatic Builds

Images are automatically built and published via GitHub Actions:

- **On push to main**: Builds and pushes both lite and full images
- **On tag push**: Builds versioned releases
- **Manual workflow**: Allows custom version builds

## Authentication (Optional)

For private repositories or higher rate limits on public repos:

```bash
# Create a GitHub Personal Access Token with `read:packages` scope
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## Migration from Docker Hub

If you're currently using Docker Hub images, migration is simple:

### Old (Docker Hub)
```bash
docker pull admonstrator/paperless-ai-patched:latest
```

### New (GHCR)
```bash
docker pull ghcr.io/admonstrator/paperless-ai-patched:latest
```

**Note**: Both registries will continue to be supported, but GHCR is recommended for the benefits listed above.

## Troubleshooting

### "manifest unknown" error
- Ensure you're using the correct image name: `ghcr.io/admonstrator/paperless-ai-patched`
- Check if the tag exists: https://github.com/Admonstrator/paperless-ai-patched/pkgs/container/paperless-ai-patched

### Authentication issues
- For public images, no authentication is required
- If you see rate limit errors, you're likely hitting Docker Hub limits - switch to GHCR

### Multi-arch support
Both `linux/amd64` and `linux/arm64` are supported. Docker will automatically pull the correct architecture.

## Links

- **GHCR Package**: https://github.com/Admonstrator/paperless-ai-patched/pkgs/container/paperless-ai-patched
- **Docker Hub** (legacy): https://hub.docker.com/r/admonstrator/paperless-ai-patched
- **Repository**: https://github.com/Admonstrator/paperless-ai-patched

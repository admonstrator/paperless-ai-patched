# TODO Liste - Paperless AI Enhanced

**Erstellt am:** 3. Dezember 2025  
**Status:** In Bearbeitung

## 🚨 Kritische Sicherheitsprobleme (Priorität: HOCH)

### NPM Security Vulnerabilities

#### 1. Critical: form-data (4.0.0 - 4.0.3)
- **Problem:** Unsichere Random-Funktion für Boundary-Generierung
- **Advisory:** [GHSA-fjxv-7rqg-78g4](https://github.com/advisories/GHSA-fjxv-7rqg-78g4)
- **Fix:** `npm update form-data` auf >= 4.0.4
- **Dateien betroffen:** Wird von axios verwendet
- **Priorität:** ⭐⭐⭐ Kritisch

#### 2. High: axios (1.0.0 - 1.11.0)
- **Problem:** DoS-Angriff durch fehlende Data Size Check
- **Advisory:** [GHSA-4hjh-wcwx-xvwj](https://github.com/advisories/GHSA-4hjh-wcwx-xvwj)
- **Fix:** `npm update axios` auf >= 1.11.1
- **Dateien betroffen:** Gesamte Paperless API Integration
- **Priorität:** ⭐⭐⭐ Hoch

#### 3. High: validator (<=13.15.20)
- **Problem:** URL-Validierungs-Bypass und Incomplete Filtering
- **Advisories:** 
  - [GHSA-9965-vmph-33xx](https://github.com/advisories/GHSA-9965-vmph-33xx)
  - [GHSA-vghf-hv5q-vc2g](https://github.com/advisories/GHSA-vghf-hv5q-vc2g)
- **Fix:** `npm update validator` auf >= 13.15.21
- **Priorität:** ⭐⭐⭐ Hoch

#### 4. High: tar-fs (2.0.0 - 2.1.3)
- **Problem:** Symlink Validation Bypass
- **Advisory:** [GHSA-vj76-c3g6-qr5v](https://github.com/advisories/GHSA-vj76-c3g6-qr5v)
- **Fix:** `npm update tar-fs` auf >= 2.1.4
- **Priorität:** ⭐⭐⭐ Hoch

#### 5. High: glob (11.0.0 - 11.0.3)
- **Problem:** Command Injection via CLI
- **Advisory:** [GHSA-5j98-mcp5-4vw2](https://github.com/advisories/GHSA-5j98-mcp5-4vw2)
- **Fix:** `npm update glob` (via rimraf update)
- **Priorität:** ⭐⭐⭐ Hoch

#### 6. Moderate: js-yaml (4.0.0 - 4.1.0)
- **Problem:** Prototype Pollution in merge
- **Advisory:** [GHSA-mh29-5h37-fv8m](https://github.com/advisories/GHSA-mh29-5h37-fv8m)
- **Fix:** `npm update js-yaml` auf >= 4.1.1
- **Priorität:** ⭐⭐ Mittel

#### 7. Low: brace-expansion (Multiple)
- **Problem:** RegExp DoS Vulnerability
- **Advisory:** [GHSA-v6h2-p8h4-qcjw](https://github.com/advisories/GHSA-v6h2-p8h4-qcjw)
- **Fix:** `npm update brace-expansion`
- **Priorität:** ⭐ Niedrig

#### 8. Low: @eslint/plugin-kit (<0.3.4)
- **Problem:** RegExp DoS through ConfigCommentParser
- **Advisory:** [GHSA-xffm-g5w8-qvg7](https://github.com/advisories/GHSA-xffm-g5w8-qvg7)
- **Fix:** `npm update eslint`
- **Priorität:** ⭐ Niedrig (DevDependency)

### Schnellfix für alle NPM Vulnerabilities
```bash
npm audit fix
npm audit fix --force  # Falls breaking changes akzeptiert werden können
```

---

## 📦 Dependency Updates

### Node.js Packages (package.json)

#### Zu prüfende Updates:
```bash
npm outdated
```

**Empfohlene regelmäßige Updates:**
- `openai`: Aktuell 4.86.2, regelmäßig auf neueste Version aktualisieren
- `express`: Aktuell 4.21.2, auf neue Security-Patches achten
- `better-sqlite3`: Aktuell 11.8.1
- `nodemon`: Aktuell 3.1.9
- `eslint`: Aktuell 9.22.0
- `prettier`: Aktuell 3.5.3

### Python Packages (requirements.txt)

#### Kritische Python Updates:
1. **pydantic**: 2.12.4 → 2.12.5 (Security/Bugfix)
2. **reportlab**: 4.2.2 → 4.4.5 (Security Updates)
3. **Weitere Updates prüfen:**
   ```bash
   pip list --outdated
   pip install --upgrade fastapi uvicorn requests sentence-transformers chromadb
   ```

#### Empfohlene Python Updates:
- FastAPI auf neueste Version (>=0.115.0 empfohlen)
- ChromaDB auf neueste stabile Version
- sentence-transformers regelmäßig aktualisieren
- torch auf neueste Version (Performance-Verbesserungen)

---

## 🔧 GitHub Workflow Konfiguration

### 1. Docker Hub Secret einrichten (ERFORDERLICH)
- **Problem:** Workflow nutzt `secrets.DOCKER_HUB_TOKEN`, aber Secret fehlt noch
- **Schritte:**
  1. Docker Hub Token erstellen: https://hub.docker.com/settings/security
  2. GitHub Repo → Settings → Secrets and variables → Actions
  3. Neues Secret erstellen: Name=`DOCKER_HUB_TOKEN`, Value=<dein-token>
- **Priorität:** ⭐⭐⭐ Hoch (Workflow funktioniert sonst nicht)
- **Datei:** `.github/workflows/docker-build-push.yml:38`

### 2. Workflow testen
- Manuell ausführen über GitHub Actions UI
- Mit Test-Tag starten (z.B. `test-v1.0.0`)
- Push deaktivieren beim ersten Test

---

## 🐛 Code-Qualität & Linting

### Markdown Linting (COPILOT.md)
- **Problem:** 50+ Markdown-Linting-Fehler in COPILOT.md
- **Betrifft:** Fehlende Leerzeilen um Überschriften, Listen, Code-Blöcke
- **Fix:**
  ```bash
  npx markdownlint-cli2 --fix "*.md"
  ```
- **Priorität:** ⭐ Niedrig (Kosmetisch)

### ESLint Warnings
- Keine kritischen ESLint-Fehler gefunden
- DevDependency `@eslint/plugin-kit` hat RegExp DoS (siehe oben)

---

## 🔒 Sicherheit & Best Practices

### 1. Environment Variables Validierung
- [ ] Prüfen ob alle `.env.example` Variablen dokumentiert sind
- [ ] Sensible Defaults für Produktionsumgebung setzen
- [ ] `MIN_CONTENT_LENGTH` Default auf sinnvollen Wert (aktuell: 10)

### 2. Docker Security
- [x] `cap_drop: ALL` bereits implementiert ✅
- [x] `no-new-privileges: true` bereits implementiert ✅
- [ ] Container-User (PUID/PGID) in Dockerfile explizit setzen
- [ ] Health-Check Port dynamisch anpassen (bereits in Dockerfile, aber im docker-compose.yml hardcoded)

### 3. API Security
- [ ] Rate Limiting für API-Endpunkte implementieren
- [ ] CORS-Konfiguration überprüfen (aktuell in server.js)
- [ ] API-Key Rotation Mechanismus dokumentieren

---

## 🚀 Performance & Optimierung

### 1. Docker Build Optimierung
- [ ] Multi-Stage Build für kleinere Images prüfen
- [ ] Layer-Caching optimieren (Reihenfolge der COPY-Befehle)
- [ ] `.dockerignore` Datei erstellen/überprüfen

### 2. Database
- [ ] SQLite Indizes überprüfen (models/document.js)
- [ ] Vacuum/Optimization Cron-Job für SQLite
- [ ] ChromaDB Performance-Tuning dokumentieren

### 3. Caching
- [ ] Response-Caching für häufige API-Calls
- [ ] Thumbnail-Cache Management (bereits teilweise implementiert)

---

## 📚 Dokumentation

### 1. API Dokumentation
- [x] Swagger bereits implementiert ✅
- [ ] Swagger-Docs auf Vollständigkeit prüfen
- [ ] Beispiel-Requests für alle Endpunkte hinzufügen

### 2. Deployment Guide
- [ ] Docker Compose Produktions-Beispiel
- [ ] Kubernetes Deployment YAML
- [ ] Update/Migration Guide erstellen
- [ ] Backup & Restore Prozedur dokumentieren

### 3. Entwickler-Dokumentation
- [x] COPILOT.md bereits vorhanden ✅
- [x] PR-772-DOCUMENTATION.md ✅
- [x] PR-747-DOCUMENTATION.md ✅
- [ ] Testing Guide (Unit/Integration Tests)
- [ ] Contributing Guidelines erweitern

---

## 🧪 Testing

### 1. Automated Testing
- [x] test-pr772-fix.js vorhanden ✅
- [ ] Integration Tests für API-Endpunkte
- [ ] E2E Tests für kritische Workflows
- [ ] RAG Service Tests (Python)

### 2. CI/CD
- [ ] GitHub Actions Workflow für Tests
- [ ] Automatische Security Scans (Snyk/Dependabot)
- [ ] Code Coverage Tracking

---

## 🎯 Feature-Anfragen & Verbesserungen

### 1. Monitoring & Logging
- [ ] Structured Logging implementieren (winston/pino)
- [ ] Prometheus Metrics für Monitoring
- [ ] Error Tracking (z.B. Sentry)

### 2. RAG Service
- [ ] Vektorsuche Performance-Metriken
- [ ] Multi-Language Support verbessern
- [ ] Alternative Embedding-Modelle konfigurierbar machen

### 3. UI/UX
- [ ] Dark Mode Support
- [ ] Mehrsprachige UI
- [ ] Mobile-Responsive Design prüfen

---

## 📋 Sofortige Aktionen (Diese Woche)

1. **Security Updates durchführen:**
   ```bash
   cd /home/admon/git/paperless-ai-enhanced
   npm audit fix
   npm audit
   git add package*.json
   git commit -m "fix: Update dependencies to resolve security vulnerabilities"
   git push origin main
   ```

2. **Docker Hub Secret einrichten:**
   - Token auf Docker Hub erstellen
   - In GitHub Repository als Secret hinterlegen
   - Workflow testen

3. **Python Dependencies aktualisieren:**
   ```bash
   pip install --upgrade pip
   pip install --upgrade pydantic reportlab
   pip freeze > requirements.txt
   git add requirements.txt
   git commit -m "chore: Update Python dependencies"
   git push origin main
   ```

---

## 🎉 Abgeschlossene Aufgaben

- [x] PR #772: Infinite Retry Loop Fix integriert
- [x] PR #747: History Cleanup Tool integriert
- [x] GitHub Workflow für Docker Build erstellt
- [x] COPILOT.md Dokumentation erstellt
- [x] SSH Remote URL konfiguriert

---

**Nächstes Review:** Nach Abschluss der Security Updates
**Verantwortlich:** Repository Owner

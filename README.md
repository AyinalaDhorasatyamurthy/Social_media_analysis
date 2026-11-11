# InsightSphere STUDIO — YouTube Intelligence, Sentiment & Creator Analytics

**InsightSphere STUDIO** is a full-stack social media analytics and creator discovery platform built with **React**, **Python/Flask**, and **MongoDB**, packaged with **Docker**, automated through **Jenkins CI/CD**, and deployable to **Kubernetes (Minikube)**.

It analyzes YouTube channels using **VADER NLP sentiment scoring**, **TF-IDF + NetworkX semantic topology graphs**, **Random Forest reach forecasting**, **K-Means engagement clustering**, **multi-country trending intelligence**, and **category-partitioned creator recommendations**.

---

## Table of Contents

1. [End-to-End System Architecture](#1-end-to-end-system-architecture)
2. [Application Features & User Flow](#2-application-features--user-flow)
3. [Environment Variables & Secret Hygiene](#3-environment-variables--secret-hygiene)
4. [Running & Deploying: Beginning to End](#4-running--deploying-beginning-to-end)
   - [Option A: Local Development (Without Docker)](#option-a-local-development-without-docker)
   - [Option B: Docker & Docker Compose](#option-b-docker--docker-compose)
   - [Option C: Jenkins CI/CD Pipeline](#option-c-jenkins-cicd-pipeline)
   - [Option D: Kubernetes Deployment on Minikube](#option-d-kubernetes-deployment-on-minikube)
5. [Complete Repository Structure & Why Every File Matters](#5-complete-repository-structure--why-every-file-matters)
6. [Backend API Reference](#6-backend-api-reference)
7. [Testing & Verification](#7-testing--verification)

---

## 1. End-to-End System Architecture

```text
+-------------------------------------------------------------------------+
|                           USER BROWSER (SPA)                            |
|   React 19 UI  |  resilientFetch() in src/apiConfig.js                  |
+------------------------------------+------------------------------------+
                                     |
         Local Dev: :3000 -> :5000   |   Docker Compose & Minikube: :80/:3000
                                     v
+-------------------------------------------------------------------------+
|                     NGINX WEB SERVER & REVERSE PROXY                    |
|  - Serves compiled React static build (/usr/share/nginx/html)           |
|  - SPA fallback: try_files $uri $uri/ /index.html                       |
|  - Same-origin proxy: location ^~ /api/ -> http://backend-service:5000/ |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                    FLASK BACKEND API (Port 5000)                        |
|  app.py -> /auth, /dash, /sentiment, /network, /influencer,             |
|            /recommendations, /send                                      |
+-------------------+----------------------------------+------------------+
                    |                                  |
                    v                                  v
+-----------------------------------+  +----------------------------------+
|   PERSISTENCE LAYER (db/mongo.py) |  |     EXTERNAL DATA & SERVICES     |
|  - Primary: MongoDB (port 27017)  |  |  - YouTube Data API v3           |
|  - Fallback: db/local_store.json  |  |  - Gmail SMTP (OTP + Reports)    |
+-----------------------------------+  +----------------------------------+
```

### Key Architectural Design Decisions

- **Same-Origin `/api` Reverse Proxy ([`nginx.conf`](nginx.conf) + [`src/apiConfig.js`](src/apiConfig.js)):** In production containers (Docker Compose and Minikube), the React build sends API calls to `/api/...` on the exact origin serving the frontend. Nginx strips `/api/` and forwards requests internally to `http://backend-service:5000/`. That means Minikube on Windows only needs **one** tunnel (`minikube service frontend-service`) and avoids CORS or unreachable container IP issues. In local development (`NODE_ENV !== "production"`), `resilientFetch()` automatically targets `http://localhost:5000` / `http://127.0.0.1:5000`.
- **Offline-Resilient Persistence ([`db/mongo.py`](db/mongo.py)):** `ResilientCollection` checks MongoDB (`MONGODB_URI`) and transparently falls back to [`db/local_store.json`](db/local_store.json) when MongoDB is unreachable, preventing cold-start crashes during local testing or CI.
- **Graceful API Quota Protection:** Both [`services/regional_trending.py`](services/regional_trending.py) and [`services/category_creators.py`](services/category_creators.py) provide curated multi-region datasets so the Dashboard and Recommendations continue functioning even without an active YouTube quota.

---

## 2. Application Features & User Flow

1. **Public Entry (`/` & `/dashboard-analytics`):**
   - [`Home.js`](src/components/Home.js) introduces InsightSphere Studio with an interactive 3D canvas background ([`InsightSphere3DCanvas.js`](src/components/InsightSphere3DCanvas.js)).
   - [`DashboardAnalytics.js`](src/components/DashboardAnalytics.js) fetches live/fallback regional trending videos across 10 countries (`IN`, `US`, `GB`, `CA`, `JP`, `KR`, `DE`, `FR`, `BR`, `AU`), engagement metrics, and a generated lexical WordCloud (`/dash/wordcloud`).
2. **Authentication Gate (`/login`, `/signup`, `LoginModal`, `ProtectedRoute`):**
   - [`AuthContext.js`](src/context/AuthContext.js) persists JWT tokens and session state in `localStorage`.
   - Clicking any analytics route while signed out opens [`LoginModal.js`](src/components/LoginModal.js) or redirects via [`ProtectedRoute.js`](src/components/ProtectedRoute.js). Auth supports 6-digit OTP email verification (`/auth/send-otp`, `/auth/verify-otp`) as well as local/demo login fallback when SMTP credentials are absent.
3. **Sentiment & Attention Matrix (`/sentiment-analysis`):**
   - [`SentimentAnalysis.js`](src/components/SentimentAnalysis.js) + [`blueprints/sentiment.py`](blueprints/sentiment.py) analyze comments across a channel's 15 latest uploads/shorts using NLTK VADER (`[-1.0, +1.0]`), construct a 7x24 weekly audience attention heatmap, run a 100-tree Random Forest view/reach forecaster, and render backend charts saved to `graphs/`.
4. **Content Semantic Topology Graph (`/network-visualization`):**
   - [`NetworkVisualization.js`](src/components/NetworkVisualization.js) + [`blueprints/network.py`](blueprints/network.py) compute TF-IDF similarity edges between videos, NetworkX degree/betweenness/closeness centralities, and K-Means engagement clusters.
5. **Influencer Verification & Benchmark (`/influencer-detection`):**
   - [`InfluencerDetection.js`](src/components/InfluencerDetection.js) + [`InteractiveWorldMap.js`](src/components/InteractiveWorldMap.js) + [`blueprints/influencer.py`](blueprints/influencer.py) filter creators by region/tier (`services/influencer_catalog.py`) and benchmark engagement rates.
6. **Channel & Creator Discovery Engine (`/recommendations`):**
   - [`Recommendations.js`](src/components/Recommendations.js) + [`blueprints/recom.py`](blueprints/recom.py) filter curated & ingested channels across 13 YouTube categories and sovereign country filters, inspect video/shorts breakdowns, and ingest live channels via `/recommendations/add-channel`.
7. **Executive Reports & Export Studio (`/reports`):**
   - [`Reports.js`](src/components/Reports.js) + [`blueprints/send.py`](blueprints/send.py) download formatted CSV audit reports (`/send/download_report`) and send email reports via SMTP (`/send/email-report`).

---

## 3. Environment Variables & Secret Hygiene

Never commit `.env`, `k8s/secret.yaml`, or real API/email credentials to Git. Create your local config from [`.env.example`](.env.example):

```powershell
copy .env.example .env
```

| Variable | Required? | Purpose |
|---|---|---|
| `YOUTUBE_API_KEY` | Recommended | Google Cloud YouTube Data API v3 key for live channel/comment/trending fetches (curated fallbacks still work if omitted). |
| `JWT_SECRET_KEY` | Yes in prod | Secret key used by `flask-jwt-extended` to sign `/auth` JWT tokens. |
| `MONGODB_URI` | Auto in Docker/K8s | MongoDB connection string (`mongodb://localhost:27017/` locally; `mongodb://mongodb:27017/network` inside Docker/K8s). |
| `MONGODB_DB` | Default `network` | Target MongoDB database name. |
| `FROM_EMAIL` | Optional | Gmail sender address used for OTP emails and report delivery. |
| `EMAIL_PASSWORD` | Optional | 16-character Gmail App Password for `FROM_EMAIL`. |
| `MAIL_SERVER` / `MAIL_PORT` / `MAIL_USE_TLS` / `MAIL_USE_SSL` | Defaults set | SMTP configuration (`smtp.gmail.com`, port `587`, TLS `True`). |

---

## 4. Running & Deploying: Beginning to End

### Option A: Local Development (Without Docker)

1. **Install Python dependencies & NLTK lexicons:**
   ```powershell
   pip install -r requirements.txt
   python -m nltk.downloader stopwords vader_lexicon
   ```
2. **Install React dependencies:**
   ```powershell
   npm install --legacy-peer-deps
   ```
3. **Ensure MongoDB is running** on `localhost:27017` (or rely on `db/local_store.json` automatic fallback).
4. **Start the Flask backend** (`http://localhost:5000`):
   ```powershell
   python app.py
   ```
5. **Start the React dev server** (`http://localhost:3000`):
   ```powershell
   npm start
   ```
   *(In dev mode, [`package.json`](package.json) sets `"proxy": "http://localhost:5000"` and [`src/apiConfig.js`](src/apiConfig.js) connects directly to port `5000`.)*

---

### Option B: Docker & Docker Compose

Docker packages the entire 3-tier stack (`mongodb` + `backend` + `frontend`) so it runs identically on any machine.

```text
docker-compose.yml (run inside Social_media_analysis/)
 ├── mongodb  (mongo:7.0)                        -> Host 27018 : Container 27017 (volume: mongodb_data)
 ├── backend  (built from Dockerfile.backend)    -> Host 5000  : Container 5000  (network alias: backend-service)
 └── frontend (built from Dockerfile.frontend)   -> Host 3000  : Container 80    (Nginx serving React + /api proxy)
```

> **Why host port `27018`?** Host port `27018` avoids colliding with any native Windows MongoDB service already running on `27017`. Containers on `insightsphere-network` still talk to `mongodb:27017` internally.

**Build and start the stack:**
```powershell
cd Social_media_analysis
docker compose up -d --build
```

**Verify & open:**
- Frontend + full app: `http://localhost:3000`
- Backend health check: `http://localhost:5000/ping` -> `{"status": "ok"}`
- View container status / logs:
  ```powershell
  docker compose ps
  docker compose logs -f backend
  ```
- Stop containers (keeps `mongodb_data` volume intact):
  ```powershell
  docker compose down
  ```

---

### Option C: Jenkins CI/CD Pipeline

[`Jenkinsfile`](Jenkinsfile) defines the automated Continuous Integration / Delivery pipeline so every push is tested, built into immutable Docker images, and smoke-tested automatically before anyone deploys it.

#### Stage-by-Stage Flow in [`Jenkinsfile`](Jenkinsfile)

| Stage | What Runs | Why It Is Important |
|---|---|---|
| **1. Checkout SCM** | `checkout scm` | Pulls the exact commit and branch that triggered Jenkins. |
| **2. Tooling Verification** | `docker --version`, `docker compose version`, `git --version` | Fails fast if the Jenkins agent lacks Docker CLI, Compose v2, or Git before spending time installing dependencies. |
| **3. Regression & Unit Tests** | `pip install -r requirements.txt` + `python scripts/full_detail_test.py --inprocess` | Boots Flask in-process (`app.test_client()`) and verifies all **65 category x country recommendation combinations** (category purity, local prioritization, valid thumbnails) without needing a background daemon or live API quota. |
| **4. Build Docker Images** | `docker compose build --pull` + tags `${BUILD_NUMBER}-${GIT_COMMIT}` | Rebuilds both `social_media_analysis-backend` and `social_media_analysis-frontend` cleanly using `.dockerignore` and stamps reproducible build tags alongside `:latest`. |
| **5. Integration Smoke Test** | `docker compose up -d` -> `sleep 15` -> `curl -fsS http://localhost:5000/ping` & `http://localhost:3000/` | Launches real containers together, verifies MongoDB healthcheck -> Flask API boot -> Nginx frontend serving HTTP 200. |
| **`post { always }`** | `docker compose down --remove-orphans \|\| true` | Guarantees ephemeral CI containers are always cleaned up even if a stage fails, preventing port `3000`/`5000`/`27018` leaks across builds. |

#### Running Jenkins Locally via Docker (Optional)
1. Start Jenkins with Docker CLI access or configure a Multibranch / Pipeline job pointing to your GitHub repo (`feat/canonicalize-layout` or `main`).
2. Set **Script Path** to `Jenkinsfile` (or `Social_media_analysis/Jenkinsfile` depending on repository root).
3. You can also run the additional unit tests manually or add them to the test step:
   ```powershell
   python -m pytest
   ```

---

### Option D: Kubernetes Deployment on Minikube

The [`k8s/`](k8s) directory declares production-style Kubernetes objects (`Deployment`, `Service`, `PersistentVolumeClaim`, `Kustomization`) for multi-replica orchestration:

```text
Minikube Cluster (Docker driver)
 ├── frontend-deployment (2 pods, Nginx :80) <--- frontend-service (NodePort 30080)
 ├── backend-deployment  (2 pods, Flask :5000)<--- backend-service  (NodePort 30500, internal DNS: backend-service:5000)
 ├── mongodb-deployment  (1 pod, mongo:7.0)   <--- mongodb Service  (ClusterIP :27017) + mongodb-pvc (1Gi)
 └── insightsphere-secrets (Kubernetes Secret injected into backend pods as env vars)
```

#### Step-by-Step Minikube Launch

1. **Start Minikube** (using Docker Desktop as driver):
   ```powershell
   minikube start --driver=docker
   ```
2. **Build the Docker images** (if not already built by Docker Compose or Jenkins):
   ```powershell
   cd Social_media_analysis
   docker compose build
   ```
3. **Load local images into Minikube** *(required whenever `backend` or `frontend` code changes because [`k8s/backend.yaml`](k8s/backend.yaml) and [`k8s/frontend.yaml`](k8s/frontend.yaml) use `imagePullPolicy: IfNotPresent`)*:
   ```powershell
   minikube image load social_media_analysis-backend:latest --overwrite=true
   minikube image load social_media_analysis-frontend:latest --overwrite=true
   ```
4. **Create the Kubernetes Secret from your local `.env`** *(keeps secrets out of Git)*:
   ```powershell
   kubectl create secret generic insightsphere-secrets --from-env-file=.env --dry-run=client -o yaml | kubectl apply -f -
   ```
5. **Deploy all manifests via Kustomize**:
   ```powershell
   kubectl apply -k k8s/
   ```
6. **Verify all 5 pods reach `Running` (`1/1`)**:
   ```powershell
   kubectl get pods
   kubectl get services
   ```
   *(Wait for `mongodb-deployment` x1, `backend-deployment` x2, `frontend-deployment` x2 to show `1/1 Running`.)*
7. **Open the application in your browser (keep this terminal open!)**:
   ```powershell
   minikube service frontend-service
   ```
   > **Note on Windows + Docker driver:** Minikube node IPs (`192.168.49.2`) aren't directly reachable from Windows browsers without a tunnel. `minikube service frontend-service` opens a local tunnel (`http://127.0.0.1:<port>`), and Nginx's `/api/` reverse proxy forwards all API calls internally inside the cluster to `backend-service:5000`, so you only need that single tunnel!

8. **Rolling updates after editing code:** Rebuild with `docker compose build <service>`, reload into Minikube (`minikube image load ... --overwrite=true`), then restart pods:
   ```powershell
   kubectl rollout restart deployment/frontend-deployment
   ```

---

## 5. Complete Repository Structure & Why Every File Matters

```text
Social_media_analysis/
├── .dockerignore                  # Excludes node_modules, .env, .git, logs from Docker build context
├── .env.example                   # Safe template documenting all required/optional environment variables
├── .gitignore                     # Blocks secrets (.env, k8s/secret.yaml), node_modules, caches & logs from Git
├── Dockerfile.backend             # Recipes for Python 3.11-slim Flask API image + pre-downloaded NLTK data
├── Dockerfile.frontend            # Multi-stage Node 20 React builder -> ~27 MB Nginx Alpine runtime image
├── docker-compose.yml             # 3-service local & CI orchestrator (mongodb + backend + frontend)
├── Jenkinsfile                    # Declarative Jenkins CI/CD pipeline (Test -> Build -> Tag -> Smoke Test -> Cleanup)
├── METHODOLOGY_AND_SYSTEM_SPECS.txt # Mathematical & algorithmic reference (VADER, TF-IDF, Centralities, Random Forest)
├── nginx.conf                     # Nginx SPA fallback + same-origin /api/ reverse proxy to backend-service:5000
├── package.json                   # React dependencies (React 19, MUI, Chart.js, Lucide, Styled Components) & dev proxy
├── package-lock.json              # Exact locked frontend dependency graph for reproducible npm builds
├── README.md                      # End-to-end documentation (this file)
├── requirements.txt               # Python backend packages (Flask, PyMongo, NLTK, scikit-learn, NetworkX, etc.)
├── app.py                         # Flask application factory (`create_app()`), CORS/Mail/JWT config & blueprint registry
├── check_mongodb.bat              # Legacy Windows helper to test local MongoDB connectivity outside Docker
├── run.bat                        # Legacy Windows script to launch `python app.py` directly
├── start_server.bat               # Legacy Windows script to launch `flask run --host=0.0.0.0 --port=5000`
│
├── blueprints/                    # Modular Flask REST API route controllers
│   ├── __init__.py                # Marks blueprints as a Python package
│   ├── config.py                  # Loads .env settings and exports MONGODB_URI, API keys & SMTP defaults
│   ├── auth.py                    # `/auth/*`: OTP email delivery/verification, JWT issuance & user profile routes
│   ├── dash.py                    # `/dash/*`: Trending regional video feeds + dynamic WordCloud image endpoint
│   ├── influencer.py              # `/influencer/*`: Multi-region influencer filtering & channel engagement scoring
│   ├── network.py                 # `/network/*`: Video similarity graphs, centrality metrics & duration/category breakdown
│   ├── recom.py                   # `/recommendations/*`: Category/country creator engine, live channel inspection & ingest
│   ├── send.py                    # `/send/*`: Executive CSV report download & SMTP email dispatch
│   └── sentiment.py               # `/sentiment/*`: VADER NLP scoring, 7x24 heatmap, ML forecast & Matplotlib PNG charts
│
├── db/                            # Database connection & offline resilience layer
│   ├── __init__.py                # Re-exports collection getters
│   ├── mongo.py                   # `ResilientCollection` wrapping PyMongo with seamless local JSON fallback
│   └── local_store.json           # Pre-seeded & auto-updated local JSON cache when MongoDB is offline
│
├── graphs/                        # Runtime chart PNG storage served by `/sentiment/graph/*`
│   ├── centrality_heatmap.png     # Rendered network centrality heatmap plot
│   ├── heatmap.png                # Rendered 7x24 audience engagement temporal heatmap
│   └── sentiment.png              # Rendered sentiment distribution visualization
│
├── k8s/                           # Kubernetes / Minikube declarative manifests
│   ├── kustomization.yaml         # Single entry point (`kubectl apply -k k8s/`) ordering all K8s resources
│   ├── mongodb-pvc.yaml           # 1Gi PersistentVolumeClaim so MongoDB data survives pod restarts
│   ├── mongodb.yaml               # 1-replica MongoDB Deployment + ClusterIP Service (`mongodb:27017`)
│   ├── backend.yaml               # 2-replica Flask Deployment (Secret env injection + `/ping` probes) + `backend-service`
│   ├── frontend.yaml              # 2-replica Nginx Frontend Deployment + NodePort Service (`frontend-service:80`)
│   └── secret.yaml.example        # Safe reference showing keys expected in `insightsphere-secrets`
│
├── public/                        # Static files bundled untouched into React's web root
│   ├── index.html                 # Root HTML shell with `#root` mount point and InsightSphere title/theme
│   ├── manifest.json              # Web app manifest metadata
│   ├── favicon.ico                # Browser tab icon
│   └── robots.txt                 # Search engine crawler policy
│
├── scripts/                       # Verification audits & catalog build tooling
│   ├── full_detail_test.py        # Audits 65 category/country recommendation matrices (supports `--inprocess` for CI)
│   └── build_full_category_registry.py # Generator script that outputs `services/category_creators.py`
│
├── services/                      # Reusable domain logic, data ingestion & fallback registries
│   ├── __init__.py                # Exports channel ingestion helpers
│   ├── category_creators.py       # Verified 13-category x 11-country creator registry for recommendations
│   ├── channel_ingest.py          # YouTube channel resolver, 15-video/150-comment VADER ingest & 24h Mongo cache
│   ├── influencer_catalog.py      # Curated global & regional influencer catalog (IN states, UK, US, DE, JP, KR, etc.)
│   ├── regional_trending.py       # Curated 10-country trending fallback data for zero-downtime dashboard rendering
│   └── serialize.py               # `json_safe()` helper converting `ObjectId`, `datetime` & NumPy scalars for JSON
│
├── src/                           # React 19 Single-Page Application source code
│   ├── index.js                   # React entry point mounting `<App />` into `public/index.html`
│   ├── App.js                     # React Router routes (public vs `<ProtectedRoute>`), wrapped in `<AuthProvider>`
│   ├── apiConfig.js               # Environment-aware `API_BASE` (`/api` in prod, `:5000` in dev) & `resilientFetch()`
│   ├── context/
│   │   └── AuthContext.js         # Global auth state, `localStorage` session sync & login modal state
│   └── components/                # UI pages and reusable interactive components
│       ├── Navbar.js              # Sticky navigation bar enforcing auth gate modal before protected tabs
│       ├── Home.js                # Landing page showcasing platform modules and CTAs
│       ├── Login.js               # Full-page OTP & user sign-in experience
│       ├── LoginModal.js          # Pop-up OTP login gate triggered from protected navigation links
│       ├── Signup.js              # Account registration page
│       ├── ProtectedRoute.js      # Route guard displaying lock screen / opening `LoginModal` when unauthenticated
│       ├── DashboardAnalytics.js  # Regional trending feed, metric tables/cards & WordCloud view
│       ├── SentimentAnalysis.js   # VADER sentiment matrix, time-heatmap charts & upload predictions
│       ├── NetworkVisualization.js# Video semantic topology graph, centrality rankings & K-Means clustering
│       ├── InfluencerDetection.js # Creator benchmarking & multi-region filtering dashboard
│       ├── InteractiveWorldMap.js # Interactive SVG world map selector for regional influencer analytics
│       ├── Recommendations.js     # Category & sovereign country channel discovery + live channel inspect UI
│       ├── Reports.js             # Executive audit preview, CSV download & email report scheduler
│       ├── InsightSphere3DCanvas.js # Animated Three/Canvas background network visual for Home & Login
│       ├── PageGuideModal.js      # Contextual formula & methodology guide pop-up for users
│       └── About.js               # Project team credits component (archived reference)
│
└── tests/                         # Pytest unit test suite
    └── test_channel_ingest.py     # Unit tests for ISO duration parsing, country normalization & JSON serialization
```

---

## 6. Backend API Reference

*(In Docker Compose / Minikube, nginx proxies `/api/<endpoint>` -> backend `/<endpoint>` automatically.)*

| Prefix / File | Method & Path | Purpose |
|---|---|---|
| [`app.py`](app.py) | `GET /`, `GET /ping` | Service status, API key indicator, and Kubernetes/Jenkins liveness/readiness health probe |
| [`blueprints/auth.py`](blueprints/auth.py) | `POST /auth/send-otp`, `POST /auth/verify-otp` | Email OTP generation & JWT session issuance |
| [`blueprints/auth.py`](blueprints/auth.py) | `GET /auth/profile`, `POST /auth/update-profile`, `GET /auth/auth-status` | Authenticated profile retrieval, updates & status checks |
| [`blueprints/dash.py`](blueprints/dash.py) | `GET /dash/get_trending_data?region=IN` | Top trending videos for selected country (live YouTube + curated fallback) |
| [`blueprints/dash.py`](blueprints/dash.py) | `GET /dash/wordcloud?region=IN`, `GET /dash/ping` | Base64 PNG WordCloud generated from trending titles + dashboard ping |
| [`blueprints/sentiment.py`](blueprints/sentiment.py) | `GET /sentiment/analyze_sentiment` | VADER sentiment distribution, 7x24 heatmap data & Random Forest prediction |
| [`blueprints/sentiment.py`](blueprints/sentiment.py) | `GET /sentiment/graph/sentiment`, `/heatmap`, `/centrality_heatmap` | Serves rendered Matplotlib PNG charts from `graphs/` |
| [`blueprints/network.py`](blueprints/network.py) | `POST /network/fetch`, `POST /network/content_analysis` | TF-IDF semantic topology graph nodes/edges, centrality metrics & video analytics |
| [`blueprints/influencer.py`](blueprints/influencer.py) | `GET /influencer/filter`, `GET /influencer/fetch_channel_engagement` | Region/tier influencer filtering & category engagement chart scoring |
| [`blueprints/recom.py`](blueprints/recom.py) | `GET /recommendations/countries`, `/categories` | Returns supported country codes and 13 YouTube category definitions |
| [`blueprints/recom.py`](blueprints/recom.py) | `POST /recommendations/recommendations`, `/add-channel`, `GET /channel/<id>`, `/channel/<id>/videos`, `/channel/<id>/shorts`, `/test-db` | Ranked creator recommendations, live channel ingest & detail drilldowns |
| [`blueprints/send.py`](blueprints/send.py) | `POST /send/download_report`, `POST /send/email-report`, `POST /send/schedule-report` | Generates CSV executive audit exports and dispatches emails via Flask-Mail |

---

## 7. Testing & Verification

| Suite | Command | What It Verifies |
|---|---|---|
| **65-Combination Recommendation Audit (CI mode)** | `python scripts/full_detail_test.py --inprocess` | Tests all 13 categories x 5 countries (`GB`, `US`, `IN`, `AU`, `ALL`) directly against Flask `test_client()` |
| **Live HTTP Recommendation Audit** | `python scripts/full_detail_test.py` | Same 65-test suite against a running backend on `http://127.0.0.1:5000` |
| **Python Unit Tests** | `python -m pytest` | Duration parsing (`PT#H#M#S`), country normalization & MongoDB `ObjectId` JSON serialization |
| **Frontend Production Build** | `npm run build` *(set `CI=false` if warnings exist)* | Bundles and optimizes the React app into `build/` identically to `Dockerfile.frontend` |

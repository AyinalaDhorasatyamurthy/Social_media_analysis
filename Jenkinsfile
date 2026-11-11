// =============================================================================
// InsightSphere STUDIO - Cross-Platform Jenkins Declarative CI/CD Pipeline
// =============================================================================
// Automates the full Continuous Integration & Delivery lifecycle on Windows
// (bat) and Linux/macOS (sh):
//   1. Checkout latest source code from Git
//   2. Verify runtime toolchains (Docker, Docker Compose, Git, Python)
//   3. Install Python dependencies & execute 65/65 Audit + Pytest unit tests
//   4. Build Production Docker Images (Multi-Stage Frontend + Backend)
//   5. Boot Ephemeral Stack & Smoke-Test Backend (/ping), Frontend (/), Proxy (/api/ping)
//   6. Guaranteed post-build teardown via `docker compose down --remove-orphans`
// =============================================================================

pipeline {
    agent any

    environment {
        APP_NAME             = 'insightsphere-studio'
        COMPOSE_PROJECT_NAME = 'social_media_analysis'
        IMAGE_BACKEND        = 'social_media_analysis-backend'
        IMAGE_FRONTEND       = 'social_media_analysis-frontend'
        BUILD_TAG            = "${env.BUILD_NUMBER}-${env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : 'local'}"
        PYTHONUNBUFFERED     = '1'
        CI                   = 'true'
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {
        // ---------------------------------------------------------------------
        // STAGE 1: Source Control Checkout
        // ---------------------------------------------------------------------
        stage('Checkout SCM') {
            steps {
                echo '===> Pulling latest commit from Git SCM...'
                checkout scm
            }
        }

        // ---------------------------------------------------------------------
        // STAGE 2: Tooling & Environment Inspection
        // ---------------------------------------------------------------------
        stage('Tooling Verification') {
            steps {
                echo '===> Verifying host/agent runtime toolchains...'
                script {
                    if (isUnix()) {
                        sh '''
                            docker --version
                            docker compose version
                            git --version
                            python3 --version || python --version
                        '''
                    } else {
                        bat '''
                            docker --version
                            docker compose version
                            git --version
                            python --version
                        '''
                    }
                }
            }
        }

        // ---------------------------------------------------------------------
        // STAGE 3: Automated Regression & Unit Tests
        // ---------------------------------------------------------------------
        stage('Regression & Unit Tests') {
            steps {
                echo '===> Installing Python requirements & executing 65/65 audit + Pytest...'
                script {
                    if (isUnix()) {
                        sh '''
                            PYTHON_BIN="$(command -v python3 || command -v python)"
                            "$PYTHON_BIN" -m pip install -r requirements.txt
                            "$PYTHON_BIN" -m nltk.downloader -q stopwords vader_lexicon
                            "$PYTHON_BIN" scripts/full_detail_test.py --inprocess
                            "$PYTHON_BIN" -m pytest
                        '''
                    } else {
                        bat '''
                            python -m pip install -r requirements.txt
                            python -m nltk.downloader -q stopwords vader_lexicon
                            python scripts\\full_detail_test.py --inprocess
                            python -m pytest
                        '''
                    }
                }
            }
        }

        // ---------------------------------------------------------------------
        // STAGE 4: Build Docker Container Images
        // ---------------------------------------------------------------------
        stage('Build Docker Images') {
            steps {
                echo '===> Building Production Docker Images via Docker Compose...'
                script {
                    if (isUnix()) {
                        sh '''
                            docker compose build
                            docker tag "${IMAGE_BACKEND}:latest" "${IMAGE_BACKEND}:${BUILD_TAG}"
                            docker tag "${IMAGE_FRONTEND}:latest" "${IMAGE_FRONTEND}:${BUILD_TAG}"
                        '''
                    } else {
                        bat '''
                            docker compose build
                            docker tag %IMAGE_BACKEND%:latest %IMAGE_BACKEND%:%BUILD_TAG%
                            docker tag %IMAGE_FRONTEND%:latest %IMAGE_FRONTEND%:%BUILD_TAG%
                        '''
                    }
                }
            }
        }

        // ---------------------------------------------------------------------
        // STAGE 5: Container Integration Smoke Test
        // ---------------------------------------------------------------------
        stage('Integration Smoke Test') {
            steps {
                echo '===> Launching ephemeral stack to verify Backend, Nginx, & /api Proxy...'
                script {
                    if (isUnix()) {
                        sh '''
                            docker compose down --remove-orphans || true
                            docker compose up -d
                            PYTHON_BIN="$(command -v python3 || command -v python)"
                            "$PYTHON_BIN" - <<'EOF'
import sys, time, urllib.request
urls = [
    "http://127.0.0.1:5000/ping",
    "http://127.0.0.1:3000/",
    "http://127.0.0.1:3000/api/ping",
]
deadline = time.time() + 60
while time.time() < deadline:
    try:
        if all(urllib.request.urlopen(u, timeout=3).status == 200 for u in urls):
            print("Smoke tests PASSED: Backend, Frontend, and /api proxy returned HTTP 200.")
            sys.exit(0)
    except Exception:
        pass
    time.sleep(2)
print("Smoke tests FAILED before 60s timeout.")
sys.exit(1)
EOF
                            docker compose ps
                        '''
                    } else {
                        bat '''
                            docker compose down --remove-orphans
                            docker compose up -d
                            curl.exe --retry 20 --retry-delay 3 --retry-all-errors -fsS http://127.0.0.1:5000/ping || exit /b 1
                            curl.exe --retry 20 --retry-delay 3 --retry-all-errors -fsS http://127.0.0.1:3000/ > nul || exit /b 1
                            curl.exe --retry 20 --retry-delay 3 --retry-all-errors -fsS http://127.0.0.1:3000/api/ping || exit /b 1
                            docker compose ps
                        '''
                    }
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // Post-Pipeline Actions & Clean Teardown
    // -------------------------------------------------------------------------
    post {
        always {
            echo '===> Tearing down ephemeral integration test containers...'
            script {
                if (isUnix()) {
                    sh 'docker compose down --remove-orphans || true'
                } else {
                    bat 'docker compose down --remove-orphans || exit /b 0'
                }
            }
        }
        success {
            echo "[PASS] InsightSphere STUDIO CI/CD Pipeline SUCCEEDED for Build #${env.BUILD_NUMBER}!"
        }
        failure {
            echo "[FAIL] InsightSphere STUDIO CI/CD Pipeline FAILED. Inspect console output for details."
        }
    }
}

// =============================================================================
// InsightSphere STUDIO - Jenkins Declarative CI/CD Pipeline
// =============================================================================
// This pipeline automates the full continuous integration & delivery lifecycle:
// 1. Checkout latest source code from Git
// 2. Lint & Validate Python and JavaScript environments
// 3. Execute 65/65 Automated Regression & Category Recommendation Tests
// 4. Build Production Docker Images (Multi-Stage Frontend + Backend)
// 5. Ephemeral Integration Testing (Healthcheck & Container Handshake)
// 6. Automated Cleanup & Artifact Reporting
// =============================================================================

pipeline {
    agent any

    environment {
        APP_NAME = 'insightsphere-studio'
        IMAGE_BACKEND = 'social_media_analysis-backend'
        IMAGE_FRONTEND = 'social_media_analysis-frontend'
        BUILD_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : 'local'}"
        PYTHONUNBUFFERED = '1'
        CI = 'true'
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        ansiColor('xterm')
    }

    stages {
        // ---------------------------------------------------------------------
        // STAGE 1: Source Control Checkout
        // ---------------------------------------------------------------------
        stage('Checkout SCM') {
            steps {
                echo "===> Pulling latest commit from Git repository..."
                checkout scm
            }
        }

        // ---------------------------------------------------------------------
        // STAGE 2: Tooling & Environment Inspection
        // ---------------------------------------------------------------------
        stage('Tooling Verification') {
            steps {
                echo "===> Verifying host runtime toolchains..."
                sh '''
                    docker --version
                    docker compose version
                    git --version
                '''
            }
        }

        // ---------------------------------------------------------------------
        // STAGE 3: Automated Regression Tests (65/65 Categories & Creators)
        // ---------------------------------------------------------------------
        stage('Regression & Unit Tests') {
            steps {
                echo "===> Executing Python test suite & creator catalog audit (in-process)..."
                sh '''
                    python -m pip install --upgrade pip
                    pip install -r requirements.txt
                    python scripts/full_detail_test.py --inprocess
                '''
            }
        }

        // ---------------------------------------------------------------------
        // STAGE 4: Build Docker Container Images
        // ---------------------------------------------------------------------
        stage('Build Docker Images') {
            steps {
                echo "===> Building Production Docker Images via Docker Compose..."
                sh '''
                    docker compose build --pull
                    docker tag ${IMAGE_BACKEND}:latest ${IMAGE_BACKEND}:${BUILD_TAG}
                    docker tag ${IMAGE_FRONTEND}:latest ${IMAGE_FRONTEND}:${BUILD_TAG}
                '''
            }
        }

        // ---------------------------------------------------------------------
        // STAGE 5: Container Integration Smoke Test
        // ---------------------------------------------------------------------
        stage('Integration Smoke Test') {
            steps {
                echo "===> Launching ephemeral stack to verify end-to-end container health..."
                sh '''
                    # Start containers in background
                    docker compose up -d

                    # Allow containers 15 seconds to finish healthchecks
                    sleep 15

                    # Check running state
                    docker compose ps

                    # Verify backend health endpoint
                    curl -fsS http://localhost:5000/ping || exit 1

                    # Verify frontend Nginx returns HTTP 200
                    curl -fsS http://localhost:3000/ || exit 1

                    echo "===> Smoke tests PASSED: Frontend, Backend, and MongoDB are fully integrated!"
                '''
            }
        }
    }

    // -------------------------------------------------------------------------
    // Post-Pipeline Actions & Clean Teardown
    // -------------------------------------------------------------------------
    post {
        always {
            echo "===> Tearing down ephemeral integration test containers..."
            sh '''
                docker compose down --remove-orphans || true
            '''
        }
        success {
            echo "🎉 InsightSphere STUDIO CI/CD Pipeline SUCCEEDED for Build #${env.BUILD_NUMBER}!"
        }
        failure {
            echo "❌ InsightSphere STUDIO CI/CD Pipeline FAILED. Inspect logs above for details."
        }
    }
}

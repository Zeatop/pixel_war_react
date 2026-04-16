pipeline {
    agent any

    environment {
        REGISTRY   = '10.0.0.10:5000'
        API_IMAGE  = 'pixel-war-api'
        CLIENT_IMAGE = 'pixel-war-client'
        TAG        = "${BUILD_NUMBER}"

        // Variables injectées dans le build du frontend
        VITE_API_URL          = 'https://leo-jackson.com/pixel-war/api'
        VITE_GOOGLE_CLIENT_ID = '143422740984-trobjf5c44t861p0i363h4pch9lkr4nd.apps.googleusercontent.com'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                        docker run --rm \
                            --volumes-from jenkins \
                            -w /var/jenkins_home/workspace/pixel-war \
                            -e SONAR_HOST_URL=\$SONAR_HOST_URL \
                            -e SONAR_TOKEN=\$SONAR_AUTH_TOKEN \
                            sonarsource/sonar-scanner-cli \
                            -Dsonar.projectKey=pixel-war \
                            -Dsonar.sources=api/src,client/src \
                            -Dsonar.host.url=\$SONAR_HOST_URL \
                            -Dsonar.token=\$SONAR_AUTH_TOKEN
                    """
                }
            }
        }

        stage('Build API Image') {
            steps {
                sh """
                    docker build \
                        -t ${REGISTRY}/${API_IMAGE}:${TAG} \
                        -t ${REGISTRY}/${API_IMAGE}:latest \
                        -f api/Dockerfile \
                        api/
                """
            }
        }

        stage('Build Client Image') {
            steps {
                sh """
                    docker build \
                        --build-arg VITE_API_URL=${VITE_API_URL} \
                        --build-arg VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID} \
                        --build-arg VITE_BASE_PATH=/pixel-war/ \
                        -t ${REGISTRY}/${CLIENT_IMAGE}:${TAG} \
                        -t ${REGISTRY}/${CLIENT_IMAGE}:latest \
                        -f client/Dockerfile \
                        client/
                """
            }
        }

        stage('Push Images') {
            steps {
                sh "docker push ${REGISTRY}/${API_IMAGE}:${TAG}"
                sh "docker push ${REGISTRY}/${API_IMAGE}:latest"
                sh "docker push ${REGISTRY}/${CLIENT_IMAGE}:${TAG}"
                sh "docker push ${REGISTRY}/${CLIENT_IMAGE}:latest"
            }
        }

        stage('Deploy to K8s') {
            steps {
                sh "sed -i 's|${REGISTRY}/${API_IMAGE}:latest|${REGISTRY}/${API_IMAGE}:${TAG}|' k8s/deployment.yaml"
                sh "sed -i 's|${REGISTRY}/${CLIENT_IMAGE}:latest|${REGISTRY}/${CLIENT_IMAGE}:${TAG}|' k8s/deployment.yaml"
                sh 'kubectl apply -f k8s/deployment.yaml'
                sh 'kubectl rollout status deployment/pixel-war-postgres --timeout=120s'
                sh 'kubectl rollout status deployment/pixel-war-api --timeout=120s'
                sh 'kubectl rollout status deployment/pixel-war-client --timeout=120s'
            }
        }
    }

    post {
        success {
            echo "Déploiement réussi ! Pixel War accessible sur https://leo-jackson.com/pixel-war"
        }
        failure {
            echo "Le pipeline a échoué"
            sh 'kubectl get pods | grep pixel-war || true'
            sh 'kubectl logs -l app=pixel-war-api --tail=30 || true'
        }
    }
}
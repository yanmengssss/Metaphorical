pipeline {
    agent any

    environment {
        APP_NAME = 'metaphorical'
        IMAGE_NAME = "docker-image-${APP_NAME}"
        CONTAINER_NAME = "container-${APP_NAME}"
        // Jenkins global secret file credential id for injected metaphorical.properties
        CRED_ID = 'metaphorical.properties'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image: ${IMAGE_NAME}..."
                    sh "docker builder prune -a -f || true"
                    sh "DOCKER_BUILDKIT=0 docker build --no-cache -t ${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Deploy / Run Container') {
            steps {
                withCredentials([file(credentialsId: env.CRED_ID, variable: 'ENV_FILE')]) {
                    script {
                        echo "Deploying Docker container: ${CONTAINER_NAME}..."

                        sh """
                            if docker inspect ${CONTAINER_NAME} > /dev/null 2>&1; then
                                docker stop ${CONTAINER_NAME}
                                docker rm ${CONTAINER_NAME}
                            fi
                        """

                        echo "Starting new container for ${APP_NAME} using Jenkins injected env file..."
                        sh """
                            docker run -d \
                                --name ${CONTAINER_NAME} \
                                --restart unless-stopped \
                                --env-file \"$ENV_FILE\" \
                                -p 6500:6500 \
                                ${IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up dangling images..."
            sh "docker image prune -f"
        }
        success {
            echo "Pipeline deployed successfully. Container ${CONTAINER_NAME} is running."
        }
        failure {
            echo "Pipeline deployment failed. Check the logs."
        }
    }
}

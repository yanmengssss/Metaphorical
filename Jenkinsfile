pipeline {
    agent any

    environment {
        APP_NAME      = 'metaphorical'
        IMAGE_NAME    = "docker-image-${APP_NAME}"
        CONTAINER_NAME = "container-${APP_NAME}"

        // Jenkins 凭据 ID（在 Jenkins → Manage Credentials 中添加 Secret file，ID 填 'Metaphorical'）
        CRED_ID = 'Metaphorical'
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
                    echo "Building Docker Image: ${IMAGE_NAME}..."
                    // 清理 BuildKit 缓存，防止 containerd layer mount 报错
                    sh "docker builder prune -a -f || true"
                    // 禁用 BuildKit 以绕过 containerd 挂载报错，添加 --no-cache 彻底避免缓存问题
                    sh "DOCKER_BUILDKIT=0 docker build --no-cache -t ${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Deploy / Run Container') {
            steps {
                script {
                    echo "Deploying Docker Container: ${CONTAINER_NAME}..."

                    // 检查并清理旧容器，防止端口冲突和重名报错
                    sh "docker stop ${CONTAINER_NAME} || true"
                    sh "docker rm ${CONTAINER_NAME} || true"

                    // -- 使用 Jenkins 凭据中的 Secret file 注入 .env 变量 --
                    withCredentials([file(credentialsId: "${CRED_ID}", variable: 'SECRET_ENV_FILE')]) {
                        echo "Starting new container with environment file for ${APP_NAME}..."

                        sh """
                            docker run -d \\
                                --name ${CONTAINER_NAME} \\
                                --restart unless-stopped \\
                                -p 6500:6500 \\
                                --env-file "\${SECRET_ENV_FILE}" \\
                                ${IMAGE_NAME}:latest
                        """
                    }

                    // -- 如果不需要注入外部环境变量，可以用下面这段替代上面的 withCredentials 块 --
                    /*
                    sh """
                        docker run -d \\
                            --name ${CONTAINER_NAME} \\
                            --restart unless-stopped \\
                            -p 6500:6500 \\
                            ${IMAGE_NAME}:latest
                    """
                    */
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up dangling images..."
            // 清理悬空镜像，防止磁盘被占满
            sh "docker image prune -f"
        }
        success {
            echo "✅ Pipeline 部署成功！容器 ${CONTAINER_NAME} 已启动运行。"
        }
        failure {
            echo "❌ Pipeline 部署失败，请检查日志！"
        }
    }
}

pipeline {
  agent {
    kubernetes {
      cloud 'kubernetes'
      defaultContainer 'docker'
      yaml '''
apiVersion: v1
kind: Pod
spec:
  serviceAccountName: jenkins
  activeDeadlineSeconds: 1800
  restartPolicy: Never
  containers:
    - name: docker
      image: 10.43.161.212:5000/ci/docker-cli:27
      command: ["cat"]
      tty: true
      env:
        - name: DOCKER_HOST
          value: tcp://localhost:2375
      resources:
        requests:
          cpu: "500m"
          memory: "512Mi"
        limits:
          cpu: "1"
          memory: "1Gi"
    - name: dind
      image: 10.43.161.212:5000/ci/docker-dind:27
      args: ["--insecure-registry=registry.registry.svc.cluster.local:5000"]
      securityContext:
        privileged: true
      env:
        - name: DOCKER_TLS_CERTDIR
          value: ""
      resources:
        requests:
          cpu: "500m"
          memory: "1Gi"
        limits:
          cpu: "2"
          memory: "3Gi"
      volumeMounts:
        - name: docker-data
          mountPath: /var/lib/docker
    - name: jnlp
      image: 10.43.161.212:5000/ci/jenkins-inbound-agent:3391.va_37fa_a_305d6d-1-jdk25
    - name: kubectl
      image: 10.43.161.212:5000/ci/docker-kubectl:v1.31.4
      command: ["cat"]
      tty: true
  volumes:
    - name: docker-data
      emptyDir: {}
'''
    }
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  triggers {
    githubPush()
  }

  environment {
    BUILD_REGISTRY           = 'registry.registry.svc.cluster.local:5000'
    IMAGE_REPOSITORY         = 'registry.registry.svc.cluster.local:5000/yemengs/metaphorical'
    RUNTIME_IMAGE_REPOSITORY = '10.43.161.212:5000/yemengs/metaphorical'
    K8S_NAMESPACE            = 'app'
    DEPLOYMENT_NAME          = 'metaphorical'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        }
      }
    }

    stage('Build and push image') {
      steps {
        container('docker') {
          sh '''#!/bin/sh
            set -eu
            until docker info >/dev/null 2>&1; do sleep 2; done
            docker build \\
              --build-arg NODE_IMAGE="$BUILD_REGISTRY/yemengs/cli-manger:20260924" \\
              --build-arg NEXT_PUBLIC_USER_SERVICE_WEB_URL=https://user.yanmengsss.xyz \\
              --build-arg NEXT_PUBLIC_HARNESS_UI_ORIGIN=https://harness.yanmengsss.xyz \\
              --tag "$IMAGE_REPOSITORY:$IMAGE_TAG" \\
              --tag "$IMAGE_REPOSITORY:ci-latest" \\
              .
            docker push "$IMAGE_REPOSITORY:$IMAGE_TAG"
            docker push "$IMAGE_REPOSITORY:ci-latest"
          '''
        }
      }
    }

    stage('Deploy to K3s') {
      steps {
        container('kubectl') {
          sh '''#!/bin/sh
            set -eu
            KUBECONFIG_PATH=$(mktemp)
            trap 'rm -f "$KUBECONFIG_PATH"' EXIT
            cat >"$KUBECONFIG_PATH" <<EOF
apiVersion: v1
kind: Config
clusters:
  - name: in-cluster
    cluster:
      server: https://${KUBERNETES_SERVICE_HOST}:${KUBERNETES_SERVICE_PORT_HTTPS}
      certificate-authority: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
users:
  - name: jenkins
    user:
      token: $(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
contexts:
  - name: deployment
    context:
      cluster: in-cluster
      user: jenkins
      namespace: ${K8S_NAMESPACE}
current-context: deployment
EOF
            kubectl --kubeconfig="$KUBECONFIG_PATH" set image deployment/"$DEPLOYMENT_NAME" \\
              web="$RUNTIME_IMAGE_REPOSITORY:$IMAGE_TAG"
            kubectl --kubeconfig="$KUBECONFIG_PATH" rollout status deployment/"$DEPLOYMENT_NAME" --timeout=180s
          '''
        }
      }
    }
  }
}

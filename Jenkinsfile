pipeline {
  agent any

  environment {
    SONAR_SCANNER_HOME = tool 'sonar-scanner'
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
            ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
            -Dsonar.projectKey=textile-project \
            -Dsonar.sources=. \
            -Dsonar.host.url=http://localhost/:9000
          """
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 2, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Build & Deploy') {
      steps {
        sh '''
          docker compose down
          docker compose up -d --build
        '''
      }
    }

  }

  post {
    success {
      echo "✅ Quality Gate passed. Deployment successful."
    }
    failure {
      echo "❌ Pipeline failed due to Quality Gate or build error."
    }
  }
}

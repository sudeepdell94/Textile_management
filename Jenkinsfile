pipeline {
  agent any

  environment {
    SONAR_SCANNER_HOME = tool 'sonar-scanner'
  }

  stages {

    stage('Checkout Code') {
      steps {
        checkout scm
      }
    }

    stage('SonarQube Analysis - Backend') {
      steps {
        withSonarQubeEnv('SonarQube') {
          dir('backend') {
            sh """
              ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
              -Dsonar.projectKey=textile-project \
              -Dsonar.sources=. \
              -Dsonar.host.url=http://sonarqube:9000
            """
          }
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

    stage('Build Docker Images') {
      steps {
        sh 'docker compose build'
      }
    }

  }

  post {
    failure {
      echo "❌ Pipeline failed due to quality gate or build error"
    }
    success {
      echo "✅ Code quality passed, build successful"
    }
  }
}

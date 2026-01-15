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

        // Use the server name you defined in Step 3
        withSonarQubeEnv('SonarQube') {
            sh "${scannerHome}/bin/sonar-scanner \
                -Dsonar.projectKey=my-mern-app \
                -Dsonar.sources=. \
                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info"
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
      echo '✅ Quality Gate passed. Deployment successful.'
    }
    failure {
      echo '❌ Pipeline failed due to Quality Gate or build error.'
    }
  }
}

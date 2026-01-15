pipeline {
    agent any

    environment {
        // This ensures the scanner is available globally in the pipeline
        SCANNER_HOME = tool 'sonar-scanner'
    }

    stages {
        stage('Checkout') {
      steps {
        checkout scm
      }
        }

        stage('SonarQube Analysis') {
      steps {
        // Use the tool name you defined in Step 4
        def scannerHome = tool 'sonar-scanner'

        // Use the server name you defined in Step 3
        withSonarQubeEnv('SonarQube') {
          sh "${SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=my-mern-app \
                        -Dsonar.sources=. \
                        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info"
        }
      }
        }

        stage('Quality Gate') {
      steps {
        // This waits for SonarQube to finish and send a webhook back
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
        }

        stage('Build & Deploy') {
      steps {
        script {
          // Using script block for multi-line docker commands
          sh '''
                        docker compose down || true
                        docker compose up -d --build
                    '''
        }
      }
        }
    }

    post {
        success {
      echo '✅ Quality Gate passed. Deployment successful.'
        }
        failure {
      echo '❌ Pipeline failed. Check SonarQube or Docker logs.'
        }
    }
}

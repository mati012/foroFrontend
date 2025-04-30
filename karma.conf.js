// karma.conf.js
module.exports = function (config) {
    config.set({
      basePath: '',
      frameworks: ['jasmine', '@angular-devkit/build-angular'],
      plugins: [
        require('karma-jasmine'),
        require('karma-chrome-launcher'),
        require('karma-coverage'),
        require('karma-jasmine-html-reporter'),
        require('karma-spec-reporter'),
        require('@angular-devkit/build-angular/plugins/karma'),
      ],
      client: {
        jasmine: {
          // Puedes configurar aquí si quieres
        },
        clearContext: false // deja los resultados visibles en el navegador
      },
      coverageReporter: {
        dir: require('path').join(__dirname, './coverage'),
        subdir: '.',
        reporters: [
          { type: 'html' },
          { type: 'text-summary' },
          { type: 'lcovonly' }, // 👈 esto es lo que lee SonarQube
        ]
      },
      reporters: ['progress', 'kjhtml', 'spec'],
      port: 9876,
      colors: true,
      logLevel: config.LOG_INFO,
      autoWatch: true,
      browsers: ['ChromeHeadless'], // Corre en segundo plano, ideal para CI
      singleRun: false,
      restartOnFileChange: true
    });
  };
module.exports = function (grunt) {

    grunt.initConfig({
        jshint: {
            all: ['*.js', 'app/**/*.js', 'test/*.js']
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    //captureFile: 'results.txt', // Optionally capture the reporter output to a file
                    quiet: false, // Optionally suppress output to standard out (defaults to false)
                    clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
                },
                src: ['test/**/*.js']
            }
        },
        apidoc: {
            myapp: {
                src: "app/",
                dest: "public/apidoc/",
                options: {
                    debug: true,
                    includeFilters: [".*\\.js$"],
                    excludeFilters: ["node_modules/"]
                }
            }
        }
    });
    // "test": "mocha --reporter spec"
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-apidoc');

    grunt.registerTask('default', ['jshint', 'apidoc']); //,'mochaTest'

    // grunt.registerTask('default', ['jshint']);

};

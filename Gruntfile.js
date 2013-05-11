module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        globalstrict:  true,  // global "use strict" (also enables 'strict')
        camelcase:     true,  // Identifiers must be in camelCase
        newcap:        true,  // Require capitalization of all constructor functions e.g. `new F()`
        lastsemic:     true,  // Tolerate omitting a semicolon for the last statement of a 1-line block
        browser:       false, // Not a browser,
        node:          true   // this runs in node.
      },
      all: ['index.js']
    },

    simplemocha: {
      options: {
        ui: 'tdd',
        reporter: 'spec',
        ignoreLeaks: false
      },
      all: ['test/*_test.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-simple-mocha');

  grunt.registerTask('test', ['jshint', 'simplemocha']);
  grunt.registerTask('default', 'test');
};

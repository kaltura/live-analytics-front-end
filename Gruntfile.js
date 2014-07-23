/*global module:false*/
module.exports = function(grunt) {

  var shellOpts = {
    stdout: true,
    failOnError: true
  };

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! KMC Live Analytics - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '* https://github.com/kaltura/LiveAnalytics\n' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
        'Atar Shadmi; Licensed GNU */\n'
    },
    concat: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        src: [
          'app/js/app.js',
          'app/js/controllers.js', 
          'app/js/directiveControllers.js', 
          'app/js/directives.js', 
          'app/js/filters.js', 
          'app/js/services.js', 
          'app/js/dummyServices.js' 
        ],
        dest: '_dist/js/livea.js'
      },
      libs: {
          src: [
              'app/lib/jquery/jquery-1.10.2.min.js',
              'app/lib/jquery-ui/jquery-ui-1.10.4/ui/minified/jquery-ui.min.js',
              'app/lib/bootstrap/bootstrap-3.1.1-dist/js/bootstrap.min.js',
              'app/lib/bootstrap/bootstrap-paginator.js',
              'app/lib/angular/angular.min.js',
              'app/lib/angular/angular-resource.min.js',
              'app/lib/angular/angular-route.min.js',
              'app/lib/angular-translate-2.2.0/angular-translate.min.js',
              'app/lib/angular-translate-2.2.0/angular-translate-loader-static-files.min.js',
              'app/lib/rickshaw/rickshaw.js',
              'app/lib/rickshaw/d3.v3.js',
              'app/lib/rickshaw/d3.layout.min.js',
              'app/lib/kaltura/KHoverDetail.js',
              'app/lib/OpenLayers-2.13.1/OpenLayers.js',
              'app/locale/en_US.js'
          ],
          dest: '_dist/js/libs.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        files: {
          '_dist/js/livea.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    cssmin: {
        combine: {
            files: {
                '_dist/css/vendor.css': [
                                         'app/lib/bootstrap/bootstrap-3.1.1-dist/css/bootstrap.css',
                                         'app/lib/jquery-ui/jquery-ui-1.10.4/themes/base/jquery-ui.css', 
                                         'app/lib/rickshaw/css/rickshaw.css',
                                         'app/lib/OpenLayers-2.13.1/theme/default/style.css'
                                         ]
            }

        }
    },
    clean: {
        build: ["_dist", "_dist/js", "_dist/css"]
    },
    copy: {
        main: {
            files: [
                    { // dummy data
                    	expand: true,
                    	cwd: 'app/data/',
                    	src: '**',
                    	dest: '_dist/data/'
                    },
                { // main files
                    expand: true,
                    cwd: 'app/dist_src',
                    src: '**',
                    dest: '_dist/'
                },
                { // partials
                    expand: true,
                    cwd: 'app/partials/',
                    src: '**',
                    dest: '_dist/partials/'
                },
                { // locale
                	expand: true,
                	cwd: 'app/locale/',
                	src: '**',
                	dest: '_dist/locale/'
                },
                // js app + vendor are created directly in place
                { // css - app (vendor is created directly in place)
                    src: 'app/css/app.css',
                    dest: '_dist/css/app.css'
                },
                { // fonts
                	 expand: true,
                     cwd: 'app/lib/bootstrap/bootstrap-3.1.1-dist/fonts',
                     src: '*',
                     dest: '_dist/fonts'
                },
                { // open layers images
                	expand: true,
                	cwd: 'app/lib/OpenLayers-2.13.1/theme/default/img',
                	src: '*',
                	dest: '_dist/css/images/ol'
                },
                { // jquery ui images
                	expand: true,
                	cwd: 'app/lib/jquery-ui/jquery-ui-1.10.4/themes/base/minified/images',
                	src: '*',
                	dest: '_dist/css/images'
                },
                { // deployment
                	expand: true,
                	cwd: 'deploy',
                	src: '**',
                	dest: '_dist/deploy'
                },
                
            ]
        }
    },
    clean: {
    	before: ['_dist/**'],
    	after: ['app/js/livea.tmp.js']
    }
    
  });

  // Add grunt plugins
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Default task.
  grunt.registerTask('default', ['clean:before', 'copy:main', 'concat:dist', 'uglify:dist', 'concat:libs', 'cssmin:combine'/*, 'clean:after'*/]);
};

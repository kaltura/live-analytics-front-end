/*global module:false*/
module.exports = function(grunt) {

  var shellOpts = {
    stdout: true,
    failOnError: true
  };

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    options: {
    	targetDir: "v<%= pkg.version %>"
    },
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
          'app/js/RGraphController.js',
          'app/js/OLMapController.js',
          'app/js/directives.js',
          'app/js/filters.js', 
          'app/js/services.js',
            'app/locale/en_US.js'
        ],
        dest: '<%= options.targetDir %>/js/livea.js'
      },
      libs: {
            src: [
                'app/lib/kaltura/KHoverDetail.js',
                'app/lib/kaltura/KTime_Local.js'
            ],
            dest: '<%= options.targetDir %>/js/libs.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        files: {
          '<%= options.targetDir %>/js/livea.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    cssmin: {
        combine: {
            files: {
                '<%= options.targetDir %>/css/vendor.css': [
                     'app/lib/bootstrap/bootstrap-3.1.1-dist/css/bootstrap.css',
                     'app/lib/jquery-ui/jquery-ui-1.10.4/themes/base/jquery-ui.css',
                     'app/lib/rickshaw/css/rickshaw.css',
                     'app/lib/OpenLayers-2.13.1/theme/default/style.css'
                 ]
            }

        }
    },

    copy: {
        vendor : {
            files: [
                // jquery + ui
                {
                    src: 'app/lib/jquery/jquery-1.10.2.min.js',
                    dest: '<%= options.targetDir %>/js/jquery.min.js'
                },
                {
                    src: 'app/lib/jquery-ui/jquery-ui-1.10.4/ui/minified/jquery-ui.min.js',
                    dest: '<%= options.targetDir %>/js/jquery-ui.min.js'
                },
                { // jquery ui images
                    expand: true,
                    cwd: 'app/lib/jquery-ui/jquery-ui-1.10.4/themes/base/minified/images',
                    src: '*',
                    dest: '<%= options.targetDir %>/css/images'
                },

                // bootstrap
                {
                    src: 'app/lib/bootstrap/bootstrap-3.1.1-dist/js/bootstrap.min.js',
                    dest: '<%= options.targetDir %>/js/bootstrap.min.js'
                },
                {
                    src: 'app/lib/bootstrap/bootstrap-paginator.js',
                    dest: '<%= options.targetDir %>/js/bootstrap-paginator.js'
                },
                {
                    src: 'app/lib/bootbox/bootbox.min.js',
                    dest: '<%= options.targetDir %>/js/bootbox.min.js'
                },
                { //  bootstrap fonts
                    expand: true,
                    cwd: 'app/lib/bootstrap/bootstrap-3.1.1-dist/fonts',
                    src: '*',
                    dest: '<%= options.targetDir %>/fonts'
                },

                // angular
                {
                    src: 'app/lib/angular/angular.min.js',
                    dest: '<%= options.targetDir %>/js/angular.min.js'
                },
                {
                    src: 'app/lib/angular/angular-resource.min.js',
                    dest: '<%= options.targetDir %>/js/angular-resource.min.js'
                },
                {
                    src: 'app/lib/angular/angular-route.min.js',
                    dest: '<%= options.targetDir %>/js/angular-route.min.js'
                },
                {
                    src: 'app/lib/angular-translate-2.2.0/angular-translate.min.js',
                    dest: '<%= options.targetDir %>/js/angular-translate.min.js'
                },
                {
                    src: 'app/lib/angular-translate-2.2.0/angular-translate-loader-static-files.min.js',
                    dest: '<%= options.targetDir %>/js/angular-translate-loader-static-files.min.js'
                },
                { // angualr map files
                    src: 'app/lib/angular/angular-route.min.js.map',
                    dest: '<%= options.targetDir %>/js/angular-route.min.js.map'
                },
                { // angualr map files
                    src: 'app/lib/angular/angular-resource.min.js.map',
                    dest: '<%= options.targetDir %>/js/angular-resource.min.js.map'
                },
                { // angualr map files
                    src: 'app/lib/angular/angular.min.js.map',
                    dest: '<%= options.targetDir %>/js/angular.min.js.map'
                },

                // open layers
                {
                    src: 'app/lib/OpenLayers-2.13.1/OpenLayers.js',
                    dest: '<%= options.targetDir %>/js/OpenLayers.js'
                },
                { // open layers images
                    expand: true,
                    cwd: 'app/lib/OpenLayers-2.13.1/theme/default/img',
                    src: '*',
                    dest: '<%= options.targetDir %>/css/images/ol'
                },

                // rickshaw
                {
                    src: 'app/lib/rickshaw/d3.v3.js',
                    dest: '<%= options.targetDir %>/js/d3.v3.js'
                },
                {
                    src: 'app/lib/rickshaw/d3.layout.min.js',
                    dest: '<%= options.targetDir %>/js/d3.layout.min.js'
                },
                {
                    src: 'app/lib/rickshaw/rickshaw.js',
                    dest: '<%= options.targetDir %>/js/rickshaw.js'
                }

            ]

        },

        main: {
            files: [
                { // main files
                    expand: true,
                    cwd: 'app/dist_src',
                    src: '**',
                    dest: '<%= options.targetDir %>/'
                },
                { // partials
                    expand: true,
                    cwd: 'app/partials/',
                    src: '**',
                    dest: '<%= options.targetDir %>/partials/'
                },
                { // locale
                	expand: true,
                	cwd: 'app/locale/',
                	src: '**',
                	dest: '<%= options.targetDir %>/locale/'
                },
                // js app + vendor are created directly in place
                { // css - app (vendor is created directly in place)
                    src: 'app/css/app.css',
                    dest: '<%= options.targetDir %>/css/app.css'
                },

                { // deployment
                	expand: true,
                	cwd: 'deploy/files',
                	src: '**',
                	dest: '<%= options.targetDir %>/deploy/files'
                },
                
            ]
        }
    },
    clean: {
        build: ["<%= options.targetDir %>", "<%= options.targetDir %>/js", "<%= options.targetDir %>/css"],
    	before: ['<%= options.targetDir %>/**'],
    	after: ['app/js/livea.tmp.js']
    },
	'string-replace': {
    	deploy: {
    		files: {
    			'<%= options.targetDir %>/deploy/config.ini': 'deploy/config.ini'
    	    },
    	    options: {
    	    	replacements: [{
    	    		pattern: '{VERSION}',
    	    		replacement: '<%= pkg.version %>'
    	    	}]
    	    }
    	}
    }
    

    
  });

  // Add grunt plugins
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-string-replace');

  // Default task.
  grunt.registerTask('default', ['clean:before', 'string-replace:deploy', 'copy:main', 'copy:vendor', 'concat:dist', 'uglify:dist', 'concat:libs', 'cssmin:combine'/*, 'clean:after'*/]);
};

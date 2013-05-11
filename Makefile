all: watch

watch:
	@nodemon -w Gruntfile.js -w test -w index.js -x grunt test

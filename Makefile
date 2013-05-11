REPORTER = spec

all: watch

watch:
	@nodemon -w test -w index.js -x make jshint test test-cov

jshint:
	@jshint --config=jshint.json --reporter=jslint index.js

test:
	@./node_modules/.bin/mocha --reporter $(REPORTER) test/typed_json_test.js

lib-cov:
	jscoverage index.js index-cov.js

test-cov: lib-cov
	@COVERAGE_RUN=1 $(MAKE) test REPORTER=html-cov > coverage.html
	rm index-cov.js

test-coveralls: lib-cov
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@COVERAGE_RUN=1 $(MAKE) test REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js
	rm index-cov.js

.PHONY: jshint test

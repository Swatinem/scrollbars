
test: build/build.js
	./node_modules/.bin/component test phantom

components: component.json
	./node_modules/.bin/component install --dev
	@touch components

build/build.js: components index.js scrollbars.css
	./node_modules/.bin/component build --dev

.PHONY: test

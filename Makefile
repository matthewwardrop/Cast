.PHONY: clean cast doc

all: cast doc

clean: 
	rm -rf build jsdoc

cast:
	mkdir -p build
	python src/compile.py build/cast.js
	yui-compressor build/cast.js > build/cast.min.js

doc:
	mkdir -p jsdoc
	jsdoc -d jsdoc build/cast.js

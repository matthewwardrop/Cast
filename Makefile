all:
	mkdir -p build
	python src/compile.py build/cast.js
	yui-compressor build/cast.js > build/cast.min.js

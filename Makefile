all:
	mkdir -p build
	cat jquery.js iscroll.js cast.js > build/cast.static.js
	yui-compressor build/cast.static.js > build/cast.static.min.js
	rm build/cast.static.js
	yui-compressor cast.js > build/cast.min.js

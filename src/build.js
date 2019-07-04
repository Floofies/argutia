const babel = require('@babel/core');
const plugin = require('./Plugin.js');
module.exports = function build(source, options) {
	const output = babel.transform(source, {
		plugins: [plugin(options)],
		comments: false
	});
	return output.code;
};
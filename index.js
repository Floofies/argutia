const fs = require("fs");
function addIndent(source) {
	return source.replace(/^(?!\s*$)/mg, "\t".repeat(1));
}
function bundle(...sources) {
	var output = [];
	for (const path of sources) output.push(fs.readFileSync(path, { encoding: "utf8" }));
	return output.join("");
}
function plotPath(path) {
	path = path.split("/");
	path.pop();
	var curPath = path.shift();
	for (const node of path) {
		curPath = curPath + "/" + node;
		console.log(curPath);
		try {
			fs.statSync(curPath);
		} catch (error) {
			if (error.code === "ENOENT") {
				fs.mkdirSync(curPath);
			} else {
				console.error(error);
				process.exit(1);
			}
		}
	}
}
const concat = (...strings) => strings.join("");
function Builder(options = null) {
	this.options = this.createOptions();
	if (options !== null) Object.assign(this.options, options);
	if ("imports" in options) {
		for (const id of options.imports) this.imports.push(require(id));
	}
}
Builder.prototype.createOptions = function () {
	return {
		preamble: "",
		varName: "publicModule",
		inputs: [],
		middleware: [],
		output: "./"
	};
};
Builder.prototype.save = function (path, source) {
	plotPath(path);
	fs.writeFileSync(path, source, { encoding: "utf8" });
};
Builder.prototype.buildModule = function (options = null) {
	if (options === null) {
		options = Object.assign({}, this.options, options);
	} else {
		options = this.options;
	}
	var source = bundle(options.inputs);
	if ("middleware" in options) {
		if (Array.isArray(options.middleware)) {
			for (const code of options.middleware) {
				source = eval("(" + code + ")(source)");
			}
		} else {
			source = eval("(function(source, imports){(" + options.middleware + ")(source)})(source " + imports + ")");
		}
	}
	this.save(options.output, concat(
		options.preamble,
		"var " + options.varName + " = (function(module){\n",
		addIndent("'use strict';\n" + source),
		"return module;\n",
		"})({exports:{}});\n",
		"if (module !== undefined) module.exports = " + options.varName + ";"
	));
};
function cliBuild() {
	var args = process.argv.slice(2);
	if (args.length === 0) return;
	const options = JSON.parse(fs.readFileSync(args[0], { encoding: "utf8" }));
	const builder = new Builder(options);
	if ("builds" in options && args.length > 1) {
		const builds = args.slice(1);
		for (const build of builds) {
			if (build in options.builds) this.buildModule(options.builds[build]);
		}
	}
};
if (!module.parent) {
	cliBuild();
} else {
	module.exports = Builder;
}
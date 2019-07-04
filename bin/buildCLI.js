#!/usr/bin/env node
const fs = require('fs');
const build = require("../src/build.js");
const cliParser = require("command-line-args");
const pathOption = [
	{ name: 'path', defaultOption: true }
];
const mainOptions = cliParser(pathOption, { stopAtFirstUnknown: true });
const argv = mainOptions._unknown || [];
var args = {};
if ("path" in mainOptions) {
	//if (Object.keys(args).length > 1) throw new Error("Invalid command.");
	args.input = mainOptions.path;
}
if ("_unknown" in mainOptions) {
	const unknowns = [].concat(mainOptions._unknown);
	var buildOptions = [];
	for (const loc in unknowns) {
		const option = mainOptions._unknown[loc];
		if (
			option !== "input"
			&& option !== "source"
			&& option !== "output"
			&& option !== "path"
		) {
			buildOptions.push(option.slice(2, option.length));
			mainOptions._unknown.splice(loc, 1);
			argv.splice(argv.indexOf(option), 1);
		}
	}
	const cliOptions = [
		{ name: "input", alias: "i", type: String },
		{ name: "source", alias: "s", type: String },
		{ name: "output", alias: "o", type: String }
	];
	args = cliParser(cliOptions, { argv });
	if ("path" in mainOptions) args.input = mainOptions.path;
}
if (!("input" in args)) args.input = null;
if (!("source" in args)) args.source = null;
if (!("output" in args)) args.output = null;
const options = Object.keys(args);
options.splice(options.indexOf("input"), 1);
options.splice(options.indexOf("source"), 1);
options.splice(options.indexOf("output"), 1);
function inputSource(input, callback) {
	fs.readFile(input, function (error, buffer) {
		if (error) throw error;
		callback(buffer.toString());
	});
}
function stdInSource(callback) {
	var source = "";
	process.stdin.on("data", chunk => {
		source += chunk;
	});
	process.stdin.on("end", function () {
		callback(source);
	});
}
function outputCode(output, code) {
	console.log("Writing compiled file to " + output);
	fs.writeFile(output, code, function (error) {
		if (error) throw error;
		console.log("Compilation complete!");
	});
}
function stdOutCode(code) {
	process.stdout.write(code + "\n");
}
function compile(source) {
	const code = build(source, buildOptions);
	if (args.output !== null) {
		outputCode(args.output, code);
	} else {
		stdOutCode(code);
	}
}
if (args.input !== null) {
	if (args.output !== null) console.log("Opening " + args.input + " for compilation.");
	inputSource(args.input, compile);
} else {
	stdInSource(compile);
}
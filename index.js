#!/usr/bin/env node
const arguita = (function () {
	"use strict";
	const fs = require("fs");
	const COMMA = 44;
	const SEMICOLON = 59;
	const COLON = 58;
	const SPACE = 32;
	const LEFT_PARENTHESIS = 40;
	const RIGHT_PARENTHESIS = 41;
	const NUMERIC = [48, 57];
	const ALPHA = [[65, 90], [97, 122]];
	const ALPHA_SPACE = [...SPACE, ...ALPHA];
	const ALPHA_NUMERIC = [...NUMERIC, ...ALPHA];
	const ALPHA_NUMERIC_SPACE = [...SPACE, ...ALPHA_NUMERIC];
	function inRange(char, range) {
		if (typeof char !== "number") char = char.charCodeAt(0);
		return (char >= range[0] && char <= range[1]);
	}
	// Returns the first contiguous substring in `string`, starting at `start`, which precedes symbols found in `nt`.
	function scanToken(string, start = 0, nt = [" "]) {
		var subString = "";
		var char;
		_scanString: for (var loc = start; char = string[loc], loc < string.length; loc++) {
			_scanNonterminals: for (const ntString of nt) {
				var ntChar;
				_matchNonterminal: for (var mLoc = 0; ntChar = ntString[mLoc], mLoc < ntString.length; mLoc++) {
					if (string[loc + mLoc] !== ntChar) {
						break _matchNonterminal;
					}
					if (mLoc === ntString.length - 1) {
						break _scanString;
					}
				}
			}
			subString += char;
		}
		return subString;
	}
	// Returns the first contiguous substring in `string`, starting at `start`, which precedes symbols found in `ranges`.
	function scanRange(string, start = 0, ranges = SPACE) {
		if ((typeof ranges) === "string") {
			ranges = getRanges(ranges);
		}
		var subString = "";
		var char;
		var code;
		_scanString: for (var loc = start; loc < string.length; loc++) {
			char = string[loc];
			code = char.charCodeAt(0);
			_scanRange: for (const range of ranges) {
				if (
					((typeof range) === "number" && code === range)
					|| (code >= range[0] && code <= range[1])
				) {
					break _scanString;
				}
			}
			subString += char;
		}
		return subString;
	}
	function scanLoc(string, start = 0, nt = [" "]) {
		return string.length + start + scanToken(string, start, nt).length;
	}
	// Returns an ordered array containing the unique alphabet of `string`.
	function getAlphabet(string) {
		return Array.from(string)
			.map(symbol => symbol.charCodeAt(0))
			.sort((t1, t2) => t1 > t2)
			.filter((symbol, loc, symbols) => loc === 0 || symbol !== symbols[loc - 1]);
	}
	function getRanges(string) {
		var symbols = getAlphabet(string);
		var codeRanges = [];
		// Reduce contiguous ranges of codes down to arrays of two.
		symbols.forEach(function (symbol, loc) {
			var symbol = symbols[loc]
			if (loc !== 0 && symbol === symbols[loc - 1] + 1) {
				codeRanges[codeRanges.length - 1].push(symbol);
			} else {
				codeRanges.push([symbol]);
			}
		});
		// Complete the ranges for single codes.
		codeRanges.forEach(function (range) {
			if (range.length === 1) {
				range.push(range[0]);
			}
		});
		return codeRanges;
	}
	function findClosingPos(string, start = 0, opener = "{", closer = "}") {
		var depth = 1;
		var char;
		_scanString: for (var loc = start; char = string[loc], loc < string.length; loc++) {
			if (char === closer) {
				depth--;
				if (depth === 0) {
					return loc;
				}
			} else if (char === opener) {
				depth++;
			}
		}
		return null;
	}
	function ParseError(message) {
		Error.constructor.call(this, message);
	}
	ParseError.prototype = Error.prototype;
	function expect(char, expectation, line, col) {
		if (char !== expectation) throw new ParseError("\"" + expectation + "\" expected, but \"" + char + "\" found near L" + line + ":C" + col);
	}
	function expectRange(char, ranges, line, col) {
		if (typeof char !== "number") char = char.charCodeAt(0);
		_scanRange: for (const range of ranges) {
			if (char >= range[0] && char <= range[1]) {
				return;
			}
		}
		throw new ParseError("\"" + ranges.toString() + "\" expected, but \"" + char + "\" found near L" + line + ":C" + col);
	}
	function List(identifier, contents = [], args = null) {
		this.contents = contents;
		this.identifier = identifier;
		this.arguments = args;
	}
	function ListElement(value) {
		if (value instanceof List) {
			this.type = "list"
		} else {
			this.type = "identifier";
		}
		this.value = value;
	}
	function parseList(source, start = 0, line, col) {
		expect(source[start], "(", line, col);
		const listEnd = findClosingPos(source, start + 1, "(", ")");
		if (listEnd === null) throw new ParseError("Unexpected end of input. Closing \")\" was expected.")
		const list = source.slice(start, listEnd);
		const listField = list.slice(1, list.length - 1);
		const listContents = [];
		var char;
		for (var loc = 0; char = listField[loc], loc < listField.length; loc++) {
			// Parse a sublist
			if (char === "(") {
				listContents.push(parseList(source, loc, line, col));
				continue;
			}
			// Parse an identifier
			if (inRange(char, ALPHA_NUMERIC)) {
				var identifier = scanToken(source, loc);
				loc = identifier + loc;
				listContents.push(identifier);
				continue;
			}
			// Skip whitespace
			if (char === " ") continue;
		}
		const listTokens = Array.from(listField.split(",")).map(token => token.trim());
		return listTokens;
	}
	function Identifier(string, compliment = null) {
		this.type = "identifier";
		this.string = string;
		this.compliment = compliment;
	}
	function parseIdentifier(string, start) {
		var identifier = new Identifier(scanRange(string, loc, [SPACE, COLON, COMMA]));
		loc = identifier.length + loc;
		lookahead = source[loc];
		if (lookahead === ":") {
			var args = scanRange(string, loc, [SPACE, COMMA, LEFT_PARENTHESIS]);
			loc = args.length + loc;
			lookahead = source[loc];
			if (lookahead === "(") {
				var list = new List(identifier, parseList(source, loc, line, col));
				identifer.compliment = list;
			} else {
				identifier.arguments = args;
			}
		}
		return identifier;
	}
	function Builder(buildfile) {
		this.buildfilePath = buildfile;
		this.buildfile = fs.readFileSync(this.confPath);
		this.loc = 0;
		this.line = 1;
		this.col = 1;
	}
	// Parse a buildfile into an AST.
	Builder.prototype.parse = function (source) {
		if (source.length === 0) throw new ParseError("Blank input!");
		const ast = [];
		var lookahead = null;
		for (this.loc = 0; char = source[loc], loc < source.length; loc++) {
			if (inRange(char, ALPHA_NUMERIC)) {
				ast.push(parseIdentifier(source, loc));
			}
		}
		return ast;
	};
	// Check a buildfile for correctness.
	Builder.prototype.lint = function (path) {
		try {
			this.parse(fs.readFileSync(path));
		} catch (error) {
			return error.message;
		}
	};
	Builder.prototype.build = function (path) {

	};
	return Builder;
})();
module.exports = arguita;
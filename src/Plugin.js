function pluginFactory(options = []) {
	const visitor = {
		"LabeledStatement": {
			exit: function (path) {
				if (path.node.label.name !== "argutia") return;
				const labelBody = path.node.body;
				if (labelBody.type === "StringLiteral") {
					var labelStr = labelBody.expression.value;
				} else if (labelBody.type === "BlockStatement") {
					var blockBody = labelBody.body;
					if (
						blockBody.length === 0
						|| blockBody[0].type !== "ExpressionStatement"
						|| blockBody[0].expression.type !== "StringLiteral"
					) return;
					var labelStr = blockBody[0].expression.value;
				} else return;
				if (options.includes(labelStr)) {
					if (labelBody.type === "BlockStatement") {
						blockBody.shift();
						path.container.splice(path.key, 1, ...blockBody);
						path.skip();
					} else {
						path.remove();
						path.skip();
					}
				} else {
					if (labelBody.type === "BlockStatement") {
						path.remove();
						path.skip();
					} else {
						var parentPath = path.getFunctionParent();
						if (parentPath === null) parentPath = path.scope.getProgramParent();
						if (path.container.length >= path.key) {
							path.container.splice(path.key + 1, 1);
						}
						path.remove();
						path.skip();
					}
				}
			}
		}
	};
	return function Plugin(babel) {
		return { visitor: visitor };
	}
}
module.exports = pluginFactory;
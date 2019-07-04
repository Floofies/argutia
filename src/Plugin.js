function pluginFactory(options = []) {
	const visitor = {
		"LabeledStatement": {
			exit: function (path) {
				const labelBody = path.node.body;
				if (
					path.node.label.name !== "argutia"
					|| labelBody.type !== "ExpressionStatement"
					|| labelBody.expression.type !== "StringLiteral"
				) return;
				if (options.includes(labelBody.expression.value)) {
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
	};
	return function Plugin(babel) {
		return { visitor: visitor };
	}
}
module.exports = pluginFactory;
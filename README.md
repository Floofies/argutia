# argutia
Noun; clever use of words; verbal trickery; sophistry.

Argutia is an incredibly basic JavaScript source code pre-processor plugin for Babel. Put simply, the plugin removes/retains specific source code based on user-supplied arguments.

A labeled string or block statement marks the succeeding atom of source code to be removed or retained. The string specifies the argument which must be supplied in order to retain the source code.

**Labeled string syntax marks the single succeeding source code atom:**

```JavaScript
argutia: "keepFoo";
foo();
```

**Block statement syntax marks all of the source code inside the statement:**

```JavaScript
argutia: {
	"keepFoo";
	foo();
}
```

The function call `foo()` will now only be retained if the argument `keepFoo` is given to the plugin.

# Using the Plugin Module

In the below example, `foo()` is retained because the `keepFoo` option is given to the plugin. To set the plugin up, call it with an array of arguments.

```JavaScript
const babel = require('@babel/core');
const argutia = require('argutia');
const options = ["keepFoo"];
const plugin = argutia(options)
const source = "argutia:'keepFoo'; foo();";
const output = babel.transform(source, {
	plugins: [plugin],
	comments: false
});
console.log(output.code);
```

The console output from the above example is `foo();`

If you would like to group multiple atoms of source code together, you can instead use a block statement:

```JavaScript
const source = "argutia: {'keepFoo'; foo(); bar(); baz(); }";
```

The console output would then be `foo(); bar(); baz();`

# Using the Command-Line Interface

The `argutia` command imports the plugin module and Babel, wrapping it in a simple command-line interface. Source code input is consumed and returned via the standard input of the terminal by default; options may be used to specify input/output file paths instead.

You can invoke the interface script like so, shown here with the `keepFoo` argument:

```bash
echo "argutia:'keepFoo'; foo();" | argutia --keepFoo
```

You can also supply input and output paths with the `-i` and `-o` parameters:

```bash
argutia --keepFoo -i path/to/my/script.js -o path/to/my/output.js
```

# Command-Line Options

`--<any>`

- Supplying any double-dashed option other than the below options will supply the argument to the plugin, retaining any source code which has been marked with a matching labeled string.

`-i` *path* (`--input` or `--path`)

- This option supplies the text from the given filepath as the input JavaScript source code you would like to compile. If this option is set to nothing, or is not set at all, then the source code is consumed via the standard input of the terminal.

`-o` *path* (`--output`)

- This option specifies a filepath which the compiled source code will be saved to. If this option is set to nothing, or is not set at all, then the source code is returned via standard output into the terminal.

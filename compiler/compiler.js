import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import generate from "@babel/generator";

const srcDir = path.join(process.cwd(), "src/components");
const outDir = path.join(process.cwd(), "src/.compiled");
const registryPath = path.join(outDir, "_componentRegistry.js");

function parseToAST(code) {
  return parse(code, {
    sourceType: "module",
    plugins: ["jsx"],
  });
}

function transformSpeckAST(ast) {
  const result = [];
  for (const node of ast.program.body) {
    if (node.type === "ExpressionStatement") {
      const expr = node.expression;
      if (expr.type === "JSXElement" || expr.type === "JSXFragment") {
        result.push(transformJSXElement(expr));
      }
    }
  }
  return { type: "Document", body: result };
}

function transformJSXElement(el) {
  if (el.type === "JSXFragment") {
    return {
      type: "Fragment",
      children: el.children.map(transformChild).filter(Boolean),
    };
  }

  const tagName = el.openingElement.name.name;
  console.log("Compiling tag:", tagName);

  if (tagName === "state") {
    const attr = el.openingElement.attributes[0];
    const parsed = parseAttributeValue(attr.value);

    // Determine if this is a hook-style state declaration
    const isHook =
      parsed?.type === "JSXExpressionContainer" &&
      parsed.expression.type !== "NumericLiteral" &&
      parsed.expression.type !== "StringLiteral" &&
      parsed.expression.type !== "BooleanLiteral";

    // console.log("STATE NODE", {
    //   name: attr.name.name,
    //   value: parsed,
    //   isHook,
    // });

    return {
      type: "StateDeclaration",
      name: attr.name.name,
      value: isHook ? parsed.expression : parsed,
      hook: isHook,
    };
  }

  if (tagName === "Router") {
    return {
      type: "RouterBlock",
      children: el.children.map(transformChild).filter(Boolean),
    };
  }

  if (tagName === "route") {
    const pathAttr = el.openingElement.attributes.find(
      (attr) => attr.name.name === "path"
    );
    const letAttr = el.openingElement.attributes.find(
      (attr) => attr.name.name === "let"
    );

    const path = pathAttr?.value?.value || "/";
    const letVar =
      letAttr?.value?.type === "JSXExpressionContainer"
        ? letAttr.value.expression.name
        : letAttr?.value?.value || null;

    return {
      type: "RouteBlock",
      path,
      letVar,
      children: el.children.map(transformChild).filter(Boolean),
    };
  }

  if (tagName === "props") {
    if (el.children.length === 0) {
      return { type: "Props", spread: true };
    }

    const propNames = el.children
      .filter((child) => child.type === "JSXText")
      .flatMap((child) =>
        child.value
          .split(/\s+/) // split by whitespace
          .map((v) => v.trim())
          .filter(Boolean)
      );

    return { type: "Props", names: propNames };
  }

  if (tagName === "if") {
    const attr = el.openingElement.attributes[0];

    const condition = attr?.value?.expression || {
      type: "Identifier",
      name: "false", // fallback if nothing is provided
    };

    return {
      type: "IfBlock",
      condition,
      children: el.children.map(transformChild).filter(Boolean),
    };
  }

  if (tagName === "loop") {
    const ofAttr = el.openingElement.attributes.find(
      (attr) => attr.name.name === "of"
    );
    const letAttr = el.openingElement.attributes.find(
      (attr) => attr.name.name === "let"
    );

    const ofExpr = ofAttr?.value?.expression;
    const loopVar = letAttr?.value?.expression?.name;

    const isAsync =
      ofExpr?.type === "CallExpression" || ofExpr?.type === "AwaitExpression";

    if (isAsync) {
      // Wrap in implicit async block
      return {
        type: "AsyncBlock",
        promise: ofExpr,
        then: [
          {
            type: "LoopBlock",
            items: {
              type: "JSXExpressionContainer",
              expression: {
                type: "Identifier",
                name: "data",
              },
            },

            loopVar,
            children: el.children.map(transformChild).filter(Boolean),
          },
        ],
        catch: [],
        loading: [],
        thenAlias: "data",
        catchAlias: "error",
      };
    }

    // If not async, return regular LoopBlock
    return {
      type: "LoopBlock",
      items: {
        type: "JSExpression",
        expression: ofExpr,
      },
      loopVar,
      children: el.children.map(transformChild).filter(Boolean),
    };
  }

  if (tagName === "slot") {
    const nameAttr = el.openingElement.attributes.find(
      (attr) => attr.name.name === "name"
    );

    return {
      type: "Slot",
      name: nameAttr?.value?.value || null, // raw string value like "header"
    };
  }

  if (tagName === "onMount") {
    return {
      type: "OnMount",
      children: el.children.map(transformChild).filter(Boolean),
    };
  }

  if (tagName === "async") {
    const keyAttr = el.openingElement.attributes.find(
      (attr) => attr.name.name === "key"
    );
    const keyExpr = keyAttr?.value?.expression;

    const promiseAttr = el.openingElement.attributes.find(
      (attr) => attr.name.name === "promise"
    );

    const promiseExpr = promiseAttr?.value?.expression;

    const thenBlock = el.children.find(
      (child) =>
        child.type === "JSXElement" && child.openingElement.name.name === "then"
    );

    const catchBlock = el.children.find(
      (child) =>
        child.type === "JSXElement" &&
        child.openingElement.name.name === "catch"
    );

    const loadingBlock = el.children.find(
      (child) =>
        child.type === "JSXElement" &&
        child.openingElement.name.name === "loading"
    );

    const thenLetAttr = thenBlock?.openingElement.attributes.find(
      (attr) => attr.name.name === "let"
    );
    const catchLetAttr = catchBlock?.openingElement.attributes.find(
      (attr) => attr.name.name === "let"
    );

    const thenAlias = thenLetAttr?.value?.expression?.name || "data";
    const catchAlias = catchLetAttr?.value?.expression?.name || "error";

    return {
      type: "AsyncBlock",
      promise: promiseExpr,
      key: keyExpr,
      then: thenBlock
        ? thenBlock.children.map(transformChild).filter(Boolean)
        : [],
      catch: catchBlock
        ? catchBlock.children.map(transformChild).filter(Boolean)
        : [],
      loading: loadingBlock
        ? loadingBlock.children.map(transformChild).filter(Boolean)
        : [],
      thenAlias,
      catchAlias,
    };
  }

  if (tagName === "switch") {
    const onAttr = el.openingElement.attributes.find(
      (attr) => attr.name.name === "on"
    );
    const switchValue = onAttr?.value?.expression;

    return {
      type: "SwitchBlock",
      value: switchValue,
      cases: el.children
        .filter(
          (c) =>
            c.type === "JSXElement" && c.openingElement.name.name === "case"
        )
        .map(transformCaseBlock), // ✅ NOW IN USE
    };
  }

  return {
    type: "Component",
    name: tagName,
    attributes: el.openingElement.attributes.map((attr) => {
      // ✅ Handle spread attributes like {...props}
      if (attr.type === "JSXSpreadAttribute") {
        return {
          key: "...",
          value: generate.default(attr.argument).code, // usually "props"
        };
      }

      return {
        key: attr.name.name,
        value: parseAttributeValue(attr.value),
      };
    }),

    children: el.children.map(transformChild).filter(Boolean),
  };
}

function transformChild(child) {
  if (child.type === "JSXElement") {
    const slotAttr = child.openingElement.attributes.find(
      (attr) => attr.name?.name === "slot"
    );

    if (slotAttr && slotAttr.value?.type === "StringLiteral") {
      return {
        type: "NamedSlotContent",
        name: slotAttr.value.value,
        element: transformJSXElement(child),
      };
    }

    return transformJSXElement(child); // Default element
  }

  if (child.type === "JSXText") {
    const trimmed = child.value.trim();
    return trimmed ? { type: "Text", value: trimmed } : null;
  }

  if (child.type === "JSXExpressionContainer") {
    return {
      type: "JSExpression",
      expression: child.expression,
    };
  }

  return null;
}

function parseAttributeValue(valueNode) {
  if (!valueNode) return true;

  // Handles: title="Hello"
  if (valueNode.type === "StringLiteral") {
    return valueNode.value;
  }

  // Handles: title={user.title} or content={props.foo}
  if (valueNode.type === "JSXExpressionContainer") {
    return {
      type: "JSXExpressionContainer",
      expression: valueNode.expression,
    };
  }

  // Handles: title={5} or title={true}
  if (valueNode.type === "NumericLiteral") return valueNode.value;
  if (valueNode.type === "BooleanLiteral") return valueNode.value;

  return null;
}

function compileNode(node, currentComponentName) {
  switch (node.type) {
    case "Component": {
      const tag = node.name;
      const isCustom = /^[A-Z]/.test(tag);

      // 🔁 Named slot content becomes props
      const namedSlotProps = node.children
        .filter((c) => c.type === "NamedSlotContent")
        .map((c) => compileNode(c, currentComponentName))
        .join(" ");

      // 🔁 Standard or spread props
      const compiledAttributes = node.attributes.map((attr) => {
        // Spread prop: {...props}
        if (attr.key === "..." && attr.value) {
          return `{...${attr.value}}`;
        }

        // JSX expression container (e.g. {user.heading})
        if (attr.value?.type === "JSXExpressionContainer") {
          return `${attr.key}={${
            generate.default(attr.value.expression).code
          }}`;
        }

        // String literal
        if (typeof attr.value === "string") {
          const isArrow = attr.value.trim().startsWith("() =>");
          if (isArrow) {
            return `${attr.key}={${attr.value}}`;
          }

          const escaped = attr.value.replace(/"/g, `'`);
          return `${attr.key}="${escaped}"`;
        }

        // Fallback (if it's raw JS string)
        return `${attr.key}={${attr.value}}`;
      });

      const allProps = [...compiledAttributes, namedSlotProps]
        .filter(Boolean)
        .join(" ");

      // ✅ Custom component
      if (isCustom && tag !== currentComponentName) {
        return `<${tag} ${allProps} />`;
      }

      // 🔁 Native HTML element
      const attrs = compiledAttributes.join(" ");
      const children = node.children
        .filter((c) => c.type !== "NamedSlotContent")
        .map((c) => compileNode(c, currentComponentName))
        .join("");

      return `<${tag} ${attrs}>${children}</${tag}>`;
    }

    case "JSExpression":
      return `{${generate.default(node.expression).code}}`;

    case "Text":
      return node.value;

    case "IfBlock": {
      const condition = node.condition
        ? generate.default(node.condition).code
        : "false";

      const children = node.children
        .map((c) => compileNode(c, currentComponentName))
        .join("");

      return `{${condition} && (${children})}`;
    }

    case "Fragment":
      return node.children
        .map((c) => compileNode(c, currentComponentName))
        .join("");

    case "RouterBlock": {
      const routes = node.children
        .filter((r) => r.type === "RouteBlock")
        .map((r) => compileNode(r, currentComponentName))
        .join("\n");

      return `{(() => {
            const path = location.pathname;
            ${routes}
            return null;
          })()}`;
    }

    case "RouteBlock": {
      const hasParams = node.path.includes(":");
      const childrenJSX = (scopeVar) =>
        node.children.map((c) => compileNode(c, scopeVar)).join("");

      console.log("🚧 Route path:", node.path);
      console.log("➡️ letVar:", node.letVar);

      if (hasParams) {
        const pathRegex = node.path.replace(/:[^/]+/g, "([^/]+)");
        const keys = [...node.path.matchAll(/:([^/]+)/g)].map((m) => m[1]);
        const matchVar = `match_${node.path
          .replace(/[^\w]/g, "_")
          .replace(/_{2,}/g, "_")
          .replace(/^_|_$/g, "")}`;

        const matchExpr = `new RegExp('^${pathRegex}$').exec(path)`;

        if (node.letVar) {
          const scope = node.letVar;
          return [
            `const ${matchVar} = ${matchExpr};`,

            `if (${matchVar}) {`,
            `  const ${scope} = { ${keys
              .map((k, i) => `${k}: ${matchVar}[${i + 1}]`)
              .join(", ")} };`,
            `  return (<>
        ${childrenJSX(scope)}
      </>);`,
            `}`,
          ].join("\n");
        } else {
          return [
            `if (${matchExpr}) {`,
            `  return (<>
        ${childrenJSX()}
      </>);`,
            `}`,
          ].join("\n");
        }
      } else {
        const matchExpr = `path === "${node.path}"`;

        if (node.letVar) {
          return [
            `if (${matchExpr}) {`,
            `  const ${node.letVar} = {};`,
            `  return (<>
        ${childrenJSX(node.letVar)}
      </>);`,
            `}`,
          ].join("\n");
        } else {
          return [
            `if (${matchExpr}) {`,
            `  return (<>
        ${childrenJSX()}
      </>);`,
            `}`,
          ].join("\n");
        }
      }
    }

    case "LoopBlock": {
      const sourceExpr = node.items?.expression || node.items; // support JSXExpressionContainer or JSExpression
      const source = generate.default(sourceExpr).code;
      const loopVar = node.loopVar || "item"; // fallback

      const children = node.children
        .map((c) => compileNode(c, loopVar)) // 👈 pass loop variable as the scope
        .join("");

      return `{${source}.map((_item, idx) => {
          const ${loopVar} = _item;
          return (
            <>
              ${children}
            </>
          );
        })}`;
    }

    case "Slot":
      return node.name ? `{props["${node.name}"]}` : `{props.children}`;

    case "NamedSlotContent": {
      const content = compileNode(node.element, currentComponentName);
      return `${node.name}={${content}}`;
    }
    case "OnMount": {
      const body = node.children
        .map((c) => {
          if (c.type === "JSExpression") {
            return generate.default(c.expression).code + ";";
          }
          return null;
        })
        .filter(Boolean)
        .join("\n");

      return `useEffect(() => {\n${body}\n}, []);`;
    }

    case "AsyncBlock": {
      const promiseCode = generate.default(node.promise).code;

      // Inject hook-based tracking
      const deps = node.key ? `[${generate.default(node.key).code}]` : `[]`;

      const setup = [
        `const [status, setStatus] = useState("pending");`,
        `const [data, setData] = useState(null);`,
        `const [error, setError] = useState(null);`,
        `useEffect(() => {`,
        `  (${promiseCode})`,
        `    .then((result) => { setData(result); setStatus("fulfilled"); })`,
        `    .catch((err) => { setError(err); setStatus("rejected"); });`,
        `}, ${deps});`,
      ].join("\n");

      const thenBody = node.then
        .map((c) => {
          if (c.type === "LoopBlock") {
            return compileNode(c, currentComponentName); // ✅ Correct scoping will happen inside LoopBlock
          }
          return compileNode(c, node.thenAlias);
        })
        .join("");

      const catchBody = node.catch
        .map((c) => compileNode(c, node.catchAlias))
        .join("");

      const loadingBody = node.loading
        .map((c) => compileNode(c, "data"))
        .join("");

      return [
        `{(() => {`,
        `  ${setup}`,
        `  if (status === "fulfilled") {`,
        `    ${
          node.thenAlias !== "data" ? `const ${node.thenAlias} = data;` : ""
        }`,
        `    return <>${thenBody}</>;`,
        `  }`,
        `  if (status === "rejected") {`,
        `    ${
          node.catchAlias !== "error" ? `const ${node.catchAlias} = error;` : ""
        }`,
        `    return <>${catchBody}</>;`,
        `  }`,
        `  return <>${loadingBody}</>;`,
        `})()}`,
      ].join("\n");
    }

    case "SwitchBlock": {
      const switchValue = generate.default(node.value).code;

      const cases = node.cases
        .map((c) => {
          const children = c.children
            .map((child) => compileNode(child, currentComponentName))
            .join("");
          return `case "${c.value}": return <>${children}</>;`;
        })
        .join("\n");

      return `{(() => {
        switch (${switchValue}) {
          ${cases}
          default: return null;
        }
      })()}`;
    }

    default:
      return "";
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateJsCode(ast, currentComponentName) {
  const rootComponent = ast.body.find((n) => n.type === "Component");
  const rootNode = rootComponent || ast.body[0]; // fallback to first node

  const propsNode = rootComponent?.children.find((n) => n.type === "Props");
  const stateVars =
    rootComponent?.children.filter((n) => n.type === "StateDeclaration") || [];

  const onMountNodes =
    rootComponent?.children.filter((n) => n.type === "OnMount") || [];

  const onMountCode = onMountNodes
    .map((n) =>
      n.children
        .map((c) => {
          if (c.type === "JSExpression") {
            return generate.default(c.expression).code + ";";
          }
          return null;
        })
        .filter(Boolean)
        .join("\n")
    )
    .filter(Boolean)
    .join("\n");

  const onMountHook = onMountCode
    ? `useEffect(() => {\n${onMountCode}\n}, []);`
    : "";

  let jsxBody = "";

  if (rootNode.type === "Component") {
    jsxBody = rootNode.children
      .filter((n) => n.type !== "OnMount")
      .map((n) => compileNode(n, currentComponentName))
      .join("\n");
  } else {
    jsxBody = compileNode(rootNode, currentComponentName);
  }

  const jsxUsesSetter = (setterName) => jsxBody.includes(setterName);

  let needsForceRender = false;
  let persistentVars = [];

  const stateSetup = stateVars
    .map((n) => {
      let value;

      if (!n.value?.type) {
        value = JSON.stringify(n.value);
      } else if (
        n.value.type === "NumericLiteral" ||
        n.value.type === "StringLiteral" ||
        n.value.type === "BooleanLiteral"
      ) {
        value = JSON.stringify(n.value.value);
      } else {
        value = generate.default(n.value.expression || n.value).code;
      }

      if (!n.name) throw new Error(`Missing state name: ${JSON.stringify(n)}`);

      const setter = `set${capitalize(n.name)}`;
      const shouldUseHook = n.hook || jsxUsesSetter(setter);

      if (shouldUseHook) {
        return `const [${n.name}, ${setter}] = useState(${value});`;
      } else {
        needsForceRender = true;
        persistentVars.push(n.name);
        return [
          `const _${n.name}Ref = useRef(${value});`,
          `let ${n.name} = _${n.name}Ref.current;`,
        ].join("\n");
      }
    })
    .join("\n");

  const updateFunction = needsForceRender
    ? `
        const [, _forceRender] = useState(0);
        function update() {
          ${persistentVars
            .map((v) => `_${v}Ref.current = ${v};`)
            .join("\n    ")}
          _forceRender((x) => x + 1);
        }
        `
    : "";

  const usedComponents =
    jsxBody.match(/<([A-Z][a-zA-Z0-9]*)\b/g)?.map((x) => x.replace("<", "")) ||
    [];

  // ✅ handle props
  let functionSignature = `export default function ${currentComponentName}(props)`;
  if (propsNode) {
    if (propsNode.spread) {
      functionSignature = `export default function ${currentComponentName}(props)`;
    } else if (propsNode.names?.length) {
      const names = propsNode.names.join(", ");
      functionSignature = `export default function ${currentComponentName}({ ${names} })`;
    }
  }

  return `
  // ⚠️ AUTO-GENERATED BY SPECK. DO NOT EDIT.
  // This file was compiled from a .speck component.
  
  import { h } from 'preact';

  import { useState${
    needsForceRender ? ", useRef" : ""
  }, useEffect } from 'preact/hooks';

  import { ${usedComponents.join(", ")} } from './_componentRegistry.js';

  ${functionSignature} {
    ${stateSetup}
    ${updateFunction}
    ${onMountHook}
    return (
      <div>
        ${jsxBody}
      </div>
    );
  }
`;
}

function generateComponentRegistry() {
  const files = fs
    .readdirSync(outDir)
    .filter((f) => f.endsWith(".jsx") && f !== "_componentRegistry.js");

  const imports = files
    .map((f) => {
      const name = path.basename(f, ".jsx");
      return `import ${name} from './${name}.jsx';`;
    })
    .join("\n");

  const exports = files.map((f) => path.basename(f, ".jsx")).join(", ");

  const content = `${imports}\n\nexport {\n  ${exports}\n};\n`;

  fs.writeFileSync(registryPath, content);
  console.log("✅ Registry updated: _componentRegistry.js");
}

(async () => {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const speckFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith(".speck"));

  for (const file of speckFiles) {
    const componentName = path.basename(file, ".speck");
    const speckCode = fs.readFileSync(path.join(srcDir, file), "utf-8");
    console.log("🔍 Compiling:", file);
    try {
      const babelAst = parseToAST(speckCode);
      const speckAst = transformSpeckAST(babelAst);
      const rawJsCode = generateJsCode(speckAst, componentName);
      const cleanedCode = rawJsCode
        .replace(/React\.useState/g, "useState")
        .replace(/React\.useEffect/g, "useEffect")
        .replace(/React\.useRef/g, "useRef")
        .replace(/React\./g, ""); // ← ✨ remove lingering React. if any

      const jsCode = cleanedCode;

      const outputFileName = file.replace(".speck", ".jsx");
      fs.writeFileSync(path.join(outDir, outputFileName), jsCode);
      console.log(`✅ Compiled successfully: ${file} → ${outputFileName}`);
    } catch (error) {
      console.error(`❌ Error parsing ${file}:`, error.message);
    }
  }

  generateComponentRegistry();
})();

function transformCaseBlock(el) {
  const whenAttr = el.openingElement.attributes.find(
    (attr) => attr.name.name === "when"
  );
  const caseValue = whenAttr?.value?.value || null;

  return {
    type: "CaseBlock",
    value: caseValue,
    children: el.children.map(transformChild).filter(Boolean),
  };
}

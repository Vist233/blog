const markerPattern = /^!!!\s+([a-zA-Z-]+)(?:\s+["“]([^"”]+)["”])?\s*\n?/;

function visit(node, parent = null) {
  if (!node || !Array.isArray(node.children)) {
    return;
  }

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index];

    if (child.type === "paragraph" && child.children?.[0]?.type === "text") {
      const match = child.children[0].value.match(markerPattern);

      if (match) {
        const [, type, title = type] = match;
        child.children[0].value = child.children[0].value.replace(markerPattern, "");

        if (child.children[0].value.length === 0) {
          child.children.shift();
        }

        child.children.unshift(
          { type: "strong", children: [{ type: "text", value: `${type.toUpperCase()} / ${title}` }] },
          { type: "break" },
        );

        node.children[index] = {
          type: "blockquote",
          data: {
            hProperties: {
              className: ["admonition", `admonition-${type}`],
            },
          },
          children: [child],
        };
      }
    }

    visit(node.children[index], parent ?? node);
  }
}

export default function remarkAdmonitions() {
  return (tree) => visit(tree);
}

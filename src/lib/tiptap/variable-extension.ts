import { Node, mergeAttributes } from '@tiptap/core';

export interface VariableOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variable: {
      insertVariable: (attrs: { tag: string; label: string }) => ReturnType;
    };
  }
}

export const Variable = Node.create<VariableOptions>({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  marks: '_',

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      tag: { default: '' },
      label: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-variable': node.attrs.tag,
        class: 'variable-pill',
      }),
      node.attrs.label,
    ];
  },

  renderText({ node }) {
    return node.attrs.label;
  },

  addCommands() {
    return {
      insertVariable:
        attrs =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs })
            .run(),
    };
  },
});

import { Extension } from '@tiptap/core';

// Préserve le retrait (margin-left / text-indent) des paragraphes et titres
// collés depuis Word ou Google Docs, sinon perdu au collage.
export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return { types: ['paragraph', 'heading'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          marginLeft: {
            default: null,
            parseHTML: element => element.style.marginLeft || null,
            renderHTML: attrs => (attrs.marginLeft ? { style: `margin-left: ${attrs.marginLeft}` } : {}),
          },
        },
      },
    ];
  },
});

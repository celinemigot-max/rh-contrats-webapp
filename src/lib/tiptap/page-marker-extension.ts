import { Node, mergeAttributes, nodeInputRule, nodePasteRule } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageMarker: {
      insertPageMarker: () => ReturnType;
    };
  }
}

// Repère de page manuel : tape "Repère" seul sur une ligne (puis Espace ou Entrée) pour
// insérer une ligne rouge à cet endroit précis. Contrairement au repère automatique
// (approximatif au-delà de la page 1), celui-ci reste exactement où l'utilisateur l'a
// placé. Il est retiré du HTML avant l'export Word/PDF (voir stripPageMarkers).
export const PageMarker = Node.create({
  name: 'pageMarker',
  group: 'block',
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: 'div[data-page-marker]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-page-marker': 'true', class: 'page-marker' })];
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /^Repère[\s]$/,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: /^Repère$/gm,
        type: this.type,
      }),
    ];
  },

  addCommands() {
    return {
      insertPageMarker:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: this.name }).run(),
    };
  },
});

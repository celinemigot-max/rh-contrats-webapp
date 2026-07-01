import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Slice } from '@tiptap/pm/model';

// Quand on colle plusieurs paragraphes, ProseMirror fusionne parfois le premier
// paragraphe collé avec le paragraphe existant à l'endroit du curseur, ce qui lui
// fait perdre son alignement/retrait d'origine (ex. "justifié" devient "gauche").
// On force le collage à toujours insérer des paragraphes neufs plutôt que de les
// fusionner, pour que la mise en forme collée soit toujours respectée.
export const PreservePasteFormatting = Extension.create({
  name: 'preservePasteFormatting',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          transformPasted(slice) {
            if (slice.content.childCount > 1 && (slice.openStart > 0 || slice.openEnd > 0)) {
              return new Slice(slice.content, 0, 0);
            }
            return slice;
          },
        },
      }),
    ];
  },
});

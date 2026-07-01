'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';
import { Variable } from '@/lib/tiptap/variable-extension';

export type VariableDef = { tag: string; label: string };

export default function RichEditor({
  initialContent,
  onReady,
  editable = true,
  placeholder = 'Rédige ton contrat ici…',
}: {
  initialContent: string;
  onReady?: (editor: Editor) => void;
  editable?: boolean;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit, Variable, Underline, Placeholder.configure({ placeholder })],
    content: initialContent,
    editable,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && onReady) onReady(editor);
  }, [editor, onReady]);

  return (
    <div className="rich-editor border rounded-lg bg-white">
      {editor && (
        <div className="flex gap-1 border-b p-2 flex-wrap">
          <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            Gras
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            Italique
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            Souligné
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            Barré
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            Titre
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            Liste
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[400px] focus:outline-none" />
    </div>
  );
}

function ToolbarButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-2.5 py-1 rounded-md transition ${active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
    >
      {children}
    </button>
  );
}

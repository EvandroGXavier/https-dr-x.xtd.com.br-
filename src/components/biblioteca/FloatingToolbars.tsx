// src/components/biblioteca/FloatingToolbars.tsx
import React from "react";
import { Editor } from "@tiptap/react";
import { BubbleMenu as BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
import { FloatingMenu as FloatingMenuPlugin } from "@tiptap/extension-floating-menu";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Quote } from "lucide-react";

export function BubbleToolbar({ editor }: { editor: Editor }) {
  if (!editor) return null;
  
  const [isVisible, setIsVisible] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateMenu = () => {
      const { state } = editor;
      const { selection } = state;
      const { from, to } = selection;
      
      if (from === to) {
        setIsVisible(false);
        return;
      }
      
      setIsVisible(true);
    };

    editor.on('selectionUpdate', updateMenu);
    editor.on('transaction', updateMenu);
    
    return () => {
      editor.off('selectionUpdate', updateMenu);
      editor.off('transaction', updateMenu);
    };
  }, [editor]);

  if (!isVisible) return null;

  return (
    <div ref={menuRef} className="absolute z-50 rounded-xl border bg-background shadow-lg px-1 py-1 flex gap-1">
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16}/></Button>
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16}/></Button>
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline size={16}/></Button>
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16}/></Button>
    </div>
  );
}

export function ParagraphFloating({ editor }: { editor: Editor }) {
  if (!editor) return null;
  
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const updateMenu = () => {
      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;
      
      // Show only at the start of an empty paragraph
      if ($from.parent.type.name === 'paragraph' && $from.parent.textContent.length === 0) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    editor.on('selectionUpdate', updateMenu);
    editor.on('transaction', updateMenu);
    
    return () => {
      editor.off('selectionUpdate', updateMenu);
      editor.off('transaction', updateMenu);
    };
  }, [editor]);

  if (!isVisible) return null;

  return (
    <div className="absolute z-50 rounded-xl border bg-background shadow-lg px-1 py-1 flex gap-1">
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={16}/></Button>
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={16}/></Button>
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={16}/></Button>
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify size={16}/></Button>
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16}/></Button>
      <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16}/></Button>
    </div>
  );
}

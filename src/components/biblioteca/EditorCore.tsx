// src/components/biblioteca/EditorCore.tsx
import React, { useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Blockquote from '@tiptap/extension-blockquote'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import CharacterCount from '@tiptap/extension-character-count'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  Download, Upload, Code, Copy, AlignJustify, AlignLeft, AlignCenter, 
  AlignRight, Bold, Italic, Underline as UnderlineIcon, ListOrdered, 
  List, Quote, Link as LinkIcon, Image as ImageIcon, Eraser, Minus 
} from 'lucide-react'

type EditorCoreProps = {
  html?: string;
  onChangeHtml?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export type EditorCoreRef = {
  getHtml: () => string;
  setHtml: (html: string) => void;
  focus: () => void;
}

const EditorCore = forwardRef<EditorCoreRef, EditorCoreProps>(function EditorCore(
  { html = '', onChangeHtml, placeholder = 'Digite seu texto…', readOnly = false },
  ref
) {
  const [sourceMode, setSourceMode] = useState(false)
  const [sourceValue, setSourceValue] = useState(html)

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
        blockquote: false,
        horizontalRule: false,
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Color,
      TextStyle,
      Highlight,
      Image.configure({ inline: false, HTMLAttributes: { class: 'mx-auto max-w-full' } }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Blockquote,
      HorizontalRule,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
    ],
    content: html || '<p></p>',
    onUpdate: ({ editor }) => {
      const current = editor.getHTML()
      onChangeHtml?.(current)
      if (sourceMode) setSourceValue(current)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[280px] px-4 py-2',
      },
    },
  })

  // Compatibilidade: reidratar quando prop html mudar externamente
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (html != null && html !== current) {
      editor.commands.setContent(html)
      if (sourceMode) setSourceValue(html)
    }
  }, [html, editor, sourceMode])

  // Expor API compatível (getHtml/setHtml)
  useImperativeHandle(ref, () => ({
    getHtml: () => editor?.getHTML() ?? '',
    setHtml: (value: string) => {
      editor?.commands.setContent(value || '<p></p>')
      setSourceValue(value || '')
    },
    focus: () => editor?.commands.focus(),
  }), [editor])

  const toggleSource = () => {
    if (!editor) return
    if (!sourceMode) {
      setSourceValue(editor.getHTML())
      setSourceMode(true)
      editor.setEditable(false)
    } else {
      editor.commands.setContent(sourceValue || '<p></p>')
      editor.setEditable(!readOnly)
      setSourceMode(false)
    }
  }

  const importFromFile = async (file: File) => {
    const text = await file.text()
    setSourceValue(text)
    if (!sourceMode) {
      editor?.commands.setContent(text || '<p></p>')
    }
  }

  const exportToFile = () => {
    const data = editor?.getHTML() ?? sourceValue ?? ''
    const blob = new Blob([data], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'documento.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyHtml = async () => {
    const data = editor?.getHTML() ?? sourceValue ?? ''
    await navigator.clipboard.writeText(data)
  }

  const ToolbarButton: React.FC<React.ComponentProps<typeof Button>> = (props) => (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" {...props} />
  )

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-3">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 pb-2 border-b">
          <ToolbarButton 
            onClick={() => editor?.chain().focus().toggleBold().run()} 
            aria-label="Negrito" 
            title="Negrito (Ctrl+B)"
          >
            <Bold size={16}/>
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor?.chain().focus().toggleItalic().run()} 
            aria-label="Itálico" 
            title="Itálico (Ctrl+I)"
          >
            <Italic size={16}/>
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor?.chain().focus().toggleUnderline().run()} 
            aria-label="Sublinhar"
          >
            <UnderlineIcon size={16}/>
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          <ToolbarButton 
            onClick={() => editor?.chain().focus().setTextAlign('left').run()} 
            aria-label="Alinhar à esquerda" 
            title="Alinhar à esquerda"
          >
            <AlignLeft size={16}/>
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor?.chain().focus().setTextAlign('center').run()} 
            aria-label="Centralizar" 
            title="Centralizar"
          >
            <AlignCenter size={16}/>
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor?.chain().focus().setTextAlign('right').run()} 
            aria-label="Alinhar à direita" 
            title="Alinhar à direita"
          >
            <AlignRight size={16}/>
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor?.chain().focus().setTextAlign('justify').run()} 
            aria-label="Justificar" 
            title="Justificar texto"
          >
            <AlignJustify size={16}/>
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          <ToolbarButton 
            onClick={() => editor?.chain().focus().toggleBulletList().run()} 
            aria-label="Lista não ordenada"
          >
            <List size={16}/>
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor?.chain().focus().toggleOrderedList().run()} 
            aria-label="Lista numerada"
          >
            <ListOrdered size={16}/>
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor?.chain().focus().toggleBlockquote().run()} 
            aria-label="Citação"
          >
            <Quote size={16}/>
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor?.chain().focus().setHorizontalRule().run()} 
            aria-label="Linha horizontal"
          >
            <Minus size={16}/>
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          <ToolbarButton 
            onClick={() => {
              const url = prompt('Informe a URL do link:')
              if (url) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
            }} 
            aria-label="Inserir link"
          >
            <LinkIcon size={16}/>
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => {
              const url = prompt('URL da imagem:')
              if (url) editor?.chain().focus().setImage({ src: url }).run()
            }} 
            aria-label="Inserir imagem"
          >
            <ImageIcon size={16}/>
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          <ToolbarButton 
            onClick={() => editor?.commands.clearContent()} 
            aria-label="Limpar conteúdo"
          >
            <Eraser size={16}/>
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6"/>
          <ToolbarButton 
            onClick={toggleSource} 
            aria-label="Código-fonte (HTML)" 
            title="Alternar código-fonte"
          >
            <Code size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={copyHtml} aria-label="Copiar HTML">
            <Copy size={16}/>
          </ToolbarButton>
          <ToolbarButton onClick={exportToFile} aria-label="Exportar HTML (.html)">
            <Download size={16}/>
          </ToolbarButton>
          <label className="inline-flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-accent rounded-md">
            <Upload size={16}/>
            <Input 
              type="file" 
              accept=".html,text/html" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) importFromFile(file)
              }}
            />
            <span className="text-xs">Importar</span>
          </label>
        </div>

        {/* Área do editor / código-fonte */}
        <div className="mt-2 border rounded-lg focus-within:ring-2 ring-offset-2">
          {sourceMode ? (
            <textarea
              className="w-full h-[360px] outline-none bg-background p-4 rounded-lg font-mono text-sm"
              value={sourceValue}
              onChange={(e) => setSourceValue(e.target.value)}
              onBlur={() => editor?.commands.setContent(sourceValue || '<p></p>')}
            />
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>
      </CardContent>
    </Card>
  )
})

export default EditorCore

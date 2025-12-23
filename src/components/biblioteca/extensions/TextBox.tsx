// src/components/biblioteca/extensions/TextBox.tsx
import { Node, mergeAttributes, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import { Rnd } from 'react-rnd'
import React, { useMemo } from 'react'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textbox: {
      insertTextBox: (attrs?: Partial<TextBoxAttrs>) => ReturnType
      setTextBoxAttrs: (attrs: Partial<TextBoxAttrs>) => ReturnType
    }
  }
}

export type TextBoxAttrs = {
  x: number; y: number; w: number; h: number;
  title: string | null; vertical: boolean;
  bg: string | null; border: string | null;
  snap?: number | null; // grade opcional
}

const DEFAULTS: TextBoxAttrs = { x: 40, y: 40, w: 260, h: 140, title: null, vertical: false, bg: '#fff', border: '#94a3b8', snap: 8 }

export const TextBox = Node.create({
  name: 'textbox',
  group: 'block',
  atom: false,
  selectable: true,
  draggable: false,
  content: 'block+',
  addAttributes() {
    return { x:{default:DEFAULTS.x}, y:{default:DEFAULTS.y}, w:{default:DEFAULTS.w}, h:{default:DEFAULTS.h},
      title:{default:DEFAULTS.title}, vertical:{default:DEFAULTS.vertical}, bg:{default:DEFAULTS.bg},
      border:{default:DEFAULTS.border}, snap:{default:DEFAULTS.snap} }
  },
  parseHTML() { return [{ tag: 'div[data-textbox]' }] },
  renderHTML({ HTMLAttributes }) {
    const a = HTMLAttributes as TextBoxAttrs
    const style = [
      `position:absolute`,`left:${a.x}px`,`top:${a.y}px`,`width:${a.w}px`,`height:${a.h}px`,
      `background:${a.bg ?? 'transparent'}`,`border:1px solid ${a.border ?? '#94a3b8'}`,
      `border-radius:12px`,`padding:10px`,`box-sizing:border-box`,`overflow:auto`,
      a.vertical ? 'writing-mode:vertical-rl; text-orientation:mixed;' : ''
    ].join(';')
    return ['div', mergeAttributes({ 'data-textbox':'1', style }),
      a.title ? ['div',{style:'font-weight:600;margin-bottom:6px;'}, a.title] : '',
      ['div', { 'data-textbox-content':'1' }, 0]
    ]
  },
  addCommands() {
    return {
      insertTextBox: (attrs) => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs: { ...DEFAULTS, ...(attrs||{}) },
          content: [{ type:'paragraph', content:[{ type:'text', text:'Texto da caixa…'}]}] }),
      setTextBoxAttrs: (attrs) => ({ commands }) => commands.updateAttributes(this.name, attrs),
    }
  },
  addNodeView() {
    const Component = (props: any) => {
      const a: TextBoxAttrs = props.node.attrs
      const update = (patch: Partial<TextBoxAttrs>) => props.updateAttributes({ ...patch })
      const writing = useMemo(() => a.vertical ? { writingMode: 'vertical-rl' as const, textOrientation: 'mixed' as const } : {}, [a.vertical])
      const grid = a.snap && a.snap > 0 ? [a.snap, a.snap] as [number, number] : undefined
      return (
        <NodeViewWrapper as="div" className="textbox-node">
          <Rnd
            size={{ width: a.w, height: a.h }}
            position={{ x: a.x, y: a.y }}
            dragGrid={grid} resizeGrid={grid}
            onDragStop={(_, d) => update({ x: d.x, y: d.y })}
            onResizeStop={(_, __, ref, ___, pos) => update({ w: ref.offsetWidth, h: ref.offsetHeight, x: pos.x, y: pos.y })}
            bounds="parent"
            style={{ background:a.bg ?? 'transparent', border:`1px solid ${a.border ?? '#94a3b8'}`, borderRadius:12, padding:10, boxSizing:'border-box', overflow:'auto' }}
          >
            {a.title ? <div style={{ fontWeight:600, marginBottom:6 }}>{a.title}</div> : null}
            <div style={{ ...writing }}><NodeViewContent as="div" data-textbox-content /></div>
          </Rnd>
        </NodeViewWrapper>
      )
    }
    return ReactNodeViewRenderer(Component)
  },
})

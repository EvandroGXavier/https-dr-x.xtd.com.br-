// src/components/biblioteca/EditorField.tsx
import React, { useRef, useEffect } from 'react'
import EditorCore, { EditorCoreRef } from './EditorCore'

type Props = {
  html: string
  setHtml: (html: string) => void
  readOnly?: boolean
  placeholder?: string
}

export default function EditorField({ html, setHtml, readOnly, placeholder }: Props) {
  const ref = useRef<EditorCoreRef>(null)
  
  // Garantir hidratação inicial
  useEffect(() => {
    ref.current?.setHtml(html || '')
  }, [html])
  
  return (
    <EditorCore
      ref={ref}
      html={html}
      readOnly={readOnly}
      onChangeHtml={setHtml}
      placeholder={placeholder || "Escreva seu documento…"}
    />
  )
}

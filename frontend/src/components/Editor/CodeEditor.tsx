import { useRef } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  height?: string | number
  readOnly?: boolean
  theme?: 'vs-dark' | 'light'
  minimap?: boolean
}

const defaultPythonTemplate = `def my_custom_tool(param1: str, param2: int = 10) -> str:
    """
    Description of what this tool does.
    
    Args:
        param1: First parameter description
        param2: Second parameter description (default: 10)
    
    Returns:
        Description of return value
    """
    # Your code here
    result = f"Processing {param1} with value {param2}"
    return result
`

export default function CodeEditor({
  value,
  onChange,
  language = 'python',
  height = '400px',
  readOnly = false,
  theme = 'vs-dark',
  minimap = false,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor
    
    // Focus editor
    editor.focus()
  }

  const handleChange: OnChange = (newValue) => {
    onChange(newValue || '')
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          readOnly,
          minimap: { enabled: minimap },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          renderLineHighlight: 'line',
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />
    </div>
  )
}

export { defaultPythonTemplate }

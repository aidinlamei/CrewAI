import { Panel } from 'reactflow'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layout, 
  Save,
  RotateCcw
} from 'lucide-react'

interface FlowControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onAutoLayout: () => void
  onSave?: () => void
  onReset?: () => void
}

export default function FlowControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onAutoLayout,
  onSave,
  onReset,
}: FlowControlsProps) {
  return (
    <Panel position="bottom-right" className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex gap-1">
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={onFitView}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Fit View"
      >
        <Maximize2 className="w-4 h-4 text-gray-600" />
      </button>
      <div className="w-px bg-gray-200 mx-1" />
      <button
        onClick={onAutoLayout}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Auto Layout"
      >
        <Layout className="w-4 h-4 text-gray-600" />
      </button>
      {onReset && (
        <button
          onClick={onReset}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4 text-gray-600" />
        </button>
      )}
      {onSave && (
        <>
          <div className="w-px bg-gray-200 mx-1" />
          <button
            onClick={onSave}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Save Layout"
          >
            <Save className="w-4 h-4 text-gray-600" />
          </button>
        </>
      )}
    </Panel>
  )
}

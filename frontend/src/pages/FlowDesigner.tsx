import { useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ReactFlow, {
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { ArrowLeft, Play } from 'lucide-react'
import { MainLayout } from '@/components/Layout'
import { Button, PageSpinner, Alert } from '@/components/Common'
import { AgentNode, TaskNode, FlowControls, FlowLegend } from '@/components/Flow'
import type { AgentNodeData } from '@/components/Flow/AgentNode'
import type { TaskNodeData } from '@/components/Flow/TaskNode'
import { projectService } from '@/services/projectService'
import { agentService } from '@/services/agentService'
import { taskService } from '@/services/taskService'

// Custom node types
const nodeTypes = {
  agent: AgentNode,
  task: TaskNode,
}

// Default edge options
const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
  },
}

function FlowDesignerContent() {
  const { projectId } = useParams<{ projectId: string }>()
  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Queries
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.get(projectId!),
    enabled: !!projectId,
  })

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents', projectId],
    queryFn: () => agentService.list(projectId!),
    enabled: !!projectId,
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskService.list(projectId!),
    enabled: !!projectId,
  })

  // Build nodes and edges from data
  useEffect(() => {
    if (!agents || !tasks) return

    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    // Create agent nodes
    agents.forEach((agent, index) => {
      const agentNode: Node<AgentNodeData> = {
        id: `agent-${agent.id}`,
        type: 'agent',
        position: { x: 50, y: 100 + index * 150 },
        data: {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          goal: agent.goal,
          llm_model: agent.llm_model,
        },
      }
      newNodes.push(agentNode)
    })

    // Create task nodes
    tasks.forEach((task, index) => {
      const agentName = agents.find(a => a.id === task.agent_id)?.name
      const taskNode: Node<TaskNodeData> = {
        id: `task-${task.id}`,
        type: 'task',
        position: { x: 350, y: 50 + index * 180 },
        data: {
          id: task.id,
          name: task.name,
          description: task.description,
          expected_output: task.expected_output,
          agent_name: agentName,
          order_index: task.order_index ?? index,
        },
      }
      newNodes.push(taskNode)

      // Create edge from agent to task
      if (task.agent_id) {
        newEdges.push({
          id: `edge-agent-${task.agent_id}-task-${task.id}`,
          source: `agent-${task.agent_id}`,
          target: `task-${task.id}`,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        })
      }

      // Create edge from previous task (sequential flow)
      if (index > 0) {
        const prevTask = tasks[index - 1]
        newEdges.push({
          id: `edge-task-${prevTask.id}-task-${task.id}`,
          source: `task-${prevTask.id}`,
          target: `task-${task.id}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#8b5cf6',
          },
        })
      }
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [agents, tasks, setNodes, setEdges])

  // Auto-layout function
  const onAutoLayout = useCallback(() => {
    if (!agents || !tasks) return

    const newNodes: Node[] = []

    // Layout agents on the left
    agents.forEach((agent, index) => {
      newNodes.push({
        id: `agent-${agent.id}`,
        type: 'agent',
        position: { x: 50, y: 80 + index * 160 },
        data: nodes.find(n => n.id === `agent-${agent.id}`)?.data || {},
      })
    })

    // Layout tasks on the right, vertically
    tasks.forEach((task, index) => {
      newNodes.push({
        id: `task-${task.id}`,
        type: 'task',
        position: { x: 400, y: 50 + index * 180 },
        data: nodes.find(n => n.id === `task-${task.id}`)?.data || {},
      })
    })

    setNodes(newNodes)
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }, [agents, tasks, nodes, setNodes, fitView])

  // Fit view after initial load
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 200)
    }
  }, [nodes.length, fitView])

  const isLoading = projectLoading || agentsLoading || tasksLoading

  if (isLoading) {
    return <PageSpinner />
  }

  if (!project) {
    return <Alert type="error">Project not found</Alert>
  }

  const hasData = agents && agents.length > 0 && tasks && tasks.length > 0

  return (
    <div className="h-[calc(100vh-180px)] bg-gray-50 rounded-lg border border-gray-200">
      {hasData ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          fitView
          minZoom={0.1}
          maxZoom={2}
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
          <FlowLegend />
          <FlowControls
            onZoomIn={() => zoomIn()}
            onZoomOut={() => zoomOut()}
            onFitView={() => fitView({ padding: 0.2 })}
            onAutoLayout={onAutoLayout}
          />
        </ReactFlow>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              Add agents and tasks to see the flow visualization
            </p>
            <div className="flex gap-3 justify-center">
              <Link to={`/projects/${projectId}/agents`}>
                <Button variant="secondary">Add Agents</Button>
              </Link>
              <Link to={`/projects/${projectId}/tasks`}>
                <Button variant="secondary">Add Tasks</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FlowDesigner() {
  const { projectId } = useParams<{ projectId: string }>()

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.get(projectId!),
    enabled: !!projectId,
  })

  return (
    <MainLayout title={`Flow Designer - ${project?.name || 'Loading...'}`}>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          to={`/projects/${projectId}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </Link>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flow Designer</h1>
          <p className="text-gray-600">Visualize your crew workflow</p>
        </div>
        <Link to={`/projects/${projectId}`}>
          <Button icon={<Play className="w-4 h-4" />}>
            Execute
          </Button>
        </Link>
      </div>

      {/* Flow Canvas */}
      <ReactFlowProvider>
        <FlowDesignerContent />
      </ReactFlowProvider>
    </MainLayout>
  )
}

import { Agent } from '@/types/agent'
import { Task } from '@/types/task'

interface FlowDesignerProps {
  agents: Agent[]
  tasks: Task[]
}

export default function FlowDesigner({ agents, tasks }: FlowDesignerProps) {
  return (
    <div className="w-full h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Flow Designer</h3>
        <p className="text-gray-500 mb-4">
          Visual workflow designer for agents and tasks
        </p>
        <p className="text-sm text-gray-400">
          {agents.length} agents, {tasks.length} tasks
        </p>
        <p className="text-xs text-gray-400 mt-2">
          TODO: Implement React Flow or similar visualization library
        </p>
      </div>
    </div>
  )
import { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface FlowDesignerProps {
  agents: any[];
  tasks: any[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

export default function FlowDesigner({
  agents,
  tasks,
  onNodesChange,
  onEdgesChange,
}: FlowDesignerProps) {
  // Convert agents to nodes
  const agentNodes: Node[] = agents.map((agent, index) => ({
    id: agent.id,
    type: 'default',
    position: { x: 100, y: index * 100 },
    data: {
      label: (
        <div className="px-4 py-2">
          <div className="font-bold">{agent.name}</div>
          <div className="text-xs text-gray-500">{agent.role}</div>
        </div>
      ),
    },
    style: {
      background: '#3b82f6',
      color: 'white',
      border: '1px solid #2563eb',
      borderRadius: '8px',
    },
  }));

  // Convert tasks to nodes
  const taskNodes: Node[] = tasks.map((task, index) => ({
    id: task.id,
    type: 'default',
    position: { x: 400, y: index * 100 },
    data: {
      label: (
        <div className="px-4 py-2">
          <div className="font-bold">{task.name}</div>
          <div className="text-xs text-gray-500">Task</div>
        </div>
      ),
    },
    style: {
      background: '#10b981',
      color: 'white',
      border: '1px solid #059669',
      borderRadius: '8px',
    },
  }));

  // Create edges from task dependencies
  const initialEdges: Edge[] = tasks.flatMap((task) => {
    const edges: Edge[] = [];

    // Agent to task edge
    if (task.agent_id) {
      edges.push({
        id: `e-${task.agent_id}-${task.id}`,
        source: task.agent_id,
        target: task.id,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      });
    }

    // Task dependency edges
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach((depId: string) => {
        edges.push({
          id: `e-${depId}-${task.id}`,
          source: depId,
          target: task.id,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      });
    }

    return edges;
  });

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([
    ...agentNodes,
    ...taskNodes,
  ]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-[600px] border border-gray-200 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          onNodesChangeInternal(changes);
          if (onNodesChange) onNodesChange(nodes);
        }}
        onEdgesChange={(changes) => {
          onEdgesChangeInternal(changes);
          if (onEdgesChange) onEdgesChange(edges);
        }}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

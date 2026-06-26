import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import Canvas from './components/Canvas'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import { useGraphStore } from './store/graph'

export default function App() {
  const { loadConfig } = useGraphStore()

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg) => loadConfig(cfg as never))
      .catch(console.error)
  }, [loadConfig])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Toolbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <ReactFlowProvider>
            <Canvas />
          </ReactFlowProvider>
        </main>
      </div>
    </div>
  )
}

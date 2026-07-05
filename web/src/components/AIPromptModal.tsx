import { useState, useEffect } from 'react'
import { X, Copy, Check, Bot } from 'lucide-react'

interface AIPromptModalProps {
  onClose: () => void
}

export default function AIPromptModal({ onClose }: AIPromptModalProps) {
  const [prompt, setPrompt] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ai/prompt')
      .then((r) => r.text())
      .then((t) => { setPrompt(t); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function copy() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
            <Bot size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">AI Agent Prompt</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Run an AI agent in your service workspace with this prompt to auto-generate a weavectl config.
            </p>
          </div>
          <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* How-to */}
        <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-950 border-b border-indigo-100 dark:border-indigo-900 shrink-0">
          <ol className="text-xs text-indigo-800 dark:text-indigo-300 space-y-1 list-decimal list-inside">
            <li>Copy the prompt below.</li>
            <li>
              Open an AI agent (Claude Code, Cursor, Copilot Workspace, …) inside the
              repository that contains your services' source code.
            </li>
            <li>Paste the prompt and run the agent — it will analyse the codebase and output YAML.</li>
            <li>
              Paste the resulting YAML back into weavectl via{' '}
              <strong>Import → Paste JSON / YAML</strong>.
            </li>
          </ol>
        </div>

        {/* Prompt */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Prompt</span>
            <button
              onClick={copy}
              disabled={loading || !prompt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy prompt'}
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              Loading…
            </div>
          ) : (
            <pre className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {prompt}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

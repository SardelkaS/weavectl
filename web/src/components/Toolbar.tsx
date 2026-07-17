import { useEffect, useState, useRef } from 'react'
import {
  Download,
  Upload,
  LayoutDashboard,
  Bot,
  Save,
  FileText,
  Clipboard,
  Eye,
  Undo2,
  Redo2,
  Sun,
  Moon,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react'
import { useGraphStore } from '../store/graph'
import { useThemeStore } from '../store/theme'
import AIPromptModal from './AIPromptModal'
import yaml from 'js-yaml'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/** Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y to redo — skipped while typing in a field. */
function useUndoRedoShortcuts() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || isEditableTarget(e.target)) return
      const key = e.key.toLowerCase()
      if (key === 'z' && e.shiftKey) {
        e.preventDefault()
        useGraphStore.getState().redo()
      } else if (key === 'z') {
        e.preventDefault()
        useGraphStore.getState().undo()
      } else if (key === 'y') {
        e.preventDefault()
        useGraphStore.getState().redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

function UndoRedoButtons() {
  const past = useGraphStore((s) => s.past)
  const future = useGraphStore((s) => s.future)
  const undo = useGraphStore((s) => s.undo)
  const redo = useGraphStore((s) => s.redo)

  return (
    <>
      <button
        className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
        onClick={undo}
        disabled={past.length === 0}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={15} />
      </button>
      <button
        className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
        onClick={redo}
        disabled={future.length === 0}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 size={15} />
      </button>
    </>
  )
}

function ViewModeSwitch() {
  const { viewMode, toggleViewMode } = useGraphStore()
  return (
    <label
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer select-none"
      title="When on, selecting a graph element only highlights it — the editor won't open"
    >
      <Eye size={15} className={viewMode ? 'text-indigo-600 dark:text-indigo-400' : ''} />
      <span className="hidden sm:inline">View mode</span>
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full">
        <input
          type="checkbox"
          checked={viewMode}
          onChange={toggleViewMode}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-indigo-600 transition-colors" />
        <span
          className={`relative inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
            ${viewMode ? 'translate-x-4' : 'translate-x-1'}`}
        />
      </span>
    </label>
  )
}

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  return (
    <button
      className="flex items-center px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}

function CollapseAllButton() {
  const collapsed = useGraphStore((s) => s.sectionsCollapsed)
  const toggle = useGraphStore((s) => s.toggleSectionsCollapsed)
  return (
    <button
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={toggle}
      title={collapsed ? 'Expand all member groups' : 'Collapse all member groups'}
    >
      {collapsed ? <ChevronsUpDown size={15} /> : <ChevronsDownUp size={15} />}
      <span className="hidden sm:inline">{collapsed ? 'Expand' : 'Collapse'}</span>
    </button>
  )
}

export default function Toolbar() {
  const { config, loadConfig, autoLayout } = useGraphStore()
  useUndoRedoShortcuts()
  const [showAI, setShowAI] = useState(false)
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [pasteModal, setPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteError, setPasteError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function exportAs(format: 'json' | 'yaml') {
    window.open(`/api/export?format=${format}`, '_blank')
    setShowExportMenu(false)
  }

  async function saveToServer() {
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
  }

  function importFile(file: File) {
    const form = new FormData()
    form.append('file', file)
    fetch('/api/import', { method: 'POST', body: form })
      .then((r) => r.json())
      .then((cfg) => loadConfig(cfg as never))
      .catch(console.error)
    setShowImportMenu(false)
  }

  function importPaste() {
    setPasteError('')
    try {
      let parsed: unknown
      try {
        parsed = JSON.parse(pasteText)
      } catch {
        parsed = yaml.load(pasteText)
      }
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid config')
      loadConfig(parsed as never)
      // also sync to server
      fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      }).catch(console.error)
      setPasteModal(false)
      setPasteText('')
      setShowImportMenu(false)
    } catch (e) {
      setPasteError(String(e))
    }
  }

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <span className="text-lg">🕸️</span>
          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">weavectl</span>
        </div>

        {/* Config name */}
        <input
          className="text-sm font-medium text-gray-700 dark:text-gray-200 dark:placeholder-gray-500 border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-indigo-400 focus:outline-none px-1 py-0.5 w-52 bg-transparent"
          value={config.name}
          onChange={(e) => loadConfig({ ...config, name: e.target.value })}
          placeholder="Architecture name..."
        />

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* View mode */}
          <ViewModeSwitch />

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

          {/* Undo / redo */}
          <UndoRedoButtons />

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

          {/* Auto layout */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={autoLayout}
            title="Auto-arrange nodes"
          >
            <LayoutDashboard size={15} />
            <span className="hidden sm:inline">Layout</span>
          </button>

          {/* Collapse / expand all member groups */}
          <CollapseAllButton />

          {/* Import */}
          <div className="relative">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => { setShowImportMenu((o) => !o); setShowExportMenu(false) }}
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Import</span>
            </button>
            {showImportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 min-w-[180px] py-1">
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileText size={14} /> Upload file
                </button>
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => { setPasteModal(true); setShowImportMenu(false) }}
                >
                  <Clipboard size={14} /> Paste JSON / YAML
                </button>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="relative">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => { setShowExportMenu((o) => !o); setShowImportMenu(false) }}
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 min-w-[140px] py-1">
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => exportAs('json')}
                >
                  📄 JSON
                </button>
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => exportAs('yaml')}
                >
                  📝 YAML
                </button>
              </div>
            )}
          </div>

          {/* Save */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={saveToServer}
            title="Save to configured file"
          >
            <Save size={15} />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* AI Help */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => setShowAI(true)}
            title="Get AI prompt for generating this config from source code"
          >
            <Bot size={15} />
            <span className="hidden sm:inline">AI Prompt</span>
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

          {/* Theme */}
          <ThemeToggle />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept=".json,.yaml,.yml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importFile(f)
            e.target.value = ''
          }}
        />
      </header>

      {/* Paste modal */}
      {pasteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Paste JSON or YAML</h2>
            </div>
            <div className="p-5 space-y-3">
              <textarea
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                rows={12}
                placeholder={'{\n  "version": "1.0",\n  "services": [...]\n}'}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              {pasteError && (
                <p className="text-sm text-red-600 dark:text-red-400">{pasteError}</p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={() => { setPasteModal(false); setPasteText(''); setPasteError('') }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  onClick={importPaste}
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAI && <AIPromptModal onClose={() => setShowAI(false)} />}
    </>
  )
}

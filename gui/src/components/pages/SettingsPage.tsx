import { useState, useEffect } from 'react'
import { cn } from '../../utils/cn'

interface Settings {
  outputDir: string
  firecrawlUrl: string
  firecrawlApiKey: string
}

const defaultSettings: Settings = {
  outputDir: '',
  firecrawlUrl: 'http://localhost:8547',
  firecrawlApiKey: '',  // 不提供默认值，强制用户配置
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // 加载配置
  useEffect(() => {
    if (window.scraper?.getConfig) {
      window.scraper.getConfig().then((config: Settings) => {
        if (config) {
          setSettings(config)
        }
      })
    }
  }, [])

  // 保存配置
  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      if (window.scraper?.saveConfig) {
        const result = await window.scraper.saveConfig(settings)
        if (result.success) {
          setSaveMessage('配置已保存')
        } else {
          setSaveMessage(`保存失败: ${result.error}`)
        }
      } else {
        setSaveMessage('保存功能暂不可用')
      }
    } catch (e) {
      setSaveMessage(`保存失败: ${String(e)}`)
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  // 选择目录
  const handleSelectDir = async () => {
    if (window.scraper?.selectDirectory) {
      const dir = await window.scraper.selectDirectory()
      if (dir) {
        setSettings((s) => ({ ...s, outputDir: dir }))
      }
    }
  }

  return (
    <div className="h-full flex flex-col max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-secondary mt-1">配置爬虫运行参数</p>
      </div>

      {/* Settings Form */}
      <div className="space-y-6">
        {/* Output Directory */}
        <div className="space-y-2">
          <label className="text-sm font-medium">输出目录</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={settings.outputDir}
              onChange={(e) =>
                setSettings((s) => ({ ...s, outputDir: e.target.value }))
              }
              placeholder="选择或输入输出目录路径"
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl',
                'bg-[rgba(15,10,25,0.6)] border border-white/[0.08]',
                'text-primary placeholder:text-secondary',
                'focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_12px_rgba(139,92,246,0.15)]',
                'transition-all'
              )}
            />
            <button
              onClick={handleSelectDir}
              className={cn(
                'px-4 py-2.5 rounded-xl',
                'bg-white/[0.06] text-secondary border border-transparent',
                'hover:bg-violet-500/15 hover:text-white hover:border-violet-500/30',
                'hover:shadow-[0_0_12px_rgba(139,92,246,0.15)]',
                'transition-all'
              )}
            >
              选择...
            </button>
          </div>
          <p className="text-xs text-secondary">爬取结果的保存位置</p>
        </div>

        {/* Firecrawl URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Firecrawl URL</label>
          <input
            type="text"
            value={settings.firecrawlUrl}
            onChange={(e) =>
              setSettings((s) => ({ ...s, firecrawlUrl: e.target.value }))
            }
            placeholder="http://localhost:8547"
            className={cn(
              'w-full px-4 py-2.5 rounded-xl',
              'bg-[rgba(15,10,25,0.6)] border border-white/[0.08]',
              'text-primary placeholder:text-secondary',
              'focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_12px_rgba(139,92,246,0.15)]',
              'transition-all'
            )}
          />
          <p className="text-xs text-secondary">Firecrawl 服务地址</p>
        </div>

        {/* Firecrawl API Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Firecrawl API Key</label>
          <input
            type="password"
            value={settings.firecrawlApiKey}
            onChange={(e) =>
              setSettings((s) => ({ ...s, firecrawlApiKey: e.target.value }))
            }
            placeholder="输入 API Key"
            className={cn(
              'w-full px-4 py-2.5 rounded-xl',
              'bg-[rgba(15,10,25,0.6)] border border-white/[0.08]',
              'text-primary placeholder:text-secondary',
              'focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_12px_rgba(139,92,246,0.15)]',
              'transition-all'
            )}
          />
          <p className="text-xs text-secondary">
            本地部署可使用任意字符串；使用 Firecrawl 云服务需填入有效 API Key
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'px-6 py-2.5 rounded-xl font-medium',
              'bg-violet-500/90 text-white border border-violet-500/50',
              'hover:bg-violet-500 hover:border-violet-400/70',
              'hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all'
            )}
          >
            {isSaving ? '保存中...' : '保存配置'}
          </button>

          {saveMessage && (
            <span
              className={cn(
                'text-sm',
                saveMessage.includes('失败') ? 'text-red-500' : 'text-green-500'
              )}
            >
              {saveMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

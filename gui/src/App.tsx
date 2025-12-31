import { useCallback } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { BentoGrid } from './components/layout/BentoGrid'
import { ProgressCard } from './components/cards/ProgressCard'
import { StatsCard } from './components/cards/StatsCard'
import { ActiveTasksCard } from './components/cards/ActiveTasksCard'
import { ControlBar } from './components/cards/ControlBar'
import { TaskListPage } from './components/pages/TaskListPage'
import { SettingsPage } from './components/pages/SettingsPage'
import { useScraperStore } from './stores/scraperStore'
import { useScraperIPC } from './hooks/useScraperIPC'
import type { NavItemKey } from './components/layout/Sidebar'

function App() {
  const { start, stop } = useScraperIPC()

  const isRunning = useScraperStore((s) => s.isRunning)
  const progress = useScraperStore((s) => s.progress)
  const allTasks = useScraperStore((s) => s.allTasks)
  const currentPage = useScraperStore((s) => s.currentPage)
  const setCurrentPage = useScraperStore((s) => s.setCurrentPage)
  const importedFile = useScraperStore((s) => s.importedFile)
  const setImportedFile = useScraperStore((s) => s.setImportedFile)

  // 任务筛选器状态（用于从 Dashboard 跳转时带筛选）
  const taskFilter = useScraperStore((s) => s.taskFilter)
  const setTaskFilter = useScraperStore((s) => s.setTaskFilter)

  // 处理导航
  const handleNavigate = (page: NavItemKey) => {
    setCurrentPage(page)
    // 如果导航到任务列表，重置筛选器
    if (page === 'tasks') {
      setTaskFilter('all')
    }
  }

  // 处理点击成功/失败数字
  const handleStatsClick = (type: 'success' | 'failed') => {
    setTaskFilter(type)
    setCurrentPage('tasks')
  }

  // 处理查看全部
  const handleViewAll = () => {
    setTaskFilter('all')
    setCurrentPage('tasks')
  }

  // 处理导入 JSON
  const handleImportJson = useCallback(async () => {
    if (!window.scraper?.selectJsonFile) {
      console.error('selectJsonFile not available')
      return
    }

    // 选择文件
    const filePath = await window.scraper.selectJsonFile()
    if (!filePath) return

    // 读取文件内容
    const result = await window.scraper.readJsonFile(filePath)
    if (!result.success) {
      console.error('Failed to read JSON:', result.error)
      return
    }

    // 验证数据格式
    const data = result.data as { articles?: unknown[] } | null
    if (!data || !data.articles || !Array.isArray(data.articles)) {
      console.error('Invalid JSON format: missing articles array')
      return
    }

    // 设置导入的文件信息
    setImportedFile({
      path: filePath,
      articleCount: data.articles.length,
    })
  }, [setImportedFile])

  // 处理开始爬取
  const handleStart = useCallback(async () => {
    if (!importedFile) return

    await start({
      articlesFile: importedFile.path,
    })
  }, [start, importedFile])

  // 渲染当前页面内容
  const renderPageContent = () => {
    switch (currentPage) {
      case 'tasks':
        return <TaskListPage initialFilter={taskFilter} />

      case 'settings':
        return <SettingsPage />

      case 'dashboard':
      default:
        return (
          <>
            {/* Control Bar */}
            <div className="mb-6">
              <ControlBar
                isRunning={isRunning}
                onStart={handleStart}
                onStop={() => stop()}
                onImportJson={handleImportJson}
                importedFile={importedFile}
              />
            </div>

            {/* Bento Grid */}
            <BentoGrid>
              <ProgressCard
                percentage={progress?.percentage ?? 0}
                completed={progress?.completed ?? 0}
                total={progress?.total ?? (importedFile?.articleCount ?? 0)}
              />

              <StatsCard
                success={progress?.success ?? 0}
                failed={progress?.failed ?? 0}
                onSuccessClick={() => handleStatsClick('success')}
                onFailedClick={() => handleStatsClick('failed')}
              />

              <ActiveTasksCard
                tasks={allTasks}
                onViewAll={handleViewAll}
              />
            </BentoGrid>
          </>
        )
    }
  }

  return (
    <div className="flex h-screen w-full bg-background text-primary selection:bg-accent selection:text-white overflow-hidden">
      <Sidebar
        activeItem={currentPage as NavItemKey}
        onNavigate={handleNavigate}
      />

      <main className="flex-1 p-6 overflow-y-auto">
        {renderPageContent()}
      </main>
    </div>
  )
}

export default App

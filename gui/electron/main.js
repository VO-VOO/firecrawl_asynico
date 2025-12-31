import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { spawn } from 'child_process'
import { createInterface } from 'readline'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow = null
let pythonProcess = null

// 项目根目录
const projectRoot = join(__dirname, '../..')

// 配置文件路径
const envFilePath = join(projectRoot, '.env')

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0f0a1a',
    titleBarStyle: 'hiddenInset',
    vibrancy: 'sidebar',
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const isDev = !app.isPackaged

  if (isDev) {
    // Try multiple ports in case 5173 is in use
    const ports = [5173, 5174, 5175, 5176]
    const tryPort = async (portIndex) => {
      if (portIndex >= ports.length) {
        console.error('Could not connect to dev server on any port')
        return
      }
      const port = ports[portIndex]
      mainWindow.loadURL(`http://localhost:${port}`).catch(() => {
        console.log(`Port ${port} failed, trying next...`)
        setTimeout(() => tryPort(portIndex + 1), 500)
      })
    }
    tryPort(0)
    // 按需打开 DevTools: mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

// ============ 爬虫控制 IPC Handlers ============

// 启动爬虫
ipcMain.handle('scraper:start', async (event, config = {}) => {
  if (pythonProcess) {
    return { success: false, error: 'Scraper already running' }
  }

  try {
    // 使用 uv run 运行 Python 脚本
    const scriptPath = join(projectRoot, 'scrape_asyncio.py')

    // 构建环境变量
    const envVars = {
      ...process.env,
      GUI_MODE: 'true',
      MAX_CONCURRENT: config.maxConcurrent?.toString() || '15',
      BATCH_SIZE: config.batchSize?.toString() || '50',
    }

    // 如果有自定义配置文件路径
    if (config.articlesFile) {
      envVars.ARTICLES_FILE = config.articlesFile
    }

    // 如果有自定义输出目录
    if (config.outputDir) {
      envVars.OUTPUT_DIR = config.outputDir
    }

    // 如果有自定义 Firecrawl URL
    if (config.firecrawlUrl) {
      envVars.FIRECRAWL_URL = config.firecrawlUrl
    }

    // 如果有自定义 API Key
    if (config.firecrawlApiKey) {
      envVars.FIRECRAWL_API_KEY = config.firecrawlApiKey
    }

    pythonProcess = spawn('uv', ['run', 'python', scriptPath], {
      cwd: projectRoot,
      detached: true,  // 创建进程组，便于停止
      env: envVars
    })

    // 逐行解析 stdout (JSON Lines)
    const rl = createInterface({ input: pythonProcess.stdout })

    rl.on('line', (line) => {
      try {
        const data = JSON.parse(line)
        if (data.type === 'progress') {
          mainWindow?.webContents.send('scraper:progress', data)
        } else if (data.type === 'task') {
          mainWindow?.webContents.send('scraper:task-update', data)
        } else if (data.type === 'complete') {
          mainWindow?.webContents.send('scraper:complete', data)
          pythonProcess = null
        }
      } catch {
        // 非 JSON 行，普通日志输出
        console.log('[Python]', line)
      }
    })

    pythonProcess.stderr.on('data', (data) => {
      const message = data.toString()
      console.error('[Python Error]', message)
      mainWindow?.webContents.send('scraper:error', { message })
    })

    pythonProcess.on('close', (code) => {
      pythonProcess = null
      // 无论退出码如何，都通知前端进程已停止
      mainWindow?.webContents.send('scraper:stopped', { code })
      if (code !== 0 && code !== null) {
        mainWindow?.webContents.send('scraper:error', {
          message: `Process exited with code ${code}`
        })
      }
    })

    pythonProcess.on('error', (err) => {
      pythonProcess = null
      mainWindow?.webContents.send('scraper:error', {
        message: `Failed to start process: ${err.message}`
      })
    })

    return { success: true }
  } catch (err) {
    pythonProcess = null
    return { success: false, error: err.message }
  }
})

// 停止爬虫
ipcMain.handle('scraper:stop', async () => {
  if (pythonProcess) {
    try {
      // 使用 SIGINT 发送到整个进程组（更可靠的停止方式）
      // 负数 PID 表示发送信号到进程组
      process.kill(-pythonProcess.pid, 'SIGINT')
    } catch {
      // 如果进程组 kill 失败，尝试直接 kill 进程
      try {
        pythonProcess.kill('SIGINT')
      } catch {
        // 进程可能已经结束
      }
    }

    // 设置超时强制 kill
    const forceKillTimeout = setTimeout(() => {
      if (pythonProcess) {
        try {
          pythonProcess.kill('SIGKILL')
        } catch {
          // 忽略错误
        }
        pythonProcess = null
      }
    }, 3000)

    // 等待进程正常退出
    pythonProcess.once('close', () => {
      clearTimeout(forceKillTimeout)
      pythonProcess = null
    })

    return { success: true }
  }
  return { success: false, error: 'No scraper running' }
})

// ============ 文件操作 IPC Handlers ============

// 选择 JSON 文件
ipcMain.handle('file:select-json', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow
  const result = await dialog.showOpenDialog(win, {
    title: '选择 JSON 文件',
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

// 读取 JSON 文件
ipcMain.handle('file:read-json', async (event, filePath) => {
  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)
    return { success: true, data, path: filePath }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// 选择目录
ipcMain.handle('dialog:select-directory', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow
  const result = await dialog.showOpenDialog(win, {
    title: '选择输出目录',
    properties: ['openDirectory', 'createDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

// ============ 配置管理 IPC Handlers ============

// 读取配置
ipcMain.handle('config:read', async () => {
  try {
    // 默认配置
    const config = {
      outputDir: projectRoot,
      firecrawlUrl: 'http://localhost:8547',
      firecrawlApiKey: 'test'
    }

    // 尝试从 .env 文件读取
    if (existsSync(envFilePath)) {
      const content = await readFile(envFilePath, 'utf-8')
      const lines = content.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim()

        switch (key.trim()) {
          case 'OUTPUT_DIR':
            config.outputDir = value
            break
          case 'FIRECRAWL_URL':
            config.firecrawlUrl = value
            break
          case 'FIRECRAWL_API_KEY':
            config.firecrawlApiKey = value
            break
        }
      }
    }

    return config
  } catch (err) {
    console.error('Failed to read config:', err)
    return {
      outputDir: projectRoot,
      firecrawlUrl: 'http://localhost:8547',
      firecrawlApiKey: 'test'
    }
  }
})

// 保存配置
ipcMain.handle('config:write', async (event, config) => {
  try {
    const envContent = `# Firecrawl Scraper Configuration
OUTPUT_DIR=${config.outputDir || projectRoot}
FIRECRAWL_URL=${config.firecrawlUrl || 'http://localhost:8547'}
FIRECRAWL_API_KEY=${config.firecrawlApiKey || 'test'}
`

    await writeFile(envFilePath, envContent, 'utf-8')
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ============ App Lifecycle ============

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // 关闭窗口时停止 Python 进程
  if (pythonProcess) {
    pythonProcess.kill('SIGTERM')
    pythonProcess = null
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // 退出前确保停止 Python 进程
  if (pythonProcess) {
    pythonProcess.kill('SIGTERM')
    pythonProcess = null
  }
})

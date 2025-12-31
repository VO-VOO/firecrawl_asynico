const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('scraper', {
  // ============ 爬虫控制 ============

  // 启动爬虫
  start: (config) => ipcRenderer.invoke('scraper:start', config),

  // 停止爬虫
  stop: () => ipcRenderer.invoke('scraper:stop'),

  // 监听进度更新
  onProgress: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('scraper:progress', handler)
    return () => ipcRenderer.removeListener('scraper:progress', handler)
  },

  // 监听任务更新
  onTaskUpdate: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('scraper:task-update', handler)
    return () => ipcRenderer.removeListener('scraper:task-update', handler)
  },

  // 监听完成事件
  onComplete: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('scraper:complete', handler)
    return () => ipcRenderer.removeListener('scraper:complete', handler)
  },

  // 监听错误
  onError: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('scraper:error', handler)
    return () => ipcRenderer.removeListener('scraper:error', handler)
  },

  // ============ 文件操作 ============

  // 选择 JSON 文件
  selectJsonFile: () => ipcRenderer.invoke('file:select-json'),

  // 读取 JSON 文件内容
  readJsonFile: (filePath) => ipcRenderer.invoke('file:read-json', filePath),

  // 选择目录
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),

  // ============ 配置管理 ============

  // 获取配置
  getConfig: () => ipcRenderer.invoke('config:read'),

  // 保存配置
  saveConfig: (config) => ipcRenderer.invoke('config:write', config),
})

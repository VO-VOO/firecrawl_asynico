import { motion } from 'framer-motion'

function App() {
  return (
    <div className="flex h-screen w-full bg-background text-primary selection:bg-accent selection:text-white overflow-hidden">
      {/* Sidebar - Glassmorphism */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-white/5 bg-sidebar-glass backdrop-blur-xl relative z-10">
        <div className="h-12 flex items-center px-4 mt-6">
          <div className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-accent text-2xl">⚡</span>
            Firecrawl
          </div>
        </div>

        <nav className="flex-1 px-2 py-6 space-y-1">
          {['Dashboard', 'Tasks', 'Settings'].map((item) => (
            <button key={item} className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-secondary hover:bg-white/5 hover:text-white transition-colors group relative">
              {item === 'Dashboard' && (
                <div className="absolute left-1 w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_#B026FF]"></div>
              )}
              <span className={item === 'Dashboard' ? "ml-2" : "ml-0"}>{item}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content - Bento Grid */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto">

          {/* Total Progress - Top Left (4 cols) */}
          <motion.div
            className="col-span-4 bg-surface rounded-3xl p-6 border border-white/5 relative group"
            whileHover={{ borderColor: 'rgba(176, 38, 255, 0.5)', boxShadow: '0 0 20px rgba(176, 38, 255, 0.15)' }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-secondary text-sm font-medium mb-4">Total Progress</h3>
            <div className="flex items-center justify-center h-32">
              <div className="text-4xl font-bold">85%</div>
            </div>
          </motion.div>

          {/* Stats - Top Right (8 cols) */}
          <motion.div
            className="col-span-8 bg-surface rounded-3xl p-6 border border-white/5 relative group flex items-center justify-around"
            whileHover={{ borderColor: 'rgba(176, 38, 255, 0.5)', boxShadow: '0 0 20px rgba(176, 38, 255, 0.15)' }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">1,250</div>
              <div className="text-xs text-secondary uppercase tracking-wider">Success</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-error mb-1">30</div>
              <div className="text-xs text-secondary uppercase tracking-wider">Failed</div>
            </div>
          </motion.div>

          {/* Active Tasks - Bottom (12 cols) */}
          <motion.div
            className="col-span-12 bg-surface rounded-3xl p-6 border border-white/5 min-h-[400px] relative group"
            whileHover={{ borderColor: 'rgba(176, 38, 255, 0.5)', boxShadow: '0 0 20px rgba(176, 38, 255, 0.15)' }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Active Tasks</h3>
              <button className="text-xs text-secondary hover:text-white bg-white/5 px-3 py-1 rounded-full transition-colors">View All</button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                <div key={i} className="bg-black/20 rounded-xl p-3 border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-secondary font-mono truncate w-3/4">https://example.com/article-{i}</span>
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  )
}

export default App

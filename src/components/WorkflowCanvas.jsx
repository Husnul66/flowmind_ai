import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BellRing,
  BookOpen,
  Bot,
  Braces,
  BrainCircuit,
  Clock,
  Database,
  GitBranch,
  GitMerge,
  Mail,
  MessageSquareText,
  Newspaper,
  Plus,
  Radar,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Truck,
  Webhook,
} from 'lucide-react'

const SCENARIO_ROTATE_MS = 10000
const AUTO_SIGNAL_DELAY_MS = 2000
const WAVE_STEP_MS = 480

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 400

function createBezierPath(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1) * 0.48
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

function createDashedDropPath(x1, y1, x2, y2) {
  const dy = Math.abs(y2 - y1) * 0.55
  return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`
}

const scenarios = [
  {
    id: 'refund-research',
    badge: 'Senaryo 01 · Müşteri İade & Talep Araştırma',
    title: 'AI Müşteri İade & Talep Araştırma Ajanı',
    subtitle:
      'Gelen iade talebini 5 farklı kaynaktan otonom araştırır, kararı ayrıştırır ve ekibe onay bildirimi yollar.',
    maxWave: 5,
    nodes: [
      {
        id: 's1-trigger',
        label: 'Yeni Talep Geldi',
        sublabel: 'Webhook',
        icon: Webhook,
        x: 92,
        y: 132,
        w: 68,
        h: 68,
        wave: 0,
        enterDelay: '0ms',
      },
      {
        id: 's1-order',
        label: 'Siparişi Sorgula',
        sublabel: 'Veritabanı',
        icon: Database,
        x: 262,
        y: 132,
        w: 68,
        h: 68,
        wave: 1,
        enterDelay: '70ms',
      },
      {
        id: 's1-agent',
        label: 'Talebi Araştır (AI Agent)',
        sublabel: 'Otonom Araştırma',
        icon: Bot,
        x: 492,
        y: 132,
        w: 160,
        h: 68,
        isAgent: true,
        portXs: [432, 462, 492, 522, 552],
        wave: 2,
        enterDelay: '140ms',
      },
      {
        id: 's1-parse',
        label: 'Kararı Ayrıştır',
        sublabel: 'JSON Çıktısı',
        icon: Braces,
        x: 722,
        y: 132,
        w: 68,
        h: 68,
        wave: 3,
        enterDelay: '210ms',
      },
      {
        id: 's1-notify',
        label: 'Onay Bildirimi Gönder',
        sublabel: 'Slack / Ekip',
        icon: BellRing,
        x: 888,
        y: 132,
        w: 68,
        h: 68,
        wave: 4,
        enterDelay: '280ms',
      },
    ],
    subTools: [
      {
        id: 's1-tool-ai',
        label: 'GPT / Claude AI',
        icon: BrainCircuit,
        x: 302,
        y: 286,
        portX: 432,
        portY: 166,
        wave: 2,
      },
      {
        id: 's1-tool-policy',
        label: 'Politikayı Oku',
        icon: BookOpen,
        x: 397,
        y: 286,
        portX: 462,
        portY: 166,
        wave: 2,
      },
      {
        id: 's1-tool-history',
        label: 'Sipariş Geçmişi',
        icon: ShoppingBag,
        x: 492,
        y: 286,
        portX: 492,
        portY: 166,
        wave: 2,
      },
      {
        id: 's1-tool-tickets',
        label: 'Eski Talepler',
        icon: MessageSquareText,
        x: 587,
        y: 286,
        portX: 522,
        portY: 166,
        wave: 2,
      },
      {
        id: 's1-tool-shipping',
        label: 'Kargo Takibi',
        icon: Truck,
        x: 682,
        y: 286,
        portX: 552,
        portY: 166,
        wave: 2,
      },
    ],
    edges: [
      { id: 's1-e1', x1: 126, y1: 132, x2: 228, y2: 132, wave: 1 },
      { id: 's1-e2', x1: 296, y1: 132, x2: 412, y2: 132, wave: 2 },
      { id: 's1-e3', x1: 572, y1: 132, x2: 688, y2: 132, wave: 3 },
      { id: 's1-e4', x1: 756, y1: 132, x2: 854, y2: 132, wave: 4 },
      { id: 's1-e5', x1: 922, y1: 132, x2: 994, y2: 132, wave: 5 },
    ],
    endTrigger: { x: 1014, y: 132, wave: 5 },
    mobileSteps: [
      { kind: 'single', nodeIds: ['s1-trigger'] },
      { kind: 'single', nodeIds: ['s1-order'] },
      { kind: 'agent-tools', nodeIds: ['s1-agent'] },
      { kind: 'single', nodeIds: ['s1-parse'] },
      { kind: 'single', nodeIds: ['s1-notify'] },
    ],
  },
  {
    id: 'support-routing',
    badge: 'Senaryo 02 · Akıllı Destek & Aciliyet Yönlendirme',
    title: 'Akıllı Destek & Aciliyet Yönlendirme Akışı',
    subtitle:
      'Müşteri talebini JSON formatına dönüştürür, AI ile aciliyet skorlar ve duruma göre ekibe veya oto-yanıta yönlendirir.',
    maxWave: 5,
    nodes: [
      {
        id: 's2-trigger',
        label: 'Destek Talebi',
        sublabel: 'Webhook',
        icon: Webhook,
        x: 92,
        y: 190,
        w: 68,
        h: 68,
        wave: 0,
        enterDelay: '0ms',
      },
      {
        id: 's2-prepare',
        label: 'Veriyi Hazırla',
        sublabel: 'JSON',
        icon: Braces,
        x: 264,
        y: 190,
        w: 68,
        h: 68,
        wave: 1,
        enterDelay: '70ms',
      },
      {
        id: 's2-agent',
        label: 'AI Öncelik Analizi',
        sublabel: 'Skorlama Ajanı',
        icon: BrainCircuit,
        x: 472,
        y: 190,
        w: 160,
        h: 68,
        isAgent: true,
        plusPorts: [428, 458, 488, 518],
        wave: 2,
        enterDelay: '140ms',
      },
      {
        id: 's2-condition',
        label: 'Acil mi?',
        sublabel: 'Koşul Dallanma',
        icon: GitBranch,
        x: 682,
        y: 190,
        w: 68,
        h: 68,
        wave: 3,
        enterDelay: '210ms',
      },
      {
        id: 's2-urgent',
        label: 'Ekibe Anında Bildir',
        sublabel: 'Acil Kanal',
        icon: BellRing,
        x: 870,
        y: 102,
        w: 68,
        h: 68,
        wave: 4,
        enterDelay: '280ms',
      },
      {
        id: 's2-auto-reply',
        label: 'Otomatik Yanıt Gönder',
        sublabel: 'E-posta',
        icon: Mail,
        x: 870,
        y: 278,
        w: 68,
        h: 68,
        wave: 4,
        enterDelay: '320ms',
      },
    ],
    subTools: [],
    edges: [
      { id: 's2-e1', x1: 126, y1: 190, x2: 230, y2: 190, wave: 1 },
      { id: 's2-e2', x1: 298, y1: 190, x2: 392, y2: 190, wave: 2 },
      { id: 's2-e3', x1: 552, y1: 190, x2: 648, y2: 190, wave: 3 },
      {
        id: 's2-e4-top',
        x1: 716,
        y1: 178,
        x2: 836,
        y2: 102,
        wave: 4,
        tag: 'Acil',
        tagX: 774,
        tagY: 125,
      },
      {
        id: 's2-e4-bot',
        x1: 716,
        y1: 202,
        x2: 836,
        y2: 278,
        wave: 4,
        tag: 'Normal',
        tagX: 774,
        tagY: 256,
      },
      { id: 's2-e5-top', x1: 904, y1: 102, x2: 994, y2: 178, wave: 5 },
      { id: 's2-e5-bot', x1: 904, y1: 278, x2: 994, y2: 202, wave: 5 },
    ],
    endTrigger: { x: 1014, y: 190, wave: 5 },
    mobileSteps: [
      { kind: 'single', nodeIds: ['s2-trigger'] },
      { kind: 'single', nodeIds: ['s2-prepare'] },
      { kind: 'agent-plus', nodeIds: ['s2-agent'] },
      { kind: 'single', nodeIds: ['s2-condition'] },
      { kind: 'branch', nodeIds: ['s2-urgent', 's2-auto-reply'], tags: ['Acil', 'Normal'] },
    ],
  },
  {
    id: 'market-intel',
    badge: 'Senaryo 03 · Günlük Pazar & Rakip İstihbaratı',
    title: 'Günlük Pazar & Rakip İstihbarat Özeti',
    subtitle:
      'Her sabah 08:00’de paralel kaynakları tarar, verileri birleştirir, AI ile yönetici özeti üretip e-postayla iletir.',
    maxWave: 5,
    nodes: [
      {
        id: 's3-cron',
        label: 'Her Sabah 08:00',
        sublabel: 'Zamanlayıcı',
        icon: Clock,
        x: 92,
        y: 190,
        w: 68,
        h: 68,
        wave: 0,
        enterDelay: '0ms',
      },
      {
        id: 's3-news',
        label: 'Sektör Haberlerini Çek',
        sublabel: 'Web Tarama',
        icon: Newspaper,
        x: 294,
        y: 102,
        w: 68,
        h: 68,
        wave: 1,
        enterDelay: '70ms',
      },
      {
        id: 's3-competitors',
        label: 'Rakip Verilerini Tara',
        sublabel: 'Pazar Takibi',
        icon: Radar,
        x: 294,
        y: 278,
        w: 68,
        h: 68,
        wave: 1,
        enterDelay: '110ms',
      },
      {
        id: 's3-merge',
        label: 'Verileri Birleştir',
        sublabel: 'Merge',
        icon: GitMerge,
        x: 498,
        y: 190,
        w: 68,
        h: 68,
        wave: 2,
        enterDelay: '180ms',
      },
      {
        id: 's3-ai',
        label: 'AI ile Özetle',
        sublabel: 'Yönetici Brifingi',
        icon: Sparkles,
        x: 684,
        y: 190,
        w: 68,
        h: 68,
        wave: 3,
        enterDelay: '240ms',
      },
      {
        id: 's3-mail',
        label: 'Yöneticiye Mail At',
        sublabel: 'Günlük Rapor',
        icon: Mail,
        x: 868,
        y: 190,
        w: 68,
        h: 68,
        wave: 4,
        enterDelay: '300ms',
      },
    ],
    subTools: [],
    edges: [
      { id: 's3-e1-top', x1: 126, y1: 178, x2: 260, y2: 102, wave: 1 },
      { id: 's3-e1-bot', x1: 126, y1: 202, x2: 260, y2: 278, wave: 1 },
      { id: 's3-e2-top', x1: 328, y1: 102, x2: 464, y2: 178, wave: 2 },
      { id: 's3-e2-bot', x1: 328, y1: 278, x2: 464, y2: 202, wave: 2 },
      { id: 's3-e3', x1: 532, y1: 190, x2: 650, y2: 190, wave: 3 },
      { id: 's3-e4', x1: 718, y1: 190, x2: 834, y2: 190, wave: 4 },
      { id: 's3-e5', x1: 902, y1: 190, x2: 994, y2: 190, wave: 5 },
    ],
    endTrigger: { x: 1014, y: 190, wave: 5 },
    mobileSteps: [
      { kind: 'single', nodeIds: ['s3-cron'] },
      { kind: 'branch', nodeIds: ['s3-news', 's3-competitors'], tags: ['Paralel 1', 'Paralel 2'] },
      { kind: 'single', nodeIds: ['s3-merge'] },
      { kind: 'single', nodeIds: ['s3-ai'] },
      { kind: 'single', nodeIds: ['s3-mail'] },
    ],
  },
]

function WorkflowCanvas() {
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [runStep, setRunStep] = useState(-1)
  const [signalRunId, setSignalRunId] = useState(0)
  const [scale, setScale] = useState(1)
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const desktopFrameRef = useRef(null)
  const waveTimersRef = useRef([])
  const autoStartTimerRef = useRef(null)

  const activeScenario = scenarios[scenarioIndex]

  const clearSignalTimers = useCallback(() => {
    if (autoStartTimerRef.current) {
      window.clearTimeout(autoStartTimerRef.current)
      autoStartTimerRef.current = null
    }
    waveTimersRef.current.forEach((id) => window.clearTimeout(id))
    waveTimersRef.current = []
  }, [])

  const triggerSignalRun = useCallback(() => {
    clearSignalTimers()
    setSignalRunId((prev) => prev + 1)
    setRunStep(0)

    if (reducedMotion) {
      setRunStep(activeScenario.maxWave)
      return
    }

    for (let wave = 1; wave <= activeScenario.maxWave; wave += 1) {
      const timerId = window.setTimeout(() => {
        setRunStep(wave)
      }, wave * WAVE_STEP_MS)
      waveTimersRef.current.push(timerId)
    }
  }, [activeScenario.maxWave, clearSignalTimers, reducedMotion])

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = (event) => setReducedMotion(event.matches)
    motionPreference.addEventListener('change', updatePreference)
    return () => motionPreference.removeEventListener('change', updatePreference)
  }, [])

  // Measure desktop canvas wrapper so the 1080px SVG/node stage scales seamlessly from 768px to 1280px+
  useEffect(() => {
    const element = desktopFrameRef.current
    if (!element) return undefined

    const updateScale = () => {
      const available = element.clientWidth
      if (available > 0) {
        setScale(Math.min(1, available / CANVAS_WIDTH))
      }
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Schedule auto signal 2 seconds after each scenario opens
  useEffect(() => {
    clearSignalTimers()
    setRunStep(reducedMotion ? activeScenario.maxWave : -1)

    if (reducedMotion) return undefined

    autoStartTimerRef.current = window.setTimeout(() => {
      triggerSignalRun()
    }, AUTO_SIGNAL_DELAY_MS)

    return () => clearSignalTimers()
  }, [scenarioIndex, activeScenario.maxWave, clearSignalTimers, reducedMotion, triggerSignalRun])

  // Auto-rotate scenarios every 10 seconds
  useEffect(() => {
    if (reducedMotion) return undefined

    const rotateTimer = window.setTimeout(() => {
      setScenarioIndex((prev) => (prev + 1) % scenarios.length)
    }, SCENARIO_ROTATE_MS)

    return () => window.clearTimeout(rotateTimer)
  }, [scenarioIndex, reducedMotion])

  const handleNextScenario = () => {
    setScenarioIndex((prev) => (prev + 1) % scenarios.length)
  }

  const getNodeById = (id) => activeScenario.nodes.find((n) => n.id === id)

  const renderNodeStateClasses = (wave) => {
    if (runStep === wave) {
      return 'border-rose-500 ring-4 ring-rose-500/15 shadow-lg shadow-rose-500/15 scale-[1.04]'
    }
    if (runStep > wave) {
      return 'border-violet-500/80 ring-2 ring-violet-500/15 shadow-md shadow-violet-500/10'
    }
    return 'border-slate-200/90 shadow-sm hover:border-slate-300'
  }

  const renderIconStateClasses = (wave) => {
    if (runStep === wave) {
      return 'bg-rose-50 text-rose-600 border-rose-200'
    }
    if (runStep > wave) {
      return 'bg-violet-50 text-violet-600 border-violet-200'
    }
    return 'bg-slate-50 text-slate-700 border-slate-200/80'
  }

  const isCompleted = runStep >= activeScenario.maxWave

  return (
    <div
      className="workflow-canvas-shell w-full max-w-7xl mx-auto min-h-[580px] md:min-h-[630px] rounded-[28px] border border-slate-200/90 shadow-xl shadow-slate-900/[0.06] flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden"
      aria-label="Flowmind AI interaktif canlı iş akışı tuvali"
    >
      {/* Top Center Action Pills */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#iletisim"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wide bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 text-rose-700 border border-rose-200/90 shadow-sm hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 transition-all"
          >
            <span>HEMEN BAŞLA</span>
            <ArrowRight size={14} strokeWidth={2.4} />
          </a>

          <button
            type="button"
            onClick={handleNextScenario}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wide bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/90 shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <RefreshCw size={13} strokeWidth={2.2} />
            <span>SENARYO DEĞİŞTİR</span>
          </button>
        </div>

        {/* Scenario Header & Status */}
        <div className="text-center max-w-2xl px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 text-[11px] font-semibold text-violet-700 shadow-sm mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                runStep >= 0 && !isCompleted
                  ? 'bg-rose-500 animate-ping'
                  : isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-violet-500'
              }`}
            />
            <span>{activeScenario.badge}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            {activeScenario.title}
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1 leading-relaxed">
            {activeScenario.subtitle}
          </p>
        </div>
      </div>

      {/* DESKTOP / TABLET PIXEL-EXACT NODE WORKFLOW CANVAS (>= 768px) */}
      <div
        ref={desktopFrameRef}
        className="hidden md:flex justify-center items-center w-full my-2 relative z-10"
      >
        <div
          style={{
            width: `${CANVAS_WIDTH * scale}px`,
            height: `${CANVAS_HEIGHT * scale}px`,
          }}
          className="relative"
        >
          <div
            key={activeScenario.id}
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            className="relative select-none"
          >
            {/* Inline SVG Layer: Bezier Cables + Dashed Sub-Tool Lines + Live Signal Flow */}
            <svg
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            >
              <defs>
                <linearGradient id={`signal-grad-${activeScenario.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F43F5E" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
                <filter id={`signal-glow-${activeScenario.id}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Main Bezier Cables */}
              {activeScenario.edges.map((edge, idx) => {
                const pathD = createBezierPath(edge.x1, edge.y1, edge.x2, edge.y2)
                const isLit = runStep >= edge.wave

                return (
                  <g key={edge.id}>
                    {/* Base inactive cable */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      className="workflow-cable-enter"
                      style={{ animationDelay: `${idx * 65}ms` }}
                    />

                    {/* Active glowing signal fill */}
                    {isLit && (
                      <>
                        <path
                          key={`lit-${signalRunId}-${edge.id}`}
                          d={pathD}
                          fill="none"
                          stroke={`url(#signal-grad-${activeScenario.id})`}
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          pathLength={1}
                          filter={`url(#signal-glow-${activeScenario.id})`}
                          className="workflow-signal-draw"
                        />
                        {!reducedMotion && runStep === edge.wave && (
                          <circle
                            key={`dot-${signalRunId}-${edge.id}`}
                            r="4.5"
                            fill="#F43F5E"
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                          >
                            <animateMotion
                              dur="0.46s"
                              repeatCount="1"
                              fill="freeze"
                              path={pathD}
                            />
                          </circle>
                        )}
                      </>
                    )}

                    {/* Branch Labels (e.g., Acil / Normal) */}
                    {edge.tag && (
                      <g transform={`translate(${edge.tagX}, ${edge.tagY})`}>
                        <rect
                          x="-24"
                          y="-10"
                          width="48"
                          height="20"
                          rx="10"
                          fill={isLit ? '#FFF1F2' : '#FFFFFF'}
                          stroke={isLit ? '#FDA4AF' : '#E2E8F0'}
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="10"
                          fontWeight="700"
                          fill={isLit ? '#BE123C' : '#64748B'}
                        >
                          {edge.tag}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}

              {/* Scenario 1: 5 Vertical Dashed Lines to Circular Sub-Tool Nodes */}
              {activeScenario.subTools.map((tool, idx) => {
                const dropD = createDashedDropPath(tool.portX, tool.portY, tool.x, tool.y - 28)
                const isLit = runStep >= tool.wave

                return (
                  <g key={`${tool.id}-line`}>
                    <path
                      d={dropD}
                      fill="none"
                      stroke={isLit ? '#F43F5E' : '#94A3B8'}
                      strokeWidth={isLit ? '2.2' : '1.6'}
                      strokeDasharray="5 5"
                      className={isLit ? 'workflow-dash-flow' : 'workflow-cable-enter'}
                      style={{ animationDelay: isLit ? `${idx * 55}ms` : '180ms' }}
                    />
                    <circle
                      cx={tool.portX}
                      cy={tool.portY}
                      r="3.5"
                      fill={isLit ? '#F43F5E' : '#FFFFFF'}
                      stroke={isLit ? '#F43F5E' : '#94A3B8'}
                      strokeWidth="1.5"
                    />
                  </g>
                )
              })}

              {/* Scenario 2: 4 '+' Port Connectors beneath AI Priority Agent */}
              {activeScenario.nodes
                .filter((n) => n.plusPorts)
                .flatMap((agent) =>
                  agent.plusPorts.map((px, idx) => {
                    const isLit = runStep >= agent.wave
                    return (
                      <line
                        key={`plus-line-${idx}`}
                        x1={px}
                        y1={agent.y + agent.h / 2}
                        x2={px}
                        y2={agent.y + agent.h / 2 + 26}
                        stroke={isLit ? '#7C3AED' : '#94A3B8'}
                        strokeWidth="1.6"
                        strokeDasharray="4 4"
                        className={isLit ? 'workflow-dash-flow' : ''}
                      />
                    )
                  }),
                )}
            </svg>

            {/* HTML Nodes Layer */}
            {activeScenario.nodes.map((node) => {
              const Icon = node.icon
              const isActiveWave = runStep === node.wave
              const isPassedWave = runStep > node.wave

              return (
                <div
                  key={node.id}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    animationDelay: node.enterDelay,
                  }}
                  className="workflow-node-enter absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                >
                  <div
                    style={{ width: `${node.w}px`, height: `${node.h}px` }}
                    className={`relative rounded-2xl bg-white border transition-all duration-300 flex items-center justify-center ${
                      node.isAgent ? 'px-3.5 gap-2.5' : ''
                    } ${renderNodeStateClasses(node.wave)}`}
                  >
                    {/* Left & Right Connection Ports */}
                    {node.wave > 0 && (
                      <span
                        className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border bg-white transition-colors ${
                          isActiveWave
                            ? 'border-rose-500 bg-rose-500'
                            : isPassedWave
                              ? 'border-violet-500 bg-violet-500'
                              : 'border-slate-300'
                        }`}
                      />
                    )}
                    <span
                      className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border bg-white transition-colors ${
                        isActiveWave
                          ? 'border-rose-500 bg-rose-500'
                          : isPassedWave
                            ? 'border-violet-500 bg-violet-500'
                            : 'border-slate-300'
                      }`}
                    />

                    {/* Node Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-300 ${renderIconStateClasses(
                        node.wave,
                      )}`}
                    >
                      <Icon size={20} strokeWidth={1.9} />
                    </div>

                    {/* Wide AI Agent Title Inside Box */}
                    {node.isAgent && (
                      <div className="min-w-0 text-left">
                        <span className="block text-[11px] font-bold text-slate-800 leading-tight">
                          {node.label}
                        </span>
                        <span className="block text-[10px] font-medium text-slate-400 mt-0.5">
                          {node.sublabel}
                        </span>
                      </div>
                    )}

                    {/* Triggered micro dot */}
                    {(isActiveWave || isPassedWave) && (
                      <span
                        className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                          isActiveWave ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                      />
                    )}
                  </div>

                  {/* Labels beneath 68x68 square nodes */}
                  {!node.isAgent && (
                    <div className="mt-2 text-center w-28">
                      <span className="block text-[11px] font-semibold text-slate-700 leading-tight">
                        {node.label}
                      </span>
                      <span className="block text-[9.5px] font-medium text-slate-400 mt-0.5">
                        {node.sublabel}
                      </span>
                    </div>
                  )}

                  {/* Scenario 2: 4 '+' Port Sockets directly below AI Agent */}
                  {node.plusPorts && (
                    <div className="flex items-center gap-[10px] mt-[26px]">
                      {node.plusPorts.map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center text-[11px] font-bold transition-colors ${
                            runStep >= node.wave
                              ? 'bg-violet-50 border-violet-300 text-violet-700'
                              : 'bg-white border-slate-300 text-slate-400'
                          }`}
                        >
                          +
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Scenario 1: 5 Circular Sub-Tool Nodes (56x56px circles) */}
            {activeScenario.subTools.map((tool, idx) => {
              const ToolIcon = tool.icon
              const isLit = runStep >= tool.wave
              return (
                <div
                  key={tool.id}
                  style={{
                    left: `${tool.x}px`,
                    top: `${tool.y}px`,
                    animationDelay: `${200 + idx * 45}ms`,
                  }}
                  className="workflow-node-enter absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                >
                  <div
                    className={`w-[56px] h-[56px] rounded-full bg-white border flex items-center justify-center transition-all duration-300 ${
                      runStep === tool.wave
                        ? 'border-rose-500 ring-4 ring-rose-500/15 shadow-md shadow-rose-500/15 scale-105'
                        : isLit
                          ? 'border-violet-400 ring-2 ring-violet-400/15 shadow-sm'
                          : 'border-slate-200/90 shadow-sm'
                    }`}
                  >
                    <ToolIcon
                      size={20}
                      strokeWidth={1.85}
                      className={
                        runStep === tool.wave
                          ? 'text-rose-600'
                          : isLit
                            ? 'text-violet-600'
                            : 'text-slate-600'
                      }
                    />
                  </div>
                  <span className="mt-2 text-[10.5px] font-semibold text-slate-600 text-center w-24 leading-tight">
                    {tool.label}
                  </span>
                </div>
              )
            })}

            {/* Right-End Interactive '+' Button + Pulsing 'BURAYA TIKLA' Badge */}
            <div
              style={{
                left: `${activeScenario.endTrigger.x}px`,
                top: `${activeScenario.endTrigger.y}px`,
              }}
              className="workflow-node-enter absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            >
              <button
                type="button"
                onClick={triggerSignalRun}
                className="group relative flex flex-col items-center cursor-pointer focus:outline-none"
                aria-label="Canlı sinyal akışını çalıştır"
              >
                <span className="absolute -top-9 whitespace-nowrap px-2.5 py-1 rounded-full bg-rose-500 text-white text-[9.5px] font-extrabold tracking-wider shadow-md shadow-rose-500/25 workflow-click-pulse">
                  BURAYA TIKLA
                </span>
                <span
                  className={`w-[40px] h-[40px] rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-rose-600 ${
                    runStep === activeScenario.endTrigger.wave
                      ? 'ring-4 ring-rose-500/30 bg-rose-600 scale-110'
                      : ''
                  }`}
                >
                  <Plus size={20} strokeWidth={2.4} />
                </span>
                <span className="mt-2 text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                  {isCompleted ? 'Tekrar Çalıştır' : 'Test Et'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE RESPONSIVE VERTICAL FLOW (< 768px) */}
      <div key={`mob-${activeScenario.id}`} className="md:hidden relative z-10 my-5 flex flex-col items-center gap-0">
        {activeScenario.mobileSteps.map((step, idx) => (
          <div key={idx} className="w-full flex flex-col items-center">
            {step.kind === 'single' && (() => {
              const node = getNodeById(step.nodeIds[0])
              if (!node) return null
              const Icon = node.icon
              return (
                <div className="flex flex-col items-center">
                  <div
                    className={`w-[68px] h-[68px] rounded-2xl bg-white border flex items-center justify-center transition-all duration-300 ${renderNodeStateClasses(
                      node.wave,
                    )}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center ${renderIconStateClasses(
                        node.wave,
                      )}`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>
                  <span className="mt-1.5 text-xs font-semibold text-slate-800 text-center">
                    {node.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{node.sublabel}</span>
                </div>
              )
            })()}

            {step.kind === 'agent-tools' && (() => {
              const agent = getNodeById(step.nodeIds[0])
              if (!agent) return null
              const AgentIcon = agent.icon
              const isLit = runStep >= agent.wave
              return (
                <div className="w-full flex flex-col items-center">
                  <div
                    className={`w-[190px] h-[68px] rounded-2xl bg-white border px-3.5 flex items-center gap-2.5 transition-all duration-300 ${renderNodeStateClasses(
                      agent.wave,
                    )}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${renderIconStateClasses(
                        agent.wave,
                      )}`}
                    >
                      <AgentIcon size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] font-bold text-slate-800 leading-tight">
                        {agent.label}
                      </span>
                      <span className="block text-[10px] text-slate-400">{agent.sublabel}</span>
                    </div>
                  </div>

                  {/* Dashed connectors + 5 circular tools in responsive wrap */}
                  <div className="w-full max-w-sm mt-2 grid grid-cols-3 gap-2.5 pt-2 border-t border-dashed border-slate-300">
                    {activeScenario.subTools.map((tool) => {
                      const ToolIcon = tool.icon
                      return (
                        <div key={tool.id} className="flex flex-col items-center text-center">
                          <span
                            className={`w-px h-3 border-l border-dashed mb-1 ${
                              isLit ? 'border-rose-500' : 'border-slate-300'
                            }`}
                          />
                          <div
                            className={`w-12 h-12 rounded-full bg-white border flex items-center justify-center transition-all ${
                              runStep === tool.wave
                                ? 'border-rose-500 ring-2 ring-rose-500/20'
                                : isLit
                                  ? 'border-violet-400'
                                  : 'border-slate-200'
                            }`}
                          >
                            <ToolIcon
                              size={17}
                              className={isLit ? 'text-rose-600' : 'text-slate-600'}
                            />
                          </div>
                          <span className="mt-1 text-[10px] font-semibold text-slate-600 leading-tight">
                            {tool.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {step.kind === 'agent-plus' && (() => {
              const agent = getNodeById(step.nodeIds[0])
              if (!agent) return null
              const AgentIcon = agent.icon
              return (
                <div className="flex flex-col items-center">
                  <div
                    className={`w-[190px] h-[68px] rounded-2xl bg-white border px-3.5 flex items-center gap-2.5 transition-all duration-300 ${renderNodeStateClasses(
                      agent.wave,
                    )}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${renderIconStateClasses(
                        agent.wave,
                      )}`}
                    >
                      <AgentIcon size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] font-bold text-slate-800 leading-tight">
                        {agent.label}
                      </span>
                      <span className="block text-[10px] text-slate-400">{agent.sublabel}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {agent.plusPorts?.map((_, pIdx) => (
                      <span
                        key={pIdx}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center text-[11px] font-bold ${
                          runStep >= agent.wave
                            ? 'bg-violet-50 border-violet-300 text-violet-700'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}
                      >
                        +
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}

            {step.kind === 'branch' && (
              <div className="w-full max-w-sm grid grid-cols-2 gap-3">
                {step.nodeIds.map((nid, bIdx) => {
                  const bNode = getNodeById(nid)
                  if (!bNode) return null
                  const BIcon = bNode.icon
                  return (
                    <div key={nid} className="flex flex-col items-center text-center">
                      {step.tags?.[bIdx] && (
                        <span className="mb-1.5 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[9.5px] font-bold text-slate-500">
                          {step.tags[bIdx]}
                        </span>
                      )}
                      <div
                        className={`w-[64px] h-[64px] rounded-2xl bg-white border flex items-center justify-center transition-all ${renderNodeStateClasses(
                          bNode.wave,
                        )}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center ${renderIconStateClasses(
                            bNode.wave,
                          )}`}
                        >
                          <BIcon size={18} />
                        </div>
                      </div>
                      <span className="mt-1.5 text-[11px] font-semibold text-slate-700 leading-tight">
                        {bNode.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Vertical animated SVG connector between mobile steps */}
            {idx < activeScenario.mobileSteps.length && (
              <svg width="24" height="28" viewBox="0 0 24 28" className="my-1 overflow-visible">
                <line
                  x1="12"
                  y1="0"
                  x2="12"
                  y2="28"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {runStep >= idx + 1 && (
                  <line
                    x1="12"
                    y1="0"
                    x2="12"
                    y2="28"
                    stroke="#F43F5E"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            )}
          </div>
        ))}

        {/* Mobile Right-End '+' Trigger */}
        <button
          type="button"
          onClick={triggerSignalRun}
          className="mt-2 flex flex-col items-center cursor-pointer focus:outline-none"
          aria-label="Canlı sinyal akışını çalıştır"
        >
          <span className="mb-2 px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold tracking-wider shadow-sm workflow-click-pulse">
            BURAYA TIKLA
          </span>
          <span className="w-[40px] h-[40px] rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-lg">
            <Plus size={20} strokeWidth={2.4} />
          </span>
        </button>
      </div>

      {/* Bottom Scenario Switcher Dots & Live Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/70">
        <span className="text-[11px] font-medium text-slate-500">
          {isCompleted
            ? 'Akış simülasyonu tamamlandı · Tekrar izlemek için + düğmesine tıklayın'
            : runStep >= 0
              ? 'Canlı veri sinyali düğümler arasında akıyor...'
              : 'Her 10 sn’de bir senaryo otomatik değişir · 2 sn içinde canlı sinyal başlar'}
        </span>

        <div className="flex items-center gap-2" role="tablist" aria-label="Senaryo seçici">
          {scenarios.map((scenario, idx) => {
            const isCurrent = idx === scenarioIndex
            return (
              <button
                key={scenario.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={scenario.title}
                onClick={() => setScenarioIndex(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  isCurrent
                    ? 'w-7 bg-violet-600'
                    : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WorkflowCanvas

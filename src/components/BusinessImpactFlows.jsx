import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bot,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Play,
  Search,
  Sheet,
  Sparkles,
  Star,
  TrendingUp,
  Utensils,
  XCircle,
  Zap,
} from 'lucide-react'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 316
const WAVE_STEP_MS = 460
const AUTO_START_DELAY_MS = 1600
const AUTO_REPLAY_INTERVAL_MS = 9500

function createBezierPath(x1, y1, x2, y2, curveOffset = 0) {
  const dx = Math.abs(x2 - x1) * 0.45
  return `M ${x1} ${y1} C ${x1 + dx} ${y1 + curveOffset}, ${x2 - dx} ${y2 - curveOffset}, ${x2} ${y2}`
}

function createDashedDropPath(x1, y1, x2, y2) {
  const dy = Math.abs(y2 - y1) * 0.55
  return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`
}

const impactScenarios = [
  {
    id: 'restaurant',
    tabTitle: 'Senaryo 1: Restoran & Kafe Örneği',
    tabSubtitle: 'Sizin Restoranınız vs. Rakibiniz',
    tabIcon: Utensils,
    withoutTitle: 'Sizin Restoranınız (Manuel Süreç)',
    withoutBody: (
      <>
        Akşam yoğunluğunda WhatsApp ve Instagram&apos;dan gelen masa rezervasyonu mesajlarına{' '}
        <strong>2 saat sonra</strong> dönülür. Müşteri beklemez,{' '}
        <strong>yan sokaktaki rakibinize</strong> gider. Günde ortalama{' '}
        <strong>4–5 masa kaybı.</strong>
      </>
    ),
    withTitle: 'AI Akışlı Restoranınız',
    withBody: (
      <>
        Müşteri yazdığı saniye AI asistan menüyü paylaşır, boş masayı kontrol eder,
        rezervasyonu onaylar ve mutfağa/tabloya işler.{' '}
        <strong>Sıfır personel eforu, %100 müşteri kazanımı.</strong>
      </>
    ),
    nodes: [
      {
        id: 'r-msg',
        topTag: 'Müşteriniz',
        label: 'Müşteri Mesajı',
        sublabel: '"4 kişilik masa var mı?"',
        icon: MessageCircle,
        x: 84,
        y: 112,
        w: 68,
        h: 68,
        wave: 0,
      },
      {
        id: 'r-ai',
        topTag: 'Sizin İşletmeniz',
        label: 'Sizin Restoran AI',
        sublabel: 'Masa & Saat Kontrolü',
        icon: Bot,
        x: 278,
        y: 112,
        w: 168,
        h: 68,
        isAgent: true,
        portXs: [232, 278, 324],
        wave: 1,
      },
      {
        id: 'r-confirm',
        topTag: 'Rakibinizden Önce',
        label: 'Anında Onay (3 sn)',
        sublabel: 'Müşteriye Rezervasyon Linki',
        icon: CheckCircle2,
        x: 478,
        y: 112,
        w: 68,
        h: 68,
        wave: 2,
      },
      {
        id: 'r-sheets',
        topTag: 'Otomatik Kayıt',
        label: 'Google Sheets Kayıt',
        sublabel: 'Müşteri & VIP Listesi',
        icon: Sheet,
        x: 658,
        y: 112,
        w: 68,
        h: 68,
        wave: 3,
      },
      {
        id: 'r-revenue',
        topTag: 'Otomatik Kazanç',
        label: 'Kazanılan Ciro',
        sublabel: 'Rakibe Gitmeden Masa Doldu',
        icon: Star,
        x: 838,
        y: 112,
        w: 68,
        h: 68,
        wave: 4,
      },
    ],
    subTools: [
      {
        id: 'r-tool-calendar',
        label: 'Masa Takvimi',
        icon: Calendar,
        x: 176,
        y: 252,
        portX: 232,
        portY: 146,
        wave: 1,
      },
      {
        id: 'r-tool-menu',
        label: 'Dijital Menü',
        icon: Utensils,
        x: 278,
        y: 252,
        portX: 278,
        portY: 146,
        wave: 1,
      },
      {
        id: 'r-tool-map',
        label: 'Konum & Kampanya',
        icon: MapPin,
        x: 380,
        y: 252,
        portX: 324,
        portY: 146,
        wave: 1,
      },
    ],
    edges: [
      { id: 'r-e1', x1: 118, y1: 112, x2: 194, y2: 112, wave: 1, curve: -12 },
      { id: 'r-e2', x1: 362, y1: 112, x2: 444, y2: 112, wave: 2, curve: 12 },
      { id: 'r-e3', x1: 512, y1: 112, x2: 624, y2: 112, wave: 3, curve: -14 },
      { id: 'r-e4', x1: 692, y1: 112, x2: 804, y2: 112, wave: 4, curve: 14 },
      { id: 'r-e5', x1: 872, y1: 112, x2: 938, y2: 112, wave: 5, curve: 0 },
    ],
  },
  {
    id: 'office',
    tabTitle: 'Senaryo 2: Ofis, Klinik & Hizmet Örneği',
    tabSubtitle: 'Sizin Ofisiniz vs. Rakibiniz',
    tabIcon: Building2,
    withoutTitle: 'Sizin Ofisiniz (Manuel Süreç)',
    withoutBody: (
      <>
        Web sitesinden teklif isteyen müşteriye ertesi gün dönüş yapılır. Teklif hazırlamak{' '}
        <strong>45 dakika</strong> sürer; müşteri o arada{' '}
        <strong>hızlı dönen rakibinizle</strong> anlaşır.
      </>
    ),
    withTitle: 'AI Akışlı Ofisiniz',
    withBody: (
      <>
        Form dolduğu an AI müşterinin şirketini analiz eder, özel teklif taslağını{' '}
        <strong>15 saniyede</strong> mail atar ve size sıcak randevu olarak bildirir.{' '}
        <strong>Günde 3+ saat zaman ve 2 kat satış kazancı.</strong>
      </>
    ),
    nodes: [
      {
        id: 'o-lead',
        topTag: 'Müşteriniz',
        label: 'Yeni Müşteri Talebi',
        sublabel: 'Web Formu / Teklif İsteği',
        icon: FileText,
        x: 84,
        y: 112,
        w: 68,
        h: 68,
        wave: 0,
      },
      {
        id: 'o-ai',
        topTag: 'Sizin İşletmeniz',
        label: 'Sizin Ofis AI',
        sublabel: 'Müşteri & İhtiyaç Analizi',
        icon: Sparkles,
        x: 278,
        y: 112,
        w: 168,
        h: 68,
        isAgent: true,
        portXs: [232, 278, 324],
        wave: 1,
      },
      {
        id: 'o-proposal',
        topTag: 'Rakibinizden Önce',
        label: '15 Saniyede Özel Teklif',
        sublabel: 'Kişiselleştirilmiş E-posta / PDF',
        icon: Mail,
        x: 478,
        y: 112,
        w: 68,
        h: 68,
        wave: 2,
      },
      {
        id: 'o-crm',
        topTag: 'Otomatik Kayıt',
        label: 'CRM & Takip Listesi',
        sublabel: 'Otomatik Hatırlatma',
        icon: Sheet,
        x: 658,
        y: 112,
        w: 68,
        h: 68,
        wave: 3,
      },
      {
        id: 'o-deal',
        topTag: 'Otomatik Kazanç',
        label: 'Sıcak Randevu & Satış',
        sublabel: 'Rakibiniz Dönmeden İşi Aldınız',
        icon: CalendarCheck,
        x: 838,
        y: 112,
        w: 68,
        h: 68,
        wave: 4,
      },
    ],
    subTools: [
      {
        id: 'o-tool-company',
        label: 'Şirket Araştırma',
        icon: Globe,
        x: 176,
        y: 252,
        portX: 232,
        portY: 146,
        wave: 1,
      },
      {
        id: 'o-tool-pricing',
        label: 'Fiyat Listesi',
        icon: Search,
        x: 278,
        y: 252,
        portX: 278,
        portY: 146,
        wave: 1,
      },
      {
        id: 'o-tool-calendar',
        label: 'Takvim Kontrolü',
        icon: Calendar,
        x: 380,
        y: 252,
        portX: 324,
        portY: 146,
        wave: 1,
      },
    ],
    edges: [
      { id: 'o-e1', x1: 118, y1: 112, x2: 194, y2: 112, wave: 1, curve: -12 },
      { id: 'o-e2', x1: 362, y1: 112, x2: 444, y2: 112, wave: 2, curve: 12 },
      { id: 'o-e3', x1: 512, y1: 112, x2: 624, y2: 112, wave: 3, curve: -14 },
      { id: 'o-e4', x1: 692, y1: 112, x2: 804, y2: 112, wave: 4, curve: 14 },
      { id: 'o-e5', x1: 872, y1: 112, x2: 938, y2: 112, wave: 5, curve: 0 },
    ],
  },
]

const impactMetrics = [
  '⏱️ Yanıt Süresi: 2 Saat → 4 Saniye',
  '📈 Müşteri Dönüşümü: +%65 Artış',
  '💰 Kurtarılan Zaman: Haftada 18 Saat',
]

function BusinessImpactFlows() {
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [runStep, setRunStep] = useState(-1)
  const [signalRunId, setSignalRunId] = useState(0)
  const [scale, setScale] = useState(1)
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const desktopFrameRef = useRef(null)
  const waveTimersRef = useRef([])
  const startTimerRef = useRef(null)
  const replayTimerRef = useRef(null)

  const scenario = impactScenarios[scenarioIndex]

  const clearAllTimers = useCallback(() => {
    if (startTimerRef.current) {
      window.clearTimeout(startTimerRef.current)
      startTimerRef.current = null
    }
    if (replayTimerRef.current) {
      window.clearInterval(replayTimerRef.current)
      replayTimerRef.current = null
    }
    waveTimersRef.current.forEach((id) => window.clearTimeout(id))
    waveTimersRef.current = []
  }, [])

  const runSignalFlow = useCallback(() => {
    waveTimersRef.current.forEach((id) => window.clearTimeout(id))
    waveTimersRef.current = []

    setSignalRunId((prev) => prev + 1)
    setRunStep(0)

    if (reducedMotion) {
      setRunStep(5)
      return
    }

    for (let wave = 1; wave <= 5; wave += 1) {
      const id = window.setTimeout(() => {
        setRunStep(wave)
      }, wave * WAVE_STEP_MS)
      waveTimersRef.current.push(id)
    }
  }, [reducedMotion])

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = (event) => setReducedMotion(event.matches)
    motionPreference.addEventListener('change', updatePreference)
    return () => motionPreference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const el = desktopFrameRef.current
    if (!el) return undefined

    const updateScale = () => {
      if (el.clientWidth > 0) {
        setScale(Math.min(1, el.clientWidth / CANVAS_WIDTH))
      }
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    clearAllTimers()
    setRunStep(reducedMotion ? 5 : -1)

    if (reducedMotion) return undefined

    startTimerRef.current = window.setTimeout(() => {
      runSignalFlow()
    }, AUTO_START_DELAY_MS)

    replayTimerRef.current = window.setInterval(() => {
      runSignalFlow()
    }, AUTO_REPLAY_INTERVAL_MS)

    return () => clearAllTimers()
  }, [scenarioIndex, clearAllTimers, reducedMotion, runSignalFlow])

  const handleManualTest = () => {
    if (startTimerRef.current) {
      window.clearTimeout(startTimerRef.current)
      startTimerRef.current = null
    }
    runSignalFlow()
  }

  const getNodeBoxClasses = (wave) => {
    if (runStep >= wave) {
      return 'border-emerald-500 ring-4 ring-emerald-500/15 shadow-lg shadow-emerald-500/15 scale-[1.03]'
    }
    return 'border-slate-200/90 shadow-sm hover:border-emerald-300'
  }

  const getIconBoxClasses = (wave) => {
    if (runStep >= wave) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    }
    return 'bg-slate-50 text-slate-700 border-slate-200/80'
  }

  const allCompleted = runStep >= 5

  return (
    <section
      id="isletme-senaryolari"
      className="relative py-16 md:py-24 border-b border-slate-200/80 bg-gradient-to-b from-[#f5f6fb] via-[#f4f3ff] to-[#f0efff]"
      aria-label="Gerçek işletme senaryoları kayıp ve kazanç karşılaştırması"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Title & Scenario Tabs */}
        <div className="max-w-3xl mx-auto text-center mb-9">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-purple-200/80 text-[10.5px] font-extrabold tracking-[1.2px] text-violet-700 shadow-sm">
            <Zap size={12} className="text-emerald-500" />
            <span>GERÇEK İŞLETME SENARYOLARI · KAYIP VS. KAZANÇ</span>
          </span>

          <h2 className="mt-4 text-2xl sm:text-3xl md:text-[38px] font-bold text-slate-900 tracking-tight leading-[1.18]">
            Bu Akış Olmazsa Müşteriyi Rakibinize Kaptırırsınız.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-emerald-600">
              Olursa 7/24 Kazanırsınız.
            </span>
          </h2>

          {/* 2 Large Concrete Business Tabs */}
          <div
            className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto"
            role="tablist"
            aria-label="İşletme senaryosu seçimi"
          >
            {impactScenarios.map((item, idx) => {
              const TabIcon = item.tabIcon
              const isSelected = idx === scenarioIndex

              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setScenarioIndex(idx)}
                  className={`flex items-center gap-3.5 text-left px-4 py-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-violet-500 shadow-lg shadow-violet-500/10 ring-2 ring-violet-500/15'
                      : 'bg-white/70 border-slate-200/90 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <TabIcon size={19} />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs sm:text-[13px] font-bold text-slate-800 leading-snug">
                      {item.tabTitle}
                    </span>
                    <span className="block text-[11px] font-medium text-slate-500 mt-0.5">
                      {item.tabSubtitle}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Dot-Grid Showcase Canvas */}
        <div className="workflow-canvas-shell w-full max-w-7xl mx-auto min-h-[620px] rounded-[28px] border border-slate-200/90 shadow-xl shadow-slate-900/[0.06] flex flex-col justify-between gap-6 p-4 sm:p-6 md:p-8 relative overflow-hidden">
          {/* Layer A: Red vs. Emerald Comparison Strip */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Red - Without This Flow */}
            <div className="rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/95 via-white to-rose-50/60 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-extrabold tracking-wide">
                  <XCircle size={13} />
                  <span>❌ Bu Akış Olmazsa</span>
                </span>
              </div>
              <p className="text-xs sm:text-[13.5px] text-slate-700 leading-relaxed">
                <strong className="text-rose-900">{scenario.withoutTitle}:</strong>{' '}
                {scenario.withoutBody}
              </p>
            </div>

            {/* Right Card: Emerald - With This AI Flow */}
            <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 via-white to-emerald-50/60 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-extrabold tracking-wide">
                  <CheckCircle2 size={13} />
                  <span>✅ Bu AI Akışı Olursa</span>
                </span>
                <span className="text-[10.5px] font-bold text-emerald-700 bg-white/90 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  7/24 Otomatik
                </span>
              </div>
              <p className="text-xs sm:text-[13.5px] text-slate-700 leading-relaxed">
                <strong className="text-emerald-900">{scenario.withTitle}:</strong>{' '}
                {scenario.withBody}
              </p>
            </div>
          </div>

          {/* Layer B (Desktop >= 768px): Pixel-Exact SVG Bezier Workflow */}
          <div
            ref={desktopFrameRef}
            className="hidden md:flex justify-center items-center w-full relative z-10"
          >
            <div
              style={{
                width: `${CANVAS_WIDTH * scale}px`,
                height: `${CANVAS_HEIGHT * scale}px`,
              }}
              className="relative"
            >
              <div
                key={scenario.id}
                style={{
                  width: `${CANVAS_WIDTH}px`,
                  height: `${CANVAS_HEIGHT}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
                className="relative select-none"
              >
                <svg
                  viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                  className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                >
                  <defs>
                    <linearGradient id={`impact-grad-${scenario.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>

                  {/* Curved Bezier Cables */}
                  {scenario.edges.map((edge, idx) => {
                    const pathD = createBezierPath(edge.x1, edge.y1, edge.x2, edge.y2, edge.curve)
                    const isLit = runStep >= edge.wave

                    return (
                      <g key={edge.id}>
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#CBD5E1"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          className="workflow-cable-enter"
                          style={{ animationDelay: `${idx * 70}ms` }}
                        />
                        {isLit && (
                          <>
                            <path
                              key={`impact-lit-${signalRunId}-${edge.id}`}
                              d={pathD}
                              fill="none"
                              stroke={`url(#impact-grad-${scenario.id})`}
                              strokeWidth="3"
                              strokeLinecap="round"
                              pathLength={1}
                              className="workflow-signal-draw"
                            />
                            {!reducedMotion && runStep === edge.wave && (
                              <circle
                                key={`impact-dot-${signalRunId}-${edge.id}`}
                                r="5"
                                fill="#10B981"
                                stroke="#FFFFFF"
                                strokeWidth="1.5"
                              >
                                <animateMotion
                                  dur="0.44s"
                                  repeatCount="1"
                                  fill="freeze"
                                  path={pathD}
                                />
                              </circle>
                            )}
                          </>
                        )}
                      </g>
                    )
                  })}

                  {/* 3 Dashed Tool Connections under AI Agent */}
                  {scenario.subTools.map((tool, idx) => {
                    const dropD = createDashedDropPath(tool.portX, tool.portY, tool.x, tool.y - 26)
                    const isLit = runStep >= tool.wave

                    return (
                      <g key={`${tool.id}-line`}>
                        <path
                          d={dropD}
                          fill="none"
                          stroke={isLit ? '#10B981' : '#94A3B8'}
                          strokeWidth={isLit ? '2.2' : '1.6'}
                          strokeDasharray="5 5"
                          className={isLit ? 'workflow-dash-flow' : 'workflow-cable-enter'}
                          style={{ animationDelay: isLit ? `${idx * 60}ms` : '160ms' }}
                        />
                        <circle
                          cx={tool.portX}
                          cy={tool.portY}
                          r="3.5"
                          fill={isLit ? '#10B981' : '#FFFFFF'}
                          stroke={isLit ? '#10B981' : '#94A3B8'}
                          strokeWidth="1.5"
                        />
                      </g>
                    )
                  })}
                </svg>

                {/* 5 Business Nodes */}
                {scenario.nodes.map((node, idx) => {
                  const Icon = node.icon
                  const isLit = runStep >= node.wave

                  return (
                    <div
                      key={node.id}
                      style={{
                        left: `${node.x}px`,
                        top: `${node.y}px`,
                        animationDelay: `${idx * 65}ms`,
                      }}
                      className="workflow-node-enter absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    >
                      {/* Concrete Business Role Pill Above Node */}
                      <span
                        className={`mb-2 px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wide whitespace-nowrap transition-colors duration-300 ${
                          isLit
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {node.topTag}
                      </span>

                      <div
                        style={{ width: `${node.w}px`, height: `${node.h}px` }}
                        className={`relative rounded-2xl bg-white border transition-all duration-300 flex items-center justify-center ${
                          node.isAgent ? 'px-3.5 gap-2.5' : ''
                        } ${getNodeBoxClasses(node.wave)}`}
                      >
                        {node.wave > 0 && (
                          <span
                            className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border transition-colors ${
                              isLit
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-slate-300 bg-white'
                            }`}
                          />
                        )}
                        <span
                          className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border transition-colors ${
                            isLit
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-slate-300 bg-white'
                          }`}
                        />

                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-300 ${getIconBoxClasses(
                            node.wave,
                          )}`}
                        >
                          <Icon size={20} strokeWidth={1.9} />
                        </div>

                        {node.isAgent && (
                          <div className="min-w-0 text-left">
                            <span className="block text-[11.5px] font-bold text-slate-800 leading-tight">
                              {node.label}
                            </span>
                            <span className="block text-[10px] font-medium text-slate-500 mt-0.5">
                              {node.sublabel}
                            </span>
                          </div>
                        )}

                        {isLit && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-sm">
                            <CheckCircle2 size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>

                      {!node.isAgent && (
                        <div className="mt-2 text-center w-32">
                          <span className="block text-[11.5px] font-bold text-slate-800 leading-tight">
                            {node.label}
                          </span>
                          <span className="block text-[10px] font-medium text-slate-500 mt-0.5 leading-snug">
                            {node.sublabel}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* 3 Circular Dashed Tool Nodes */}
                {scenario.subTools.map((tool, idx) => {
                  const ToolIcon = tool.icon
                  const isLit = runStep >= tool.wave
                  return (
                    <div
                      key={tool.id}
                      style={{
                        left: `${tool.x}px`,
                        top: `${tool.y}px`,
                        animationDelay: `${160 + idx * 55}ms`,
                      }}
                      className="workflow-node-enter absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    >
                      <div
                        className={`w-[52px] h-[52px] rounded-full bg-white border flex items-center justify-center transition-all duration-300 ${
                          isLit
                            ? 'border-emerald-500 ring-4 ring-emerald-500/15 shadow-md shadow-emerald-500/10'
                            : 'border-slate-200/90 shadow-sm'
                        }`}
                      >
                        <ToolIcon
                          size={19}
                          strokeWidth={1.85}
                          className={isLit ? 'text-emerald-600' : 'text-slate-600'}
                        />
                      </div>
                      <span className="mt-1.5 text-[10.5px] font-semibold text-slate-700 text-center w-28 leading-tight">
                        {tool.label}
                      </span>
                    </div>
                  )
                })}

                {/* Right-End 'CANLI TEST ET' Interactive Button */}
                <div
                  style={{ left: '998px', top: '112px' }}
                  className="workflow-node-enter absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                >
                  <button
                    type="button"
                    onClick={handleManualTest}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11px] font-extrabold tracking-wide shadow-lg transition-all cursor-pointer whitespace-nowrap ${
                      allCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                        : 'bg-slate-950 hover:bg-emerald-600 text-white shadow-slate-900/20'
                    }`}
                  >
                    <Play size={13} fill="currentColor" />
                    <span>CANLI TEST ET</span>
                  </button>
                  <span className="mt-2 text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                    {allCompleted ? 'Tüm Adımlar Yeşil ✓' : 'Sinyali Başlat'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Layer B (Mobile < 768px): Readable Vertical Node Flow */}
          <div key={`mob-${scenario.id}`} className="md:hidden relative z-10 flex flex-col items-center">
            {scenario.nodes.map((node, idx) => {
              const Icon = node.icon
              const isLit = runStep >= node.wave
              return (
                <div key={node.id} className="w-full flex flex-col items-center">
                  <span
                    className={`mb-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                      isLit
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {node.topTag}
                  </span>

                  <div
                    className={`w-full max-w-xs rounded-2xl bg-white border px-4 py-3 flex items-center gap-3 transition-all duration-300 ${getNodeBoxClasses(
                      node.wave,
                    )}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getIconBoxClasses(
                        node.wave,
                      )}`}
                    >
                      <Icon size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-slate-800 leading-tight">
                        {node.label}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {node.sublabel}
                      </span>
                    </div>
                    {isLit && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                  </div>

                  {/* Mobile 3 Dashed Sub-Tools under AI Agent */}
                  {node.isAgent && (
                    <div className="w-full max-w-xs mt-2 grid grid-cols-3 gap-2 pt-2 border-t border-dashed border-slate-300">
                      {scenario.subTools.map((tool) => {
                        const ToolIcon = tool.icon
                        const toolLit = runStep >= tool.wave
                        return (
                          <div key={tool.id} className="flex flex-col items-center text-center">
                            <span
                              className={`w-px h-2.5 border-l border-dashed mb-1 ${
                                toolLit ? 'border-emerald-500' : 'border-slate-300'
                              }`}
                            />
                            <div
                              className={`w-10 h-10 rounded-full bg-white border flex items-center justify-center ${
                                toolLit ? 'border-emerald-500 text-emerald-600' : 'border-slate-200 text-slate-600'
                              }`}
                            >
                              <ToolIcon size={16} />
                            </div>
                            <span className="mt-1 text-[10px] font-semibold text-slate-600 leading-tight">
                              {tool.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {idx < scenario.nodes.length - 1 && (
                    <svg width="20" height="24" viewBox="0 0 20 24" className="my-1">
                      <line
                        x1="10"
                        y1="0"
                        x2="10"
                        y2="24"
                        stroke={runStep >= idx + 1 ? '#10B981' : '#CBD5E1'}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
              )
            })}

            <button
              type="button"
              onClick={handleManualTest}
              className={`mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wide shadow-lg cursor-pointer transition-colors ${
                allCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-white hover:bg-emerald-600'
              }`}
            >
              <Play size={13} fill="currentColor" />
              <span>{allCompleted ? 'TEKRAR CANLI TEST ET' : 'CANLI TEST ET'}</span>
            </button>
          </div>

          {/* Layer C: Bottom Impact Bar (3 Concrete Metric Badges) */}
          <div className="relative z-10 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {impactMetrics.map((metric) => (
                <span
                  key={metric}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-slate-200/90 text-xs font-bold text-slate-700 shadow-sm"
                >
                  {metric}
                </span>
              ))}
            </div>

            <a
              href="#iletisim"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <TrendingUp size={15} />
              <span>İşletmeniz İçin Kuralım →</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BusinessImpactFlows

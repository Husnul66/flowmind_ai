import { useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Info,
  LockKeyhole,
  MessageCircle,
  Monitor,
  Sparkles,
  Workflow,
} from 'lucide-react'

const MAX_CHARACTERS = 1000
const examplePrompt =
  'Bir güzellik salonu için WhatsApp üzerinden gelen randevu taleplerini yöneten, uygun saatleri kontrol eden ve müşterilere otomatik cevap veren bir sistem istiyorum.'
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
  .trim()
  .replace(/\/+$/, '')

function isDemoResponse(value) {
  const miniSite = value?.mini_site

  return Boolean(
    value
    && typeof value === 'object'
    && typeof value.title === 'string'
    && typeof value.business_problem === 'string'
    && typeof value.solution_summary === 'string'
    && Array.isArray(value.steps)
    && value.steps.length > 0
    && value.steps.length <= 5
    && value.steps.every((step) => (
      step
      && typeof step === 'object'
      && typeof step.name === 'string'
      && typeof step.description === 'string'
      && typeof step.tool === 'string'
    ))
    && Array.isArray(value.benefits)
    && value.benefits.length > 0
    && value.benefits.length <= 3
    && value.benefits.every((benefit) => (
      typeof benefit === 'string' && benefit.trim().length > 0
    ))
    && typeof value.estimated_time_saving === 'string'
    && typeof value.implementation_note === 'string'
    && miniSite
    && typeof miniSite === 'object'
    && !Array.isArray(miniSite)
    && typeof miniSite.brand_name === 'string'
    && miniSite.brand_name.length > 0
    && miniSite.brand_name.length <= 80
    && typeof miniSite.domain_slug === 'string'
    && miniSite.domain_slug.length <= 60
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(miniSite.domain_slug)
    && typeof miniSite.tagline === 'string'
    && miniSite.tagline.length > 0
    && miniSite.tagline.length <= 140
    && ['indigo', 'emerald', 'rose', 'amber'].includes(miniSite.accent_color)
    && Array.isArray(miniSite.selectable_options)
    && miniSite.selectable_options.length === 3
    && miniSite.selectable_options.every((option) => (
      typeof option === 'string' && option.trim().length > 0 && option.length <= 80
    ))
    && Array.isArray(miniSite.chat_preview)
    && miniSite.chat_preview.length === 3
    && miniSite.chat_preview.every((message, index) => (
      message
      && typeof message === 'object'
      && message.sender === ['customer', 'bot', 'system'][index]
      && typeof message.text === 'string'
      && message.text.trim().length > 0
      && message.text.length <= 180
    ))
    && Array.isArray(miniSite.kpi_cards)
    && miniSite.kpi_cards.length === 2
    && miniSite.kpi_cards.every((card) => (
      card
      && typeof card === 'object'
      && typeof card.label === 'string'
      && card.label.trim().length > 0
      && card.label.length <= 60
      && typeof card.value === 'string'
      && card.value.trim().length > 0
      && card.value.length <= 40
    ))
  )
}

function DemoGenerator({ onDemoGenerated }) {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0)
  const isLoading = status === 'loading'
  const selectedOption = result?.mini_site.selectable_options[selectedOptionIndex]

  function updatePrompt(value) {
    setPrompt(value)
    setResult(null)
    setSelectedOptionIndex(0)
    setErrorMessage('')
    setStatus('idle')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isLoading) return

    const normalizedPrompt = prompt.trim()
    if (!normalizedPrompt || normalizedPrompt.length > MAX_CHARACTERS) {
      setErrorMessage('Lütfen 1.000 karakteri aşmayan bir iş ihtiyacı yazın.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setResult(null)
    setErrorMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/demos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: normalizedPrompt }),
      })
      const responseBody = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof responseBody.detail === 'string'
            ? responseBody.detail
            : 'Demo şu anda oluşturulamadı. Lütfen daha sonra tekrar deneyin.',
        )
      }
      if (!isDemoResponse(responseBody)) {
        throw new Error('Demo servisi beklenmeyen bir yanıt verdi.')
      }

      setResult(responseBody)
      onDemoGenerated(responseBody)
      setSelectedOptionIndex(0)
      setStatus('success')
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.name === 'Error'
          ? error.message
          : 'Sunucuya bağlanılamadı veya geçerli bir yanıt alınamadı. Lütfen daha sonra tekrar deneyin.',
      )
      setStatus('error')
    }
  }

  return (
    <section className="section demo-generator-section" id="ai-demo">
      <div className="container">
        <div className="demo-generator-heading">
          <span className="eyebrow">İŞLETMENİZE ÖZEL DEMO</span>
          <h2>İş fikrinizi anlatın, otomasyon akışınızı keşfedin.</h2>
          <p>
            Otomatikleştirmek istediğiniz süreci yazın. Gemini, ihtiyacınıza göre
            adımları, önerilen araçları ve uygulama notlarını içeren bir demo taslağı
            oluştursun.
          </p>
        </div>

        <div className="demo-generator-layout">
          <div className="demo-prompt-card">
            <div className="demo-prompt-heading">
              <span className="demo-prompt-icon"><Sparkles size={18} /></span>
              <div>
                <h3>Nasıl bir otomasyon istiyorsunuz?</h3>
                <p>İş probleminizi günlük dilinizle anlatmanız yeterli.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="demo-prompt-label" htmlFor="automation-prompt">İşletme ihtiyacınız</label>
              <textarea
                id="automation-prompt"
                name="automationPrompt"
                value={prompt}
                onChange={(event) => updatePrompt(event.target.value)}
                maxLength={MAX_CHARACTERS}
                placeholder={examplePrompt}
                required
                rows={6}
                disabled={isLoading}
                aria-describedby="prompt-help prompt-counter"
              />
              <div className="demo-prompt-meta">
                <button
                  className="demo-example-button"
                  type="button"
                  disabled={isLoading}
                  onClick={() => updatePrompt(examplePrompt)}
                >
                  Örnek metni kullan <ArrowDown size={14} />
                </button>
                <span id="prompt-counter" className="character-counter" aria-live="polite">
                  {prompt.length} / {MAX_CHARACTERS} karakter
                </span>
              </div>
              <span id="prompt-help" className="sr-only">
                En fazla 1000 karakter yazabilirsiniz.
              </span>
              <button
                className="button button-primary demo-generate-button"
                type="submit"
                disabled={isLoading || !prompt.trim()}
              >
                {isLoading
                  ? <><span className="spinner" /> Demo hazırlanıyor...</>
                  : <>{result ? 'Yeni Demo Oluştur' : 'Ücretsiz Demo Oluştur'} <ArrowRight size={17} /></>}
              </button>
            </form>

            <div className="demo-rights-note">
              <Info size={17} />
              <p>
                <strong>Demo kullanım sınırları</strong>
                Günlük toplam limit ve istemci-IP aralığı koruması uygulanır. Bu,
                doğrulanmış müşteri başına demo hakkı değildir.
              </p>
            </div>
          </div>

          <div className="demo-preview-column" aria-live="polite" aria-busy={isLoading}>
            <div className="demo-preview-card">
              <div className="demo-preview-header">
                <span className="demo-preview-icon"><CalendarCheck size={18} /></span>
                <div>
                  <span className="demo-preview-label">
                    {result ? 'GEMINI İLE OLUŞTURULDU' : 'KİŞİSELLEŞTİRİLMİŞ AI DEMOSU'}
                  </span>
                  <h3>{result?.title || (isLoading ? 'Demo hazırlanıyor' : 'Demo ön izlemesi')}</h3>
                </div>
                <span className="preview-status">
                  <span /> {result ? 'AI taslağı' : isLoading ? 'Hazırlanıyor' : 'Bekliyor'}
                </span>
              </div>

              {isLoading && (
                <div className="demo-preview-placeholder" role="status">
                  <span><span className="spinner" /></span>
                  <strong>İhtiyacınıza özel akış hazırlanıyor</strong>
                  <p>Bu işlem birkaç saniye sürebilir.</p>
                </div>
              )}

              {status === 'error' && (
                <div className="form-alert form-alert-error demo-generation-error" role="alert">
                  <strong>Demo oluşturulamadı.</strong>
                  <span>{errorMessage}</span>
                </div>
              )}

              {result && (
                <div className="demo-result-content">
                  <div className={`mini-browser mini-browser--${result.mini_site.accent_color}`}>
                    <div className="mini-browser-toolbar">
                      <div className="mini-browser-dots" aria-hidden="true">
                        <span /><span /><span />
                      </div>
                      <div className="mini-browser-address">
                        <LockKeyhole size={11} />
                        <span>https://demo.flowmind.ai/{result.mini_site.domain_slug}</span>
                      </div>
                      <span className="mini-browser-live"><span /> Canlı Ön İzleme</span>
                    </div>

                    <div className="mini-site-screen">
                      <div className="mini-site-brand">
                        <span className="mini-site-logo"><Sparkles size={16} /></span>
                        <div>
                          <strong>{result.mini_site.brand_name}</strong>
                          <span>KİŞİSEL DENEYİM</span>
                        </div>
                        <span className="mini-site-brand-mark"><Monitor size={15} /></span>
                      </div>

                      <section className="mini-site-hero">
                        <span className="mini-site-eyebrow">SİZE ÖZEL, KOLAYCA</span>
                        <h4>{result.mini_site.brand_name}</h4>
                        <p>{result.mini_site.tagline}</p>
                      </section>

                      <section className="mini-site-options" aria-label="Randevu seçimi">
                        <div className="mini-site-section-heading">
                          <div>
                            <span>İLK ADIM</span>
                            <h5>Size uygun seçeneği belirleyin</h5>
                          </div>
                          <BadgeCheck size={17} />
                        </div>
                        <div className="mini-option-list">
                          {result.mini_site.selectable_options.map((option, index) => (
                            <button
                              className={`mini-option${selectedOptionIndex === index ? ' is-selected' : ''}`}
                              type="button"
                              key={`${option}-${index}`}
                              aria-pressed={selectedOptionIndex === index}
                              onClick={() => setSelectedOptionIndex(index)}
                            >
                              <span className="mini-option-radio">
                                {selectedOptionIndex === index && <Check size={11} />}
                              </span>
                              <span>{option}</span>
                              <ArrowRight size={14} />
                            </button>
                          ))}
                        </div>
                      </section>

                      <section className="mini-automation-preview" aria-live="polite">
                        <div className="mini-site-section-heading mini-automation-heading">
                          <div>
                            <span>CANLI OTOMASYON AKIŞI</span>
                            <h5>Seçimden onaya</h5>
                          </div>
                          <span className="mini-flow-running"><span /> AKTİF</span>
                        </div>
                        <div className="mini-chat-list">
                          {result.mini_site.chat_preview.map((message, index) => {
                            const senderLabels = {
                              customer: 'WhatsApp',
                              bot: 'AI Asistan',
                              system: 'Sistem Bildirimi',
                            }
                            const senderIcons = {
                              customer: <MessageCircle size={13} />,
                              bot: <Bot size={13} />,
                              system: <CheckCircle2 size={13} />,
                            }
                            const hasOptionToken = message.text.includes('{{option}}')
                            const messageText = hasOptionToken
                              ? message.text.replaceAll('{{option}}', selectedOption)
                              : message.sender === 'customer'
                                ? `${message.text} Seçimim: ${selectedOption}.`
                                : message.text

                            return (
                              <div
                                className={`mini-chat-message mini-chat-message--${message.sender}`}
                                key={`${message.sender}-${index}`}
                              >
                                <span className="mini-chat-avatar">{senderIcons[message.sender]}</span>
                                <div className="mini-chat-bubble">
                                  <span>{senderLabels[message.sender]}</span>
                                  <p>{messageText}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="mini-live-confirmation" key={selectedOption}>
                          <CheckCircle2 size={15} />
                          <span><strong>{selectedOption}</strong> seçimi onaylandı ve takvime işlendi.</span>
                        </div>
                      </section>

                      <div className="mini-flow-metrics-grid">
                        <section className="mini-flow-section">
                          <div className="mini-site-section-heading">
                            <div>
                              <span>OTOMASYON ZİNCİRİ</span>
                              <h5>Her adım birbiriyle bağlı</h5>
                            </div>
                            <Workflow size={16} />
                          </div>
                          <div className="mini-flow-steps">
                            {result.steps.map((step, index) => (
                              <div className="mini-flow-step-wrap" key={`${step.name}-${index}`}>
                                <div className="mini-flow-step">
                                  <span className="mini-flow-step-number">{String(index + 1).padStart(2, '0')}</span>
                                  <div>
                                    <strong>{step.name}</strong>
                                    <span>{step.tool}</span>
                                  </div>
                                  <Check size={13} />
                                </div>
                                {index < result.steps.length - 1 && (
                                  <span className="mini-flow-step-connector" aria-hidden="true">
                                    <ArrowDown size={11} />
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>

                        <aside className="mini-kpi-section" aria-label="Beklenen metrikler">
                          {result.mini_site.kpi_cards.map((card, index) => (
                            <div className="mini-kpi-card" key={`${card.label}-${index}`}>
                              <span>{card.label}</span>
                              <strong>{card.value}</strong>
                            </div>
                          ))}
                          <div className="mini-time-saving">
                            <span>TAHMİNİ ZAMAN KAZANCI</span>
                            <strong>{result.estimated_time_saving}</strong>
                          </div>
                        </aside>
                      </div>
                    </div>
                  </div>

                  <details className="mini-details">
                    <summary>
                      <span><Info size={15} /> Otomasyon Detayları &amp; Notlar</span>
                      <ChevronDown size={16} />
                    </summary>
                    <div className="mini-details-content">
                      <section>
                        <span className="demo-result-label">İŞ PROBLEMİ</span>
                        <p>{result.business_problem}</p>
                      </section>
                      <section>
                        <span className="demo-result-label">ÖNERİLEN ÇÖZÜM</span>
                        <p>{result.solution_summary}</p>
                      </section>
                      <section>
                        <span className="demo-result-label">BEKLENEN FAYDALAR</span>
                        <ul>
                          {result.benefits.map((benefit, index) => (
                            <li key={`${benefit}-${index}`}>{benefit}</li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <span className="demo-result-label">UYGULAMA NOTU</span>
                        <p>{result.implementation_note}</p>
                      </section>
                    </div>
                  </details>

                  <p className="demo-preview-disclaimer">
                    Bu, yapay zekâ tarafından oluşturulan bir taslaktır; gerçek entegrasyon,
                    sonuç veya zaman tasarrufu garantisi değildir.
                  </p>
                </div>
              )}

              {!isLoading && !result && status !== 'error' && (
                <div className="demo-preview-placeholder">
                  <span><Sparkles size={18} /></span>
                  <strong>AI demo taslağınız burada görünecek</strong>
                  <p>İhtiyacınızı yazıp demo oluşturduğunuzda size özel öneri bu alanda görüntülenir.</p>
                </div>
              )}
            </div>
            <div className="demo-preview-footnote">
              <Sparkles size={15} />
              <span>Önerilen araçlar ve akış, gerçek kurulum öncesinde ihtiyaç analiziyle doğrulanmalıdır.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DemoGenerator

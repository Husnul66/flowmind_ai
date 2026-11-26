import { useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  CalendarCheck,
  Check,
  Info,
  MessageCircle,
  Sparkles,
} from 'lucide-react'

const MAX_CHARACTERS = 1000
const examplePrompt =
  'Bir güzellik salonu için WhatsApp üzerinden gelen randevu taleplerini yöneten, uygun saatleri kontrol eden ve müşterilere otomatik cevap veren bir sistem istiyorum.'

const previewSteps = [
  { title: 'WhatsApp mesajı alınır', detail: 'Randevu talebi otomasyon akışına aktarılır.', icon: MessageCircle },
  { title: 'Talep bilgileri anlaşılır', detail: 'Hizmet ve tercih edilen zaman belirlenir.', icon: Sparkles },
  { title: 'Uygun saat kontrol edilir', detail: 'Takvimdeki müsaitlik bilgisi kontrol edilir.', icon: CalendarCheck },
  { title: 'Müşteriye yanıt verilir', detail: 'Uygun saat bilgisi WhatsApp üzerinden iletilir.', icon: Check },
]

function DemoGenerator() {
  const [prompt, setPrompt] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    if (prompt.trim()) {
      setShowPreview(true)
    }
  }

  return (
    <section className="section demo-generator-section" id="ai-demo">
      <div className="container">
        <div className="demo-generator-heading">
          <span className="eyebrow">İŞLETMENİZE ÖZEL DEMO</span>
          <h2>İş fikrinizi anlatın, otomasyon akışınızı keşfedin.</h2>
          <p>
            Otomatikleştirmek istediğiniz süreci yazın. Aşağıdaki ön izleme, kişiselleştirilmiş
            AI demolarının nasıl sunulacağını gösteren sabit bir örnektir.
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
                onChange={(event) => {
                  setPrompt(event.target.value)
                  setShowPreview(false)
                }}
                maxLength={MAX_CHARACTERS}
                placeholder={examplePrompt}
                required
                rows={6}
                aria-describedby="prompt-help prompt-counter"
              />
              <div className="demo-prompt-meta">
                <button className="demo-example-button" type="button" onClick={() => setPrompt(examplePrompt)}>
                  Örnek metni kullan <ArrowDown size={14} />
                </button>
                <span id="prompt-counter" className="character-counter" aria-live="polite">
                  {prompt.length} / {MAX_CHARACTERS} karakter
                </span>
              </div>
              <span id="prompt-help" className="sr-only">
                En fazla 1000 karakter yazabilirsiniz.
              </span>
              <button className="button button-primary demo-generate-button" type="submit">
                Ücretsiz Demo Oluştur <ArrowRight size={17} />
              </button>
            </form>

            <div className="demo-rights-note">
              <Info size={17} />
              <p>
                <strong>Demo kullanım hakkı hakkında</strong>
                Tek kullanımlık hak kontrolü şu an etkin değildir; bu bilgilendirme ve ön izleme
                arayüzüdür. Hak yönetimi ileride sunucu tarafında eklenecektir.
              </p>
            </div>
          </div>

          <div className="demo-preview-column" aria-live="polite">
            <div className="demo-preview-card">
              <div className="demo-preview-header">
                <span className="demo-preview-icon"><CalendarCheck size={18} /></span>
                <div>
                  <span className="demo-preview-label">ÖRNEK AKIŞ ÖN İZLEMESİ</span>
                  <h3>{showPreview ? 'WhatsApp randevu otomasyonu' : 'Otomasyon ön izlemesi'}</h3>
                </div>
                <span className="preview-status"><span /> Örnek</span>
              </div>

              {showPreview ? (
                <>
                  <div className="demo-submitted-prompt">
                    <span>Gönderdiğiniz senaryo</span>
                    <p>{prompt}</p>
                  </div>

                  <div className="demo-preview-flow">
                    {previewSteps.map((step, index) => {
                      const Icon = step.icon
                      return (
                        <div className="demo-preview-step-wrap" key={step.title}>
                          <div className="demo-preview-step">
                            <span className="demo-preview-step-icon"><Icon size={16} /></span>
                            <div>
                              <strong>{step.title}</strong>
                              <p>{step.detail}</p>
                            </div>
                            <span className="demo-preview-number">0{index + 1}</span>
                          </div>
                          {index < previewSteps.length - 1 && <span className="demo-preview-connector" aria-hidden="true" />}
                        </div>
                      )
                    })}
                  </div>

                  <p className="demo-preview-disclaimer">
                    Bu sabit güzellik salonu senaryosu yalnızca örnektir; AI tarafından üretilmez ve
                    gönderdiğiniz metne göre kişiselleştirilmez.
                  </p>
                </>
              ) : (
                <div className="demo-preview-placeholder">
                  <span><Sparkles size={18} /></span>
                  <strong>Ön izlemeniz burada görünecek</strong>
                  <p>İşletme ihtiyacınızı yazıp ücretsiz demo oluşturduğunuzda örnek bir otomasyon akışı görüntülenir.</p>
                </div>
              )}
            </div>
            <div className="demo-preview-footnote">
              <Sparkles size={15} />
              <span>Bu alan ileride gerçek AI tarafından oluşturulan demo akışlarını gösterecek şekilde hazırlandı.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DemoGenerator

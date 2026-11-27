import { useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock3, Mail, MessageCircle, ShieldCheck } from 'lucide-react'

const packages = ['Başlangıç', 'Büyüme', 'Kurumsal']

function ContactForm({ selectedPackage, onPackageChange, lastGeneratedDemo }) {
  const formRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [errorDetail, setErrorDetail] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
    .trim()
    .replace(/\/+$/, '')
  const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim()

  async function handleSubmit(event) {
    event.preventDefault()
    if (!formRef.current) return

    setStatus('loading')
    setErrorDetail('')
    setSyncMessage('')

    try {
      const formData = new FormData(formRef.current)
      const payload = {
        fullName: formData.get('fullName'),
        companyName: formData.get('companyName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        website: formData.get('website'),
        selectedPackage: formData.get('selectedPackage'),
        requirements: formData.get('requirements'),
        submittedAt: new Date().toISOString(),
        demo_title: lastGeneratedDemo?.title || 'İşletmenize Özel Otomasyon Talebi',
        brand_name: lastGeneratedDemo?.mini_site?.brand_name || '',
        solution_summary: lastGeneratedDemo?.solution_summary
          || 'İhtiyaçlarınıza özel AI destekli iş akışı ve otomasyon planlaması.',
        estimated_time_saving: lastGeneratedDemo?.estimated_time_saving
          || 'Haftalık ortalama %40-%60 zaman tasarrufu potansiyeli',
        steps_summary: lastGeneratedDemo?.steps?.length
          ? lastGeneratedDemo.steps.map((step, index) => `${index + 1}. ${step.name}`).join(' → ')
          : '1. İhtiyaç Analizi → 2. Akış Tasarımı → 3. Canlı Kurulum',
      }

      const response = await fetch(`${apiBaseUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('request-failed')
      }

      const result = await response.json()
      if (
        !['synced', 'pending', 'failed'].includes(result.googleSheetsSyncStatus)
        || !['not_configured', 'accepted', 'failed'].includes(result.activepiecesStatus)
        || typeof result.webhook_synced !== 'boolean'
      ) {
        throw new Error('invalid-response')
      }

      formRef.current.reset()
      onPackageChange('')
      if (result.googleSheetsSyncStatus === 'synced') {
        setStatus('success')
      } else {
        setStatus('pending')
        setSyncMessage(
          result.webhook_synced
            ? 'Activepieces isteği kabul etti; Google Sheets aktarımı henüz doğrulanmadı. Kaydınız sistemde korunuyor.'
            : result.activepiecesStatus === 'failed'
              ? 'Otomasyon servisine ulaşılamadı. Google Sheets aktarımı tamamlanmadı; kaydınız sistemde korunuyor.'
              : 'Activepieces henüz yapılandırılmadı. Google Sheets aktarımı beklemede; kaydınız sistemde korunuyor.',
        )
      }
    } catch (error) {
      setStatus('error')
      setErrorDetail(error.message === 'invalid-response'
        ? 'Sunucudan beklenmeyen bir yanıt alındı. Girdiğiniz bilgiler bu sayfada korunuyor.'
        : 'Sunucuya bağlanılamadı veya talep doğrulanamadı. Girdiğiniz bilgiler bu sayfada korunuyor.')
    }
  }

  return (
    <section className="section contact-section" id="iletisim">
      <div className="container contact-layout">
        <div className="contact-copy">
          <span className="eyebrow">BİRLİKTE BAŞLAYALIM</span>
          <h2>İşinizi daha akıllı hale getirecek ilk adımı atın.</h2>
          <p>İhtiyacınızı kısaca anlatın. Sürecinizi değerlendirelim, size uygun otomasyon için birlikte bir yol haritası çıkaralım.</p>
          <div className="contact-promise">
            <span className="promise-icon"><ShieldCheck size={18} /></span>
            <div><strong>Ücretsiz ön değerlendirme</strong><span>Talebiniz, size uygun bir çözüm önermek için incelenir.</span></div>
          </div>
          <div className="contact-mini-note"><span className="status-pulse" /> Formunuzu gönderdiğinizde ekibimiz sizinle iletişime geçer.</div>
        </div>

        <div className="contact-form-card">
          <div className="form-heading">
            <div>
              <span className="form-step-label">ÜCRETSİZ ÖN GÖRÜŞME</span>
              <h3>Projenizi anlatın</h3>
            </div>
            <span className="form-secure"><ShieldCheck size={15} /> Güvenli form</span>
          </div>

          {(status === 'success' || status === 'pending') && (
            <div className={`form-alert ${status === 'pending' ? 'form-alert-pending' : 'form-alert-success'}`} role="status">
              {status === 'pending' ? <Clock3 size={20} /> : <CheckCircle2 size={20} />}
              <div>
                <strong>{status === 'pending' ? 'Talebiniz kaydedildi.' : 'Talebiniz alındı!'}</strong>
                <span>{status === 'pending' ? syncMessage : 'İlginiz için teşekkür ederiz. En kısa sürede sizinle iletişime geçeceğiz.'}</span>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="form-alert form-alert-error" role="alert">
              <div><strong>Talebiniz şu anda gönderilemedi.</strong><span>{errorDetail}</span></div>
              <div className="contact-alternatives">
                {whatsappNumber ? (
                  <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp ile ulaşın</a>
                ) : (
                  <span><MessageCircle size={15} /> WhatsApp: .env dosyasına VITE_WHATSAPP_NUMBER ekleyin</span>
                )}
                {contactEmail ? (
                  <a href={`mailto:${contactEmail}`}><Mail size={15} /> {contactEmail}</a>
                ) : (
                  <span><Mail size={15} /> E-posta: .env dosyasına VITE_CONTACT_EMAIL ekleyin</span>
                )}
              </div>
            </div>
          )}

          <form ref={formRef} className="contact-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="form-field">
                <span>Ad Soyad <b>*</b></span>
                <input name="fullName" type="text" autoComplete="name" placeholder="Adınız ve soyadınız" required />
              </label>
              <label className="form-field">
                <span>Şirket Adı <b>*</b></span>
                <input name="companyName" type="text" autoComplete="organization" placeholder="Şirketinizin adı" required />
              </label>
              <label className="form-field">
                <span>İş E-postası <b>*</b></span>
                <input name="email" type="email" autoComplete="email" placeholder="siz@sirketiniz.com" required />
              </label>
              <label className="form-field">
                <span>Telefon / WhatsApp <b>*</b></span>
                <input name="phone" type="tel" autoComplete="tel" placeholder="+90 5XX XXX XX XX" required />
              </label>
              <label className="form-field">
                <span>Web sitesi <em>İsteğe bağlı</em></span>
                <input name="website" type="url" autoComplete="url" placeholder="https://sirketiniz.com" />
              </label>
              <label className="form-field">
                <span>İlgilendiğiniz paket <b>*</b></span>
                <select
                  name="selectedPackage"
                  value={selectedPackage}
                  onChange={(event) => onPackageChange(event.target.value)}
                  required
                >
                  <option value="">Paket seçin</option>
                  {packages.map((packageName) => <option key={packageName} value={packageName}>{packageName}</option>)}
                </select>
              </label>
              <label className="form-field form-field-full">
                <span>İhtiyacınızı anlatın <b>*</b></span>
                <textarea name="requirements" rows="4" placeholder="Hangi işleri otomatikleştirmek veya kolaylaştırmak istiyorsunuz?" required />
              </label>
            </div>
            <button className="button button-primary form-submit" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? <><span className="spinner" /> Gönderiliyor...</> : <>Ücretsiz Analiz Talep Et <ArrowRight size={17} /></>}
            </button>
            <p className="form-privacy"><ShieldCheck size={14} /> Bilgileriniz yalnızca talebinize yanıt vermek için kullanılır.</p>
          </form>
        </div>
      </div>
    </section>
  )
}

export default ContactForm

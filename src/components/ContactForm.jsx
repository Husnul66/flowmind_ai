import { useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Mail, MessageCircle, ShieldCheck } from 'lucide-react'

const packages = ['Başlangıç', 'Büyüme', 'Kurumsal']

function ContactForm({ selectedPackage, onPackageChange }) {
  const formRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [errorDetail, setErrorDetail] = useState('')
  const webhookUrl = import.meta.env.VITE_ACTIVEPIECES_WEBHOOK_URL?.trim()
  const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim()

  async function handleSubmit(event) {
    event.preventDefault()
    if (!formRef.current) return

    setStatus('loading')
    setErrorDetail('')

    try {
      if (!webhookUrl) {
        throw new Error('missing-webhook')
      }

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
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`http-${response.status}`)
      }

      formRef.current.reset()
      onPackageChange('')
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorDetail(
        error.message === 'missing-webhook'
          ? 'Gönderim için VITE_ACTIVEPIECES_WEBHOOK_URL ayarlanmalıdır.'
          : 'Ağ bağlantısı, sunucu yanıtı veya tarayıcı CORS ayarları gönderimi engellemiş olabilir. Girdiğiniz bilgiler bu sayfada korunuyor.',
      )
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

          {status === 'success' && (
            <div className="form-alert form-alert-success" role="status">
              <CheckCircle2 size={20} />
              <div><strong>Talebiniz alındı!</strong><span>İlginiz için teşekkür ederiz. En kısa sürede sizinle iletişime geçeceğiz.</span></div>
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

import { ArrowUpRight, Bot, ChartNoAxesCombined, Database, Mail, MessageCircle, Search, Workflow } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'

const services = [
  {
    icon: Search,
    tone: 'service-violet',
    title: 'AI Lead Enrichment & Satış Asistanı',
    description: 'Satış ekibinizin doğru müşteri adaylarına, doğru bilgilerle ulaşmasına yardımcı olur.',
    features: ['Şirket araştırması ve web sitesi keşfi', 'Potansiyel müşteri verisi zenginleştirme', 'CRM entegrasyonu ve satış takibi'],
  },
  {
    icon: MessageCircle,
    tone: 'service-blue',
    title: '7/24 Akıllı Müşteri İletişim Ajanı',
    description: 'Müşteri sorularını karşılayan, ekibinizin iş yükünü hafifleten akıllı iletişim akışları.',
    features: ['E-posta otomasyonu ve WhatsApp entegrasyonu', 'Müşteri desteği ve akıllı yönlendirme', 'Randevu planlama ve hatırlatma'],
  },
  {
    icon: ChartNoAxesCombined,
    tone: 'service-cyan',
    title: 'Operasyon ve Raporlama Otomasyonu',
    description: 'Tekrarlayan operasyonel işleri azaltın; verilerinizi düzenli ve erişilebilir tutun.',
    features: ['Belge işleme ve elektronik tablo otomasyonu', 'Sistemler arasında veri eşitleme', 'Otomatik raporlama ve bildirimler'],
  },
]

function Services() {
  return (
    <section className="section services-section" id="cozumler">
      <div className="container">
        <SectionTitle
          eyebrow="SİZİN İÇİN TASARLANDI"
          title="İş akışınız daha akıllı çalışsın"
          description="Zaman alan işleri sadeleştiren, mevcut araçlarınızla uyumlu otomasyon çözümleri."
        />
        <div className="service-grid">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <article className="service-card" key={service.title}>
                <div className={`service-icon ${service.tone}`}><Icon size={21} /></div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul>
                  {service.features.map((feature) => <li key={feature}><span className="feature-check">✓</span>{feature}</li>)}
                </ul>
                <a className="card-link" href="#iletisim">Çözümü keşfedin <ArrowUpRight size={15} /></a>
              </article>
            )
          })}
        </div>
        <div className="integration-strip">
          <span className="integration-icon"><Workflow size={19} /></span>
          <span>Mevcut araçlarınızla birlikte çalışır</span>
          <span className="integration-divider" />
          <span className="integration-tool"><Database size={15} /> CRM</span>
          <span className="integration-tool"><Mail size={15} /> E-posta</span>
          <span className="integration-tool"><Bot size={15} /> Yapay zekâ</span>
        </div>
      </div>
    </section>
  )
}

export default Services

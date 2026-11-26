import { ArrowRight, Check } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'

const packages = [
  {
    name: 'Başlangıç',
    description: 'İlk otomasyon adımınızı güvenle atın.',
    features: ['Bir otomasyon iş akışı', 'Temel yapay zekâ entegrasyonu', 'Kurulum ve test'],
    cta: 'Teklif Alın',
  },
  {
    name: 'Büyüme',
    description: 'Otomasyonu birden fazla sürece taşıyın.',
    features: ['Birden fazla AI ajanı', 'CRM entegrasyonu', 'Gelişmiş iş akışları', 'Performans takibi'],
    cta: 'Büyüme Paketi İçin Teklif Alın',
    popular: true,
  },
  {
    name: 'Kurumsal',
    description: 'Karmaşık ihtiyaçlar için uçtan uca çözüm.',
    features: ['Özel yapay zekâ mimarisi', 'Gelişmiş API entegrasyonları', 'Özel bakım ve destek'],
    cta: 'Özel Teklif Alın',
  },
]

function Pricing({ onChoosePackage }) {
  return (
    <section className="section pricing-section" id="paketler">
      <div className="container">
        <SectionTitle
          eyebrow="İHTİYACINIZA UYGUN"
          title="İşletmeniz için doğru başlangıç"
          description="Her işletmenin süreci farklı. İhtiyacınızı konuşalım, kapsamı birlikte netleştirelim."
        />
        <div className="pricing-grid">
          {packages.map((item) => (
            <article className={`pricing-card${item.popular ? ' pricing-card-popular' : ''}`} key={item.name}>
              {item.popular && <span className="popular-badge">En çok tercih edilen</span>}
              <div className="pricing-name">{item.name}</div>
              <p className="pricing-description">{item.description}</p>
              <div className="pricing-price">Teklif Alın</div>
              <p className="pricing-note">İhtiyacınıza özel kapsam ve fiyatlandırma</p>
              <button
                type="button"
                className={`button pricing-button${item.popular ? ' button-primary' : ' button-outline'}`}
                onClick={() => onChoosePackage(item.name)}
              >
                {item.cta} <ArrowRight size={16} />
              </button>
              <div className="pricing-rule" />
              <span className="included-label">Pakete dahil olanlar</span>
              <ul className="pricing-features">
                {item.features.map((feature) => <li key={feature}><Check size={15} />{feature}</li>)}
              </ul>
            </article>
          ))}
        </div>
        <p className="pricing-footnote">Fiyatlandırma, entegrasyon kapsamı ve iş akışlarınız değerlendirildikten sonra belirlenir.</p>
      </div>
    </section>
  )
}

export default Pricing

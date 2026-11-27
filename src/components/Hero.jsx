import { ArrowDown, ArrowRight, Sparkles } from 'lucide-react'
import WorkflowCanvas from './WorkflowCanvas.jsx'

function Hero() {
  return (
    <section className="hero-section" id="ana-sayfa">
      <div className="hero-orb hero-orb-one" aria-hidden="true" />
      <div className="hero-orb hero-orb-two" aria-hidden="true" />
      <div className="container hero-layout">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="status-pulse" /> İşletmeniz için akıllı otomasyon</div>
          <h1>Tekrarlayan İşleri Yapay Zekâ Ajanlarına Devredin, <span>Ekibiniz Büyümeye Odaklansın.</span></h1>
          <p className="hero-description">
            Müşteri kazanımı, e-posta iletişimi, veri girişi ve raporlama gibi tekrarlayan süreçleri
            işletmenize özel yapay zekâ otomasyonlarıyla sadeleştirin.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#iletisim">Hemen Otomasyon Talep Et <ArrowRight size={17} /></a>
            <a className="button button-quiet" href="#ornek-akis"><span className="play-icon"><ArrowDown size={15} /></span> Örnek Akışları İncele</a>
          </div>
          <div className="hero-footnote"><Sparkles size={15} /> İşletmenize göre tasarlanır. Ekibinizle birlikte çalışır.</div>
        </div>
        <div className="hero-visual" id="ornek-akis"><WorkflowCanvas /></div>
      </div>
      <a className="hero-scroll" href="#cozumler"><span>Keşfet</span><ArrowDown size={15} /></a>
    </section>
  )
}

export default Hero

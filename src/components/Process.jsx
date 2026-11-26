import { ArrowRight, ClipboardList, FlaskConical, Gauge } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'

const steps = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'İhtiyaç Analizi',
    description: 'İş akışınızı, hedeflerinizi ve kullandığınız araçları birlikte değerlendiririz.',
    tag: 'Keşif ve planlama',
  },
  {
    number: '02',
    icon: FlaskConical,
    title: 'Özel AI Akışı Kurulumu & Test',
    description: 'İşletmenizin ihtiyaçlarına uygun otomasyonu kurar, gerçek senaryolarla test ederiz.',
    tag: 'Kurulum ve doğrulama',
  },
  {
    number: '03',
    icon: Gauge,
    title: 'Teslimat ve Optimizasyon',
    description: 'Ekibinize teslim eder, kullanım geri bildirimleriyle akışı iyileştirmeye devam ederiz.',
    tag: 'Canlıya geçiş',
  },
]

function Process() {
  return (
    <section className="section process-section" id="surec">
      <div className="container">
        <SectionTitle
          eyebrow="NASIL ÇALIŞIR?"
          title="Fikirden çalışan akışa, birlikte."
          description="Şeffaf, iş birliğine dayalı ve işletmenizin ihtiyaçlarına göre şekillenen üç adımlı süreç."
        />
        <div className="process-grid">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <article className="process-card" key={step.number}>
                <div className="process-card-top">
                  <span className="process-number">{step.number}</span>
                  <div className="process-icon"><Icon size={20} /></div>
                  {index < steps.length - 1 && <ArrowRight className="process-arrow" size={18} />}
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <span className="process-tag"><span />{step.tag}</span>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Process

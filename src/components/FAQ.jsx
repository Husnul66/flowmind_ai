import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'

const questions = [
  {
    question: 'Otomasyon kurulumu ne kadar sürer?',
    answer: 'Süre; iş akışının kapsamına, entegrasyon sayısına ve mevcut sistemlerinize göre değişir. İhtiyaç analizinden sonra size net bir zaman planı sunarız.',
  },
  {
    question: 'İşletme verilerimin güvenliği nasıl sağlanıyor?',
    answer: 'Veri erişimi ve saklama kapsamı, her projede kullanılan araçlara ve entegrasyonlara göre birlikte belirlenir. Yalnızca gerekli izinler ve veriler kullanılır; güvenlik gereksinimleriniz proje başlangıcında değerlendirilir.',
  },
  {
    question: 'Google Sheets, WhatsApp ve CRM sistemlerimle çalışır mı?',
    answer: 'Google Sheets ve yaygın CRM araçları dahil olmak üzere, API veya desteklenen entegrasyonlara sahip sistemlerle bağlantı kurulabilir. WhatsApp entegrasyonu için uygun bir WhatsApp Business çözümü gerekir; uyumluluğu keşif görüşmesinde doğrularız.',
  },
  {
    question: 'Kurulumdan sonra bakım ve destek sunuluyor mu?',
    answer: 'Evet. İhtiyacınıza göre izleme, bakım ve optimizasyon kapsamı belirlenebilir. Destek modeli ve kapsamı teklif aşamasında açıkça paylaşılır.',
  },
  {
    question: 'Yapay zekâ ajanlarının sınırları var mı?',
    answer: 'Evet. Ajanlar yalnızca tanımlanan görevler ve erişim izinleri çerçevesinde çalışır; her sonucu kusursuz kabul etmemek gerekir. Kritik adımlara insan onayı eklenebilir ve akışlar test edilerek güvenli biçimde devreye alınır.',
  },
  {
    question: 'Paketlerin fiyatı nedir?',
    answer: 'Sabit fiyat yerine, ihtiyaç duyulan iş akışları, entegrasyonlar ve destek kapsamına göre özel teklif hazırlanır. Form üzerinden önceliklerinizi paylaşarak teklif talep edebilirsiniz.',
  },
]

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="section faq-section" id="sss">
      <div className="container faq-container">
        <SectionTitle
          eyebrow="MERAK EDİLENLER"
          title="Aklınızdaki sorular"
          description="Otomasyon süreci ve iş birliğimiz hakkında bilmeniz gerekenler."
        />
        <div className="faq-list">
          {questions.map((item, index) => {
            const isOpen = index === openIndex
            const panelId = `faq-panel-${index}`
            return (
              <article className={`faq-item${isOpen ? ' faq-item-open' : ''}`} key={item.question}>
                <h3>
                  <button
                    className="faq-question"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  >
                    {item.question}
                    <ChevronDown size={18} />
                  </button>
                </h3>
                <div className="faq-answer" id={panelId} hidden={!isOpen}>
                  <p>{item.answer}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FAQ

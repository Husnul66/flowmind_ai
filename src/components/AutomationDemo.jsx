import { ArrowDown, Check, FileSpreadsheet, Mail, Search, Sparkles } from 'lucide-react'

const workflowSteps = [
  { title: 'Yeni Form', detail: 'Potansiyel müşteri formu alındı', icon: FileSpreadsheet, color: 'blue' },
  { title: 'AI Web Araştırması', detail: 'Şirket bilgileri zenginleştiriliyor', icon: Search, color: 'violet' },
  { title: 'Google Sheets Kaydı', detail: 'Bilgiler tabloya ekleniyor', icon: FileSpreadsheet, color: 'green' },
  { title: 'Otomatik Teklif E-postası', detail: 'Kişiye özel e-posta hazırlanıyor', icon: Mail, color: 'orange' },
]

function AutomationDemo() {
  return (
    <div className="workflow-card" aria-label="Örnek otomasyon akışı">
      <div className="workflow-topbar">
        <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
        <span className="workflow-label"><Sparkles size={14} /> Örnek otomasyon akışı</span>
        <span className="demo-badge"><span /> Temsili demo</span>
      </div>
      <div className="workflow-body">
        <div className="workflow-intro">
          <div>
            <span className="workflow-kicker">SATIŞ SÜRECİ</span>
            <h2>Bir formdan, kişiye özel teklife.</h2>
          </div>
          <span className="workflow-count">4 adım</span>
        </div>
        <div className="workflow-steps">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <div className="workflow-step-wrap" key={step.title}>
                <div className="workflow-step">
                  <span className={`workflow-icon icon-${step.color}`}><Icon size={18} /></span>
                  <span className="workflow-step-copy">
                    <strong>{step.title}</strong>
                    <small>{step.detail}</small>
                  </span>
                  <span className="step-check"><Check size={14} /></span>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className="workflow-connector" aria-hidden="true"><span /><ArrowDown size={13} /></div>
                )}
              </div>
            )
          })}
        </div>
        <p className="workflow-note">Bu görsel, olası bir iş akışını anlatan temsili bir demodur; çalışan bir otomasyon değildir.</p>
      </div>
      <div className="workflow-glow" aria-hidden="true" />
    </div>
  )
}

export default AutomationDemo

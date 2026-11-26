import { ArrowUpRight, Bot } from 'lucide-react'

const currentYear = new Date().getFullYear()

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <a className="brand footer-brand" href="#ana-sayfa">
          <span className="brand-mark"><Bot size={20} strokeWidth={2.2} /></span>
          <span>FlowMind<span className="brand-light"> AI</span></span>
        </a>
        <p>İşletmeniz için daha akıllı iş akışları.</p>
        <a className="footer-cta" href="#iletisim">Projenizi konuşalım <ArrowUpRight size={15} /></a>
      </div>
      <div className="container footer-bottom">
        <span>© {currentYear} FlowMind AI. Tüm hakları saklıdır.</span>
        <a href="#ana-sayfa">Başa dön ↑</a>
      </div>
    </footer>
  )
}

export default Footer

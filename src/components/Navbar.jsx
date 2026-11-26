import { useState } from 'react'
import { ArrowUpRight, Bot, Menu, X } from 'lucide-react'

const links = [
  { label: 'Kişisel Demo', href: '#ai-demo' },
  { label: 'Çözümler', href: '#cozumler' },
  { label: 'Nasıl Çalışır', href: '#surec' },
  { label: 'Paketler', href: '#paketler' },
  { label: 'SSS', href: '#sss' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="site-header">
      <nav className="nav-shell container" aria-label="Ana menü">
        <a className="brand" href="#ana-sayfa" onClick={closeMenu} aria-label="FlowMind AI ana sayfa">
          <span className="brand-mark"><Bot size={21} strokeWidth={2.2} /></span>
          <span>FlowMind<span className="brand-light"> AI</span></span>
        </a>

        <div className={`nav-links${menuOpen ? ' nav-links-open' : ''}`} id="primary-navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>{link.label}</a>
          ))}
          <a className="button button-small button-primary nav-mobile-cta" href="#iletisim" onClick={closeMenu}>
            Ücretsiz Analiz & Teklif Al <ArrowUpRight size={16} />
          </a>
        </div>

        <a className="button button-small button-primary nav-desktop-cta" href="#iletisim">
          Ücretsiz Analiz & Teklif Al <ArrowUpRight size={16} />
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>
    </header>
  )
}

export default Navbar

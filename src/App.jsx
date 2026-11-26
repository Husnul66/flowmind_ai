import { useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import DemoGenerator from './components/DemoGenerator.jsx'
import Services from './components/Services.jsx'
import Process from './components/Process.jsx'
import Pricing from './components/Pricing.jsx'
import FAQ from './components/FAQ.jsx'
import ContactForm from './components/ContactForm.jsx'
import Footer from './components/Footer.jsx'

function App() {
  const [selectedPackage, setSelectedPackage] = useState('')

  function choosePackage(packageName) {
    setSelectedPackage(packageName)
    document.getElementById('iletisim')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <DemoGenerator />
        <Services />
        <Process />
        <Pricing onChoosePackage={choosePackage} />
        <FAQ />
        <ContactForm
          selectedPackage={selectedPackage}
          onPackageChange={setSelectedPackage}
        />
      </main>
      <Footer />
    </>
  )
}

export default App

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/[0.07] font-body mt-24">
      <div className="max-w-[1280px] mx-auto px-margin-mobile lg:px-margin-desktop py-16 md:py-24">
        {/* Top Section: 4-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-gutter gap-y-12 mb-20">
          {/* Column 1: Brand Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-display font-bold text-2xl lg:text-3xl tracking-tighter uppercase text-white/90">The Humours Hub</h3>
              <p className="text-white/45 text-sm lg:text-base leading-relaxed">
                Ahmedabad's Own. <br className="hidden lg:block" /> A bridge between the local urban community and emerging artists.
              </p>
            </div>
            <div className="flex items-center space-x-5 pt-2">
              <a aria-label="Instagram" className="text-white/45 hover:text-primary-container transition-all duration-300 transform hover:-translate-y-1" href="https://www.instagram.com/the.humourshub" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a aria-label="Twitter X" className="text-white/45 hover:text-primary-container transition-all duration-300 transform hover:-translate-y-1" href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-x-twitter text-xl"></i>
              </a>
              <a aria-label="WhatsApp" className="text-white/45 hover:text-primary-container transition-all duration-300 transform hover:-translate-y-1" href="https://whatsapp.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-whatsapp text-xl"></i>
              </a>
            </div>
          </div>
          {/* Column 2: Explore */}
          <div className="space-y-6">
            <h4 className="font-display font-bold text-sm uppercase tracking-[0.2em] text-primary-container">Explore</h4>
            <ul className="space-y-4 text-sm lg:text-base">
              <li><Link className="text-white/45 hover:text-white transition-colors" href="/">Home</Link></li>
              <li><Link className="text-white/45 hover:text-white transition-colors" href="/shows">Shows</Link></li>
              <li><Link className="text-white/45 hover:text-white transition-colors" href="/gallery">Gallery</Link></li>
              <li><Link className="text-white/45 hover:text-white transition-colors" href="/about">About Us</Link></li>
            </ul>
          </div>
          {/* Column 3: Community */}
          <div className="space-y-6">
            <h4 className="font-display font-bold text-sm uppercase tracking-[0.2em] text-primary-container">Community</h4>
            <ul className="space-y-4 text-sm lg:text-base">
              <li><Link className="text-white/45 hover:text-white transition-colors" href="/perform-with-us">Perform With Us</Link></li>
              <li><Link className="text-white/45 hover:text-white transition-colors" href="/">Contact</Link></li>
              <li><Link className="text-white/45 hover:text-white transition-colors" href="/">Venue Hire</Link></li>
              <li><Link className="text-white/45 hover:text-white transition-colors" href="/">Support</Link></li>
            </ul>
          </div>
          {/* Column 4: Newsletter & Legal */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h4 className="font-display font-bold text-sm uppercase tracking-[0.2em] text-primary-container">Legal</h4>
              <ul className="space-y-4 text-sm lg:text-base">
                <li><Link className="text-white/45 hover:text-white transition-colors" href="/policies">Privacy Policy</Link></li>
                <li><Link className="text-white/45 hover:text-white transition-colors" href="/policies">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        {/* Bottom Bar: Developer Credit & Copyright */}
        <div className="pt-10 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 text-center md:text-left">
            © 2024 The Humours Hub. Cultivating Culture in Ahmedabad.
          </p>
          <div className="group relative">
            <Link className="inline-flex items-center gap-x-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02] transition-all duration-500 ease-out hover:border-primary-container/50 hover:bg-primary-container/[0.05] hover:drop-shadow-[0_0_15px_rgba(255,107,26,0.2)]" href="https://shubhhh.in" target="_blank" rel="noopener noreferrer">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/45 font-medium">
                Crafted with passion by
              </span>
              <span className="text-[11px] uppercase tracking-widest font-bold bg-gradient-to-r from-white via-primary-container to-white bg-[length:200%_auto] bg-clip-text text-transparent group-hover:from-primary-container group-hover:to-white" style={{ animation: 'shimmer 3s linear infinite' }}>
                Shubham Vaghela
              </span>
            </Link>
            <div className="absolute inset-0 rounded-full bg-primary-container/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}

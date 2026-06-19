import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest dark:bg-surface-container-lowest font-body-md text-body-md font-label-caps text-label-caps full-width py-16 border-t border-white/5 bg-surface-container-lowest flat no shadows flex flex-col md:flex-row items-center justify-between gap-8 px-margin-mobile md:px-margin-desktop w-full text-center md:text-left max-w-container-max mx-auto mt-24">
      <div className="font-headline-sm text-headline-sm font-bold text-on-surface flex-shrink-0">
        The Humours Hub
      </div>
      <div className="flex flex-wrap justify-center gap-6 flex-1">
        <Link className="text-on-surface-variant hover:text-on-surface hover:text-primary transition-colors" href="/">Shows</Link>
        <Link className="text-on-surface-variant hover:text-on-surface hover:text-primary transition-colors" href="#">Gallery</Link>
        <Link className="text-on-surface-variant hover:text-on-surface hover:text-primary transition-colors" href="#">About</Link>
        <Link className="text-on-surface-variant hover:text-on-surface hover:text-primary transition-colors" href="#">Perform With Us</Link>
        <Link className="text-on-surface-variant hover:text-on-surface hover:text-primary transition-colors" href="#">Contact</Link>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <a className="text-on-surface-variant hover:text-primary transition-colors" href="https://www.instagram.com/the.humourshub" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a className="text-on-surface-variant hover:text-primary transition-colors" href="#" target="_blank" rel="noopener noreferrer">BookMyShow</a>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/30 py-10">
    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <Link to="/" className="font-heading font-bold text-xl text-gradient">GapRomance</Link>
      <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
        <Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
        <Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
        <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
        <Link to="/safety" className="hover:text-primary transition-colors">Safety Guidelines</Link>
      </div>
      <p className="text-muted-foreground text-sm">© 2026 GapRomance. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;

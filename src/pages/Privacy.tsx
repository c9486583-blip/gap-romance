import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col scroll-smooth">
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-2xl font-heading font-bold text-gradient">GapRomance</Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/login">Log In</Link></Button>
            <Button variant="hero" size="sm" asChild><Link to="/signup">Join Free</Link></Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="legal-content">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 text-center">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <p className="text-center text-muted-foreground text-sm mb-12">Effective Date: March 2026 · Last Updated: March 2026</p>

            <div className="glass rounded-2xl p-8 md:p-12 space-y-8 text-foreground text-sm leading-relaxed">
              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">Introduction</h2>
                <p className="text-muted-foreground">GapRomance ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use the GapRomance platform and related services. By creating an account or using GapRomance, you agree to the collection and use of your information as described herein.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">1. Information We Collect</h2>
                <h3 className="font-bold text-primary/80 mb-2">1.1 Information You Provide</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Registration: legal name, date of birth, email, phone, password.</li>
                  <li>Profile: photos, bio, hobbies, music taste, lifestyle preferences.</li>
                  <li>Onboarding quiz responses and preferences.</li>
                  <li>Verification: government-issued photo ID and selfie.</li>
                  <li>Payment information processed securely through Stripe.</li>
                  <li>Messages, virtual gifts, and support correspondence.</li>
                </ul>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">1.2 Automatic Collection</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Device information, log data, IP address, and usage data.</li>
                  <li>Location data (with permission) for distance-based matching.</li>
                  <li>Cookies and similar tracking technologies.</li>
                </ul>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">1.3 Third Parties</h3>
                <p className="text-muted-foreground">We may receive information from Stripe, identity verification partners, and connected services like Spotify.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">2. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Create and manage your account; display your profile to other users.</li>
                  <li>Power the AI-driven matching algorithm and platform features.</li>
                  <li>Process payments and manage subscriptions.</li>
                  <li>Verify identity and age; detect and prevent fraud.</li>
                  <li>Monitor for harmful content using automated moderation.</li>
                  <li>Send account notifications, service updates, and respond to support inquiries.</li>
                  <li>Comply with applicable laws and enforce our Terms of Service.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">3. How We Share Your Information</h2>
                <p className="text-muted-foreground mb-2">Your profile is visible to other users. Your precise location is never shared — only your city or approximate distance is displayed. Messages are visible only to participants.</p>
                <p className="text-muted-foreground">We share data with trusted service providers (Stripe, hosting, verification, moderation) under strict contractual obligations. We may disclose information for legal compliance or safety purposes.</p>
                <p className="text-primary font-semibold mt-3">We do not sell, rent, or trade your personal information. Ever.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">4. Location Data</h2>
                <p className="text-muted-foreground">Your precise GPS coordinates are stored securely and never shared with other users. You may revoke location permission at any time through your device settings.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">5. Adult Content & Privacy</h2>
                <p className="text-muted-foreground">Explicit messages are stored securely and accessible only to the sender and recipient. GapRomance does not review private content except to investigate policy violations or at the direction of law enforcement.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">6. Data Retention</h2>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Active account data: retained for account duration.</li>
                  <li>Verification records: minimum 5 years.</li>
                  <li>Payment records: 7 years per financial regulations.</li>
                  <li>Messages: 2 years from conversation date.</li>
                  <li>Upon deletion: profile removed immediately, backups purged within 90 days.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">7. Data Security</h2>
                <p className="text-muted-foreground">We implement encryption in transit (SSL/TLS) and at rest, secure authentication, regular security audits, and restricted employee access. While we take every precaution, no system is impenetrable.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">8. Cookies</h2>
                <p className="text-muted-foreground">We use essential, preference, and analytics cookies. You can control cookies through your browser settings. Disabling essential cookies may affect functionality.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">9. Children's Privacy</h2>
                <p className="text-muted-foreground">GapRomance is strictly for adults. Women must be 18+ and men must be 25+. We do not knowingly collect information from anyone under the applicable minimum age. Contact GapRomanceSupport@proton.me if you believe a minor has created an account.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">10. Your Privacy Rights</h2>
                <p className="text-muted-foreground">Depending on your location, you may have rights to access, rectify, erase, port, or object to processing of your data. Contact GapRomanceSupport@proton.me to exercise these rights. We respond within 30 days.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">11. California Privacy Rights (CCPA)</h2>
                <p className="text-muted-foreground">California residents have additional rights under CCPA. GapRomance does not sell personal information. Submit CCPA requests to GapRomanceSupport@proton.me with subject line "CCPA Request."</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">12. International Users</h2>
                <p className="text-muted-foreground">GapRomance is operated from the United States. By using the Platform, you consent to the transfer of your information to the United States.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">13. Third-Party Links</h2>
                <p className="text-muted-foreground">This Privacy Policy does not apply to third-party websites or services linked from GapRomance.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">14. Changes to This Policy</h2>
                <p className="text-muted-foreground">We will notify you of material changes at least 14 days before they take effect. Continued use constitutes acceptance.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">15. Contact Us</h2>
                <p className="text-muted-foreground">Email: <a href="mailto:GapRomanceSupport@proton.me" className="text-primary hover:underline">GapRomanceSupport@proton.me</a></p>
                <p className="text-muted-foreground">We aim to respond within 2 business days.</p>
              </section>

              <div className="border-t border-border pt-6 text-center">
                <p className="text-muted-foreground italic">Your privacy matters to us. GapRomance is committed to being transparent about how we collect and use your data.</p>
                <p className="text-primary font-heading font-bold mt-4">GapRomance — Experience meets energy.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;

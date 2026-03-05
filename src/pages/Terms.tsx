import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Terms = () => {
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
              Terms of <span className="text-gradient">Service</span>
            </h1>
            <p className="text-center text-muted-foreground mb-2">& User Agreement</p>
            <p className="text-center text-muted-foreground text-sm mb-12">Effective Date: March 2026 · Last Updated: March 2026</p>

            <div className="glass rounded-2xl p-8 md:p-12 space-y-8 text-foreground text-sm leading-relaxed">
              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">Introduction</h2>
                <p>Welcome to GapRomance ("the Platform," "we," "us," or "our"). GapRomance is a premium online dating platform designed for age-gap relationships. These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and GapRomance governing your access to and use of our website, mobile application, and all related services (collectively, the "Services").</p>
                <p className="mt-3">By accessing or using GapRomance, registering an account, or clicking "I Agree," you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the Platform.</p>
                <p className="mt-3">These Terms apply to all visitors, users, and others who access or use the Services. Please also review our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and Safety Guidelines, which are incorporated into these Terms by reference.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">1. Eligibility & Age Requirements</h2>
                <h3 className="font-bold text-primary/80 mb-2">1.1 Minimum Age Requirements</h3>
                <p>GapRomance enforces strict minimum age requirements to protect all users and ensure a safe platform environment:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Women must be at least 18 years of age to register and use the Platform.</li>
                  <li>Men must be at least 25 years of age to register and use the Platform.</li>
                  <li>Any user found to be under the applicable minimum age will have their account immediately and permanently terminated.</li>
                </ul>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">1.2 Legal Capacity</h3>
                <p className="text-muted-foreground">By creating an account, you represent and warrant that you have the legal capacity to enter into a binding agreement and that you are not prohibited from using the Services under any applicable law.</p>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">1.3 Geographic Restrictions</h3>
                <p className="text-muted-foreground">GapRomance is available to users worldwide where permitted by law. You are responsible for ensuring that your use of the Platform complies with all laws and regulations applicable in your jurisdiction.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">2. Account Registration & Verification</h2>
                <h3 className="font-bold text-primary/80 mb-2">2.1 Account Creation</h3>
                <p className="text-muted-foreground">To use GapRomance, you must create an account by providing accurate, complete, and current information including your legal name, date of birth, email address, and phone number. You agree to keep this information updated at all times.</p>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">2.2 Mandatory Verification</h3>
                <p className="text-muted-foreground">Verification is mandatory for all users. No profile will appear in discovery or be visible to other users until verification is successfully completed. Upon successful verification, users receive a Verified Badge on their profile at no cost.</p>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">2.3 One Account Per Person</h3>
                <p className="text-muted-foreground">Each user is permitted one account only. Creating multiple accounts to circumvent a suspension, ban, or verification requirement is strictly prohibited.</p>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">2.4 Account Security</h3>
                <p className="text-muted-foreground">You are responsible for maintaining the confidentiality of your login credentials. Notify GapRomance immediately at support@gapromance.com if you suspect unauthorized use of your account.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">3. Onboarding Quiz & Profile</h2>
                <p className="text-muted-foreground">Upon creating an account, all users are required to complete an AI-powered onboarding quiz before their profile is made visible. You agree that all information submitted in your profile accurately represents you. You may not post photos of anyone other than yourself or misrepresent your identity in any way.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">4. Dating Modes</h2>
                <p className="text-muted-foreground">GapRomance offers two distinct modes: <strong>Serious Dating</strong> — for meaningful, long-term relationships, and <strong>Casual Dating</strong> — for non-committal connections. Users may select one or both modes. GapRomance does not guarantee any particular outcome from use of either mode.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">5. User Conduct & Prohibited Activities</h2>
                <p className="text-muted-foreground mb-2">You agree to use GapRomance respectfully and lawfully at all times. The following activities are strictly prohibited and may result in immediate account suspension or permanent termination:</p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Harassment, threats, intimidation, bullying, or any form of aggressive behavior.</li>
                  <li>Sending violent, threatening, or psychologically harmful messages or images.</li>
                  <li>Impersonating any person, entity, or public figure.</li>
                  <li>Soliciting money, financial information, or gifts from other users.</li>
                  <li>Using the Platform for commercial solicitation, advertising, or spam.</li>
                  <li>Scraping, harvesting, or collecting user data through automated means.</li>
                  <li>Uploading malware, viruses, or harmful code.</li>
                  <li>Posting content promoting discrimination or hate speech.</li>
                  <li>Any activity that violates applicable law.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">6. Adult Content Policy</h2>
                <p className="text-muted-foreground">GapRomance permits consensual adult content between users who are both adults (18+) and have mutually consented. Explicit content is permitted within private messages only. Content depicting minors, non-consensual imagery, or content used for coercion is strictly prohibited and will result in permanent termination and reporting to law enforcement.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">7. 18 U.S.C. § 2257 Compliance</h2>
                <p className="text-muted-foreground">GapRomance is not the primary producer of any sexually explicit content. Users who upload explicit content represent that all persons depicted were at least 18 years of age at the time of production.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">8. Subscriptions, Payments & Refunds</h2>
                <p className="text-muted-foreground mb-2">GapRomance offers the following subscription plans:</p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li><strong>Free Tier</strong> — Browse profiles and send limited messages.</li>
                  <li><strong>Premium</strong> — $19.99/month. Unlimited messaging, see who liked you, advanced search.</li>
                  <li><strong>Elite</strong> — $34.99/month. All Premium features plus weekly boosts and Spotlight Badge.</li>
                </ul>
                <p className="text-muted-foreground mt-3 mb-2">À la carte purchases include:</p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Profile Boost — $5.00 per boost</li>
                  <li>Super Like — $2.00 each</li>
                  <li>Spotlight Badge — $7.00 per week</li>
                  <li>Virtual Gifts — $1.00–$5.00 each</li>
                </ul>
                <p className="text-muted-foreground mt-3">All payments are processed through Stripe. Subscriptions renew automatically. All purchases are generally non-refundable. Refund requests can be sent to support@gapromance.com within 7 days.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">9. Virtual Gifts</h2>
                <p className="text-muted-foreground">Virtual gifts are purely for entertainment purposes and have no monetary value. They cannot be redeemed for cash, are non-transferable, and non-refundable once sent.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">10. Safety & Reporting</h2>
                <p className="text-muted-foreground">GapRomance is deeply committed to user safety. Every profile and message includes report and block options. We cooperate fully with law enforcement in investigations involving illegal activity.</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Never share your home address or financial information with other users.</li>
                  <li>Meet in a public place for first in-person meetings.</li>
                  <li>Inform a trusted person of your plans when meeting someone from the Platform.</li>
                  <li>Trust your instincts — if something feels wrong, report it.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">11. Intellectual Property</h2>
                <p className="text-muted-foreground">All content, features, and functionality of the Platform are the exclusive property of GapRomance. By uploading content, you grant GapRomance a non-exclusive, worldwide, royalty-free license to use it solely for operating and improving the Platform.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">12. Privacy & Data</h2>
                <p className="text-muted-foreground">Your use of GapRomance is governed by our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. Your precise location is never shared with other users.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">13. Disclaimers & Limitation of Liability</h2>
                <p className="text-muted-foreground">GapRomance does not guarantee that you will find a match. The Platform is provided "as is." We are not liable for harm arising from interactions with other users. Our total liability shall not exceed the amount you paid in the 12 months preceding any claim.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">14. Indemnification</h2>
                <p className="text-muted-foreground">You agree to indemnify and hold harmless GapRomance from any claims arising from your use of the Platform, violation of these Terms, or violation of third-party rights.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">15. Account Termination & Suspension</h2>
                <p className="text-muted-foreground">GapRomance may suspend or terminate your account at any time for violation of these Terms, failure to complete verification, or abusive behavior. You may delete your account at any time. Upon termination, unused subscription time is forfeited.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">16. Governing Law & Dispute Resolution</h2>
                <p className="text-muted-foreground">These Terms are governed by the laws of the United States. Disputes shall be resolved by binding arbitration. You waive any right to a jury trial or class action participation. Before formal proceedings, contact support@gapromance.com to attempt informal resolution.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">17. Changes to These Terms</h2>
                <p className="text-muted-foreground">GapRomance may update these Terms at any time. Material changes will be notified at least 14 days in advance. Continued use constitutes acceptance.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">18. Miscellaneous</h2>
                <p className="text-muted-foreground">These Terms constitute the entire agreement between you and GapRomance. If any provision is unenforceable, the remaining provisions remain in effect. You may not assign your rights under these Terms without our consent.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">19. Contact Information</h2>
                <p className="text-muted-foreground">Email: <a href="mailto:support@gapromance.com" className="text-primary hover:underline">support@gapromance.com</a></p>
                <p className="text-muted-foreground">Website: www.gapromance.com</p>
                <p className="text-muted-foreground mt-2">We aim to respond to all inquiries within 2 business days.</p>
              </section>

              <div className="border-t border-border pt-6 text-center">
                <p className="text-muted-foreground italic">By creating an account on GapRomance, you confirm that you have read, understood, and agree to these Terms of Service and User Agreement in their entirety.</p>
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

export default Terms;

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Safety = () => {
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 text-center">
              Safety <span className="text-gradient">Guidelines</span>
            </h1>
            <p className="text-center text-muted-foreground text-sm mb-12">Effective Date: March 2026 · Last Updated: March 2026</p>

            <div className="glass rounded-2xl p-8 md:p-12 space-y-8 text-foreground text-sm leading-relaxed">
              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">Our Commitment to Your Safety</h2>
                <p className="text-muted-foreground">At GapRomance, your safety is our highest priority. We have built safety into every layer of the platform — from mandatory identity verification before any profile goes live, to automated content moderation, to a robust reporting and blocking system. These Safety Guidelines are designed to help you understand the protections we have in place and how you can stay safe while using GapRomance.</p>
                <p className="text-muted-foreground mt-3">We ask all users to read these guidelines carefully and take personal responsibility for their own safety when interacting with others online and in person. If you ever feel unsafe or encounter behavior that violates these guidelines, please report it immediately using our in-app tools or by contacting us at <a href="mailto:GapRomanceSupport@proton.me" className="text-primary hover:underline">GapRomanceSupport@proton.me</a>.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">1. Mandatory Verification</h2>
                <h3 className="font-bold text-primary/80 mb-2">1.1 How Verification Works</h3>
                <p className="text-muted-foreground">Every GapRomance user is required to complete mandatory identity verification before their profile is visible to others. Verification consists of two steps:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>Phone number verification via SMS confirmation at the time of registration.</li>
                  <li>Identity verification via a government-issued photo ID and a real-time selfie match processed through our secure verification partner.</li>
                </ul>
                <p className="text-muted-foreground mt-3">Verification is free for all users. GapRomance absorbs the cost of verification as part of our commitment to platform safety.</p>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">1.2 Verified Badge</h3>
                <p className="text-muted-foreground">Upon successful verification, users receive a Verified Badge displayed prominently on their profile. This badge confirms that the user has passed our identity check and is a real person who meets our age requirements.</p>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">1.3 Verification Does Not Guarantee Behavior</h3>
                <p className="text-muted-foreground">While mandatory verification significantly reduces fake profiles and catfishing, it does not guarantee the future behavior or intentions of any user. Always exercise caution and use your judgment.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">2. Online Safety</h2>
                <h3 className="font-bold text-primary/80 mb-2">2.1 Protecting Your Personal Information</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Never share your home address, workplace address, or daily routine with someone you have just met.</li>
                  <li>Do not share financial information, bank details, credit card numbers, or cryptocurrency wallet addresses.</li>
                  <li>Avoid sharing your government ID, Social Security number, or other sensitive documents.</li>
                  <li>Be cautious about sharing social media handles or phone numbers until trust is established.</li>
                  <li>Do not share explicit photos or videos that could identify personal locations.</li>
                </ul>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">2.2 Recognizing Red Flags</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Asking for money, gift cards, cryptocurrency, or financial assistance of any kind.</li>
                  <li>Refusing to video chat or meet in person after extended communication.</li>
                  <li>Inconsistencies between profile photos and video appearance.</li>
                  <li>Pressuring you to move communication off-platform quickly.</li>
                  <li>Declarations of love or intense attachment unusually early.</li>
                  <li>Stories involving urgent financial crises or overseas travel emergencies.</li>
                  <li>Asking you to keep the relationship secret from friends or family.</li>
                </ul>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">2.3 Romance Scams</h3>
                <p className="text-muted-foreground">Romance scams are a serious concern on all dating platforms. If someone asks you for money or financial assistance, treat this as an immediate red flag. Report the user immediately and cease all communication. Never send money to someone you have not met in person.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">3. Content Safety & Moderation</h2>
                <h3 className="font-bold text-primary/80 mb-2">3.1 Automated Content Moderation</h3>
                <p className="text-muted-foreground">GapRomance uses automated content moderation to scan messages and images for violent, threatening, or aggressive content. When such content is detected:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                  <li>The recipient is shown a warning banner.</li>
                  <li>The recipient is offered the option to report or block the sender.</li>
                  <li>The incident is flagged for review by our safety team.</li>
                </ul>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">3.2 Adult Content</h3>
                <p className="text-muted-foreground">GapRomance permits consensual adult content between adults in private messages. However, content depicting minors, non-consensual imagery, coercion, or blackmail is strictly prohibited and will result in permanent termination and reporting to law enforcement.</p>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">3.3 Your Role in Content Safety</h3>
                <p className="text-muted-foreground">Automated moderation is powerful but not perfect. If you receive content that makes you uncomfortable or feel threatened, report it immediately. Do not engage with users who send harmful content — block and report them.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">4. Meeting in Person</h2>
                <h3 className="font-bold text-primary/80 mb-2">4.1 Take Your Time</h3>
                <p className="text-muted-foreground">There is no rush to meet someone in person. Trust your instincts — if something feels off, it is okay to decline or postpone.</p>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">4.2 First Meeting Safety Tips</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Always meet in a public place — never at a private residence or isolated location.</li>
                  <li>Tell a trusted friend or family member where you are going and who you are meeting.</li>
                  <li>Arrange your own transportation. Do not accept a ride from a first-time meeting.</li>
                  <li>Keep your phone charged and accessible.</li>
                  <li>Have an exit plan. It is perfectly acceptable to end a date early.</li>
                  <li>Do not leave your food or drink unattended.</li>
                  <li>Avoid excessive alcohol on a first meeting.</li>
                </ul>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">4.3 Letting Someone Know Your Plans</h3>
                <p className="text-muted-foreground">Before any in-person meeting, share the person's name and profile, the location/date/time, and agree on a check-in plan with a trusted contact.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">5. Harassment, Abuse & Threatening Behavior</h2>
                <h3 className="font-bold text-primary/80 mb-2">5.1 Zero Tolerance Policy</h3>
                <p className="text-muted-foreground mb-2">GapRomance has a zero tolerance policy for harassment, abuse, threats, and any form of aggressive behavior, including:</p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Threatening, intimidating, or violent messages or images.</li>
                  <li>Persistent unwanted contact after being asked to stop.</li>
                  <li>Psychological manipulation, gaslighting, or emotional abuse.</li>
                  <li>Sexual harassment including unsolicited explicit content.</li>
                  <li>Stalking or attempting to locate someone without consent.</li>
                  <li>Any behavior intended to intimidate, humiliate, or harm another user.</li>
                </ul>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">5.2 If You Experience Harassment</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Use the in-app block feature to stop all contact immediately.</li>
                  <li>Use the in-app report feature to alert our safety team.</li>
                  <li>Screenshot and save threatening messages for potential law enforcement use.</li>
                  <li>If you feel you are in immediate danger, contact your local emergency services.</li>
                  <li>Contact our support team at <a href="mailto:GapRomanceSupport@proton.me" className="text-primary hover:underline">GapRomanceSupport@proton.me</a>.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">6. Reporting & Blocking</h2>
                <h3 className="font-bold text-primary/80 mb-2">6.1 How to Report</h3>
                <p className="text-muted-foreground">Every profile, message, and piece of content includes a report option. Tap the three-dot menu or flag icon, select "Report," choose the reason, and submit. You can also email <a href="mailto:GapRomanceSupport@proton.me" className="text-primary hover:underline">GapRomanceSupport@proton.me</a> or use our <Link to="/contact" className="text-primary hover:underline">Contact Us</Link> form.</p>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">6.2 How to Block</h3>
                <p className="text-muted-foreground">Blocking a user prevents them from viewing your profile, messaging you, or appearing in discovery. Blocked users are not notified.</p>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">6.3 What Happens After You Report</h3>
                <p className="text-muted-foreground">All reports are reviewed by our safety team. Actions may include a formal warning, temporary suspension, permanent termination, or reporting to law enforcement. Reports are treated confidentially.</p>
                <h3 className="font-bold text-primary/80 mb-2 mt-4">6.4 False Reports</h3>
                <p className="text-muted-foreground">Filing false reports in bad faith is a violation of our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and may result in action against your account.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">7. Financial Safety</h2>
                <p className="text-muted-foreground">GapRomance will never ask you to send money to another user. All legitimate transactions are processed exclusively through our secure payment system. If anyone asks you to send money outside the platform, this is a scam — report it immediately.</p>
                <p className="text-muted-foreground mt-3">Virtual gifts are digital tokens for entertainment purposes only. They have no real-world monetary value and cannot be redeemed for cash.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">8. Protection of Minors</h2>
                <p className="text-muted-foreground">GapRomance has an absolute zero tolerance policy for any content, behavior, or activity that exploits, harms, or endangers minors. Women must be at least 18 and men must be at least 25 to use the platform. Mandatory verification enforces these requirements. Any account found to belong to a minor will be immediately and permanently terminated.</p>
                <p className="text-muted-foreground mt-3">If you believe a minor is using GapRomance, report it immediately to <a href="mailto:GapRomanceSupport@proton.me" className="text-primary hover:underline">GapRomanceSupport@proton.me</a>.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">9. Law Enforcement Cooperation</h2>
                <p className="text-muted-foreground">GapRomance cooperates fully with law enforcement agencies in investigations involving illegal activity. We will provide user data where required by valid legal process and will proactively report illegal activity — including child exploitation, threats of violence, and fraud — to the appropriate authorities.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">10. Mental Health & Wellbeing</h2>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Take breaks from the platform whenever you feel overwhelmed or discouraged.</li>
                  <li>Set boundaries with matches and do not feel pressured to respond immediately.</li>
                  <li>Rejection is a normal part of dating. It does not define your worth.</li>
                  <li>If you are struggling, reach out to a qualified mental health professional.</li>
                </ul>
                <p className="text-muted-foreground mt-3">If you encounter a user who appears to be in crisis or expresses thoughts of self-harm, please report it immediately to <a href="mailto:GapRomanceSupport@proton.me" className="text-primary hover:underline">GapRomanceSupport@proton.me</a>.</p>
              </section>

              <section>
                <h2 className="text-xl font-heading font-bold text-primary mb-3">11. Contact Our Safety Team</h2>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>In-app report feature: available on every profile and message.</li>
                  <li>Email: <a href="mailto:support@gapromance.com" className="text-primary hover:underline">support@gapromance.com</a></li>
                  <li>Contact form: available on our <Link to="/contact" className="text-primary hover:underline">Contact Us</Link> page.</li>
                </ul>
                <p className="text-muted-foreground mt-3">We aim to respond to all safety-related reports within 24 hours. For urgent concerns, contact your local emergency services.</p>
              </section>

              <div className="border-t border-border pt-6 text-center">
                <p className="text-muted-foreground italic">GapRomance is committed to being the safest age-gap dating platform available. Your safety is not optional — it is built into everything we do.</p>
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

export default Safety;

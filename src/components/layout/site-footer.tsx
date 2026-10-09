import { Mail, MapPin, Phone } from "lucide-react";
import { demoContact, footerLinks } from "@/data/store";
import { Brand } from "@/components/ui/brand";
import { ComingSoonButton } from "@/components/ui/coming-soon";
import { SocialIcon } from "@/components/ui/social-icon";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-grid">
        <div className="footer-brand"><Brand compact /><p>Modest Beauty<br />Everyday With You</p></div>
        {footerLinks.map((group) => <div key={group.title} className="footer-group"><h2>{group.title}</h2><ul>{group.items.map((item) => <li key={item.label}>{item.href ? <a href={item.href}>{item.label}</a> : <ComingSoonButton feature={item.feature ?? item.label}>{item.label}</ComingSoonButton>}</li>)}</ul></div>)}
        <div className="footer-contact"><h2>Contact <span className="demo-contact-label">Demo details</span></h2><ul><li><Mail />{demoContact.email}</li><li><Phone />{demoContact.phone}</li><li><MapPin />{demoContact.location}</li></ul></div>
        <div className="footer-social"><div className="social-links">{(["Facebook", "Instagram", "YouTube", "TikTok"] as const).map((name) => <ComingSoonButton key={name} feature={`${name} page`} className="icon-button" aria-label={`${name} — Coming soon`}><SocialIcon name={name} /></ComingSoonButton>)}</div><p>© {new Date().getFullYear()} NOOR. All rights reserved.</p></div>
      </div>
    </footer>
  );
}

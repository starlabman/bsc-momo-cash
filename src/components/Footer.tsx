import { ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import ScrollReveal from '@/components/ScrollReveal';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-gradient-to-r from-muted/10 via-muted/20 to-muted/10 backdrop-blur-sm mt-12 sm:mt-20">
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-hero bg-clip-text text-transparent">SikaPay</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footer.description')}
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('footer.networks')}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">Base</Badge>
              <Badge variant="outline" className="text-xs">BSC</Badge>
              <Badge variant="outline" className="text-xs">Ethereum</Badge>
              <Badge variant="outline" className="text-xs">Arbitrum</Badge>
              <Badge variant="outline" className="text-xs">Optimism</Badge>
              <Badge variant="outline" className="text-xs">Polygon</Badge>
              <Badge variant="outline" className="text-xs">Solana</Badge>
              <Badge variant="outline" className="text-xs">Avalanche</Badge>
              <Badge variant="outline" className="text-xs">Lisk</Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('footer.navigation')}</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">{t('footer.home')}</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">{t('footer.about')}</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary transition-colors">{t('footer.faq')}</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">{t('footer.contact')}</Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('footer.contactTitle')}</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>📧 support@sikapay.com</li>
              <li>📱 WhatsApp: +228 98 24 48 50</li>
              <li>💬 Telegram: @sikapay_support</li>
              <li>{t('footer.support247')}</li>
            </ul>
          </div>
        </div>
        </ScrollReveal>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-primary/10">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {t('footer.rights')}
          </div>
          <div className="flex items-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">{t('legal.privacy')}</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">{t('legal.terms')}</Link>
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>
              {t('footer.online')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
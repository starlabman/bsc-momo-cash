import { Mail, Phone, MessageCircle, Send, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Contact = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: t('contact.sent'),
      description: t('contact.sentDesc'),
    });
    
    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: t('contact.email'),
      value: "support@sikapay.com",
      description: t('contact.emailResponse'),
      href: "mailto:support@sikapay.com"
    },
    {
      icon: Phone,
      title: t('contact.whatsapp'),
      value: "+228 98 24 48 50",
      description: t('contact.whatsappAvail'),
      href: "https://wa.me/221771234567"
    },
    {
      icon: MessageCircle,
      title: t('contact.telegram'),
      value: "@sikapay_support",
      description: t('contact.telegramResponse'),
      href: "https://t.me/sikapay_support"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            {t('contact.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>
      </section>

      <section className="py-8 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <a key={index} href={method.href} target="_blank" rel="noopener noreferrer" className="block">
                <Card className="border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg h-full">
                  <CardContent className="p-6 text-center">
                    <div className="h-14 w-14 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                      <method.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">{method.title}</h3>
                    <p className="text-primary font-medium mb-1">{method.value}</p>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  {t('contact.sendMessage')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.fullName')}</Label>
                    <Input
                      id="name"
                      placeholder={t('contact.fullNamePlaceholder')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.emailLabel')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('contact.emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('contact.subject')}</Label>
                    <Input
                      id="subject"
                      placeholder={t('contact.subjectPlaceholder')}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t('contact.message')}</Label>
                    <Textarea
                      id="message"
                      placeholder={t('contact.messagePlaceholder')}
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('contact.sending') : t('contact.send')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    {t('contact.supportHours')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{t('contact.supportDesc')}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('contact.whatsappTelegram')}</span>
                      <span className="font-medium text-green-500">{t('contact.allDay')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('contact.email')}</span>
                      <span className="font-medium">{t('contact.emailDelay')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {t('contact.coveredAreas')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{t('contact.coveredDesc')}</p>
                  <div className="flex flex-wrap gap-2">
                    {["🇸🇳 Sénégal", "🇲🇱 Mali", "🇧🇫 Burkina Faso", "🇨🇮 Côte d'Ivoire", "🇹🇬 Togo", "🇧🇯 Bénin"].map((country, index) => (
                      <span key={index} className="px-3 py-1 bg-muted rounded-full text-xs font-medium">
                        {country}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-2 text-foreground">{t('contact.urgentHelp')}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{t('contact.urgentDesc')}</p>
                  <div className="flex gap-3">
                    <a href="https://wa.me/22898244850" target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        WhatsApp
                      </Button>
                    </a>
                    <a href="https://t.me/sikapay_support" target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        Telegram
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
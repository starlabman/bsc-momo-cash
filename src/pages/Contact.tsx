import { ArrowRightLeft, ArrowLeft, Mail, Phone, MessageCircle, Send, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
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
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message envoyé !",
      description: "Nous vous répondrons dans les plus brefs délais.",
    });
    
    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      value: "support@sikapay.com",
      description: "Réponse sous 24h",
      href: "mailto:support@sikapay.com"
    },
    {
      icon: Phone,
      title: "WhatsApp",
      value: "+221 77 123 45 67",
      description: "Disponible 24/7",
      href: "https://wa.me/221771234567"
    },
    {
      icon: MessageCircle,
      title: "Telegram",
      value: "@sikapay_support",
      description: "Réponse instantanée",
      href: "https://t.me/sikapay_support"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <ArrowRightLeft className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">SikaPay</h1>
              <p className="text-xs text-muted-foreground font-medium">Crypto ↔ Mobile Money</p>
            </div>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Contactez-nous
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Notre équipe est disponible 24/7 pour répondre à vos questions et vous accompagner dans vos transactions.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-8 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <a 
                key={index} 
                href={method.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
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

      {/* Contact Form & Info */}
      <section className="py-12 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Envoyez-nous un message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      placeholder="Votre nom"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      placeholder="Sujet de votre message"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Décrivez votre demande..."
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
                    {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <div className="space-y-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Horaires de support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Notre équipe est disponible pour vous aider à tout moment.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">WhatsApp & Telegram</span>
                      <span className="font-medium text-green-500">24h/24 - 7j/7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">Réponse sous 24h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Zones couvertes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    SikaPay est disponible dans toute la zone UEMOA.
                  </p>
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
                  <h4 className="font-semibold mb-2 text-foreground">Besoin d'aide urgente ?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pour les questions concernant une transaction en cours, utilisez WhatsApp ou Telegram pour une réponse plus rapide.
                  </p>
                  <div className="flex gap-3">
                    <a href="https://wa.me/221771234567" target="_blank" rel="noopener noreferrer">
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

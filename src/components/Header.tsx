import { Link } from "react-router-dom";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  return (
    <header className="border-b bg-background/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover-lift">
            <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <ArrowRightLeft className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">SikaPay</h1>
              <p className="text-xs text-muted-foreground font-medium">Crypto ↔ Mobile Money</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-xs animate-glow-pulse border-primary/30 bg-primary/5 hidden sm:flex">
              Multi-Blockchain
            </Badge>
            <Link to="/about">
              <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10">
                À propos
              </Button>
            </Link>
            <Link to="/faq">
              <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10">
                FAQ
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10">
                Contact
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="glass-button text-xs hover:bg-primary/10"
              onClick={() => window.location.href = '/admin/login'}
            >
              Admin
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

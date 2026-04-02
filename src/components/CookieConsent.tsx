import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("cookies.title")}
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slide-in-up"
    >
      <div className="container max-w-4xl mx-auto bg-card border border-border rounded-xl p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">{t("cookies.title")}</p>
          <p className="text-xs text-muted-foreground">
            {t("cookies.description")}{" "}
            <Link to="/privacy" className="underline hover:text-primary">
              {t("cookies.learnMore")}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={decline}>
            {t("cookies.decline")}
          </Button>
          <Button size="sm" className="bg-gradient-primary" onClick={accept}>
            {t("cookies.accept")}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={decline} aria-label={t("cookies.close")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

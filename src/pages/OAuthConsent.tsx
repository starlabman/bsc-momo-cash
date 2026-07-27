import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield } from "lucide-react";

// Minimal typed wrapper around the beta supabase.auth.oauth namespace so this
// page compiles even when the client's TS types don't expose it yet.
type OAuthClient = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauthClient = (supabase.auth as any).oauth as OAuthClient | undefined;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Paramètre authorization_id manquant.");
        return;
      }
      if (!oauthClient) {
        setError(
          "Le serveur d'autorisation OAuth 2.1 n'est pas activé sur ce Supabase. Contactez l'administrateur.",
        );
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauthClient.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    if (!oauthClient) return;
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauthClient.approveAuthorization(authorizationId)
      : await oauthClient.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Le serveur d'autorisation n'a pas renvoyé d'URL de redirection.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Autoriser l'accès</CardTitle>
          <CardDescription>
            Connectez une application externe à votre compte SikaPay.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!error && !details && (
            <p className="text-sm text-muted-foreground text-center">Chargement…</p>
          )}
          {details && (
            <>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{details.client?.name ?? "Une application"}</strong> demande à agir en
                  votre nom sur SikaPay.
                </p>
                <p className="text-muted-foreground">
                  Elle pourra utiliser les tools SikaPay (lister vos transactions, en créer,
                  consulter le taux) comme si c'était vous.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => decide(false)}
                >
                  Refuser
                </Button>
                <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                  Autoriser
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

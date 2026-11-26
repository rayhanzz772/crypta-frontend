import { ShieldX, LogOut, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const BlockedVault = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <ShieldX className="w-5 h-5 text-destructive" />
          <span className="text-sm font-semibold">Crypta</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut />
          Sign Out
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center border-none shadow-none bg-transparent">
          <CardContent className="pt-6">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-destructive/10">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">Vault Blocked</h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base leading-relaxed">
              Your vault has been blocked due to a security policy violation or an
              administrative action. All vault operations are disabled until the
              block is lifted.
            </p>

            <Alert variant="destructive" className="mt-6 text-left">
              <AlertTitle>What does this mean?</AlertTitle>
              <AlertDescription>
                <ul className="space-y-1.5">
                  <li>• You cannot view, create, or modify any vault entries</li>
                  <li>• Encrypted data remains safe but inaccessible</li>
                  <li>• Contact support to resolve this issue</li>
                </ul>
              </AlertDescription>
            </Alert>

            {user?.email && (
              <Badge
                variant="outline"
                className="mt-6 gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-normal"
              >
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </Badge>
            )}

            <div className="mt-8">
              <Button size="lg" onClick={handleLogout}>
                <LogOut />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlockedVault;

import {
  Shield,
  Key,
  FileText,
  Clock,
  Hash,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description:
      "AES-256-GCM with Argon2id key derivation ensures your passwords and notes are protected with military-grade encryption.",
  },
  {
    icon: FileText,
    title: "Encrypted Secret Notes",
    description:
      "Store sensitive information like recovery codes, API keys, or private notes with the same encryption as your passwords.",
  },
  {
    icon: Key,
    title: "Zero Knowledge Design",
    description:
      "Your master password never leaves your device. We can't access your data even if we wanted to.",
  },
  {
    icon: Clock,
    title: "Rate Limiting & Auto Lock",
    description:
      "Prevent brute force attacks with intelligent rate limiting and automatic session locking after inactivity.",
  },
  {
    icon: Hash,
    title: "Per-Item Salted KDF",
    description:
      "Each vault entry has unique Argon2id parameters, making it impossible to crack multiple passwords at once.",
  },
  {
    icon: Lock,
    title: "Unified Vault Protection",
    description:
      "Both passwords and notes share the same secure vault with a single master password for easy management.",
  },
];

const FeatureCard = ({ feature }) => {
  const Icon = feature.icon;

  return (
    <Card className="group h-full transition-all duration-300 hover:border-primary/40 hover:shadow-elev">
      <CardContent className="p-6 sm:p-8">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" strokeWidth={2} />
        </div>

        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
          {feature.title}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {feature.description}
        </p>

        <div className="mt-4 sm:mt-6 h-1 w-0 group-hover:w-full bg-gradient-to-r from-primary to-primary/40 rounded-full transition-all duration-500"></div>
      </CardContent>
    </Card>
  );
};

const SecurityFeatures = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <Badge
            variant="outline"
            className="gap-2 rounded-full px-4 py-1.5 sm:px-5 sm:py-2 mb-4 sm:mb-6 font-semibold text-primary border-primary/30"
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            SECURITY FIRST
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Enterprise-Grade{" "}
            <span className="text-gradient">Security</span>
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Built with the latest cryptographic standards and security best
            practices to keep your passwords and sensitive notes safe.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Want to learn more about our security architecture?
          </p>
          <Button
            asChild
            size="lg"
            className="text-sm sm:text-base"
          >
            <a
              href="https://github.com/rayhanzz772/password-vault-backend"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read Security Documentation
            </a>
          </Button>
        </div>
      </div>

      <div className="absolute top-20 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary/10 rounded-full filter blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-20 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary/10 rounded-full filter blur-3xl opacity-40 pointer-events-none"></div>
    </section>
  );
};

export default SecurityFeatures;

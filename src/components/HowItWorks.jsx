import { UserPlus, Lock, Unlock } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Register & Create a Master Password",
    description:
      "Sign up and create a strong master password. This is the only password you'll need to remember. We never store or transmit it.",
  },
  {
    number: "02",
    icon: Lock,
    title: "Encrypt & Save Your Secrets",
    description:
      "Add your passwords and notes, and we'll encrypt each one with AES-256-GCM using your master password. Each entry gets unique Argon2id salt.",
  },
  {
    number: "03",
    icon: Unlock,
    title: "Decrypt Instantly When You Need Them",
    description:
      "Unlock your vault with your master password. Decryption happens instantly on your device - your secrets never leave unencrypted.",
  },
];

const StepCard = ({ step, index }) => {
  const Icon = step.icon;

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="absolute -top-6 sm:-top-8 -left-3 sm:-left-4 text-6xl sm:text-7xl lg:text-8xl font-bold text-muted-foreground/20">
              {step.number}
            </div>

            <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center p-6 sm:p-7 lg:p-8 shadow-elev">
              <Icon className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-primary" strokeWidth={2} />
            </div>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">
              {step.title}
            </h3>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              {step.description}
            </p>
          </div>
        </div>
      </div>

      {/* Connecting line (not for last item) - Static */}
      {index < steps.length - 1 && (
        <div
          className="hidden md:block absolute left-12 sm:left-14 lg:left-16 top-28 sm:top-32 w-0.5 h-20 sm:h-24 bg-border"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)",
          }}
        />
      )}
    </div>
  );
};

const HowItWorks = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <Badge
            variant="outline"
            className="rounded-full px-4 py-1.5 sm:px-5 sm:py-2 mb-4 sm:mb-6 font-semibold text-primary border-primary/30"
          >
            HOW IT WORKS
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Get Started in{" "}
            <span className="text-gradient">Three Simple Steps</span>
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Crypta makes security simple. Here's how it works under the hood.
          </p>
        </div>

        <div className="space-y-12 sm:space-y-16 md:space-y-24">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} />
          ))}
        </div>

        <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
          <Card className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-6 sm:p-8 shadow-elev max-w-full">
            <div className="text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                Ready to secure your secrets?
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Join thousands of users protecting their passwords and sensitive
                information.
              </p>
            </div>
            <Button asChild size="lg" className="whitespace-nowrap text-sm sm:text-base">
              <Link to="/register">Create an Account</Link>
            </Button>
          </Card>
        </div>
      </div>

      <div className="absolute top-1/4 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary/10 rounded-full filter blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-primary/10 rounded-full filter blur-3xl opacity-40 pointer-events-none"></div>
    </section>
  );
};

export default HowItWorks;

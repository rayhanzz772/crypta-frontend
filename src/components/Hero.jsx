import { Link } from "react-router-dom";
import { ArrowRight, Github, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Hero = () => {
  return (
    <section
      className="relative pt-14 sm:pt-16 overflow-hidden"
      aria-label="Hero section"
    >
      <div className="absolute inset-0 bg-background" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="text-center">
          <Badge
            variant="outline"
            className="gap-2 rounded-full px-4 py-1.5 sm:px-5 sm:py-2 mb-6 sm:mb-8 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
            Zero-Knowledge Encryption
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 sm:mb-8">
            <span className="block mb-2">Build and secure</span>
            <span className="block animated-text">your digital vault.</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto px-4">
            Crypta provides military-grade encryption and developer-friendly
            tools to build, scale, and secure your passwords and sensitive data
            with confidence.
          </p>

          <nav
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16"
            aria-label="Call to action"
          >
            <Button asChild size="lg" className="w-full sm:w-auto h-12 px-8 text-base group">
              <Link to="/login" aria-label="Start securing your passwords">
                Start Securing
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-base"
            >
              <a
                href="https://github.com/rayhanzz772/password-vault-backend"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source code on GitHub"
              >
                <Github />
                View on GitHub
              </a>
            </Button>
          </nav>
        </div>
      </div>
    </section>
  );
};

export default Hero;

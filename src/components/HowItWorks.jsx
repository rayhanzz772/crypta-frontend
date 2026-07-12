import { UserPlus, Lock, Unlock } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Register & Create a Master Password",
    description:
      "Sign up and create a strong master password. This is the only password you'll need to remember. We never store or transmit it.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    number: "02",
    icon: Lock,
    title: "Encrypt & Save Your Secrets",
    description:
      "Add your passwords and notes, and we'll encrypt each one with AES-256-GCM using your master password. Each entry gets unique Argon2id salt.",
    color: "from-purple-500 to-pink-500"
  },
  {
    number: "03",
    icon: Unlock,
    title: "Decrypt Instantly When You Need Them",
    description:
      "Unlock your vault with your master password. Decryption happens instantly on your device - your secrets never leave unencrypted.",
    color: "from-green-500 to-emerald-500",
  },
];

const StepCard = ({ step, index }) => {
  const Icon = step.icon;
  const isEven = index % 2 === 0;

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
        {/* Step Number & Icon */}
        <div className="flex-shrink-0">
          <div className="relative">
            {/* Large number in background */}
            <div className="absolute -top-6 sm:-top-8 -left-3 sm:-left-4 text-6xl sm:text-7xl lg:text-8xl font-bold text-slate-200 dark:text-slate-800 opacity-50">
              {step.number}
            </div>

            {/* Icon container */}
            <div
              className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br ${step.color} p-6 sm:p-7 lg:p-8 shadow-2xl`}
            >
              <Icon className="w-full h-full text-white" strokeWidth={2} />
            </div>

            <div className="absolute -top-3 sm:-top-4 -right-3 sm:-right-4 text-3xl sm:text-4xl">
              {step.image}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white">
              {step.title}
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              {step.description}
            </p>
          </div>
        </div>
      </div>

      {/* Connecting line (not for last item) - Static */}
      {index < steps.length - 1 && (
        <div
          className="hidden md:block absolute left-12 sm:left-14 lg:left-16 top-28 sm:top-32 w-0.5 h-20 sm:h-24 bg-gradient-to-b from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-800"
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
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 mb-4 sm:mb-6">
            <span className="text-xs sm:text-sm font-semibold">
              HOW IT WORKS
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-slate-900 dark:text-white">
            Get Started in{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Three Simple Steps
            </span>
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
            Crypta makes security simple. Here's how it works under the hood.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12 sm:space-y-16 md:space-y-24">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
            <div className="text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                Ready to secure your secrets?
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Join thousands of users protecting their passwords and sensitive
                information.
              </p>
            </div>
            <Link
              to="/register"
              className="group px-6 sm:px-8 py-3 sm:py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>

      {/* Background decorations */}
      <div className="absolute top-1/4 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/30 dark:to-purple-950/30 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-950/30 dark:to-orange-950/30 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
    </section>
  );
};

export default HowItWorks;

import {
  Briefcase,
  Wallet,
  Users,
  Grip,
  User,
  Gamepad2,
  Heart,
  Lock,
  LayoutGrid,
  Lightbulb,
} from "lucide-react";

// Get icon component based on category name
export const getCategoryIcon = (categoryName) => {
  const normalizedCategory = categoryName?.toLowerCase() || "";

  const iconMap = {
    work: Briefcase,
    finance: Wallet,
    social: Users,
    medical: Heart,
    ideas: Lightbulb,
    personal: User,
    game: Gamepad2,
    other: Grip,
    all: LayoutGrid,
  };

  return iconMap[normalizedCategory] || Lock; // Default to Lock if category not found
};

// Get gradient colors based on category
export const getCategoryGradient = (category) => {
  // Allow passing a category object (e.g. { name, gradient }) or a string
  if (!category) return "from-primary-500 to-purple-600";

  if (typeof category === "object") {
    if (category.gradient) return category.gradient;
    if (category.color) return category.color; // assume it's a valid Tailwind class string or gradient
    category = category.name || category.label || "";
  }

  const normalizedCategory = category?.toLowerCase() || "";

  const gradientMap = {
    work: "from-blue-500 to-blue-600",
    finance: "from-green-500 to-emerald-600",
    social: "from-purple-500 to-pink-600",
    game: "from-orange-500 to-red-600",
    medical: "from-rose-400 to-rose-600",
    health: "from-rose-400 to-rose-600",
    personal: "from-indigo-400 to-indigo-600",
    other: "from-slate-400 to-slate-600",
    ideas: "from-primary-500 to-purple-600",
  };

  return gradientMap[normalizedCategory] || "from-primary-500 to-purple-600"; // Default gradient
};

// Get category badge & icon color styling based on category name
export const getCategoryColor = (categoryName) => {
  const normalized = categoryName?.toLowerCase() || "";

  if (normalized.includes("work")) {
    return {
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-xs",
      pill: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60",
    };
  }

  if (
    normalized.includes("finance") ||
    normalized.includes("money") ||
    normalized.includes("bank")
  ) {
    return {
      gradient: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-xs",
      pill: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60",
    };
  }

  if (
    normalized.includes("game") ||
    normalized.includes("gaming") ||
    normalized.includes("play")
  ) {
    return {
      gradient: "bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-xs",
      pill: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60",
    };
  }

  if (
    normalized.includes("social") ||
    normalized.includes("chat") ||
    normalized.includes("media")
  ) {
    return {
      gradient: "bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl shadow-xs",
      pill: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60",
    };
  }

  if (normalized.includes("personal") || normalized.includes("me")) {
    return {
      gradient: "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl shadow-xs",
      pill: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60",
    };
  }

  if (normalized.includes("medical") || normalized.includes("health")) {
    return {
      gradient: "bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl shadow-xs",
      pill: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60",
    };
  }

  // Default / Other / All
  return {
    gradient: "bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl shadow-xs",
    pill: "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/60",
  };
};

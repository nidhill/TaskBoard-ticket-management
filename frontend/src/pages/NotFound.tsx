import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background font-sans text-foreground selection:bg-primary/20">

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-10 -top-10 h-72 w-72 animate-blob rounded-full bg-primary/10 mix-blend-multiply blur-3xl filter transition-all duration-1000 ease-in-out dark:bg-primary/5"></div>
        <div className="absolute right-0 top-0 h-72 w-72 animate-blob animation-delay-2000 rounded-full bg-blue-400/10 mix-blend-multiply blur-3xl filter transition-all duration-1000 ease-in-out dark:bg-blue-400/5"></div>
        <div className="absolute -bottom-10 left-20 h-72 w-72 animate-blob animation-delay-4000 rounded-full bg-purple-400/10 mix-blend-multiply blur-3xl filter transition-all duration-1000 ease-in-out dark:bg-purple-400/5"></div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="container relative z-10 mx-auto flex max-w-[600px] flex-col items-center px-4 text-center">
        {/* Animated 404 Number */}
        <div className="relative mb-8 select-none">
          <h1 className="text-[150px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/20 animate-fade-in drop-shadow-sm">
            404
          </h1>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background/80 px-4 py-1.5 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur-sm border border-border/50">
            Page not found
          </div>
        </div>

        <div className="space-y-6 animate-slide-up animation-delay-300">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Lost in space?
            </h2>
            <p className="text-lg text-muted-foreground">
              We couldn't find the page you were looking for. It might have been removed, renamed, or doesn't exist.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-12 w-full sm:w-auto px-8 gap-2 shadow-lg shadow-primary/20 group">
              <Link to="/">
                <Home className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                Back to Home
              </Link>
            </Button>

            <Button variant="outline" size="lg" className="h-12 w-full sm:w-auto px-8 gap-2 group" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Go Back
            </Button>
          </div>
        </div>

        {/* Technical details for debugging (optional/small) */}
        <div className="mt-16 text-xs text-muted-foreground/50 font-mono animate-fade-in animation-delay-700">
          Error Code: 404 • Path: {location.pathname}
        </div>
      </div>

      {/* Footer copyright */}
      <div className="absolute bottom-6 text-xs text-muted-foreground/40 font-medium">
        &copy; {new Date().getFullYear()} Slate. All rights reserved.
      </div>
    </div>
  );
};

export default NotFound;

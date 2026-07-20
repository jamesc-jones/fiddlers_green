"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Hero from "@/components/Hero";
import IntroSequence from "@/components/IntroSequence";

const INTRO_SESSION_KEY = "fg-intro-seen";

// Avoids the "useLayoutEffect does nothing on the server" warning during
// static generation, while still running before paint on the client.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function HomeClient() {
  const [showIntro, setShowIntro] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  // Decided in a layout effect (fires before the browser paints) so the
  // intro either is or isn't part of the very first frame — never a flash
  // of Hero-then-overlay or overlay-then-Hero.
  useIsomorphicLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const alreadySeenThisSession =
      sessionStorage.getItem(INTRO_SESSION_KEY) === "1";

    if (!prefersReducedMotion && !alreadySeenThisSession) {
      setShowIntro(true);
    }
  }, []);

  function handleIntroComplete() {
    sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    setIntroComplete(true);
  }

  return (
    <>
      {/* skipEntrance is intentionally tied to showIntro alone (not
          introComplete): the intro owns the reveal for this page load, so
          Hero must stay in its settled state once mounted, not replay its
          own fade-up after the overlay fades away. */}
      <Hero skipEntrance={showIntro} />
      {showIntro && !introComplete && (
        <IntroSequence onComplete={handleIntroComplete} />
      )}
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import SkipButton from "@/components/IntroSequence/SkipButton";
import LogoReveal from "@/components/IntroSequence/LogoReveal";
import FeatherSVG, { FEATHER_DURATION } from "@/components/IntroSequence/FeatherSVG";
import ChainFormation, { CHAIN_DURATION } from "@/components/IntroSequence/ChainFormation";
import WampumReveal, { WAMPUM_DURATION } from "@/components/IntroSequence/WampumReveal";

const EASE = [0.22, 1, 0.36, 1] as const;
const CSS_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// Full timeline (~3.9s, under the ~4-4.2s cap). Sequential, not layered:
// each cinematic element fully fades to nothing before the next begins, so
// there is never more than one focal point on screen, and the logo always
// gets a calm, uncontested moment. Northern lights is the one exception —
// it's a soft ambient wash behind everything, not a shape competing for
// attention, so it's allowed to persist underneath the whole sequence.
const LIGHTS_DELAY = 0.2;
const LIGHTS_DURATION = 1;

const FEATHER_DELAY = 0.1;
const CHAIN_DELAY = FEATHER_DELAY + FEATHER_DURATION;
const WAMPUM_DELAY = CHAIN_DELAY + CHAIN_DURATION;

const QUIET_BEAT = 0.2;
const LOGO_DELAY = WAMPUM_DELAY + WAMPUM_DURATION + QUIET_BEAT;
const LOGO_DURATION = 0.5;
const LOGO_HOLD = 0.2;

const EXIT_DELAY = LOGO_DELAY + LOGO_DURATION + LOGO_HOLD;
const EXIT_DURATION = 0.35;
const SKIP_EXIT_DURATION = 0.3;

export default function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasFinishedRef = useRef(false);
  const skipRequestedRef = useRef(false);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock background scroll for the brief life of the overlay.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function finish() {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onComplete();
  }

  // Root overlay fade is driven by a plain CSS transition + setTimeout,
  // rather than Framer Motion's imperative animate()/useAnimate(). In
  // testing, useAnimate's animate() call reliably failed to resolve when
  // invoked from a click handler or a setTimeout callback (works fine when
  // called synchronously inline in an effect) — its promise never settled
  // and no visual change occurred. A direct style transition is simple,
  // fully reliable, and still only touches opacity, per the performance
  // requirement. Child layers below keep declarative Motion `animate` props,
  // which are unaffected by this issue.
  function fadeOutAndFinish(durationSeconds: number) {
    const el = rootRef.current;
    if (el) {
      el.style.transition = `opacity ${durationSeconds}s ${CSS_EASE}`;
      el.style.opacity = "0";
    }
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    finishTimeoutRef.current = setTimeout(finish, durationSeconds * 1000);
  }

  useEffect(() => {
    exitTimeoutRef.current = setTimeout(() => {
      fadeOutAndFinish(EXIT_DURATION);
    }, EXIT_DELAY * 1000);

    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSkip() {
    if (skipRequestedRef.current) return;
    skipRequestedRef.current = true;
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    fadeOutAndFinish(SKIP_EXIT_DURATION);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleSkip();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={rootRef}
      role="presentation"
      onClick={handleSkip}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
    >
      {/* Northern lights atmosphere — plain declarative motion is fine here;
          unlike the root's exit fade, this layer never needs to be
          interrupted, it just plays forward once. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 mix-blend-screen"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(56,189,148,0.4) 0%, rgba(16,90,90,0.2) 25%, rgba(80,60,140,0.25) 50%, rgba(56,189,148,0.4) 75%, rgba(16,90,90,0.2) 100%)",
          backgroundSize: "200% 200%",
        }}
        initial={{ opacity: 0, backgroundPosition: "0% 50%" }}
        animate={{ opacity: 0.15, backgroundPosition: "100% 50%" }}
        transition={{ delay: LIGHTS_DELAY, duration: LIGHTS_DURATION, ease: EASE }}
      />

      <FeatherSVG delay={FEATHER_DELAY} />
      <ChainFormation delay={CHAIN_DELAY} />
      <WampumReveal delay={WAMPUM_DELAY} />
      <LogoReveal delay={LOGO_DELAY} />

      <SkipButton onSkip={handleSkip} />
    </div>
  );
}

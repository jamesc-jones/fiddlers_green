"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

// ─── Navigation data ──────────────────────────────────────────────────────────
// Add, rename, or reorder links here. The rest of the component updates automatically.

const NAV_LINKS = [
  { label: "Home",     href: "/"         },
  { label: "Catalog",  href: "/catalog"  },
  { label: "Heritage", href: "/heritage" },
  { label: "Chat",     href: "/chat"     },
  { label: "Contact",  href: "/contact"  },
] as const;

// Auth-aware links are computed at render time (not a static array like
// NAV_LINKS above) because they depend on login state and role — logged
// out, customer, and admin all see a different set. Logout is handled
// separately since it's an action, not a navigable Link.
interface AuthLink {
  label: string;
  href: string;
  testId: string;
}

function getAuthLinks(
  isLoggedIn: boolean,
  isAdmin: boolean
): AuthLink[] {
  if (!isLoggedIn) {
    return [
      { label: "Login", href: "/login", testId: "nav-login" },
      { label: "Register", href: "/register", testId: "nav-register" },
    ];
  }
  const links: AuthLink[] = [
    { label: "Cart", href: "/cart", testId: "nav-cart" },
    { label: "Account", href: "/account", testId: "nav-account" },
  ];
  if (isAdmin) {
    links.push({ label: "Admin", href: "/admin/products", testId: "nav-admin" });
  }
  return links;
}

// ─── Animation variants ───────────────────────────────────────────────────────
// Defined outside the component so they're not recreated on every render.

const mobileMenuVariants = {
  closed: {
    opacity: 0,
    y: "-100%",
    transition: { duration: 0.35, ease: [0.32, 0, 0.67, 0] as const },
  },
  open: {
    opacity: 1,
    y: "0%",
    transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] as const },
  },
};

const mobileLinkVariants = {
  closed: { opacity: 0, y: 20 },
  open:   (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07 + 0.15, duration: 0.4, ease: "easeOut" as const },
  }),
};

const hamburgerTop = {
  closed: { rotate: 0,   y: 0  },
  open:   { rotate: 45,  y: 7  },
};

const hamburgerMid = {
  closed: { opacity: 1, scaleX: 1 },
  open:   { opacity: 0, scaleX: 0 },
};

const hamburgerBot = {
  closed: { rotate: 0,   y: 0  },
  open:   { rotate: -45, y: -7 },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const authLinks = getAuthLinks(!!user, isAdmin);

  function handleLogout() {
    logout();
    setIsMenuOpen(false);
    router.push("/");
  }

  // Close mobile menu when navigating to a new page.
  // Adjusted during render (not in an effect) per React's guidance for
  // resetting state in response to a prop/derived-value change.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMenuOpen(false);
  }

  // Detect scroll position to toggle the frosted-glass background
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  // ESC closes the mobile menu while it's open.
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  return (
    <>
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <header
        className={[
          "fixed top-0 left-0 right-0 z-50",
          "transition-all duration-500 ease-in-out",
          isScrolled || isMenuOpen
            ? "bg-black/80 backdrop-blur-md border-b border-white/10"
            : "bg-transparent border-b border-transparent",
        ].join(" ")}
      >
        <nav
          className="mx-auto flex items-center justify-between px-6 md:px-10 h-16 md:h-20 max-w-7xl"
          aria-label="Main navigation"
        >
          {/* ── Logo / Brand name ─────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex flex-col leading-none group"
            aria-label="Fiddler's Green — home"
          >
            <span
              className={[
                "font-display text-xl md:text-2xl tracking-wide",
                "text-white transition-colors duration-300 group-hover:text-brand-gold",
              ].join(" ")}
            >
              Fiddler&apos;s Green
            </span>
            <span className="text-[10px] tracking-[0.25em] text-white/50 uppercase font-body">
              Tyendinaga · Indigenous
            </span>
          </Link>

          {/* ── Desktop links ─────────────────────────────────────────────── */}
          <ul className="hidden md:flex items-center gap-8" role="list">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      "relative font-body text-sm tracking-[0.12em] uppercase",
                      "transition-colors duration-200",
                      "after:absolute after:left-0 after:-bottom-0.5",
                      "after:h-px after:bg-brand-gold",
                      "after:transition-all after:duration-300",
                      isActive
                        ? "text-brand-gold after:w-full"
                        : "text-white/70 hover:text-white after:w-0 hover:after:w-full",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}

            {/* Divider between content nav and auth-aware nav */}
            <li aria-hidden="true" className="h-4 w-px bg-white/20" />

            {authLinks.map(({ label, href, testId }) => {
              const isActive = pathname === href;
              const showBadge = label === "Cart" && cart !== null && cart.total_items > 0;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    data-testid={testId}
                    className={[
                      "relative font-body text-sm tracking-[0.12em] uppercase",
                      "transition-colors duration-200",
                      "after:absolute after:left-0 after:-bottom-0.5",
                      "after:h-px after:bg-brand-gold",
                      "after:transition-all after:duration-300",
                      isActive
                        ? "text-brand-gold after:w-full"
                        : "text-white/70 hover:text-white after:w-0 hover:after:w-full",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {label}
                    {showBadge && (
                      <span
                        data-testid="nav-cart-badge"
                        className="ml-1 text-brand-gold text-xs align-super"
                      >
                        ({cart!.total_items})
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}

            {user && (
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  data-testid="nav-logout"
                  className="font-body text-sm tracking-[0.12em] uppercase text-white/70 hover:text-brand-gold transition-colors duration-200"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>

          {/* ── Mobile hamburger ──────────────────────────────────────────── */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] z-50"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {/* Three bars that animate into an X */}
            <motion.span
              variants={hamburgerTop}
              animate={isMenuOpen ? "open" : "closed"}
              transition={{ duration: 0.3 }}
              className="block w-6 h-px bg-white origin-center"
            />
            <motion.span
              variants={hamburgerMid}
              animate={isMenuOpen ? "open" : "closed"}
              transition={{ duration: 0.2 }}
              className="block w-6 h-px bg-white origin-center"
            />
            <motion.span
              variants={hamburgerBot}
              animate={isMenuOpen ? "open" : "closed"}
              transition={{ duration: 0.3 }}
              className="block w-6 h-px bg-white origin-center"
            />
          </button>
        </nav>
      </header>

      {/* ── Mobile full-screen menu ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className={[
              "fixed inset-0 z-40 md:hidden",
              "bg-black/95 backdrop-blur-sm",
              "flex flex-col items-center justify-center gap-10",
            ].join(" ")}
          >
            <ul className="flex flex-col items-center gap-8" role="list">
              {NAV_LINKS.map(({ label, href }, i) => {
                const isActive = pathname === href;
                return (
                  <motion.li
                    key={href}
                    custom={i}
                    variants={mobileLinkVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                  >
                    <Link
                      href={href}
                      className={[
                        "font-display text-4xl italic tracking-wide",
                        "transition-colors duration-200",
                        isActive
                          ? "text-brand-gold"
                          : "text-white/80 hover:text-white",
                      ].join(" ")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  </motion.li>
                );
              })}

              {authLinks.map(({ label, href, testId }, i) => {
                const isActive = pathname === href;
                const showBadge = label === "Cart" && cart !== null && cart.total_items > 0;
                return (
                  <motion.li
                    key={href}
                    custom={NAV_LINKS.length + i}
                    variants={mobileLinkVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                  >
                    <Link
                      href={href}
                      data-testid={testId}
                      className={[
                        "font-display text-4xl italic tracking-wide",
                        "transition-colors duration-200",
                        isActive
                          ? "text-brand-gold"
                          : "text-white/80 hover:text-white",
                      ].join(" ")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {label}
                      {showBadge && (
                        <span
                          data-testid="nav-cart-badge-mobile"
                          className="ml-2 text-brand-gold text-xl align-super"
                        >
                          ({cart!.total_items})
                        </span>
                      )}
                    </Link>
                  </motion.li>
                );
              })}

              {user && (
                <motion.li
                  custom={NAV_LINKS.length + authLinks.length}
                  variants={mobileLinkVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  <button
                    type="button"
                    onClick={handleLogout}
                    data-testid="nav-logout"
                    className="font-display text-4xl italic tracking-wide text-white/80 hover:text-white transition-colors duration-200"
                  >
                    Logout
                  </button>
                </motion.li>
              )}
            </ul>

            {/* Subtle brand tagline at the bottom of mobile menu */}
            <p className="absolute bottom-10 text-xs tracking-[0.3em] text-white/30 uppercase font-body">
              Made in Tyendinaga
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

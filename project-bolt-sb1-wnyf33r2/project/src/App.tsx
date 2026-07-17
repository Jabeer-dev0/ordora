import { useEffect, useRef, useState } from 'react';
import {
  Menu as MenuIcon,
  X,
  ShoppingBag,
  Clock,
  Phone,
  MapPin,
  Utensils,
  Truck,
  CheckCircle2,
  ChevronRight,
  Facebook,
  Instagram,
  Twitter,
  ArrowRight,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Small scroll-reveal hook                                                  */
/* -------------------------------------------------------------------------- */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                     */
/* -------------------------------------------------------------------------- */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Home', href: '#home' },
    { label: 'How it works', href: '#how' },
    { label: 'Order', href: '#order' },
    { label: 'Opening times', href: '#opening' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-cream-50/95 shadow-md backdrop-blur py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-cream-50 shadow-lg shadow-brand-600/30">
            <Utensils className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span
              className={`block font-display text-lg font-bold tracking-wide ${
                scrolled ? 'text-brand-700' : 'text-cream-50'
              }`}
            >
              Chesters
            </span>
            <span
              className={`block text-[10px] font-semibold uppercase tracking-[0.25em] ${
                scrolled ? 'text-neutral-500' : 'text-cream-100/80'
              }`}
            >
              Blackburn
            </span>
          </div>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`text-sm font-medium transition-colors hover:text-brand-500 ${
                  scrolled ? 'text-neutral-700' : 'text-cream-50/90'
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <a
            href="#order"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-cream-50 shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/40"
          >
            <ShoppingBag className="h-4 w-4" />
            Order Online
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`rounded-lg p-2 transition-colors md:hidden ${
            scrolled ? 'text-neutral-800' : 'text-cream-50'
          }`}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mx-4 mt-2 rounded-2xl bg-cream-50 p-4 shadow-xl ring-1 ring-black/5">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {l.label}
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#order"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-cream-50"
          >
            <ShoppingBag className="h-4 w-4" />
            Order Online
          </a>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */
function Hero() {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden">
      {/* Background image placeholder */}
      <div className="absolute inset-0">
        {/* IMAGE PLACEHOLDER — upload your hero banner here */}
        <div className="h-full w-full bg-gradient-to-br from-brand-800 via-brand-700 to-brand-950" />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-cream-100/30 bg-cream-50/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cream-100 backdrop-blur animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
          Authentic flavours, freshly made
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight text-cream-50 drop-shadow-lg sm:text-6xl lg:text-7xl animate-fade-up text-balance">
          Chesters Blackburn
        </h1>
        <p
          className="mt-5 max-w-xl text-base text-cream-100/90 sm:text-lg animate-fade-up"
          style={{ animationDelay: '0.15s' }}
        >
          Order your favourite meals online for fast delivery or easy collection.
          Freshly prepared, every time.
        </p>
        <div
          className="mt-9 flex flex-col items-center gap-4 sm:flex-row animate-fade-up"
          style={{ animationDelay: '0.3s' }}
        >
          <a
            href="#order"
            className="group inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-4 text-base font-semibold text-cream-50 shadow-2xl shadow-brand-900/40 transition-all hover:bg-brand-500 hover:scale-105"
          >
            <ShoppingBag className="h-5 w-5" />
            Order Online
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full border border-cream-100/40 px-8 py-4 text-base font-semibold text-cream-50 backdrop-blur transition-all hover:bg-cream-50/10"
          >
            How it works
          </a>
        </div>

        {/* Stats strip */}
        <div
          className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-4 animate-fade-up"
          style={{ animationDelay: '0.45s' }}
        >
          {[
            { value: '30+', label: 'Years of flavour' },
            { value: '4.8★', label: 'Customer rating' },
            { value: '7 days', label: 'Open weekly' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-cream-100/15 bg-cream-50/5 px-4 py-4 backdrop-blur"
            >
              <div className="font-display text-2xl font-bold text-cream-50">
                {s.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-cream-100/70">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 animate-fade-in">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-cream-100/40 p-1.5">
          <div className="h-2 w-1 animate-bounce rounded-full bg-cream-100/70" />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  How it works                                                               */
/* -------------------------------------------------------------------------- */
function HowItWorks() {
  const ref = useReveal<HTMLDivElement>();
  const steps = [
    {
      icon: ShoppingBag,
      title: 'Easily Order',
      desc: 'Select a branch, browse and select food from our delicious menu and securely checkout.',
    },
    {
      icon: Utensils,
      title: 'Fast Preparation',
      desc: "Once we receive your order, we'll start making your food. We aim to have your food ready on time, every time.",
    },
    {
      icon: CheckCircle2,
      title: 'Enjoy Food',
      desc: 'The best part — tuck in and enjoy your freshly prepared meal.',
    },
  ];

  return (
    <section id="how" className="bg-cream-50 py-24">
      <div ref={ref} className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">
            Simple process
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-neutral-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-neutral-500">
            Ordering food has never been easier.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="group relative overflow-hidden rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-600/10"
            >
              <span className="absolute right-5 top-4 font-display text-6xl font-bold text-brand-50 transition-colors group-hover:text-brand-100">
                {i + 1}
              </span>
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-cream-50">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold text-neutral-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#order"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Begin your order
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Order CTA banner                                                           */
/* -------------------------------------------------------------------------- */
function OrderCTA() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="order" className="relative overflow-hidden py-24">
      {/* Background image placeholder */}
      <div className="absolute inset-0">
        {/* IMAGE PLACEHOLDER — upload a food / restaurant image here */}
        <div className="h-full w-full bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div
        ref={ref}
        className="reveal relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8"
      >
        <h2 className="font-display text-3xl font-bold text-cream-50 sm:text-5xl text-balance">
          Start Ordering Now
        </h2>
        <p className="mt-4 text-lg text-cream-100/90">
          Why not give us a try? Browse our menu and place your order in minutes.
        </p>
        <a
          href="#menu"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-cream-50 px-8 py-4 text-base font-semibold text-brand-700 shadow-2xl transition-all hover:scale-105 hover:bg-white"
        >
          <ShoppingBag className="h-5 w-5" />
          Begin your order
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Opening times                                                              */
/* -------------------------------------------------------------------------- */
const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

type Slot = { day: string; hours: string };

const storeHours: Slot[] = DAYS.map((d) => ({ day: d, hours: '10:45 - 23:00' }));
storeHours[0] = { day: 'Sunday', hours: '11:45 - 23:00' };

const deliveryHours: Slot[] = DAYS.map((d) => ({
  day: d,
  hours: '16:00 - 22:45',
}));
deliveryHours[0] = { day: 'Sunday', hours: '16:00 - 22:30' };
deliveryHours[4] = { day: 'Thursday', hours: '16:00 - 22:30' };
deliveryHours[5] = { day: 'Friday', hours: '16:00 - 22:30' };
deliveryHours[6] = { day: 'Saturday', hours: '16:00 - 22:30' };

const collectionHours: Slot[] = DAYS.map((d) => ({
  day: d,
  hours: '11:00 - 22:45',
}));
collectionHours[0] = { day: 'Sunday', hours: '12:00 - 22:45' };

function HoursTable({ slots }: { slots: Slot[] }) {
  const today = new Date().getDay();
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
      {slots.map((s, i) => {
        const isToday = i === today;
        return (
          <div
            key={s.day}
            className={`flex items-center justify-between px-5 py-3 text-sm ${
              isToday
                ? 'bg-brand-50 font-semibold text-brand-700'
                : 'text-neutral-600'
            } ${i !== slots.length - 1 ? 'border-b border-neutral-100' : ''}`}
          >
            <span className="flex items-center gap-2">
              {isToday && (
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              )}
              {s.day}
            </span>
            <span className={isToday ? 'text-brand-700' : 'text-neutral-500'}>
              {s.hours}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OpeningTimes() {
  const ref = useReveal<HTMLDivElement>();
  const [tab, setTab] = useState<'store' | 'delivery' | 'collection'>('store');
  const tabs = [
    { id: 'store', label: 'Store', icon: Clock },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'collection', label: 'Collection', icon: ShoppingBag },
  ] as const;

  return (
    <section id="opening" className="bg-cream-100 py-24">
      <div ref={ref} className="reveal mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">
            Plan your visit
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-neutral-900 sm:text-4xl">
            Opening times
          </h2>
          <p className="mt-3 text-neutral-500">
            Tap a branch to display the opening hours for both delivery and
            collection.
          </p>
        </div>

        {/* Branch selector */}
        <div className="mt-10 flex justify-center">
          <button className="inline-flex items-center gap-2 rounded-full border-2 border-brand-600 bg-brand-600 px-6 py-2.5 text-sm font-semibold text-cream-50 shadow-lg shadow-brand-600/30">
            <MapPin className="h-4 w-4" />
            Chester Blackburn
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  tab === t.id
                    ? 'bg-brand-600 text-cream-50 shadow'
                    : 'text-neutral-600 hover:text-brand-600'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mx-auto mt-8 max-w-md">
          {tab === 'store' && <HoursTable slots={storeHours} />}
          {tab === 'delivery' && <HoursTable slots={deliveryHours} />}
          {tab === 'collection' && <HoursTable slots={collectionHours} />}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Contact                                                                     */
/* -------------------------------------------------------------------------- */
function Contact() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="contact" className="bg-cream-50 py-24">
      <div ref={ref} className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">
            Get in touch
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-neutral-900 sm:text-4xl">
            Contact us
          </h2>
          <p className="mt-3 text-neutral-500">
            Tap a branch to display the contact details.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <button className="mx-auto flex items-center gap-2 rounded-full border-2 border-brand-600 bg-brand-600 px-6 py-2.5 text-sm font-semibold text-cream-50 shadow-lg shadow-brand-600/30">
            <MapPin className="h-4 w-4" />
            Chester Blackburn
          </button>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {/* Address card */}
            <div className="rounded-3xl border border-neutral-100 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-neutral-900">
                Address
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                {/* ADDRESS PLACEHOLDER — enter your address here */}
                Your address line
                <br />
                Blackburn, United Kingdom
              </p>
            </div>

            {/* Call card */}
            <div className="rounded-3xl border border-neutral-100 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-neutral-900">
                Call us
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                {/* PHONE PLACEHOLDER — enter your phone here */}
                +44 0000 000000
              </p>
            </div>

            {/* Map placeholder card */}
            <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
              {/* IMAGE PLACEHOLDER — upload a map / location image here */}
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-400">
                <MapPin className="h-8 w-8" />
              </div>
              <div className="p-6 text-center">
                <h3 className="font-display text-lg font-bold text-neutral-900">
                  Find us
                </h3>
                <p className="mt-2 text-sm text-neutral-500">
                  View us on the map
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                      */
/* -------------------------------------------------------------------------- */
function Footer() {
  return (
    <footer className="bg-neutral-900 pt-16 pb-8 text-cream-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-cream-50">
                <Utensils className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <span className="block font-display text-lg font-bold text-cream-50">
                  Chesters
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.25em] text-cream-100/60">
                  Blackburn
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-cream-100/60">
              Authentic flavours, freshly prepared and delivered to your door.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-cream-50">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {['Home', 'How it works', 'Order Online', 'Opening times', 'Contact'].map(
                (l) => (
                  <li key={l}>
                    <a
                      href="#home"
                      className="text-cream-100/60 transition-colors hover:text-brand-400"
                    >
                      {l}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Website stuff */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-cream-50">
              Website Stuff
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {['Privacy Policy', 'Terms & Conditions', 'Allergen Info', 'FAQs'].map(
                (l) => (
                  <li key={l}>
                    <a
                      href="#home"
                      className="text-cream-100/60 transition-colors hover:text-brand-400"
                    >
                      {l}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Keep in touch */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-cream-50">
              Keep in touch
            </h4>
            <div className="mt-4 flex gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#home"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-cream-100/70 transition-all hover:bg-brand-600 hover:text-cream-50"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <p className="mt-4 text-sm text-cream-100/60">
              {/* PHONE PLACEHOLDER */}
              +44 0000 000000
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-6 sm:flex-row">
          <p className="text-xs text-cream-100/50">
            © {new Date().getFullYear()} Chesters Blackburn. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-cream-100/50">
            <span>Secure payments</span>
            <div className="flex gap-1.5">
              {['VISA', 'MC', 'AMEX'].map((c) => (
                <span
                  key={c}
                  className="rounded bg-neutral-800 px-2 py-1 text-[10px] font-semibold text-cream-100/70"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  App                                                                         */
/* -------------------------------------------------------------------------- */
export default function App() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <OrderCTA />
        <OpeningTimes />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

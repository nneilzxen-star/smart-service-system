import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, ArrowRight, CalendarCheck, Wind, Zap as BoltIcon, Droplets, Monitor,
  Wifi, Sparkles, Camera, Hammer, ClipboardCheck, Clock, ChevronDown, ChevronUp,
  FileText, Wrench
} from 'lucide-react';

const services = [
  { icon: Wind, name: 'AC Repair', desc: 'Professional AC repair & maintenance', color: 'bg-blue-50 text-blue-600' },
  { icon: BoltIcon, name: 'Electrical', desc: 'Certified electrical repair & wiring', color: 'bg-yellow-50 text-yellow-600' },
  { icon: Droplets, name: 'Plumbing', desc: 'Pipe repair, leak fixing & installation', color: 'bg-cyan-50 text-cyan-600' },
  { icon: Monitor, name: 'Computer Repair', desc: 'Hardware & software troubleshooting', color: 'bg-purple-50 text-purple-600' },
  { icon: Wifi, name: 'Wi-Fi Setup', desc: 'Router setup & network configuration', color: 'bg-indigo-50 text-indigo-600' },
  { icon: Sparkles, name: 'Home Cleaning', desc: 'Deep cleaning for your entire home', color: 'bg-pink-50 text-pink-600' },
  { icon: Camera, name: 'CCTV Install', desc: 'Security camera installation & setup', color: 'bg-gray-50 text-gray-600' },
  { icon: Hammer, name: 'General Maintenance', desc: 'Painting, carpentry & handyman work', color: 'bg-orange-50 text-orange-600' },
];

const steps = [
  { step: '01', title: 'Book a Service', desc: 'Choose your service, pick a date & time, and enter your location.' },
  { step: '02', title: 'Get Assigned', desc: 'Our dispatcher assigns an available technician to your job.' },
  { step: '03', title: 'Follow Updates', desc: 'Check your booking for status changes and technician details.' },
  { step: '04', title: 'Service Done', desc: 'Technician completes the job. Review your invoice and leave feedback.' },
];

const faqs = [
  { q: 'How do I book a service?', a: 'Register or log in, browse available services, select your preferred date and time, enter your address, and confirm your booking.' },
  { q: 'How are technicians assigned?', a: 'An administrator or dispatcher assigns an available technician to a booking. Assignment details appear in the booking once it has been assigned.' },
  { q: 'Can I cancel a booking?', a: 'Cancellation depends on the booking status. Open the booking details to see whether cancellation is available for that booking.' },
  { q: 'How is the service cost calculated?', a: 'The service base price is shown when you book. The final invoice is available after the job is completed.' },
  { q: 'How can I leave feedback?', a: 'After a booking is marked complete, open its details to submit a rating and review.' },
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md overflow-hidden">
      <button aria-expanded={open} onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
        <span className="font-medium text-gray-900 text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-6 pb-4 text-sm text-gray-600">{a}</div>}
    </div>
  );
};

const LandingPage = () => (
  <div className="min-h-screen bg-white">
    {/* Navbar */}
    <nav className="app-header sticky top-0 z-40 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" aria-label="SmartService home">
          <div className="brand-icon w-10 h-10 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-slate-900">SmartService</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors px-2 sm:px-3 py-2">Sign in</Link>
          <Link to="/register" className="btn-primary text-sm px-3 sm:px-4">Book a service</Link>
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-sky-900 text-white py-16 sm:py-20 lg:py-24 px-4">
      <div className="hero-grid absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div className="hero-orb absolute -right-24 -top-28 -z-10 h-96 w-96 rounded-full bg-sky-400/15 blur-3xl" aria-hidden="true" />
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_.9fr] items-center gap-12 page-enter">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6 ring-1 ring-white/15">
            <Zap className="w-4 h-4 text-sky-300" /> Home services, made simpler
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.08] tracking-tight">
            Book a service.<br />
            <span className="bg-gradient-to-r from-sky-200 via-cyan-100 to-white bg-clip-text text-transparent">Know what happens next.</span>
          </h1>
          <p className="text-base md:text-lg text-blue-100/90 mb-8 max-w-xl leading-relaxed">
            Choose a service, schedule a visit, and follow booking updates in one place—from dispatch through completion.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-blue-800 font-semibold rounded-xl hover:bg-sky-50 transition-all duration-200 shadow-lg shadow-slate-950/20 hover:-translate-y-0.5">
              Book a service <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/15 transition-all duration-200 border border-white/20">
              Sign in to your account
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100/90">
            {['Clear service pricing', 'Booking status updates', 'Customer and technician workflows'].map((item) => (
              <span key={item} className="inline-flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-sky-300" />{item}</span>
            ))}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:justify-self-end" aria-label="Preview of the service booking workflow">
          <div className="absolute -inset-5 rounded-[2rem] bg-sky-400/10 blur-2xl" aria-hidden="true" />
          <div className="relative rounded-3xl border border-white/15 bg-white/[0.08] p-4 shadow-2xl shadow-slate-950/30 backdrop-blur-md sm:p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Booking overview</p>
                <p className="mt-1 text-sm font-semibold text-white">Your service, step by step</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-200"><CalendarCheck className="h-5 w-5" /></div>
            </div>
            <div className="space-y-3 py-4">
              {[
                { icon: CalendarCheck, title: 'Request submitted', detail: 'Service and preferred schedule' },
                { icon: Wrench, title: 'Technician assigned', detail: 'Assignment appears in your booking' },
                { icon: FileText, title: 'Job completed', detail: 'Review the invoice and leave feedback' },
              ].map(({ icon: Icon, title, detail }, index) => (
                <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 p-3.5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${index === 0 ? 'bg-sky-400/15 text-sky-200' : 'bg-white/10 text-blue-100'}`}><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-xs text-blue-100/75">{detail}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-sky-200/70" />
                </div>
              ))}
            </div>
            <p className="rounded-xl bg-sky-300/10 px-3 py-2.5 text-xs leading-relaxed text-sky-100">
              Booking activity and service details stay together in your account.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Workflow highlights */}
    <section className="border-y border-slate-100 bg-white py-8 sm:py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:gap-5 sm:px-6">
        {[
          { icon: CalendarCheck, label: 'Book a service', detail: 'Choose service and schedule' },
          { icon: Wrench, label: 'Dispatch', detail: 'Assign an available technician' },
          { icon: Clock, label: 'Follow updates', detail: 'See booking status changes' },
          { icon: FileText, label: 'Wrap up', detail: 'Invoice and customer feedback' },
        ].map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-slate-50 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Icon className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Services */}
    <section className="py-16 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700 mb-3">What we can help with</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Available Services</h2>
        <p className="text-gray-500">Professional services for every home and business need</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {services.map(({ icon: Icon, name, desc, color }) => (
          <article key={name} className="card interactive-card group">
            <div className={`service-card-icon w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{name}</h3>
            <p className="text-xs text-gray-500">{desc}</p>
          </article>
        ))}
      </div>
    </section>

    {/* How It Works */}
    <section className="py-16 px-4 bg-slate-100/70 border-y border-slate-200/70">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-500">Simple, fast, and reliable service booking</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-700 text-white rounded-2xl flex items-center justify-center font-bold text-lg mx-auto mb-4 shadow-md shadow-blue-900/15">{step}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Why Choose Us */}
    <section className="py-16 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose SmartService?</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: CalendarCheck, title: 'Easy to schedule', desc: 'Choose a service and submit your preferred date, time, and location.', color: 'bg-blue-50 text-blue-600' },
          { icon: Clock, title: 'Status in one place', desc: 'Follow booking progress and see assignment details from your account.', color: 'bg-emerald-50 text-emerald-600' },
          { icon: FileText, title: 'Clear wrap-up', desc: 'Review the invoice and submit customer feedback after the service is complete.', color: 'bg-amber-50 text-amber-600' },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="card interactive-card text-center">
            <div className={`service-card-icon w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${color}`}>
              <Icon className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Role workflow */}
    <section className="py-16 px-4 bg-slate-100/70 border-y border-slate-200/70">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700 mb-3">Connected by design</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">One service flow. Clear roles.</h2>
          <p className="text-gray-500">Customers, dispatchers, and technicians work from the same booking.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: CalendarCheck, title: 'Customer', detail: 'Create bookings, follow status, and review invoices.', color: 'bg-sky-50 text-sky-700' },
            { icon: ClipboardCheck, title: 'Dispatcher', detail: 'Review requests and assign available technicians.', color: 'bg-violet-50 text-violet-700' },
            { icon: Wrench, title: 'Technician', detail: 'See assigned jobs and update work progress.', color: 'bg-emerald-50 text-emerald-700' },
          ].map(({ icon: Icon, title, detail, color }) => (
            <div key={title} className="card interactive-card flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}><Icon className="h-6 w-6" /></div>
              <div>
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section className="py-16 px-4 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h2>
      </div>
      <div className="space-y-3">
        {faqs.map((faq) => <FAQItem key={faq.q} {...faq} />)}
      </div>
    </section>

    {/* CTA */}
    <section className="relative isolate overflow-hidden py-16 px-4 bg-gradient-to-r from-blue-800 via-primary-700 to-sky-700 text-white text-center">
      <div className="hero-grid absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-primary-100 mb-8">Create an account to book services, follow booking updates, and manage completed jobs in one place.</p>
        <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-800 font-bold rounded-xl hover:bg-sky-50 transition-all duration-200 shadow-lg hover:-translate-y-0.5 text-lg">
          Book Your First Service <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>

    {/* Footer */}
    <footer className="bg-gray-900 text-gray-400 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-blue-700 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">SmartService</span>
          </div>
          <p className="text-sm">© 2026 SmartService. Academic Final Project — Systems Integration & Architecture.</p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </div>
    </footer>
  </div>
);

export default LandingPage;

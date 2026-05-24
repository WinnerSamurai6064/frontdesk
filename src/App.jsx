import {
  ArrowRight,
  BellRinging,
  Broadcast,
  CalendarBlank,
  CaretRight,
  Clock,
  DeviceMobile,
  Fire,
  GlobeHemisphereEast,
  Lightning,
  MagnifyingGlass,
  Newspaper,
  Radio,
  ShareNetwork,
  Sparkle,
  TrendUp,
} from '@phosphor-icons/react';
import { categories, leadStory, stories, tickerItems } from './data/news';

function Badge({ children, tone = 'dark' }) {
  const tones = {
    dark: 'bg-slate-950 text-white',
    light: 'bg-white/90 text-slate-950 ring-1 ring-slate-200',
    blue: 'bg-blue-600 text-white',
    red: 'bg-red-600 text-white',
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

function StoryCard({ story, large = false }) {
  return (
    <article className={`group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${large ? 'md:col-span-2' : ''}`}>
      <div className={large ? 'grid md:grid-cols-[1fr_0.95fr]' : ''}>
        <div className="relative overflow-hidden">
          <img
            src={story.image}
            alt=""
            className={`w-full object-cover transition duration-500 group-hover:scale-105 ${large ? 'h-72 md:h-full' : 'h-56'}`}
          />
          <div className="absolute left-4 top-4">
            <Badge tone="light">{story.category}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} weight="bold" />
              {story.readTime}
            </span>
            <span className="inline-flex items-center gap-1.5 text-blue-700">
              <TrendUp size={15} weight="bold" />
              {story.tag}
            </span>
          </div>

          <h3 className={`${large ? 'text-2xl md:text-3xl' : 'text-xl'} font-black leading-tight tracking-tight text-slate-950`}>
            {story.title}
          </h3>

          <p className="line-clamp-3 text-sm leading-6 text-slate-600 md:text-base">
            {story.summary}
          </p>

          <button className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700">
            Read story
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      </div>
    </article>
  );
}

function DeskItem({ icon: Icon, title, text }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-white shadow-xl shadow-black/10">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950">
        <Icon size={24} weight="duotone" />
      </div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

export default function App() {
  const mainStory = stories[0];
  const otherStories = stories.slice(1);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
          <a href="#top" className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/20">
              <Newspaper size={25} weight="duotone" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight">FrontDesk</p>
              <p className="text-[0.67rem] font-black uppercase tracking-[0.28em] text-blue-700">Daily news desk</p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-extrabold text-slate-700 lg:flex">
            {categories.slice(0, 5).map((category) => (
              <a key={category} href={`#${category.toLowerCase().replaceAll(' ', '-')}`} className="transition hover:text-blue-700">
                {category}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-950 transition hover:border-blue-200 hover:bg-blue-50">
              <MagnifyingGlass size={20} weight="bold" />
            </button>
            <button className="hidden items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 md:inline-flex">
              Subscribe
              <BellRinging size={18} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.35),transparent_32%),radial-gradient(circle_at_top_right,rgba(220,38,38,0.26),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-6 lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge tone="red">
                <Radio size={14} weight="fill" />
                {leadStory.eyebrow}
              </Badge>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-200">
                <CalendarBlank size={15} weight="bold" />
                Updated today
              </span>
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[0.96] tracking-tight md:text-6xl lg:text-7xl">
              {leadStory.title}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              {leadStory.summary}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-blue-100">
                Start reading
                <ArrowRight size={18} weight="bold" />
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15">
                View desks
                <CaretRight size={18} weight="bold" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/10 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <img src={leadStory.image} alt="" className="h-[26rem] w-full rounded-[1.65rem] object-cover" />
              <div className="mt-3 grid gap-3 rounded-[1.65rem] bg-slate-950/80 p-5 md:grid-cols-3">
                <div className="md:col-span-2">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">{leadStory.category}</p>
                  <h2 className="mt-2 text-xl font-black leading-tight">{leadStory.location}</h2>
                </div>
                <div className="flex items-center justify-start gap-2 text-sm font-bold text-slate-300 md:justify-end">
                  <Clock size={18} weight="bold" />
                  {leadStory.readTime}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-hidden px-4 lg:px-6">
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
            <Lightning size={15} weight="fill" />
            Live Desk
          </span>
          <div className="flex min-w-0 gap-6 overflow-hidden text-sm font-extrabold text-slate-700">
            {tickerItems.map((item) => (
              <span key={item} className="inline-flex shrink-0 items-center gap-2">
                <Sparkle size={15} weight="fill" className="text-red-600" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-700">Latest coverage</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Across the desks</h2>
          </div>
          <button className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black transition hover:border-blue-200 hover:bg-blue-50">
            Browse all stories
            <ShareNetwork size={18} weight="bold" />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <StoryCard story={mainStory} large />
          {otherStories.map((story) => (
            <StoryCard key={story.title} story={story} />
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mb-8 max-w-3xl">
            <Badge tone="blue">
              <Broadcast size={15} weight="fill" />
              News standard look
            </Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Built for daily publishing, mobile readers and future Claude connectors.</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              FrontDesk starts as a sharp static news front page. Next steps can add RSS feeds, CMS drafts, Claude-assisted summaries and connector tools for publishing from mobile.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <DeskItem icon={GlobeHemisphereEast} title="Local + global" text="Nigeria-first coverage with international headlines beside it." />
            <DeskItem icon={Fire} title="Urban culture" text="Entertainment, creators, music, street style and youth lifestyle bits." />
            <DeskItem icon={DeviceMobile} title="Mobile-first" text="Fast card layout, readable spacing and clean navigation on phones." />
            <DeskItem icon={Lightning} title="AI-ready" text="Prepared for future Claude workflows, article drafts and editor tools." />
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 md:flex-row md:items-center md:justify-between lg:px-6">
          <div>
            <p className="text-2xl font-black tracking-tight">FrontDesk</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Daily Nigerian, international, technology, urban lifestyle and entertainment news.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                {category}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

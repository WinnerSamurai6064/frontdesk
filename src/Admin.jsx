import { useEffect, useMemo, useState } from 'react';
import {
  Article,
  FloppyDisk,
  LockKey,
  PencilSimple,
  Plus,
  SignOut,
  Trash,
} from '@phosphor-icons/react';
import {
  createArticle,
  deleteArticle,
  fetchPublishedArticles,
  fetchSiteSettings,
  updateArticle,
  updateSiteSettings,
} from './lib/api';

const emptyArticle = {
  title: '',
  category: 'Daily Brief',
  summary: '',
  body: '',
  sourcesText: '',
  imageUrl: '',
  imageCredit: '',
  imageLicenseNote: '',
  tone: 'neutral, clear, modern news desk',
};

const defaultSettings = {
  footerTitle: 'FrontDesk',
  footerText: 'Daily Nigerian, international, technology, urban lifestyle and entertainment news.',
  footerNote: 'Built for fast mobile reading.',
  contactEmail: '',
  whatsapp: '',
};

function articleToForm(article) {
  return {
    title: article.title || '',
    category: article.category || 'Daily Brief',
    summary: article.summary || '',
    body: article.body || '',
    sourcesText: (article.sources || []).join('\n'),
    imageUrl: article.rawImage?.url || article.image || '',
    imageCredit: article.imageCredit || '',
    imageLicenseNote: article.imageLicenseNote || '',
    tone: article.tone || 'neutral, clear, modern news desk',
  };
}

function formToArticle(form) {
  return {
    title: form.title,
    category: form.category,
    summary: form.summary,
    body: form.body,
    sources: form.sourcesText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    image: form.imageUrl ? { url: form.imageUrl } : null,
    imageCredit: form.imageCredit,
    imageLicenseNote: form.imageLicenseNote,
    tone: form.tone,
    approvalNote: 'CMS publish',
  };
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {label}
      {children}
    </label>
  );
}

const inputClass = 'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export default function Admin() {
  const [token, setToken] = useState(() => window.localStorage.getItem('frontdesk_admin_token') || '');
  const [loginToken, setLoginToken] = useState('');
  const [articles, setArticles] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [form, setForm] = useState(emptyArticle);
  const [editingId, setEditingId] = useState('');
  const [tab, setTab] = useState('articles');
  const [status, setStatus] = useState('Ready');
  const [loading, setLoading] = useState(false);

  const isLoggedIn = Boolean(token);

  const activeArticle = useMemo(
    () => articles.find((item) => item.id === editingId),
    [articles, editingId],
  );

  async function load() {
    setLoading(true);
    try {
      const [liveArticles, liveSettings] = await Promise.all([
        fetchPublishedArticles(),
        fetchSiteSettings(),
      ]);
      setArticles(liveArticles);
      setSettings({ ...defaultSettings, ...(liveSettings || {}) });
      setStatus('CMS synced with backend');
    } catch (error) {
      setStatus(error.message || 'Could not sync CMS');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) load();
  }, [isLoggedIn]);

  function login(event) {
    event.preventDefault();
    if (!loginToken.trim()) return;
    window.localStorage.setItem('frontdesk_admin_token', loginToken.trim());
    setToken(loginToken.trim());
    setLoginToken('');
  }

  function logout() {
    window.localStorage.removeItem('frontdesk_admin_token');
    setToken('');
    setArticles([]);
  }

  function startNew() {
    setEditingId('');
    setForm(emptyArticle);
    setTab('articles');
  }

  function startEdit(article) {
    setEditingId(article.id);
    setForm(articleToForm(article));
    setTab('articles');
  }

  async function saveArticle(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = formToArticle(form);
      if (editingId) {
        await updateArticle(editingId, payload, token);
        setStatus('Article updated');
      } else {
        await createArticle(payload, token);
        setStatus('Article published');
      }
      setForm(emptyArticle);
      setEditingId('');
      await load();
    } catch (error) {
      setStatus(error.message || 'Could not save article');
    } finally {
      setLoading(false);
    }
  }

  async function removeArticle(id) {
    if (!window.confirm('Delete this article from FrontDesk?')) return;
    setLoading(true);
    try {
      await deleteArticle(id, token);
      setStatus('Article deleted');
      await load();
    } catch (error) {
      setStatus(error.message || 'Could not delete article');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const updated = await updateSiteSettings(settings, token);
      setSettings({ ...defaultSettings, ...updated });
      setStatus('Site settings saved');
    } catch (error) {
      setStatus(error.message || 'Could not save settings');
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
        <form onSubmit={login} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-950">
            <LockKey size={28} weight="duotone" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">FrontDesk CMS</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Enter your admin token to manage published articles and site footer settings.
          </p>
          <input
            type="password"
            value={loginToken}
            onChange={(event) => setLoginToken(event.target.value)}
            placeholder="Admin token"
            className="mt-6 w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:ring-4 focus:ring-blue-500/30"
          />
          <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
            Login
            <LockKey size={18} weight="bold" />
          </button>
          <a href="/" className="mt-4 block text-center text-sm font-bold text-slate-300 hover:text-white">
            Back to FrontDesk
          </a>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-700">Admin Console</p>
            <h1 className="text-3xl font-black tracking-tight">FrontDesk CMS</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">{status}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black hover:bg-slate-50">View site</a>
            <button onClick={load} className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black hover:bg-slate-50">Sync</button>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-red-600">
              Logout
              <SignOut size={18} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[0.9fr_1.3fr]">
        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTab('articles')} className={`rounded-2xl px-4 py-3 text-sm font-black ${tab === 'articles' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>Articles</button>
              <button onClick={() => setTab('settings')} className={`rounded-2xl px-4 py-3 text-sm font-black ${tab === 'settings' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>Footer</button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Published stories</h2>
              <button onClick={startNew} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white">
                <Plus size={16} weight="bold" /> New
              </button>
            </div>
            <div className="space-y-3">
              {articles.map((article) => (
                <div key={article.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">{article.category}</p>
                  <h3 className="mt-1 text-sm font-black leading-snug">{article.title}</h3>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => startEdit(article)} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                      <PencilSimple size={14} weight="bold" /> Edit
                    </button>
                    <button onClick={() => removeArticle(article.id)} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-100">
                      <Trash size={14} weight="bold" /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {!articles.length && <p className="text-sm font-semibold text-slate-500">No published articles yet.</p>}
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          {tab === 'articles' ? (
            <form onSubmit={saveArticle} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Article Manager</p>
                  <h2 className="text-2xl font-black">{editingId ? 'Edit article' : 'Publish article'}</h2>
                </div>
                <Article size={32} weight="duotone" className="text-slate-400" />
              </div>

              <Field label="Title">
                <input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Category">
                  <select className={inputClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    {['Daily Brief', 'Nigeria', 'World', 'Technology', 'Urban Pulse', 'Entertainment'].map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tone">
                  <input className={inputClass} value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value })} />
                </Field>
              </div>

              <Field label="Summary">
                <textarea className={inputClass} rows="3" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
              </Field>

              <Field label="Body">
                <textarea className={inputClass} rows="10" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
              </Field>

              <Field label="Sources, one URL per line">
                <textarea className={inputClass} rows="3" value={form.sourcesText} onChange={(event) => setForm({ ...form, sourcesText: event.target.value })} />
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Image URL">
                  <input className={inputClass} value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
                </Field>
                <Field label="Image credit">
                  <input className={inputClass} value={form.imageCredit} onChange={(event) => setForm({ ...form, imageCredit: event.target.value })} />
                </Field>
                <Field label="License note">
                  <input className={inputClass} value={form.imageLicenseNote} onChange={(event) => setForm({ ...form, imageLicenseNote: event.target.value })} />
                </Field>
              </div>

              <button disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60">
                <FloppyDisk size={18} weight="bold" />
                {editingId ? 'Save changes' : 'Publish now'}
              </button>
            </form>
          ) : (
            <form onSubmit={saveSettings} className="space-y-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Site Settings</p>
                <h2 className="text-2xl font-black">Edit footer and contact details</h2>
              </div>

              <Field label="Footer title">
                <input className={inputClass} value={settings.footerTitle} onChange={(event) => setSettings({ ...settings, footerTitle: event.target.value })} />
              </Field>
              <Field label="Footer text">
                <textarea className={inputClass} rows="3" value={settings.footerText} onChange={(event) => setSettings({ ...settings, footerText: event.target.value })} />
              </Field>
              <Field label="Footer note">
                <input className={inputClass} value={settings.footerNote} onChange={(event) => setSettings({ ...settings, footerNote: event.target.value })} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Contact email">
                  <input className={inputClass} value={settings.contactEmail} onChange={(event) => setSettings({ ...settings, contactEmail: event.target.value })} />
                </Field>
                <Field label="WhatsApp">
                  <input className={inputClass} value={settings.whatsapp} onChange={(event) => setSettings({ ...settings, whatsapp: event.target.value })} />
                </Field>
              </div>

              <button disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60">
                <FloppyDisk size={18} weight="bold" />
                Save footer
              </button>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

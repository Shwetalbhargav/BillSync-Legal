import { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, Chrome, Clock, ExternalLink, FileText, FileType, LogOut, Mail, MessageCircle, Monitor, RefreshCw, ShieldCheck, Video, WifiOff } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const initialLogin = {
  name: '',
  mobile: '',
  password: '',
  role: 'lawyer',
  firmId: '',
};

function formatSeconds(value) {
  const seconds = Math.max(0, Number(value || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function formatDate(value) {
  if (!value) return 'Not yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not yet';
  return date.toLocaleString();
}

function sessionTitle(session) {
  if (!session) return 'No active work session';
  const matter = session.matterName || session.caseId?.title || session.caseId?.name || 'Selected matter';
  const client = session.clientName || session.clientId?.displayName || session.clientId?.name || 'Client';
  return `${client} / ${matter}`;
}

const toolCards = [
  { id: 'microsoft_word', label: 'Microsoft Word', detail: 'Create a Lexora work-session document.', icon: FileText },
  { id: 'pdf_reader', label: 'PDF reader', detail: 'Open the sample review PDF.', icon: FileType },
  { id: 'google_docs', label: 'Google Docs', detail: 'Open Docs for browser drafting.', icon: FileText },
  { id: 'google_chrome', label: 'Chrome research', detail: 'Open browser research.', icon: Chrome },
  { id: 'gmail', label: 'Gmail', detail: 'Open Gmail with meter context.', icon: Mail },
  { id: 'google_meet', label: 'Google Meet', detail: 'Open Meet for calls or hearings.', icon: Video },
  { id: 'zoom', label: 'Zoom', detail: 'Open Zoom web launcher.', icon: Video },
  { id: 'microsoft_teams', label: 'Teams', detail: 'Open Microsoft Teams.', icon: Monitor },
  { id: 'whatsapp', label: 'WhatsApp Web', detail: 'Open WhatsApp Web.', icon: MessageCircle },
  { id: 'billbot_ai', label: 'Assistant', detail: 'Open the Lexora assistant.', icon: Bot },
];

function StatusPill({ state }) {
  const session = state.session;
  const pending = Number(state.queue?.pending || 0);
  let label = 'Signed out';
  let tone = 'muted';
  if (state.signedIn && !session) {
    label = state.online === false ? 'Offline' : 'No session';
    tone = state.online === false ? 'warning' : 'muted';
  }
  if (session?.status === 'paused') {
    label = 'Paused';
    tone = 'warning';
  }
  if (session?.status === 'running') {
    label = pending ? 'Tracking, sync pending' : 'Tracking';
    tone = pending ? 'warning' : 'success';
  }
  return <span className={`pill ${tone}`}>{label}</span>;
}

function LoginForm({ state, onLogin, onSettings }) {
  const [form, setForm] = useState(initialLogin);
  const [settings, setSettings] = useState({
    backendBaseUrl: state.backendBaseUrl || '',
    webAppUrl: state.webAppUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setSettings({
      backendBaseUrl: state.backendBaseUrl || '',
      webAppUrl: state.webAppUrl || '',
    });
  }, [state.backendBaseUrl, state.webAppUrl]);

  async function submitSettings(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await onSettings(settings);
      setMessage('Settings saved.');
    } catch (error) {
      setMessage(error.message || 'Settings could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await onSettings(settings);
      await onLogin(form);
      setForm(initialLogin);
    } catch (error) {
      setMessage(error.message || 'Login failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid two">
      <section className="panel">
        <div className="panel-title">
          <ShieldCheck />
          <div>
            <h2>Desktop login</h2>
            <p>Use the same Lexora account and firm as the web app.</p>
          </div>
        </div>
        <form className="form" onSubmit={submitLogin}>
          <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>Mobile<input value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} required maxLength={10} /></label>
          <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
          <label>Role
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="lawyer">Lawyer</option>
              <option value="partner">Partner</option>
              <option value="associate">Associate</option>
              <option value="intern">Intern</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>Firm ID<input value={form.firmId} onChange={(event) => setForm({ ...form, firmId: event.target.value })} required /></label>
          <button disabled={saving} type="submit">Sign in</button>
        </form>
        {message ? <p className="message">{message}</p> : null}
      </section>
      <section className="panel">
        <div className="panel-title">
          <Monitor />
          <div>
            <h2>Connection</h2>
            <p>Point the agent at your API and web Work Meter.</p>
          </div>
        </div>
        <form className="form" onSubmit={submitSettings}>
          <label>Backend API URL<input value={settings.backendBaseUrl} onChange={(event) => setSettings({ ...settings, backendBaseUrl: event.target.value })} /></label>
          <label>Web Work Meter URL<input value={settings.webAppUrl} onChange={(event) => setSettings({ ...settings, webAppUrl: event.target.value })} /></label>
          <button disabled={saving} type="submit">Save settings</button>
        </form>
      </section>
    </div>
  );
}

function ToolLauncher({ requestedTool, onOpenTool }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <ExternalLink />
        <div>
          <h2>Work tools</h2>
          <p>Launch desktop and browser tools from the agent after starting a web Work Meter session.</p>
        </div>
      </div>
      {requestedTool ? <p className="handoff">Web requested: {toolCards.find((tool) => tool.id === requestedTool)?.label || requestedTool}</p> : null}
      <div className="tool-grid">
        {toolCards.map((tool) => {
          const Icon = tool.icon;
          return (
            <button className={`tool-card ${requestedTool === tool.id ? 'selected' : ''}`} key={tool.id} onClick={() => onOpenTool(tool.id)} type="button">
              <span className="tool-icon"><Icon /></span>
              <span className="tool-copy">
                <strong>{tool.label}</strong>
                <small>{tool.detail}</small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Dashboard({ state, requestedTool, onLogout, onRetry, onOpenTool, onOpenWeb }) {
  const live = state.live || {};
  const session = state.session;
  const nativeNotes = useMemo(() => Object.entries(state.nativeStatus || {}).map(([key, value]) => `${key}: ${value}`), [state.nativeStatus]);

  return (
    <div className="stack">
      <section className="panel hero">
        <div>
          <div className="eyebrow">Logged in as {state.user?.name || state.user?.email || 'Lexora user'}</div>
          <h2>{sessionTitle(session)}</h2>
          <p>{session ? `Status: ${session.status || 'running'}. Desktop activity is attached to this web-started session.` : 'Start work in the Lexora web Work Meter. The desktop agent will detect it automatically.'}</p>
        </div>
        <div className="actions">
          <button type="button" onClick={onOpenWeb}>Open Web Work Meter</button>
          <button className="secondary" type="button" onClick={onLogout}><LogOut /> Logout</button>
        </div>
      </section>

      <div className="metrics">
        <section className="metric"><Activity /><span>Activity</span><strong>{live.activityPercent || 0}%</strong></section>
        <section className="metric"><Clock /><span>Active sample</span><strong>{formatSeconds(live.activeSeconds)}</strong></section>
        <section className="metric"><span className="iconText">K</span><span>Keys</span><strong>{live.keyboardCount || 0}</strong></section>
        <section className="metric"><span className="iconText">M</span><span>Mouse</span><strong>{live.mouseCount || 0}</strong></section>
      </div>

      <ToolLauncher requestedTool={requestedTool} onOpenTool={onOpenTool} />

      <div className="grid two">
        <section className="panel">
          <div className="panel-title">
            <Monitor />
            <div>
              <h2>Current app</h2>
              <p>{state.currentWindow?.appName || 'No active window detected'}</p>
            </div>
          </div>
          <p className="window-title">{state.currentWindow?.title || 'Window title unavailable'}</p>
          <div className="note">{nativeNotes.join(' | ')}</div>
        </section>

        <section className="panel">
          <div className="panel-title">
            {state.online === false ? <WifiOff /> : <RefreshCw />}
            <div>
              <h2>Sync</h2>
              <p>{state.queue?.pending || 0} pending item(s)</p>
            </div>
          </div>
          <p>Last poll: {formatDate(state.lastPollAt)}</p>
          {state.lastError ? <p className="error">{state.lastError}</p> : null}
          <button className="secondary" type="button" onClick={onRetry}>Retry queued sync</button>
        </section>
      </div>

      <section className="panel privacy">
        <ShieldCheck />
        <p>This agent sends counts and timing only. It does not send keystroke values, screenshots, document content, clipboard content, or page text.</p>
      </section>
    </div>
  );
}

function App() {
  const [state, setState] = useState({ signedIn: false, queue: { pending: 0 }, live: {} });
  const [busy, setBusy] = useState(false);
  const [requestedTool] = useState(() => new URLSearchParams(window.location.search).get('tool') || '');

  useEffect(() => {
    if (!window.lexoraAgent) return undefined;
    window.lexoraAgent.getState().then(setState);
    return window.lexoraAgent.onState(setState);
  }, []);

  async function run(action) {
    setBusy(true);
    try {
      const next = await action();
      if (next) setState(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <header>
        <div>
          <h1>Lexora Desktop Agent</h1>
          <p>Windows activity tracking for web-started work sessions.</p>
        </div>
        <StatusPill state={state} />
      </header>

      {state.signedIn ? (
        <Dashboard
          state={state}
          requestedTool={requestedTool}
          onLogout={() => run(() => window.lexoraAgent.logout())}
          onRetry={() => run(() => window.lexoraAgent.retrySync())}
          onOpenTool={(tool) => run(() => window.lexoraAgent.openTool(tool))}
          onOpenWeb={() => run(() => window.lexoraAgent.openWebMeter())}
        />
      ) : (
        <LoginForm
          state={state}
          onLogin={(credentials) => run(() => window.lexoraAgent.login(credentials))}
          onSettings={(settings) => run(() => window.lexoraAgent.updateSettings(settings))}
        />
      )}
      {busy ? <div className="busy">Working...</div> : null}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

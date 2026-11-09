import { useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, Award, Check, ChevronRight, CircleHelp,
  Clock3, Crown, Gem, Gift, Hammer, Home, Pickaxe, Settings,
  ShieldCheck, Sparkles, Trophy, Users, Wallet, X,
} from 'lucide-react';
import mineArtwork from './assets/mine-art.png';

type Tab = 'Mine' | 'Missions' | 'Friends' | 'Wallet' | 'Profile';

const navItems: { label: Tab; icon: typeof Pickaxe }[] = [
  { label: 'Mine', icon: Pickaxe },
  { label: 'Missions', icon: Trophy },
  { label: 'Friends', icon: Users },
  { label: 'Wallet', icon: Wallet },
  { label: 'Profile', icon: Home },
];

const initialMissions = [
  { id: 'login', title: 'Clock in at the mine', detail: 'Open the mine today', reward: 25, done: false, type: 'Daily' },
  { id: 'collect', title: 'Gather your yield', detail: 'Claim points from the mine', reward: 40, done: false, type: 'Daily' },
  { id: 'upgrade', title: 'Build your legacy', detail: 'Upgrade your mine once', reward: 75, done: false, type: 'Daily' },
  { id: 'weekly', title: 'A week underground', detail: 'Complete 5 daily missions', reward: 180, done: false, type: 'Weekly' },
];

function App() {
  const [tab, setTab] = useState<Tab>('Mine');
  const [points, setPoints] = useState(1240);
  const [level, setLevel] = useState(3);
  const [mined, setMined] = useState(68);
  const [missions, setMissions] = useState(initialMissions);
  const [notice, setNotice] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  };
  const claimPoints = () => {
    const reward = 36 + level * 4;
    setPoints((value) => value + reward);
    setMined(0);
    setMissions((items) => items.map((item) => item.id === 'collect' ? { ...item, done: true } : item));
    flash(`+${reward} EP added to your treasury`);
  };
  const upgrade = () => {
    const cost = 320 + (level - 3) * 170;
    if (points < cost) {
      flash(`You need ${cost - points} more EP to upgrade`);
      return;
    }
    setPoints((value) => value - cost);
    setLevel((value) => value + 1);
    setMissions((items) => items.map((item) => item.id === 'upgrade' ? { ...item, done: true } : item));
    flash(`Mine upgraded to level ${level + 1}`);
  };
  const completeMission = (id: string) => {
    const mission = missions.find((item) => item.id === id);
    if (!mission || mission.done) return;
    setMissions((items) => items.map((item) => item.id === id ? { ...item, done: true } : item));
    setPoints((value) => value + mission.reward);
    flash(`Mission complete · +${mission.reward} EP`);
  };

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand-mark"><Pickaxe size={19} strokeWidth={2.2} /></div>
        <div className="brand-copy"><span>MINER</span><small>EMPIRE</small></div>
        <div className="season-pill"><span className="live-dot" /> SEASON 04</div>
        <button className="balance-chip" onClick={() => setTab('Wallet')} data-testid="button-header-wallet" aria-label="Open wallet">
          <Gem size={15} /><span data-testid="text-header-balance">{points.toLocaleString()}</span><small>EP</small>
        </button>
      </header>

      <section className="screen" key={tab}>
        {tab === 'Mine' && <MineScreen points={points} level={level} mined={mined} onClaim={claimPoints} onUpgrade={upgrade} />}
        {tab === 'Missions' && <MissionsScreen missions={missions} onComplete={completeMission} />}
        {tab === 'Friends' && <FriendsScreen onFeedback={flash} />}
        {tab === 'Wallet' && <WalletScreen points={points} onFeedback={flash} />}
        {tab === 'Profile' && <ProfileScreen level={level} onSettings={() => setSettingsOpen(true)} />}
      </section>

      <nav className="bottom-nav" aria-label="Game navigation">
        {navItems.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => setTab(label)} className={`nav-item ${tab === label ? 'active' : ''}`} data-testid={`tab-${label.toLowerCase()}`} aria-current={tab === label ? 'page' : undefined}>
            <span className="nav-icon"><Icon size={20} strokeWidth={tab === label ? 2.3 : 1.8} /></span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {notice && <div className="toast-note" role="status" data-testid="status-feedback"><Check size={16} />{notice}</div>}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} onFeedback={flash} />}
    </main>
  );
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="heading-sub">{subtitle}</p></div>;
}

function MineScreen({ points, level, mined, onClaim, onUpgrade }: { points: number; level: number; mined: number; onClaim: () => void; onUpgrade: () => void }) {
  const cost = 320 + (level - 3) * 170;
  const progress = Math.min(100, Math.round((mined / 120) * 100));
  return <div className="page-content mine-page">
    <div className="mine-intro">
      <div><p className="eyebrow">YOUR DOMAIN</p><h1>The Deepforge</h1><div className="level-line"><span className="level-badge"><Crown size={13} /> LEVEL {level}</span><span className="rank-copy">Ironhold territory</span></div></div>
      <button className="icon-button help-button" aria-label="About mining" onClick={() => window.alert('Your mine gathers Empire Points over time. Claim when you are ready.') } data-testid="button-mining-help"><CircleHelp size={18} /></button>
    </div>
    <div className="art-card">
      <img src={mineArtwork} alt="A gold-lit mine built into a deep cavern with glowing teal ore" />
      <div className="art-shade" />
      <div className="art-caption"><span className="mine-status"><i /> MINE ACTIVE</span><span className="art-location">THE VEIL CAVERNS</span></div>
      <div className="art-title">BENEATH THE<br /><em>OLD MOUNTAIN</em></div>
      <div className="art-stats"><div><span>EXTRACTION RATE</span><strong>{(2.4 + (level - 3) * 0.6).toFixed(1)} <small>EP / HR</small></strong></div><div className="stat-separator" /><div><span>VEIN QUALITY</span><strong className="teal-text">RICH <Gem size={14} /></strong></div></div>
    </div>
    <div className="treasury-card">
      <div className="treasury-top"><div><p className="eyebrow">UNCLAIMED YIELD</p><div className="yield-number" data-testid="text-unclaimed-yield">{mined}<small>.4 <span>EP</span></small></div></div><div className="coin-seal"><Gem size={22} /></div></div>
      <div className="progress-label"><span>CLAIM READY IN</span><strong><Clock3 size={13} /> 02:18:42</strong></div>
      <div className="progress-track"><span style={{ width: `${Math.max(progress, 24)}%` }} /></div>
      <button className="button button-gold claim-button" onClick={onClaim} data-testid="button-claim-points"><ArrowDownToLine size={17} /> Claim Points <span>+{36 + level * 4} EP</span></button>
    </div>
    <div className="balance-strip">
      <div className="balance-emblem"><Gem size={17} /></div><div className="balance-label"><span>EMPIRE POINTS</span><small>Available treasury</small></div><strong data-testid="text-ep-balance">{points.toLocaleString()} <small>EP</small></strong>
    </div>
    <section className="upgrade-section">
      <div className="section-heading"><div><p className="eyebrow">GROW YOUR EMPIRE</p><h2>Next upgrade</h2></div><span className="next-level">LVL {level + 1}</span></div>
      <div className="upgrade-card">
        <div className="upgrade-icon"><Hammer size={22} /></div><div className="upgrade-info"><strong>Reinforced Drill</strong><span>Increase extraction by <b>+0.6 EP / hr</b></span></div>
        <div className="upgrade-cost"><Gem size={13} /><strong>{cost}</strong><small>EP</small></div>
      </div>
      <button className="button button-outline upgrade-button" onClick={onUpgrade} data-testid="button-upgrade-mine">Upgrade mine <ArrowRight size={16} /></button>
    </section>
    <div className="mine-footnote"><ShieldCheck size={14} /> Your mine keeps working while you explore.</div>
  </div>;
}

type Mission = typeof initialMissions[number];
function MissionsScreen({ missions, onComplete }: { missions: Mission[]; onComplete: (id: string) => void }) {
  const daily = missions.filter((mission) => mission.type === 'Daily');
  const weekly = missions.filter((mission) => mission.type === 'Weekly');
  const doneCount = missions.filter((mission) => mission.done).length;
  return <div className="page-content">
    <PageHeading eyebrow="THE DAILY LEDGER" title="Missions" subtitle="Small deeds. A stronger empire." />
    <div className="streak-card"><div className="streak-icon"><Sparkles size={19} /></div><div className="streak-text"><strong>Daily login</strong><span>Day 4 of your mining streak</span></div><div className="streak-reward"><strong>+25</strong><small>EP</small></div><button className="streak-claim" onClick={() => onComplete('login')} disabled={missions[0].done} data-testid="button-daily-login">{missions[0].done ? <Check size={17} /> : 'Claim'}</button></div>
    <div className="mission-progress"><div><span>TODAY'S PROGRESS</span><strong>{doneCount} / {missions.length} complete</strong></div><div className="progress-track"><span style={{ width: `${(doneCount / missions.length) * 100}%` }} /></div></div>
    <div className="section-heading mission-section-heading"><div><p className="eyebrow">RESET IN 08:42:16</p><h2>Daily missions</h2></div><span className="count-tag">{daily.filter((item) => item.done).length}/{daily.length}</span></div>
    <div className="mission-list">{daily.filter((item) => item.id !== 'login').map((mission) => <MissionRow key={mission.id} mission={mission} onComplete={onComplete} />)}</div>
    <div className="section-heading weekly-heading"><div><p className="eyebrow">ENDS IN 3 DAYS</p><h2>Weekly challenges</h2></div><span className="weekly-mark"><Award size={15} /> WEEKLY</span></div>
    <div className="mission-list">{weekly.map((mission) => <MissionRow key={mission.id} mission={mission} onComplete={onComplete} />)}</div>
    <div className="mission-note"><Gift size={15} /><span>Rewards are sample EP for this game demo.</span></div>
  </div>;
}

function MissionRow({ mission, onComplete }: { mission: Mission; onComplete: (id: string) => void }) {
  return <article className={`mission-row ${mission.done ? 'mission-done' : ''}`} data-testid={`card-mission-${mission.id}`}>
    <div className="mission-symbol">{mission.done ? <Check size={17} /> : mission.type === 'Weekly' ? <Trophy size={17} /> : <Pickaxe size={17} />}</div>
    <div className="mission-copy"><strong>{mission.title}</strong><span>{mission.detail}</span></div>
    <div className="mission-action"><span className="reward">+{mission.reward} <small>EP</small></span><button onClick={() => onComplete(mission.id)} disabled={mission.done} data-testid={`button-mission-${mission.id}`}>{mission.done ? 'Done' : 'Claim'}</button></div>
  </article>;
}

function FriendsScreen({ onFeedback }: { onFeedback: (message: string) => void }) {
  return <div className="page-content">
    <PageHeading eyebrow="STRENGTH IN NUMBERS" title="Bring your crew" subtitle="Build a deeper empire together." />
    <div className="friends-banner"><div className="banner-orbit orbit-one" /><div className="banner-orbit orbit-two" /><div className="banner-gem"><Users size={30} /></div><div className="banner-label">THE UNDERGROUND<br /><strong>IS BETTER TOGETHER</strong></div><div className="banner-people"><span>V</span><span>M</span><span>+</span></div></div>
    <div className="invite-card"><p className="eyebrow">YOUR INVITE CODE</p><div className="invite-code"><span>DEEP-7K4P</span><span className="placeholder-tag">DEMO ONLY</span></div><p className="muted-copy">A preview code only. No referral link is active.</p><button className="button button-gold invite-button" onClick={() => onFeedback('Demo only — no invite was sent')} data-testid="button-invite-friends"><Users size={17} /> Invite friends <ArrowRight size={16} /></button></div>
    <div className="section-heading friend-progress-heading"><div><p className="eyebrow">YOUR CREW</p><h2>Referral progress</h2></div><span className="count-tag">0 / 5</span></div>
    <div className="referral-progress"><div className="referral-progress-top"><div><strong>Mining together</strong><span>Sample progress only</span></div><strong>0 <small>FRIENDS</small></strong></div><div className="progress-track"><span style={{ width: '0%' }} /></div><div className="milestones"><span>1</span><span>3</span><span>5</span></div></div>
    <div className="reward-card"><div className="reward-glyph"><Gift size={19} /></div><div><strong>Empire grows with every ally</strong><p>Sample rewards: 100 EP for each crew milestone.</p></div><ChevronRight size={17} /></div>
    <div className="fine-print">Invite controls are visual demo interactions. Nothing is copied, shared, or sent.</div>
  </div>;
}

function WalletScreen({ points, onFeedback }: { points: number; onFeedback: (message: string) => void }) {
  return <div className="page-content">
    <PageHeading eyebrow="YOUR TREASURY" title="Wallet" subtitle="A clear view of your game assets." />
    <div className="wallet-hero"><div className="wallet-hero-top"><span>IN-GAME BALANCE</span><div className="wallet-token"><Gem size={14} /> EP</div></div><strong data-testid="text-wallet-ep">{points.toLocaleString()}<small> EP</small></strong><span className="wallet-caption">Empire Points · sample game balance</span><div className="wallet-bottom-rule"><span /><span /><span /></div></div>
    <button className="button button-outline connect-button" onClick={() => onFeedback('Wallet connection is not enabled in this demo')} data-testid="button-connect-wallet"><Wallet size={17} /> Connect TON Wallet <span className="demo-chip">DEMO</span></button>
    <p className="wallet-demo-note"><ShieldCheck size={14} /> Connection is not enabled. No wallet or blockchain action will occur.</p>
    <section className="asset-section"><div className="section-heading"><div><p className="eyebrow">EMPIRE ASSETS</p><h2>Allocations</h2></div></div>
      <div className="asset-row"><div className="asset-symbol ep-symbol"><Gem size={18} /></div><div className="asset-copy"><strong>Empire Points</strong><span>In-game balance</span></div><div className="asset-amount"><strong>{points.toLocaleString()}</strong><span>EP</span></div></div>
      <div className="asset-row"><div className="asset-symbol mx-symbol">MX</div><div className="asset-copy"><strong>Pending MX allocation</strong><span className="not-issued">Not yet issued</span></div><div className="asset-amount pending-amount"><strong>—</strong><span>MX</span></div></div>
      <div className="asset-row"><div className="asset-symbol chain-symbol"><Gem size={18} /></div><div className="asset-copy"><strong>On-chain MX balance</strong><span>Placeholder · not connected</span></div><div className="asset-amount pending-amount"><strong>—</strong><span>MX</span></div></div>
    </section>
    <div className="wallet-disclaimer"><CircleHelp size={16} /><p>This is a game interface preview. MX is not issued here, and no balances are queried on-chain.</p></div>
  </div>;
}

function ProfileScreen({ level, onSettings }: { level: number; onSettings: () => void }) {
  return <div className="page-content">
    <PageHeading eyebrow="YOUR CHRONICLE" title="Profile" subtitle="The name behind the empire." />
    <div className="profile-card"><div className="profile-banner" /><div className="profile-content"><div className="avatar">V<span className="avatar-status" /></div><div className="profile-name"><strong>VeinSeeker</strong><span>Deepforge founder</span></div><span className="profile-level"><Crown size={13} /> LVL {level}</span><div className="profile-divider" /><div className="profile-stat"><span>EMPIRE RANK</span><strong>Ironbound</strong></div><div className="profile-stat"><span>MINING STREAK</span><strong>4 days</strong></div><div className="profile-stat"><span>JOINED</span><strong>Season 04</strong></div></div></div>
    <div className="section-heading achievements-heading"><div><p className="eyebrow">MILESTONES</p><h2>Achievements</h2></div><span className="count-tag">2 / 8</span></div>
    <div className="achievement-grid"><div className="achievement unlocked"><div className="achievement-icon"><Pickaxe size={19} /></div><strong>First strike</strong><span>Started mining</span><i><Check size={11} /></i></div><div className="achievement unlocked"><div className="achievement-icon"><Gem size={19} /></div><strong>Stone & spark</strong><span>Reached level 3</span><i><Check size={11} /></i></div><div className="achievement locked"><div className="achievement-icon"><Crown size={19} /></div><strong>Deep delver</strong><span>Reach level 5</span></div><div className="achievement locked"><div className="achievement-icon"><Trophy size={19} /></div><strong>Day keeper</strong><span>7 day streak</span></div></div>
    <div className="section-heading settings-heading"><div><p className="eyebrow">PREFERENCES</p><h2>Account settings</h2></div></div>
    <button className="settings-row" onClick={onSettings} data-testid="button-account-settings"><span className="settings-icon"><Settings size={17} /></span><span><strong>Game preferences</strong><small>Sound, notifications & account</small></span><ChevronRight size={17} /></button>
    <div className="profile-footer">MINER EMPIRE <span>·</span> SEASON 04 <span>·</span> DEMO BUILD</div>
  </div>;
}

function SettingsDialog({ onClose, onFeedback }: { onClose: () => void; onFeedback: (message: string) => void }) {
  const [sound, setSound] = useState(true);
  const [notifications, setNotifications] = useState(false);
  return <div className="modal-backdrop" onClick={onClose}><section className="settings-modal" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="settings-title">
    <div className="modal-head"><div><p className="eyebrow">ACCOUNT</p><h2 id="settings-title">Game preferences</h2></div><button className="icon-button" onClick={onClose} aria-label="Close settings" data-testid="button-close-settings"><X size={18} /></button></div>
    <div className="preference-row"><span><strong>Game sound</strong><small>Audio feedback</small></span><button className={`toggle ${sound ? 'on' : ''}`} onClick={() => setSound(!sound)} aria-pressed={sound} data-testid="toggle-game-sound"><i /></button></div>
    <div className="preference-row"><span><strong>Mining reminders</strong><small>Local demo preference</small></span><button className={`toggle ${notifications ? 'on' : ''}`} onClick={() => setNotifications(!notifications)} aria-pressed={notifications} data-testid="toggle-reminders"><i /></button></div>
    <button className="button button-gold modal-done" onClick={() => { onClose(); onFeedback('Preferences saved on this screen'); }} data-testid="button-save-settings">Save preferences <Check size={16} /></button>
  </section></div>;
}

export default App;

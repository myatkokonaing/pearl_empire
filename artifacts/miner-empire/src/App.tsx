import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownToLine, ArrowRight, Award, Check, ChevronRight, CircleHelp,
  Clock3, Crown, Gem, Gift, Hammer, Home, Pickaxe, Settings,
  ShieldCheck, Sparkles, Trophy, Users, Wallet, X,
} from "lucide-react";
import mineArtwork from "./assets/pearl-castle.svg";
import {
  detectInitialLanguage, formatDecimal, formatLocalDate, formatLocalTime,
  formatNumber, languageOptions, pluralMessage, readSavedLanguage,
  saveLanguage, translate, type Language, type TranslationKey,
} from "./lib/i18n";
import {
  detectDeviceTimeZone, formatCountdown, formatUtcOffset, listTimeZones,
  readTimeZonePreference, saveTimeZonePreference, type TimeZoneMode,
  type TimeZonePreference,
} from "./lib/regional";

type Tab = "Mine" | "Missions" | "Friends" | "Wallet" | "Profile";
type MissionType = "Daily" | "Weekly" | "Special";
type MissionId = "login" | "collect" | "upgrade" | "weekly" | "special";
type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;

interface Mission {
  id: MissionId;
  reward: number;
  done: boolean;
  type: MissionType;
  progress: number;
  target: number;
}

const navItems: { label: Tab; labelKey: TranslationKey; icon: typeof Pickaxe }[] = [
  { label: "Mine", labelKey: "nav.mine", icon: Pickaxe },
  { label: "Missions", labelKey: "nav.missions", icon: Trophy },
  { label: "Friends", labelKey: "nav.friends", icon: Users },
  { label: "Wallet", labelKey: "nav.wallet", icon: Wallet },
  { label: "Profile", labelKey: "nav.profile", icon: Home },
];

const initialMissions: Mission[] = [
  { id: "login", reward: 25, done: false, type: "Daily", progress: 0, target: 1 },
  { id: "collect", reward: 40, done: false, type: "Daily", progress: 0, target: 1 },
  { id: "upgrade", reward: 75, done: false, type: "Daily", progress: 0, target: 1 },
  { id: "weekly", reward: 180, done: false, type: "Weekly", progress: 2, target: 5 },
  { id: "special", reward: 120, done: false, type: "Special", progress: 1, target: 3 },
];

function App() {
  const [tab, setTab] = useState<Tab>("Mine");
  const [points, setPoints] = useState(1240);
  const [totalEarned, setTotalEarned] = useState(1840);
  const [level, setLevel] = useState(3);
  const [mined, setMined] = useState(68.4);
  const [missions, setMissions] = useState(() => initialMissions.map((mission) => ({ ...mission })));
  const [notice, setNotice] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(detectInitialLanguage);
  const [firstLaunchOpen, setFirstLaunchOpen] = useState(() => readSavedLanguage() === null);
  const [deviceTimeZone, setDeviceTimeZone] = useState(detectDeviceTimeZone);
  const [timeZonePreference, setTimeZonePreference] = useState<TimeZonePreference>(readTimeZonePreference);
  const [now, setNow] = useState(() => new Date());
  const [claimDeadline] = useState(() => Date.now() + (2 * 60 * 60 + 18 * 60 + 42) * 1000);
  const [dailyDeadline] = useState(() => Date.now() + 8 * 60 * 60 * 1000);
  const [weeklyDeadline] = useState(() => Date.now() + 3 * 24 * 60 * 60 * 1000);
  const noticeTimer = useRef<number | null>(null);
  const t: Translate = (key, values) => translate(language, key, values);
  const timeZone = timeZonePreference.mode === "automatic" ? deviceTimeZone : timeZonePreference.zone;
  const timeZones = useMemo(
    () => listTimeZones(deviceTimeZone, timeZonePreference.zone),
    [deviceTimeZone, timeZonePreference.zone],
  );
  const n = (value: number) => formatNumber(value, language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate(language, "app.title");
  }, [language]);

  useEffect(() => {
    const telegram = window.Telegram?.WebApp;
    const syncViewport = () => {
      const height = telegram?.viewportStableHeight || telegram?.viewportHeight ||
        window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty("--tg-viewport-height", `${Math.ceil(height)}px`);
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("resize", syncViewport);
    telegram?.onEvent?.("viewportChanged", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("resize", syncViewport);
      telegram?.offEvent?.("viewportChanged", syncViewport);
    };
  }, []);

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    const timer = window.setInterval(updateClock, 1000);
    window.addEventListener("focus", updateClock);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateClock);
    };
  }, []);

  useEffect(() => () => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
  }, []);

  const flash = (message: string) => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3000);
  };

  const applyLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    saveLanguage(nextLanguage);
    setFirstLaunchOpen(false);
  };

  const applyTimeZoneMode = (mode: TimeZoneMode) => {
    const nextPreference: TimeZonePreference = {
      mode,
      zone: mode === "automatic"
        ? deviceTimeZone
        : timeZonePreference.mode === "manual" ? timeZonePreference.zone : deviceTimeZone,
    };
    setTimeZonePreference(nextPreference);
    saveTimeZonePreference(nextPreference);
    flash(translate(language, "notice.timezoneSaved"));
  };

  const applyManualTimeZone = (zone: string) => {
    const nextPreference: TimeZonePreference = { mode: "manual", zone };
    setTimeZonePreference(nextPreference);
    saveTimeZonePreference(nextPreference);
    flash(translate(language, "notice.timezoneSaved"));
  };

  const claimPoints = () => {
    const reward = 36 + level * 4;
    setPoints((value) => value + reward);
    setTotalEarned((value) => value + reward);
    setMined(0);
    setMissions((items) => items.map((item) =>
      item.id === "collect" ? { ...item, done: true, progress: item.target } : item,
    ));
    flash(translate(language, "notice.claimed", { amount: formatNumber(reward, language) }));
  };

  const upgrade = () => {
    const cost = 320 + (level - 3) * 170;
    if (points < cost) {
      flash(translate(language, "notice.insufficient", {
        amount: formatNumber(cost - points, language),
      }));
      return;
    }
    setPoints((value) => value - cost);
    setLevel((value) => value + 1);
    setMissions((items) => items.map((item) =>
      item.id === "upgrade" ? { ...item, done: true, progress: item.target } : item,
    ));
    flash(translate(language, "notice.upgraded", {
      level: formatNumber(level + 1, language),
    }));
  };

  const completeMission = (id: MissionId) => {
    const mission = missions.find((item) => item.id === id);
    if (!mission || mission.done) return;
    setMissions((items) => items.map((item) =>
      item.id === id ? { ...item, done: true, progress: item.target } : item,
    ));
    setPoints((value) => value + mission.reward);
    setTotalEarned((value) => value + mission.reward);
    flash(translate(language, "notice.missionClaimed", {
      amount: formatNumber(mission.reward, language),
    }));
  };

  return (
    <main className="game-shell" data-language={language}>
      <header className="topbar">
        <div className="brand-mark" role="img" aria-label="Pearl Empire">
          <Crown size={17} strokeWidth={2} />
          <Gem className="brand-pearl" size={9} />
        </div>
        <div className="brand-copy"><span>PEARL</span><small>EMPIRE</small></div>
        <div className="season-pill"><span className="live-dot" />{t("brand.season")}</div>
        <button
          className="balance-chip"
          onClick={() => setTab("Wallet")}
          data-testid="button-header-wallet"
          aria-label={t("nav.wallet")}
          type="button"
        >
          <Gem size={15} /><span data-testid="text-header-balance">{n(points)}</span><small>EP</small>
        </button>
      </header>

      <section className="screen" key={tab}>
        {tab === "Mine" && (
          <MineScreen
            points={points} level={level} mined={mined} language={language}
            timeZone={timeZone} now={now} claimDeadline={claimDeadline}
            onClaim={claimPoints} onUpgrade={upgrade} onFeedback={flash} t={t} n={n}
          />
        )}
        {tab === "Missions" && (
          <MissionsScreen
            missions={missions} language={language} timeZone={timeZone}
            dailyDeadline={dailyDeadline} weeklyDeadline={weeklyDeadline}
            onComplete={completeMission} t={t} n={n}
          />
        )}
        {tab === "Friends" && <FriendsScreen onFeedback={flash} t={t} language={language} n={n} />}
        {tab === "Wallet" && <WalletScreen points={points} onFeedback={flash} t={t} n={n} />}
        {tab === "Profile" && (
          <ProfileScreen
            level={level} totalEarned={totalEarned} onSettings={() => setSettingsOpen(true)}
            onFeedback={flash} t={t} language={language} n={n}
          />
        )}
      </section>

      <nav className="bottom-nav" aria-label={t("nav.profile")}>
        {navItems.map(({ label, labelKey, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setTab(label)}
            className={`nav-item ${tab === label ? "active" : ""}`}
            data-testid={`tab-${label.toLowerCase()}`}
            aria-current={tab === label ? "page" : undefined}
            type="button"
          >
            <span className="nav-icon"><Icon size={20} strokeWidth={tab === label ? 2.3 : 1.8} /></span>
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </nav>
      {notice && (
        <div className="toast-note" role="status" aria-live="polite" data-testid="status-feedback">
          <Check size={16} />{notice}
        </div>
      )}
      {settingsOpen && (
        <SettingsDialog
          language={language}
          onLanguageChange={(nextLanguage) => {
            applyLanguage(nextLanguage);
            flash(translate(nextLanguage, "notice.languageSaved"));
          }}
          timeZone={timeZone}
          timeZoneMode={timeZonePreference.mode}
          timeZones={timeZones}
          deviceTimeZone={deviceTimeZone}
          now={now}
          onTimeZoneModeChange={applyTimeZoneMode}
          onTimeZoneChange={applyManualTimeZone}
          onClose={() => setSettingsOpen(false)}
          onFeedback={flash}
          t={t}
        />
      )}
      {firstLaunchOpen && (
        <FirstLaunchLanguageDialog language={language} onContinue={applyLanguage} t={t} />
      )}
    </main>
  );
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="heading-sub">{subtitle}</p></div>;
}

function MineScreen({
  points, level, mined, language, timeZone, now, claimDeadline, onClaim, onUpgrade, onFeedback, t, n,
}: {
  points: number; level: number; mined: number; language: Language; timeZone: string; now: Date;
  claimDeadline: number; onClaim: () => void; onUpgrade: () => void;
  onFeedback: (message: string) => void; t: Translate; n: (value: number) => string;
}) {
  const cost = 320 + (level - 3) * 170;
  const progress = Math.min(100, Math.round((mined / 120) * 100));
  return <div className="page-content mine-page">
    <div className="mine-intro">
      <div><p className="eyebrow tagline">{t("brand.tagline")}</p><h1>{t("mine.title")}</h1><div className="level-line"><span className="level-badge"><Crown size={13} />{t("mine.level", { level: n(level) })}</span><span className="rank-copy">{t("mine.realmSample")}</span></div></div>
      <button className="icon-button help-button" aria-label={t("mine.about")} onClick={() => onFeedback(t("notice.help"))} data-testid="button-mining-help" type="button"><CircleHelp size={18} /></button>
    </div>
    <div className="art-card">
      <img src={mineArtwork} alt={t("mine.about")} data-testid="img-mine-art" />
      <div className="art-shade" />
      <div className="art-caption"><span className="mine-status"><i />{t("mine.activeDemo")}</span><span className="art-location">{t("mine.location")}</span></div>
      <div className="art-title">{t("mine.artTitle")}<br /><em>{t("mine.artSubtitle")}</em></div>
      <div className="art-stats"><div><span>{t("mine.extractionRate")}</span><strong>{formatDecimal(2.4 + (level - 3) * 0.6, language)} <small>{t("mine.perHour")}</small></strong></div><div className="stat-separator" /><div><span>{t("mine.veinQuality")}</span><strong className="teal-text">{t("mine.rich")} <Gem size={14} /></strong></div></div>
    </div>
    <div className="treasury-card">
      <div className="treasury-top"><div><p className="eyebrow">{t("mine.unclaimed")}</p><div className="yield-number" data-testid="text-unclaimed-yield">{formatDecimal(mined, language)} <small>EP</small></div></div><div className="coin-seal"><Gem size={22} /></div></div>
      <div className="progress-label"><span>{t("mine.claimReady")}</span><strong><Clock3 size={13} />{formatCountdown(claimDeadline - now.getTime(), language)}</strong></div>
      <div className="progress-track"><span style={{ width: `${Math.max(progress, 24)}%` }} /></div>
      <p className="demo-time-hint">{t("mine.countdownNote")}</p>
      <p className="demo-time-hint">{t("mine.localDeadline", { date: formatLocalDate(new Date(claimDeadline), language, timeZone), time: formatLocalTime(new Date(claimDeadline), language, timeZone) })}</p>
      <button className="button button-gold claim-button" onClick={onClaim} data-testid="button-claim-points" type="button"><ArrowDownToLine size={17} />{t("mine.claimPoints")}<span>{t("mine.claimReward", { amount: n(36 + level * 4) })}</span></button>
    </div>
    <div className="balance-strip">
      <div className="balance-emblem"><Gem size={17} /></div>
      <div className="balance-label"><span>{t("mine.balance")}</span><small>{t("mine.balanceNote")}</small></div>
      <strong data-testid="text-ep-balance">{n(points)} <small>EP</small></strong>
    </div>
    <section className="upgrade-section">
      <div className="section-heading"><div><p className="eyebrow">{t("mine.growEmpire")}</p><h2>{t("mine.nextUpgrade")}</h2></div><span className="next-level">{t("mine.nextLevel", { level: n(level + 1) })}</span></div>
      <div className="upgrade-card"><div className="upgrade-icon"><Hammer size={22} /></div><div className="upgrade-info"><strong>{t("mine.upgradeName")}</strong><span>{t("mine.upgradeDescription")}</span></div><div className="upgrade-cost"><Gem size={13} /><strong>{n(cost)}</strong><small>EP</small></div></div>
      <button className="button button-outline upgrade-button" onClick={onUpgrade} data-testid="button-upgrade-mine" type="button">{t("mine.upgradeButton")} <ArrowRight size={16} /></button>
    </section>
    <div className="mine-footnote"><ShieldCheck size={14} />{t("mine.keepsWorking")}</div>
  </div>;
}

function MissionsScreen({
  missions, language, timeZone, dailyDeadline, weeklyDeadline, onComplete, t, n,
}: {
  missions: Mission[]; language: Language; timeZone: string; dailyDeadline: number; weeklyDeadline: number;
  onComplete: (id: MissionId) => void; t: Translate; n: (value: number) => string;
}) {
  const daily = missions.filter((mission) => mission.type === "Daily");
  const weekly = missions.filter((mission) => mission.type === "Weekly");
  const special = missions.filter((mission) => mission.type === "Special");
  const dailyDone = daily.filter((mission) => mission.done).length;
  const progress = daily.length ? (dailyDone / daily.length) * 100 : 0;
  const deadline = (timestamp: number) => ({
    date: formatLocalDate(new Date(timestamp), language, timeZone),
    time: formatLocalTime(new Date(timestamp), language, timeZone),
  });
  const loginMission = missions.find((mission) => mission.id === "login");
  return <div className="page-content">
    <PageHeading eyebrow={t("missions.eyebrow")} title={t("missions.title")} subtitle={t("missions.subtitle")} />
    <div className="streak-card"><div className="streak-icon"><Sparkles size={19} /></div><div className="streak-text"><strong>{t("missions.loginTitle")}</strong><span>{t("missions.streak", { day: n(4) })}</span></div><div className="streak-reward"><strong>+{n(25)}</strong><small>EP</small></div><button className="streak-claim" onClick={() => onComplete("login")} disabled={loginMission?.done} data-testid="button-daily-login" type="button">{loginMission?.done ? <Check size={17} /> : t("missions.claim")}</button></div>
    <div className="mission-progress"><div><span>{t("missions.today")}</span><strong>{pluralMessage(language, "missions", dailyDone)} · {t("missions.progress", { current: n(dailyDone), total: n(daily.length) })}</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>
    <div className="section-heading mission-section-heading"><div><p className="eyebrow">{t("missions.dailyDeadline", deadline(dailyDeadline))}</p><h2>{t("missions.dailyTitle")}</h2></div><span className="count-tag">{n(dailyDone)}/{n(daily.length)}</span></div>
    <div className="mission-list">{daily.filter((mission) => mission.id !== "login").map((mission) => <MissionRow key={mission.id} mission={mission} onComplete={onComplete} t={t} n={n} language={language} />)}</div>
    <div className="section-heading weekly-heading"><div><p className="eyebrow">{t("missions.weeklyDeadline", deadline(weeklyDeadline))}</p><h2>{t("missions.weeklyTitle")}</h2></div><span className="weekly-mark"><Award size={15} />{t("missions.weeklyTitle")}</span></div>
    <div className="mission-list">{weekly.map((mission) => <MissionRow key={mission.id} mission={mission} onComplete={onComplete} t={t} n={n} language={language} />)}</div>
    <div className="section-heading weekly-heading"><div><p className="eyebrow">{t("missions.specialTag")}</p><h2>{t("missions.specialTitle")}</h2></div><span className="weekly-mark"><Sparkles size={14} />{t("missions.specialTag")}</span></div>
    <div className="mission-list">{special.map((mission) => <MissionRow key={mission.id} mission={mission} onComplete={onComplete} t={t} n={n} language={language} />)}</div>
    <div className="mission-note"><Gift size={15} /><span>{t("missions.sampleNote")}</span></div>
  </div>;
}

function MissionRow({
  mission, language, onComplete, t, n,
}: {
  mission: Mission; language: Language; onComplete: (id: MissionId) => void; t: Translate; n: (value: number) => string;
}) {
  const titleKey = `mission.${mission.id}.title` as TranslationKey;
  const detailKey = `mission.${mission.id}.detail` as TranslationKey;
  const icon = mission.done ? <Check size={17} /> : mission.type === "Weekly" ? <Trophy size={17} /> : mission.type === "Special" ? <Sparkles size={17} /> : <Pickaxe size={17} />;
  const progressPercent = mission.done ? 100 : Math.min(100, (mission.progress / mission.target) * 100);
  const progressLabel = `${pluralMessage(language, "missions", mission.progress)} · ${t("missions.progress", { current: n(mission.progress), total: n(mission.target) })}`;
  return <article className={`mission-row ${mission.done ? "mission-done" : ""}`} data-testid={`card-mission-${mission.id}`}>
    <div className="mission-symbol">{icon}</div>
    <div className="mission-copy"><strong>{t(titleKey)}</strong><span>{t(detailKey)}</span><div className="mission-mini-track" role="progressbar" aria-label={progressLabel} aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progressPercent}%` }} /></div></div>
    <div className="mission-action"><span className="reward">+{n(mission.reward)} <small>EP</small></span><button onClick={() => onComplete(mission.id)} disabled={mission.done} data-testid={`button-mission-${mission.id}`} type="button">{mission.done ? t("missions.done") : t("missions.claim")}</button></div>
  </article>;
}

function FriendsScreen({
  onFeedback, t, language, n,
}: {
  onFeedback: (message: string) => void; t: Translate; language: Language; n: (value: number) => string;
}) {
  const referralLink = "https://t.me/pearl_empire_demo?start=PEARL-DEMO-7K4P";
  const invite = async () => {
    if (!navigator.clipboard?.writeText) {
      onFeedback(t("friends.clipboardUnavailable"));
      return;
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      onFeedback(t("friends.copySuccess"));
    } catch {
      onFeedback(t("friends.copyError"));
    }
  };
  return <div className="page-content">
    <PageHeading eyebrow={t("friends.eyebrow")} title={t("friends.title")} subtitle={t("friends.subtitle")} />
    <div className="friends-banner"><div className="banner-orbit orbit-one" /><div className="banner-orbit orbit-two" /><div className="banner-gem"><Users size={30} /></div><div className="banner-label">{t("friends.bannerEyebrow")}<br /><strong>{t("friends.bannerTitle")}</strong></div><div className="banner-people"><span>V</span><span>M</span><span>+</span></div></div>
    <div className="invite-card"><p className="eyebrow">{t("friends.referralLabel")}</p><div className="invite-code"><span>{t("friends.code")}</span><span className="placeholder-tag">{t("friends.sampleOnly")}</span></div><p className="muted-copy">{t("friends.linkHint")}</p><button className="button button-gold invite-button" onClick={invite} data-testid="button-invite-friends" type="button"><Users size={17} />{t("friends.copyLink")}<ArrowRight size={16} /></button></div>
    <div className="section-heading friend-progress-heading"><div><p className="eyebrow">{t("friends.crew")}</p><h2>{t("friends.stats")}</h2></div><span className="count-tag">{n(0)} / {n(5)}</span></div>
    <div className="referral-progress"><div className="referral-progress-top"><div><strong>{t("friends.crew")}</strong><span>{t("friends.sampleProgress")}</span></div><strong>{pluralMessage(language, "friends", 0)}</strong></div><div className="progress-track"><span style={{ width: "0%" }} /></div><div className="milestones"><span>{n(1)}</span><span>{n(3)}</span><span>{n(5)}</span></div></div>
    <div className="reward-card"><div className="reward-glyph"><Gift size={19} /></div><div><strong>{t("friends.referralRewards")}</strong><p>{t("friends.rewardDetail")}</p></div><ChevronRight size={17} /></div>
    <div className="fine-print">{t("friends.disclaimer")}</div>
  </div>;
}

function WalletScreen({
  points, onFeedback, t, n,
}: {
  points: number; onFeedback: (message: string) => void; t: Translate; n: (value: number) => string;
}) {
  return <div className="page-content">
    <PageHeading eyebrow={t("wallet.eyebrow")} title={t("wallet.title")} subtitle={t("wallet.subtitle")} />
    <div className="wallet-hero"><div className="wallet-hero-top"><span>{t("wallet.sampleBalance")}</span><div className="wallet-token"><Gem size={14} /> EP</div></div><strong data-testid="text-wallet-ep">{n(points)}<small> EP</small></strong><span className="wallet-caption">{t("wallet.epNote")}</span><div className="wallet-bottom-rule"><span /><span /><span /></div></div>
    <button className="button button-outline connect-button" onClick={() => onFeedback(t("wallet.disabled"))} data-testid="button-connect-wallet" type="button"><Wallet size={17} />{t("wallet.connect")}<span className="demo-chip">{t("wallet.demo")}</span></button>
    <p className="wallet-demo-note"><ShieldCheck size={14} />{t("wallet.disabled")}</p>
    <section className="asset-section"><div className="section-heading"><div><p className="eyebrow">{t("wallet.assets")}</p><h2>{t("wallet.allocations")}</h2></div></div>
      <div className="asset-row"><div className="asset-symbol ep-symbol"><Gem size={18} /></div><div className="asset-copy"><strong>{t("wallet.points")}</strong><span>{t("wallet.inGame")}</span></div><div className="asset-amount"><strong>{n(points)}</strong><span>EP</span></div></div>
      <div className="asset-row"><div className="asset-symbol mx-symbol">MX</div><div className="asset-copy"><strong>{t("wallet.pendingMx")}</strong><span className="not-issued">{t("wallet.illustrative")}</span></div><div className="asset-amount pending-amount"><strong>—</strong><span>MX</span></div></div>
      <div className="asset-row"><div className="asset-symbol chain-symbol"><Gem size={18} /></div><div className="asset-copy"><strong>{t("wallet.onChainMx")}</strong><span>{t("wallet.unavailable")}</span></div><div className="asset-amount pending-amount"><strong>—</strong><span>MX</span></div></div>
    </section>
    <div className="wallet-disclaimer"><CircleHelp size={16} /><p>{t("wallet.disclaimer")}</p></div>
  </div>;
}

function ProfileScreen({
  level, totalEarned, onSettings, onFeedback, t, language, n,
}: {
  level: number; totalEarned: number; onSettings: () => void; onFeedback: (message: string) => void;
  t: Translate; language: Language; n: (value: number) => string;
}) {
  return <div className="page-content">
    <PageHeading eyebrow={t("profile.eyebrow")} title={t("profile.title")} subtitle={t("profile.subtitle")} />
    <div className="profile-card"><div className="profile-banner" /><div className="profile-content"><div className="avatar" aria-label={t("profile.username")}>V<span className="avatar-status" /></div><div className="profile-name"><strong>{t("profile.username")}</strong><span>{t("profile.role")}</span></div><span className="profile-level"><Crown size={13} />{t("mine.level", { level: n(level) })}</span><div className="profile-divider" /><div className="profile-stat"><span>{t("profile.empireRank")}</span><strong>{t("profile.rankValue")}</strong></div><div className="profile-stat"><span>{t("profile.miningStreak")}</span><strong>{pluralMessage(language, "days", 4)}</strong></div><div className="profile-stat"><span>{t("profile.joined")}</span><strong>{t("profile.season")}</strong></div></div></div>
    <div className="profile-total"><span>{t("profile.totalEarned")}</span><strong data-testid="text-profile-earned">{n(totalEarned)} EP</strong></div>
    <div className="section-heading achievements-heading"><div><p className="eyebrow">{t("profile.milestones")}</p><h2>{t("profile.achievements")}</h2></div><span className="count-tag">{n(2)} / {n(8)}</span></div>
    <div className="achievement-grid">
      <Achievement icon={<Pickaxe size={19} />} title={t("profile.firstStrike")} detail={t("profile.firstStrikeDetail")} unlocked />
      <Achievement icon={<Gem size={19} />} title={t("profile.stoneSpark")} detail={t("profile.stoneSparkDetail")} unlocked />
      <Achievement icon={<Crown size={19} />} title={t("profile.deepDelver")} detail={t("profile.deepDelverDetail")} />
      <Achievement icon={<Trophy size={19} />} title={t("profile.dayKeeper")} detail={t("profile.dayKeeperDetail")} />
    </div>
    <div className="section-heading settings-heading"><div><p className="eyebrow">{t("profile.preferences")}</p><h2>{t("profile.accountSettings")}</h2></div></div>
    <button className="settings-row" onClick={onSettings} data-testid="button-account-settings" type="button"><span className="settings-icon"><Settings size={17} /></span><span><strong>{t("profile.gamePreferences")}</strong><small>{t("profile.settingsDescription")}</small></span><ChevronRight size={17} /></button>
    <div className="help-card"><div><CircleHelp size={17} /><strong>{t("profile.helpTitle")}</strong></div><p>{t("profile.helpDescription")}</p><button onClick={() => onFeedback(t("profile.helpFeedback"))} data-testid="button-profile-help" type="button">{t("profile.helpButton")}<ChevronRight size={15} /></button></div>
    <div className="profile-footer">{t("profile.footer")}</div>
  </div>;
}

function Achievement({
  icon, title, detail, unlocked = false,
}: {
  icon: ReactNode; title: string; detail: string; unlocked?: boolean;
}) {
  return <div className={`achievement ${unlocked ? "unlocked" : "locked"}`}><div className="achievement-icon">{icon}</div><strong>{title}</strong><span>{detail}</span>{unlocked && <i><Check size={11} /></i>}</div>;
}

function SettingsDialog({
  language, onLanguageChange, timeZone, timeZoneMode, timeZones, deviceTimeZone, now,
  onTimeZoneModeChange, onTimeZoneChange, onClose, onFeedback, t,
}: {
  language: Language; onLanguageChange: (language: Language) => void; timeZone: string;
  timeZoneMode: TimeZoneMode; timeZones: string[]; deviceTimeZone: string; now: Date;
  onTimeZoneModeChange: (mode: TimeZoneMode) => void; onTimeZoneChange: (zone: string) => void;
  onClose: () => void; onFeedback: (message: string) => void; t: Translate;
}) {
  const [sound, setSound] = useState(true);
  const [reminders, setReminders] = useState(false);
  const date = formatLocalDate(now, language, timeZone);
  const time = formatLocalTime(now, language, timeZone);
  const offset = formatUtcOffset(now, timeZone);
  return <div className="modal-backdrop" onClick={onClose}><section className="settings-modal" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="settings-title" data-testid="dialog-settings">
    <div className="modal-head"><div><p className="eyebrow">{t("settings.account")}</p><h2 id="settings-title">{t("settings.title")}</h2></div><button className="icon-button" onClick={onClose} aria-label={t("common.close")} data-testid="button-close-settings" type="button"><X size={18} /></button></div>
    <div className="settings-section"><div className="settings-section-title"><strong>{t("settings.language")}</strong><small>{t("settings.languageDescription")}</small></div><select className="setting-select" value={language} aria-label={t("settings.chooseLanguage")} onChange={(event) => onLanguageChange(event.currentTarget.value as Language)} data-testid="select-language">{languageOptions.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}</select></div>
    <section className="regional-settings" aria-labelledby="regional-title">
      <div className="settings-section-title"><strong id="regional-title">{t("settings.regional")}</strong><small>{t("settings.regionalDescription")}</small></div>
      <div className="timezone-mode"><span>{t("settings.timezoneMode")}</span><div className="timezone-mode-buttons">{(["automatic", "manual"] as const).map((mode) => <button key={mode} className={timeZoneMode === mode ? "selected" : ""} aria-pressed={timeZoneMode === mode} onClick={() => onTimeZoneModeChange(mode)} data-testid={`button-timezone-${mode}`} type="button">{t(`common.${mode}` as TranslationKey)}</button>)}</div></div>
      <div className="timezone-detail"><span>{t("settings.detectedTimezone")}</span><strong>{deviceTimeZone}</strong><small>{t("settings.deviceTimezone")}</small></div>
      <label className="timezone-picker"><span>{t("settings.chooseTimezone")}</span><select className="setting-select" value={timeZone} disabled={timeZoneMode === "automatic"} onChange={(event) => onTimeZoneChange(event.currentTarget.value)} data-testid="select-timezone">{timeZones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select></label>
      <div className="regional-readout">
        <div><span>{t("settings.currentDate")}</span><strong>{date}</strong></div>
        <div><span>{t("settings.currentTime")}</span><strong>{time}</strong></div>
        <div><span>{t("settings.utcOffset")}</span><strong>{offset}</strong></div>
      </div>
      <p className="regional-note">{t("settings.noIp")}</p>
      <p className="regional-note">{t("settings.regionalNote")}</p>
      <p className="regional-note demo-time-note">{t("settings.demoTimeNotice")}</p>
    </section>
    <div className="preference-row"><span><strong>{t("settings.sound")}</strong><small>{t("settings.soundDescription")}</small></span><button className={`toggle ${sound ? "on" : ""}`} onClick={() => setSound(!sound)} aria-label={t("settings.sound")} aria-pressed={sound} data-testid="toggle-game-sound" type="button"><i /></button></div>
    <div className="preference-row"><span><strong>{t("settings.reminders")}</strong><small>{t("settings.remindersDescription")}</small></span><button className={`toggle ${reminders ? "on" : ""}`} onClick={() => setReminders(!reminders)} aria-label={t("settings.reminders")} aria-pressed={reminders} data-testid="toggle-reminders" type="button"><i /></button></div>
    <button className="button button-gold modal-done" onClick={() => { onClose(); onFeedback(t("notice.preferencesSaved")); }} data-testid="button-save-settings" type="button">{t("common.save")} <Check size={16} /></button>
  </section></div>;
}

function FirstLaunchLanguageDialog({
  language, onContinue, t,
}: {
  language: Language; onContinue: (language: Language) => void; t: Translate;
}) {
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  return <div className="modal-backdrop first-launch-backdrop"><section className="settings-modal first-launch-modal" aria-modal="true" role="dialog" aria-labelledby="first-language-title" data-testid="dialog-first-language">
    <div className="modal-head"><div><p className="eyebrow">{t("settings.chooseLanguage")}</p><h2 id="first-language-title">{t("settings.firstTitle")}</h2><p className="heading-sub">{t("settings.firstDescription")}</p></div></div>
    <div className="language-options">{languageOptions.map((option) => <button key={option.code} className={`language-option ${selectedLanguage === option.code ? "selected" : ""}`} onClick={() => setSelectedLanguage(option.code)} aria-pressed={selectedLanguage === option.code} data-testid={`button-language-${option.code}`} type="button"><span>{option.name}</span>{selectedLanguage === option.code && <Check size={16} />}</button>)}</div>
    <button className="button button-gold modal-done" onClick={() => onContinue(selectedLanguage)} data-testid="button-language-continue" type="button">{t("settings.continue")} <ArrowRight size={16} /></button>
  </section></div>;
}

export default App;

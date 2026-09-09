import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  Users,
  Shield,
  Swords,
  Wind,
  Leaf,
  Sparkles,
  LockKeyhole,
  Menu,
  X,
  LogOut,
  ScrollText,
  CircleCheck,
  Clock3,
  Send,
  Search,
  LayoutDashboard,
  FileText,
  History,
  Mail,
  AlertCircle,
  LoaderCircle,
  Compass,
  Smartphone,
  Crown,
} from "lucide-react";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "./styles.css";
const Context = createContext();
const statuses = {
  pending: "En cours d’examen",
  accepted: "Acceptée",
  waitlisted: "Liste d’attente",
  rejected: "Non retenue",
};
async function api(path, options = {}) {
  const response = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Le service est momentanément indisponible.");
  return data;
}
const post = (path, data = {}) =>
  api(path, { method: "POST", body: JSON.stringify(data) });
function useApp() {
  return useContext(Context);
}
function Button({ children, to, secondary = false, className = "", ...props }) {
  const cls = `button ${secondary ? "secondary" : ""} ${className}`;
  return to ? (
    <Link className={cls} to={to} {...props}>
      {children}
    </Link>
  ) : (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
function Brand() {
  return (
    <Link to="/" className="brand" aria-label="IDREM ZENKAI, accueil">
      <img src="/favicon.svg" alt="" />
      <span>
        IDREM <b>ZENKAI</b>
        <small>LA VOLONTÉ D’UNE NOUVELLE ÈRE</small>
      </span>
    </Link>
  );
}
function Label({ children }) {
  return (
    <div className="eyebrow">
      <span />
      {children}
    </div>
  );
}
function ErrorBox({ children }) {
  return children ? (
    <div className="alert error" role="alert">
      <AlertCircle size={18} />
      <span>{children}</span>
    </div>
  ) : null;
}
function Loading() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" />
      Chargement…
    </div>
  );
}
function Header() {
  const { account, info, refresh } = useApp();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location]);
  return (
    <>
      <div className="announcement">
        <span className="live-dot" /> RECRUTEMENT DE LA PREMIÈRE PROMOTION{" "}
        <span className="announcement-divider">/</span>
        <span>20 places. Une histoire à écrire.</span>
        <Link to="/candidature">
          Rejoindre l’aventure <ArrowUpRight size={13} />
        </Link>
      </div>
      <header>
        <div className="nav-wrap">
          <Brand />
          <nav
            className={open ? "open" : ""}
            aria-label="Navigation principale"
          >
            <NavLink to="/" end>
              Accueil
            </NavLink>
            <Link to="/#univers">L’univers</Link>
            <Link to="/#clans">Les clans</Link>
            <NavLink to="/candidature">Candidature</NavLink>
            <Link to="/#faq">FAQ</Link>
          </nav>
          <div className="nav-actions">
            {account.user ? (
              <>
                <Link
                  className="account-link"
                  to={account.user.role === "admin" ? "/admin" : "/espace"}
                >
                  <span className="avatar-small">
                    {account.user.name.slice(0, 1)}
                  </span>
                  <span>Mon espace</span>
                </Link>
                <button
                  className="icon-button logout"
                  title="Se déconnecter"
                  onClick={async () => {
                    await post("/auth/logout");
                    await refresh();
                  }}
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <Button to="/connexion" secondary className="login-button">
                Connexion <ArrowUpRight size={15} />
              </Button>
            )}
            <button
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              className="icon-button menu-toggle"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
function Footer() {
  return (
    <footer>
      <div className="footer-main">
        <Brand />
        <p>
          Un monde ninja. Vingt destins.
          <br />
          La prochaine histoire est la tienne.
        </p>
        <div>
          <Link to="/regles">Règles du serveur</Link>
          <Link to="/confidentialite">Confidentialité</Link>
          <Link to="/admin">
            Administration <LockKeyhole size={12} />
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} IDREM ZENKAI · Projet communautaire
          indépendant.
        </span>
        <span>
          Non affilié aux ayants droit de Naruto. Jeu en développement.
        </span>
      </div>
    </footer>
  );
}
const clans = [
  {
    name: "Uchiwa",
    type: "Dōjutsu",
    rare: true,
    symbol: "写",
    icon: Eye,
    text: "Le regard qui change le destin.",
  },
  {
    name: "Uzumaki",
    type: "Vitalité & sceaux",
    rare: true,
    symbol: "渦",
    icon: Wind,
    text: "Une volonté qui ne s’éteint jamais.",
  },
  {
    name: "Senju",
    type: "Héritage shinobi",
    rare: true,
    symbol: "森",
    icon: Leaf,
    text: "Les racines d’une nouvelle ère.",
  },
  {
    name: "Hyūga",
    type: "Byakugan",
    symbol: "眼",
    icon: Eye,
    text: "Voir au-delà des apparences.",
  },
  { name: "Akimichi", type: "Puissance", symbol: "力", icon: Shield },
  { name: "Yamanaka", type: "Esprit", symbol: "心", icon: Sparkles },
  { name: "Aburame", type: "Insectes", symbol: "虫", icon: Leaf },
  { name: "Inuzuka", type: "Compagnons", symbol: "牙", icon: Shield },
  {
    name: "Fushiguro",
    type: "Ombres · adaptation",
    symbol: "影",
    icon: Compass,
  },
  { name: "Itadori", type: "Corps · adaptation", symbol: "拳", icon: Swords },
  { name: "Kurosaki", type: "Sabre · adaptation", symbol: "刀", icon: Swords },
  { name: "Shunsui", type: "Sabre · adaptation", symbol: "風", icon: Wind },
  { name: "Yeager", type: "Héritage · adaptation", symbol: "進", icon: Flame },
  { name: "Ackerman", type: "Combat · adaptation", symbol: "戦", icon: Swords },
];
function Home() {
  const { info } = useApp();
  const [filter, setFilter] = useState("featured");
  const visible =
    filter === "all"
      ? clans
      : filter === "rare"
        ? clans.filter((c) => c.rare)
        : clans.slice(0, 4);
  return (
    <>
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-copy">
          <Label>NARUTO SHIPPUDEN · RP MULTIJOUEUR PRIVÉ</Label>
          <h1>
            TON HISTOIRE.
            <br />
            TES CHOIX.
            <br />
            <span>TA VOIE NINJA.</span>
          </h1>
          <p>
            Tu connais leur histoire.
            <br className="desktop-break" /> Il est temps d’écrire la tienne.
          </p>
          <div className="hero-description">
            Rejoins 20 joueurs dans un univers où chaque lien,
            <br className="desktop-break" /> chaque mission et chaque décision
            comptent.
          </div>
          <div className="hero-buttons">
            <Button to="/candidature">
              Déposer ma candidature <ArrowUpRight size={19} />
            </Button>
            <a className="text-link" href="#univers">
              Découvrir l’univers <ArrowRight size={16} />
            </a>
          </div>
          <div className="hero-footnote">
            <Shield size={14} />
            <span>Accès gratuit</span>
            <i />
            Sélection sur candidature
            <i />
            Android
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/idrem-zenkai.png"
            alt="Illustration IDREM ZENKAI : Naruto et Sasuke sous une lune rouge"
            fetchPriority="high"
          />
          <div className="art-shade" />
          <div className="art-top">
            <span className="outline-tag">
              <span className="live-dot" /> UN NOUVEAU CHAPITRE
            </span>
            <span className="vertical-text">KONOHA · TERRE DE FEU</span>
          </div>
          <div className="art-bottom">
            <span>01 / LE COMMENCEMENT</span>
            <strong>
              LA FEUILLE.
              <br />
              DE NOUVELLES RACINES.
            </strong>
            <span>KONOHA · DÉBUT DE SHIPPUDEN</span>
          </div>
          <div className="art-corner" />
        </div>
        <div className="hero-side-label">EST. 2026 — ÉCRIS TA LÉGENDE</div>
      </section>
      <div className="stats-bar">
        <div>
          <Users />
          <strong>
            20<span>JOUEURS SÉLECTIONNÉS</span>
          </strong>
          <span className="stat-note">Une communauté, pas une foule.</span>
        </div>
        <div>
          <Compass />
          <strong>
            01<span>MONDE PARTAGÉ</span>
          </strong>
          <span className="stat-note">Des destins qui se croisent.</span>
        </div>
        <div>
          <Flame />
          <strong>
            14<span>CLANS À DÉCOUVRIR</span>
          </strong>
          <span className="stat-note">Un héritage. Ta propre voie.</span>
        </div>
      </div>
      <section className="section universe" id="univers">
        <div className="section-heading">
          <div>
            <Label>BIENVENUE DANS IDREM ZENKAI</Label>
            <h2>
              Le même monde.
              <br />
              <span>Une autre histoire.</span>
            </h2>
          </div>
          <p>
            Naruto vient de rentrer à Konoha. L’Akatsuki agit dans l’ombre. Et
            toi, jeune genin, tu t’apprêtes à laisser ta marque.
            <br />
            <b>Rien n’est écrit d’avance.</b>
          </p>
        </div>
        <div className="feature-grid">
          <article>
            <span className="feature-number">01</span>
            <Swords className="feature-icon" />
            <h3>Vis ta voie ninja</h3>
            <p>
              Missions, entraînements et examens. Construis ton personnage et
              progresse de genin à jōnin.
            </p>
            <span className="feature-bottom">
              PROGRESSION & COMBAT <ArrowUpRight size={17} />
            </span>
          </article>
          <article>
            <span className="feature-number">02</span>
            <Users className="feature-icon" />
            <h3>Ne pars pas seul</h3>
            <p>
              Forme ton équipe, rencontre ton sensei et accomplis des quêtes
              ensemble. Chaque ninja a sa place.
            </p>
            <span className="feature-bottom">
              COOPÉRATION & RP <ArrowUpRight size={17} />
            </span>
          </article>
          <article>
            <span className="feature-number">03</span>
            <ScrollText className="feature-icon" />
            <h3>Change le récit</h3>
            <p>
              Nouvelles alliances, rivalités et événements inédits. Vos
              décisions feront évoluer le monde partagé.
            </p>
            <span className="feature-bottom">
              UN UNIVERS ALTERNATIF <ArrowUpRight size={17} />
            </span>
          </article>
        </div>
        <div className="development-note">
          <Smartphone size={16} />
          <span>
            Le jeu Android est en développement. Le site accueille la première
            phase de candidatures.
          </span>
          <span className="small-tag">PHASE 01</span>
        </div>
      </section>
      <section className="clan-section section" id="clans">
        <div className="section-heading">
          <div>
            <Label>L’HÉRITAGE NE SE CHOISIT PAS</Label>
            <h2>
              Un clan. <span>Ton destin.</span>
            </h2>
          </div>
          <p>
            Après ton admission, un tirage unique révèle ton clan et ton
            affinité. Ce que tu en feras ne dépend que de toi.
          </p>
        </div>
        <div className="clan-toolbar">
          <div className="tabs" aria-label="Filtrer les clans">
            {[
              ["featured", "À la une"],
              ["rare", "Clans rares"],
              ["all", "Tous les clans · 14"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={filter === key ? "active" : ""}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <span>
            <LockKeyhole size={13} /> Un seul tirage. Aucune relance.
          </span>
        </div>
        <div className="clan-grid">
          {visible.map(({ name, type, rare, symbol, icon: Icon, text }) => (
            <article className={`clan-card ${rare ? "rare" : ""}`} key={name}>
              <div className="clan-card-top">
                <Icon size={24} />
                {rare && <span className="rare-tag">RARE · 8 %*</span>}
              </div>
              <span className="clan-symbol" aria-hidden="true">
                {name.slice(0, 2).toUpperCase()}
              </span>
              <div className="clan-card-bottom">
                <small>{type}</small>
                <h3>{name}</h3>
                {text && <p>{text}</p>}
              </div>
            </article>
          ))}
        </div>
        <p className="fine-print">
          * Probabilités initiales. Uchiwa, Uzumaki et Senju : 3 joueurs maximum
          par clan. Les capacités des clans adaptés restent à définir.
        </p>
      </section>
      <section className="section join-section" id="rejoindre">
        <div className="join-banner">
          <div>
            <Label>UNE PETITE COMMUNAUTÉ. UNE GRANDE AVENTURE.</Label>
            <h2>
              20 places.
              <br />
              <span>Et si l’une était la tienne ?</span>
            </h2>
            <p>
              Pas besoin d’être un expert. De la motivation, du respect
              <br className="desktop-break" /> et l’envie de construire une
              histoire ensemble.
            </p>
            <Button to="/candidature">
              Tenter l’aventure <ArrowUpRight size={18} />
            </Button>
            <div className="admissions">
              <span className="live-dot" />
              {info.accepted} / 20 joueurs admis · Sélection manuelle
            </div>
          </div>
          <ol className="join-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Crée ton compte</h3>
                <p>Un pseudo, un e-mail et ton premier pas.</p>
              </div>
              <ArrowUpRight />
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Raconte-nous ton histoire</h3>
                <p>Ta motivation, ton personnage et 10 questions Naruto.</p>
              </div>
              <ArrowUpRight />
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Reçois ta réponse</h3>
                <p>Suis la décision dans ton espace personnel.</p>
              </div>
              <ArrowUpRight />
            </li>
          </ol>
        </div>
      </section>
      <section className="section faq-section" id="faq">
        <div>
          <Label>AVANT DE FRANCHIR LES PORTES</Label>
          <h2>
            Une question ?<br />
            <span>On t’éclaire.</span>
          </h2>
          <p>
            Les premières réponses pour
            <br />
            préparer ton arrivée à Konoha.
          </p>
        </div>
        <div className="faq-list">
          {[
            [
              "Le jeu est-il gratuit ?",
              "Oui. L’accès est gratuit, sans achat de place ni avantage payant. L’hébergement permanent reste un objectif à valider selon les ressources gratuites disponibles.",
            ],
            [
              "Est-ce que je peux déjà jouer sur Android ?",
              "Pas encore. Cette première version concerne le site et les candidatures. Aucune APK n’est disponible pour le moment ; les joueurs admis retrouveront les instructions ici lorsque les tests Android commenceront.",
            ],
            [
              "Comment sont choisis les 20 joueurs ?",
              "Le propriétaire examine personnellement les motivations, le projet de personnage et les réponses au quiz. Il peut accepter, refuser ou placer une candidature en liste d’attente. Le score ne décide pas automatiquement de ton admission.",
            ],
            [
              "Puis-je choisir mon clan ou obtenir le Mokuton ?",
              "Ton clan est tiré une seule fois après acceptation. Trois joueurs de la cohorte complète de vingt recevront le potentiel Mokuton, indépendamment de leur clan. Ce potentiel devra ensuite être éveillé dans le jeu.",
            ],
            [
              "Faut-il connaître tout Naruto pour candidater ?",
              "Non. Le quiz comporte 10 questions intermédiaires. Nous cherchons aussi de la motivation, du respect et l’envie de jouer en équipe.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <ChevronDown size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
function PageIntro({ label, title, description }) {
  return (
    <div className="page-intro">
      <Label>{label}</Label>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
function PasswordField({
  label = "Mot de passe",
  name = "password",
  minLength = 10,
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="field">
      {label}
      <div className="password-wrap">
        <input
          name={name}
          type={show ? "text" : "password"}
          minLength={minLength}
          maxLength={128}
          autoComplete={
            name === "password" ? "current-password" : "new-password"
          }
          required
          placeholder="10 caractères minimum"
        />
        <button
          type="button"
          className="icon-button"
          aria-label={
            show ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}
function AuthPage({ initial = "login" }) {
  const [mode, setMode] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { refresh, account } = useApp();
  const nav = useNavigate();
  const location = useLocation();
  const redirect = location.state?.from || "/espace";
  useEffect(() => {
    setMode(initial);
    setError("");
    setMessage("");
  }, [initial]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (mode === "forgot") {
        const result = await post("/auth/forgot", data);
        setMessage(result.message);
      } else {
        const result = await post(
          mode === "register" ? "/auth/register" : "/auth/login",
          {
            ...data,
            password: mode === "register" ? data.newPassword : data.password,
          },
        );
        await refresh();
        nav(result.user.role === "admin" ? "/admin" : redirect);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-layout">
      <aside className="auth-art">
        <img src="/idrem-zenkai.png" alt="L’univers IDREM ZENKAI" />
        <div>
          <Label>TA LÉGENDE COMMENCE ICI</Label>
          <h2>
            Chaque ninja
            <br />a un début.
            <br />
            <span>Voici le tien.</span>
          </h2>
          <p>20 joueurs. Un seul monde. Votre histoire.</p>
        </div>
      </aside>
      <section className="auth-panel">
        <Link className="back-link" to="/">
          <ArrowLeft size={15} /> Retour à l’accueil
        </Link>
        <div className="auth-inner">
          <Label>LES PORTES DE KONOHA</Label>
          <h1>
            {mode === "login"
              ? "Bon retour, shinobi."
              : mode === "register"
                ? "Fais le premier pas."
                : "Retrouve ton accès."}
          </h1>
          <p>
            {mode === "login"
              ? "Connecte-toi pour retrouver ton espace personnel."
              : mode === "register"
                ? "Crée ton compte, puis raconte-nous ton histoire."
                : "Indique l’adresse e-mail associée à ton compte."}
          </p>
          {mode !== "forgot" && (
            <div className="auth-tabs">
              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Connexion
              </button>
              <button
                className={mode === "register" ? "active" : ""}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Créer un compte
              </button>
            </div>
          )}
          <ErrorBox>{error}</ErrorBox>
          {message && (
            <div className="alert success">
              <Check size={18} />
              {message}
            </div>
          )}
          <form onSubmit={submit} key={mode}>
            {mode === "register" && (
              <label className="field">
                Pseudo
                <input
                  name="name"
                  required
                  minLength={3}
                  maxLength={30}
                  placeholder="Ton nom dans la communauté"
                  autoComplete="nickname"
                />
              </label>
            )}
            <label className="field">
              Adresse e-mail
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                placeholder="toi@exemple.com"
                autoComplete="email"
              />
            </label>
            {mode !== "forgot" && (
              <PasswordField
                name={mode === "register" ? "newPassword" : "password"}
                minLength={mode === "login" ? 1 : 10}
              />
            )}{" "}
            {mode === "login" && (
              <button
                type="button"
                className="forgot-link"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                }}
              >
                Mot de passe oublié ?
              </button>
            )}
            {mode === "register" && (
              <label className="checkbox-label">
                <input type="checkbox" required />{" "}
                <span>
                  J’ai lu les <Link to="/regles">règles</Link> et la{" "}
                  <Link to="/confidentialite">
                    politique de confidentialité
                  </Link>
                  .
                </span>
              </label>
            )}
            <Button className="full-width" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <>
                  {mode === "login"
                    ? "Se connecter"
                    : mode === "register"
                      ? "Créer mon compte"
                      : "Envoyer un lien"}
                  <ArrowRight size={18} />
                </>
              )}
            </Button>
          </form>
          {mode === "forgot" && (
            <button
              className="text-link"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
            >
              Retour à la connexion
            </button>
          )}
          <div className="auth-note">
            <LockKeyhole size={14} />
            Tes informations restent privées. Ton mot de passe est protégé par
            un hachage sécurisé.
          </div>
        </div>
      </section>
    </main>
  );
}
function Application() {
  const { account, loading, refresh } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [quiz, setQuiz] = useState([]);
  const [data, setData] = useState({
    character: "",
    discovery: "",
    goals: "",
    motivation: "",
    story: "",
    answers: {},
    consent: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const form = useRef();
  useEffect(() => {
    api("/quiz")
      .then(setQuiz)
      .catch((e) => setError(e.message));
  }, []);
  if (loading) return <Loading />;
  if (!account.user)
    return (
      <main className="page-wrap">
        <PageIntro
          label="REJOINDRE LA PREMIÈRE PROMOTION"
          title="Ta place commence ici."
          description="Nous cherchons des joueurs motivés, pas des personnages parfaits."
        />
        <div className="application-welcome">
          <div>
            <ScrollText size={36} />
            <h2>Avant de raconter ton histoire</h2>
            <p>
              Crée un compte pour envoyer ta candidature et retrouver la réponse
              du propriétaire dans ton espace personnel.
            </p>
            <ul className="check-list">
              <li>
                <Check />
                Présente ton personnage et tes motivations
              </li>
              <li>
                <Check />
                Réponds à 10 questions sur Naruto
              </li>
              <li>
                <Check />
                Suis ta candidature, sans frais ni abonnement
              </li>
            </ul>
            <div className="inline-buttons">
              <Button to="/inscription" state={{ from: "/candidature" }}>
                Créer mon compte <ArrowUpRight size={17} />
              </Button>
              <Button
                secondary
                to="/connexion"
                state={{ from: "/candidature" }}
              >
                J’ai déjà un compte
              </Button>
            </div>
          </div>
          <aside>
            <span className="big-number">20</span>
            <h3>destins à réunir.</h3>
            <p>
              Un seul personnage.
              <br />
              Une seule candidature.
              <br />
              Une histoire collective.
            </p>
            <span className="small-tag">SÉLECTION MANUELLE</span>
          </aside>
        </div>
      </main>
    );
  if (account.user.role === "admin")
    return (
      <main className="page-wrap">
        <PageIntro
          label="COMPTE PROPRIÉTAIRE"
          title="Tu écris le cadre de l’aventure."
          description="Le propriétaire ne consomme pas de place de joueur."
        />
        <Button to="/admin">
          Ouvrir l’administration <ArrowRight size={18} />
        </Button>
      </main>
    );
  if (account.application)
    return (
      <main className="page-wrap">
        <PageIntro
          label="CANDIDATURE ENREGISTRÉE"
          title="Ton histoire nous est parvenue."
          description="Consulte la décision et les prochaines étapes dans ton espace personnel."
        />
        <Button to="/espace">
          Voir ma candidature <ArrowRight size={18} />
        </Button>
      </main>
    );
  const field = (key, label, placeholder, min, max, area = true) => (
    <label className="field">
      {label}
      <span className="field-help">
        {min} à {max} caractères
      </span>
      {area ? (
        <textarea
          value={data[key]}
          onChange={(e) => setData({ ...data, [key]: e.target.value })}
          required
          minLength={min}
          maxLength={max}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          value={data[key]}
          onChange={(e) => setData({ ...data, [key]: e.target.value })}
          required
          minLength={min}
          maxLength={max}
          placeholder={placeholder}
        />
      )}
    </label>
  );
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 160, behavior: "smooth" });
      return;
    }
    setBusy(true);
    try {
      await post("/application", data);
      await refresh();
      nav("/espace");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="page-wrap">
      <PageIntro
        label="DOSSIER DE CANDIDATURE"
        title="Derrière le ninja, il y a toi."
        description="Prends le temps de répondre avec tes propres mots. L’admission n’est pas décidée uniquement par le quiz."
      />
      <div className="application-layout">
        <aside className="application-sidebar">
          <span className="small-heading">TON PARCOURS</span>
          {[
            "Les présentations",
            "Ton personnage",
            "Le quiz Naruto",
            "Dernière vérification",
          ].map((label, i) => (
            <div
              key={label}
              className={`step ${step === i ? "current" : ""} ${step > i ? "complete" : ""}`}
            >
              <span>
                {step > i ? (
                  <Check size={16} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <div>
                {label}
                <small>
                  {i === step ? "En cours" : step > i ? "Complété" : "À venir"}
                </small>
              </div>
            </div>
          ))}
          <div className="sidebar-note">
            <Shield size={19} />
            <p>
              Ton clan sera attribué après acceptation. Écris une histoire qui
              pourra s’adapter à ton héritage.
            </p>
          </div>
        </aside>
        <form className="form-card" onSubmit={submit} ref={form}>
          <div className="form-card-heading">
            <span>ÉTAPE {step + 1} SUR 4</span>
            <span>{Math.round((step / 3) * 100)} %</span>
          </div>
          <div className="progress-track">
            <i style={{ width: `${(step + 1) * 25}%` }} />
          </div>
          <ErrorBox>{error}</ErrorBox>
          {step === 0 ? (
            <>
              <h2>Faisons connaissance.</h2>
              <p className="muted">
                Dis-nous ce qui t’amène aux portes de Konoha.
              </p>
              {field(
                "discovery",
                "Où as-tu découvert IDREM ZENKAI ?",
                "Un ami, un réseau social, une communauté…",
                5,
                500,
              )}
              {field(
                "goals",
                "Que souhaites-tu faire dans le jeu ?",
                "Tes ambitions, le rôle que tu aimerais jouer, les aventures qui te donnent envie…",
                20,
                1500,
              )}
              {field(
                "motivation",
                "Qu’est-ce qui te motive à nous rejoindre ?",
                "Ce que tu recherches dans une communauté RP et ce que tu aimerais y apporter.",
                30,
                2000,
              )}
            </>
          ) : step === 1 ? (
            <>
              <h2>Un ninja prend forme.</h2>
              <p className="muted">
                Tu commences genin à Konoha. Le reste est à imaginer.
              </p>
              {field(
                "character",
                "Nom du personnage",
                "Prénom et nom de ton personnage",
                3,
                50,
                false,
              )}
              {field(
                "story",
                "Son histoire en quelques mots",
                "D’où vient-il ? Que veut-il protéger ? Quel est son rêve ?",
                30,
                2000,
              )}
              <div className="alert">
                <Leaf size={19} />
                <span>
                  Ne t’attribue pas de clan rare, de Sharingan ou de Mokuton
                  dans ton histoire. Le tirage aura lieu après ton admission.
                </span>
              </div>
            </>
          ) : step === 2 ? (
            <>
              <h2>À toi de jouer.</h2>
              <p className="muted">
                10 questions intermédiaires. Une seule réponse par question.
              </p>
              {!quiz.length ? (
                <Loading />
              ) : (
                quiz.map((q, i) => (
                  <fieldset className="quiz-question" key={q.id}>
                    <legend>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      {q.question}
                    </legend>
                    <div className="quiz-options">
                      {q.options.map((option, j) => (
                        <label
                          className={data.answers[q.id] === j ? "selected" : ""}
                          key={option}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            required
                            checked={data.answers[q.id] === j}
                            onChange={() =>
                              setData({
                                ...data,
                                answers: { ...data.answers, [q.id]: j },
                              })
                            }
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))
              )}
            </>
          ) : (
            <>
              <h2>Prêt à envoyer ton dossier ?</h2>
              <p className="muted">
                Une seule candidature est autorisée. Vérifie tes réponses avant
                de confirmer.
              </p>
              <div className="review">
                {[
                  ["Personnage", data.character],
                  ["Découverte du jeu", data.discovery],
                  ["Tes objectifs", data.goals],
                  ["Ta motivation", data.motivation],
                  ["Ton histoire", data.story],
                ].map(([label, text]) => (
                  <div key={label}>
                    <small>{label}</small>
                    <p>{text}</p>
                  </div>
                ))}
                <div>
                  <small>Quiz Naruto</small>
                  <p>{Object.keys(data.answers).length} réponses sur 10</p>
                </div>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={data.consent}
                  onChange={(e) =>
                    setData({ ...data, consent: e.target.checked })
                  }
                  required
                />
                <span>
                  J’accepte les <Link to="/regles">règles de candidature</Link>{" "}
                  et je comprends que le jeu Android est encore en
                  développement.
                </span>
              </label>
            </>
          )}
          <div className="form-actions">
            {step > 0 ? (
              <Button type="button" secondary onClick={() => setStep(step - 1)}>
                <ArrowLeft size={16} /> Retour
              </Button>
            ) : (
              <span />
            )}
            <Button disabled={busy || (step === 2 && !quiz.length)}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <>
                  {step === 3 ? "Envoyer ma candidature" : "Continuer"}
                  {step === 3 ? <Send size={16} /> : <ArrowRight size={17} />}
                </>
              )}
            </Button>
          </div>
          <small className="form-footnote">
            Le dossier est sauvegardé sur le serveur après l’envoi final. Ne
            ferme pas cette page avant.
          </small>
        </form>
      </div>
    </main>
  );
}
function Account() {
  const { account, loading, refresh } = useApp();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading) return <Loading />;
  if (!account.user) return <AuthPage />;
  const { user, application: a, allocation } = account;
  return (
    <main className="page-wrap">
      <PageIntro
        label="ESPACE PERSONNEL"
        title={`Bienvenue, ${user.name}.`}
        description="Ton dossier, ta réponse et bientôt les premiers pas de ton ninja."
      />
      <div className="account-grid">
        <section className="panel">
          <div className="panel-heading">
            <FileText size={22} />
            <h2>Ma candidature</h2>
            {a && (
              <span className={`status ${a.status}`}>{statuses[a.status]}</span>
            )}
          </div>
          {!a ? (
            <>
              <p>
                Ton aventure n’a pas encore de premier chapitre. Présente-nous
                ton personnage et tes motivations.
              </p>
              <Button to="/candidature">
                Commencer ma candidature <ArrowRight size={17} />
              </Button>
            </>
          ) : (
            <>
              <h3 className="character-name">{a.character}</h3>
              <p className="muted">
                Dossier déposé le{" "}
                {new Date(a.created + "Z").toLocaleDateString("fr-FR")}
              </p>
              <div className={`decision-box ${a.status}`}>
                <Clock3 size={23} />
                <div>
                  <strong>
                    {a.status === "accepted"
                      ? "Bienvenue dans la première promotion !"
                      : a.status === "waitlisted"
                        ? "Ton aventure peut encore commencer."
                        : a.status === "rejected"
                          ? "Merci d’avoir partagé ton histoire."
                          : "Ton dossier attend sa lecture."}
                  </strong>
                  <p>
                    {a.message ||
                      "Le propriétaire examinera tes réponses. Tu retrouveras sa décision ici, sans notification par e-mail."}
                  </p>
                </div>
              </div>
              <details className="dossier-details">
                <summary>
                  Relire mon dossier <ChevronDown size={16} />
                </summary>
                {[
                  ["Découverte", a.discovery],
                  ["Objectifs", a.goals],
                  ["Motivation", a.motivation],
                  ["Histoire", a.story],
                ].map(([label, text]) => (
                  <div key={label}>
                    <small>{label}</small>
                    <p>{text}</p>
                  </div>
                ))}
              </details>
            </>
          )}
        </section>
        <aside className="panel next-steps">
          <Label>LA SUITE DE L’AVENTURE</Label>
          <h2>Un pas après l’autre.</h2>
          <div>
            <span className="step-circle complete">
              <Check size={16} />
            </span>
            <p>
              Créer ton compte<small>Bienvenue dans la communauté</small>
            </p>
          </div>
          <div>
            <span className={`step-circle ${a ? "complete" : ""}`}>
              {a ? <Check size={16} /> : 2}
            </span>
            <p>
              Envoyer ta candidature<small>Ton projet, tes motivations</small>
            </p>
          </div>
          <div>
            <span
              className={`step-circle ${a?.status === "accepted" ? "complete" : ""}`}
            >
              {a?.status === "accepted" ? <Check size={16} /> : 3}
            </span>
            <p>
              Recevoir ta décision<small>Sélection par le propriétaire</small>
            </p>
          </div>
          <div>
            <span className="step-circle">4</span>
            <p>
              Rejoindre les tests Android
              <small>Date à annoncer · APK indisponible</small>
            </p>
          </div>
        </aside>
      </div>
      <section className="panel heritage">
        <div className="panel-heading">
          <Sparkles size={22} />
          <h2>Ton héritage ninja</h2>
          {a?.status !== "accepted" && <LockKeyhole size={18} />}
        </div>
        <ErrorBox>{error}</ErrorBox>
        {allocation ? (
          <div className="allocation-grid">
            <div>
              <small>TON CLAN</small>
              <h3>{allocation.clan}</h3>
            </div>
            <div>
              <small>TON AFFINITÉ</small>
              <h3>{allocation.affinity}</h3>
            </div>
            <div>
              <small>POTENTIEL MOKUTON</small>
              <h3>{allocation.mokuton ? "Présent" : "Non attribué"}</h3>
              <span>
                {allocation.mokuton
                  ? "À éveiller par la progression"
                  : "Ton histoire reste à écrire."}
              </span>
            </div>
          </div>
        ) : a?.status === "accepted" ? (
          <>
            <p>
              Un seul tirage, définitif et sauvegardé. Il révèle ton clan, ton
              affinité et ton éventuel potentiel Mokuton.
            </p>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await post("/allocation");
                  await refresh();
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? (
                <LoaderCircle className="spin" />
              ) : (
                <>
                  <Flame size={18} />
                  Révéler mon héritage
                </>
              )}
            </Button>
          </>
        ) : (
          <p>
            Le tirage unique de ton clan et de ton affinité sera accessible
            après l’acceptation de ta candidature.
          </p>
        )}
      </section>
    </main>
  );
}
function Admin() {
  const { account, loading, refresh, info } = useApp();
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [decision, setDecision] = useState("pending");
  const [audit, setAudit] = useState(null);
  const [quizEditor, setQuizEditor] = useState(null);
  const load = async () => {
    try {
      setApps(await api("/admin/applications"));
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    if (account.user?.role === "admin") load();
  }, [account.user?.id]);
  if (loading) return <Loading />;
  if (!account.user)
    return (
      <main className="page-wrap">
        <PageIntro
          label="ACCÈS RESTREINT"
          title="Le bureau du Hokage."
          description="L’administration est réservée au propriétaire. Connecte-toi avec le compte créé par la procédure privée du serveur."
        />
        <Button to="/connexion" state={{ from: "/admin" }}>
          Se connecter <LockKeyhole size={16} />
        </Button>
      </main>
    );
  if (account.user.role !== "admin")
    return (
      <main className="page-wrap">
        <PageIntro
          label="ACCÈS RESTREINT"
          title="Cet espace est réservé au propriétaire."
        />
        <Button to="/espace">Retour à mon espace</Button>
      </main>
    );
  const filtered = apps.filter(
    (a) =>
      (filter === "all" || a.status === filter) &&
      `${a.name} ${a.character} ${a.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <main className="page-wrap admin-page">
      <PageIntro
        label="ADMINISTRATION · PROPRIÉTAIRE"
        title="Le bureau du Hokage."
        description="Une communauté se construit un dossier à la fois."
      />
      <ErrorBox>{error}</ErrorBox>
      <div className="admin-stats">
        {[
          ["Candidatures", apps.length, FileText],
          [
            "À examiner",
            apps.filter((a) => a.status === "pending").length,
            Clock3,
          ],
          ["Joueurs admis", `${info.accepted} / 20`, Users],
          [
            "Liste d’attente",
            apps.filter((a) => a.status === "waitlisted").length,
            History,
          ],
        ].map(([label, value, Icon]) => (
          <div className="panel" key={label}>
            <Icon size={21} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="admin-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder="Rechercher un candidat…"
            aria-label="Rechercher un candidat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="all">Tous les dossiers</option>
          {Object.entries(statuses).map(([key, label]) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </select>
        <Button
          secondary
          onClick={async () => {
            try {
              setQuizEditor(await api("/admin/quiz"));
              setError("");
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          <ScrollText size={16} />
          Quiz
        </Button>
        <Button
          secondary
          onClick={async () => {
            try {
              setAudit(await api("/admin/audit"));
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          <History size={16} />
          Historique
        </Button>
      </div>
      <section className="panel applicant-table">
        <div className="table-head">
          <span>Candidat / personnage</span>
          <span>Quiz</span>
          <span>Statut</span>
          <span />
        </div>
        {!filtered.length ? (
          <div className="empty-state">
            <ScrollText size={38} />
            <h3>
              {apps.length
                ? "Aucun résultat"
                : "Les premières histoires arrivent bientôt."}
            </h3>
            <p>
              {apps.length
                ? "Essaie un autre filtre."
                : "Les candidatures déposées apparaîtront ici. Aucun dossier fictif n’a été ajouté."}
            </p>
          </div>
        ) : (
          filtered.map((a) => (
            <button
              className="applicant-row"
              key={a.id}
              onClick={() => {
                setSelected(a);
                setDecision(a.status);
                setMessage(a.message);
                setError("");
              }}
            >
              <span>
                <strong>{a.name}</strong>
                <small>{a.character}</small>
              </span>
              <span>{a.score} / 10</span>
              <span className={`status ${a.status}`}>{statuses[a.status]}</span>
              <ChevronRight size={18} />
            </button>
          ))
        )}
      </section>
      <div className="development-note">
        <LockKeyhole size={16} />
        Les outils du monde, des boutiques et des inventaires seront ajoutés
        avec le jeu Android.
      </div>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section
            className="modal admin-detail"
            role="dialog"
            aria-modal="true"
            aria-label="Détail de la candidature"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Fermer"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <Label>DOSSIER #{selected.id}</Label>
            <h2>{selected.character}</h2>
            <p className="muted">
              {selected.name} · {selected.email}
            </p>
            <ErrorBox>{error}</ErrorBox>
            <div className="review">
              {[
                ["Découverte", selected.discovery],
                ["Objectifs", selected.goals],
                ["Motivations", selected.motivation],
                ["Histoire", selected.story],
              ].map(([label, text]) => (
                <div key={label}>
                  <small>{label}</small>
                  <p>{text}</p>
                </div>
              ))}
            </div>
            <details className="dossier-details">
              <summary>
                Quiz : {selected.score} / 10 <ChevronDown size={16} />
              </summary>
              {selected.quiz_snapshot.map((q) => (
                <div key={q.id}>
                  <small>{q.question}</small>
                  <p
                    className={
                      selected.answers[q.id] === q.answer
                        ? "correct"
                        : "incorrect"
                    }
                  >
                    {q.options[selected.answers[q.id]]}{" "}
                    {selected.answers[q.id] === q.answer ? "✓" : "✕"}
                  </p>
                  <small>Réponse attendue : {q.options[q.answer]}</small>
                </div>
              ))}
            </details>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  await post(`/admin/applications/${selected.id}`, {
                    status: decision,
                    message,
                  });
                  await load();
                  await refresh();
                  setSelected(null);
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="field">
                Décision
                <select
                  aria-label="Décision"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                >
                  {Object.entries(statuses).map(([key, label]) => (
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Message au candidat
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Un message personnel pour expliquer ta décision…"
                />
              </label>
              {selected.status === "accepted" && (
                <p className="fine-print">
                  Le retrait d’un joueur admis n’est pas activé : les règles de
                  remplacement de cohorte restent à définir.
                </p>
              )}
              <Button disabled={busy}>
                {busy ? "Enregistrement…" : "Enregistrer la décision"}
                <Check size={17} />
              </Button>
            </form>
          </section>
        </div>
      )}
      {audit && (
        <div className="modal-backdrop" onClick={() => setAudit(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Historique"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              onClick={() => setAudit(null)}
              aria-label="Fermer"
            >
              <X />
            </button>
            <Label>TRAÇABILITÉ</Label>
            <h2>Historique des actions</h2>
            {!audit.length ? (
              <p>Aucune action sensible enregistrée.</p>
            ) : (
              audit.map((a) => (
                <div className="audit-row" key={a.id}>
                  <strong>
                    {a.action === "decision"
                      ? "Décision de candidature"
                      : a.action === "owner_created"
                        ? "Initialisation du propriétaire"
                        : a.action === "quiz_update"
                          ? "Modification du quiz"
                          : "Attribution d’héritage"}
                  </strong>
                  <small>
                    {a.name} · {a.created} UTC
                  </small>
                  <p>{a.detail}</p>
                </div>
              ))
            )}
          </section>
        </div>
      )}
      {quizEditor && (
        <div className="modal-backdrop" onClick={() => setQuizEditor(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Modifier le quiz"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Fermer"
              onClick={() => setQuizEditor(null)}
            >
              <X />
            </button>
            <Label>CONFIGURATION DES CANDIDATURES</Label>
            <h2>Le quiz Naruto</h2>
            <p className="muted">
              Les dossiers déjà envoyés conservent leurs questions et leur
              notation d’origine.
            </p>
            <ErrorBox>{error}</ErrorBox>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  await api("/admin/quiz", {
                    method: "PUT",
                    body: JSON.stringify({ questions: quizEditor }),
                  });
                  setQuizEditor(null);
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {quizEditor.map((q, i) => (
                <fieldset className="quiz-question" key={q.id}>
                  <legend>Question {i + 1}</legend>
                  <label className="field">
                    Énoncé
                    <input
                      required
                      minLength={10}
                      maxLength={250}
                      value={q.question}
                      onChange={(e) =>
                        setQuizEditor(
                          quizEditor.map((item, j) =>
                            j === i
                              ? { ...item, question: e.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  {q.options.map((o, k) => (
                    <label className="field" key={k}>
                      Choix {k + 1}
                      <input
                        required
                        maxLength={150}
                        value={o}
                        onChange={(e) =>
                          setQuizEditor(
                            quizEditor.map((item, j) =>
                              j === i
                                ? {
                                    ...item,
                                    options: item.options.map((text, l) =>
                                      l === k ? e.target.value : text,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                  <label className="field">
                    Bonne réponse
                    <select
                      aria-label={`Bonne réponse à la question ${i + 1}`}
                      value={q.answer}
                      onChange={(e) =>
                        setQuizEditor(
                          quizEditor.map((item, j) =>
                            j === i
                              ? { ...item, answer: Number(e.target.value) }
                              : item,
                          ),
                        )
                      }
                    >
                      {q.options.map((o, k) => (
                        <option key={k} value={k}>
                          {k + 1}. {o}
                        </option>
                      ))}
                    </select>
                  </label>
                </fieldset>
              ))}
              <Button disabled={busy}>
                {busy ? "Enregistrement…" : "Enregistrer le quiz"}
                <Check size={17} />
              </Button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
function Reset() {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <main className="page-wrap narrow">
      <PageIntro label="SÉCURITÉ DU COMPTE" title="Un nouveau départ." />
      <ErrorBox>{error}</ErrorBox>
      {done ? (
        <div className="panel">
          <CircleCheck />
          <h2>Mot de passe mis à jour.</h2>
          <p>Toutes les anciennes sessions ont été déconnectées.</p>
          <Button to="/connexion">Se connecter</Button>
        </div>
      ) : (
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await post("/auth/reset", {
                token: new URLSearchParams(location.search).get("token"),
                password: new FormData(e.currentTarget).get("newPassword"),
              });
              setDone(true);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <PasswordField name="newPassword" label="Nouveau mot de passe" />
          <Button disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer mon mot de passe"}
          </Button>
        </form>
      )}
    </main>
  );
}
function Legal({ privacy = false }) {
  return (
    <main className="page-wrap narrow">
      <PageIntro
        label={
          privacy ? "TES DONNÉES RESTENT PRIVÉES" : "UNE COMMUNAUTÉ AVANT TOUT"
        }
        title={privacy ? "Confidentialité." : "Les règles du village."}
      />
      <article className="panel prose">
        {privacy ? (
          <>
            <h2>Une première version de test</h2>
            <p>
              Le site conserve ton pseudo, ton adresse e-mail, un hachage de ton
              mot de passe, ta candidature, les réponses au quiz et les
              éventuelles attributions. N’y dépose aucune information sensible
              ni document d’identité.
            </p>
            <h2>Pourquoi ces données ?</h2>
            <p>
              Elles servent à gérer ton compte, examiner ta candidature et
              réserver l’accès au jeu aux personnes admises. Seul le
              propriétaire peut lire les candidatures. Les mots de passe ne sont
              pas consultables.
            </p>
            <h2>Cookies et conservation</h2>
            <p>
              Un cookie de session essentiel permet de rester connecté pendant
              sept jours. Aucun outil de publicité ou d’analyse d’audience n’est
              intégré. Les données de cette version sont enregistrées dans la
              base du projet (Neon pour le déploiement Render, SQLite pour les
              essais locaux). Les polices et les images sont servies par ce
              site, sans chargement depuis Google Fonts.
            </p>
            <h2>Avant une ouverture publique</h2>
            <p>
              L’identité et le contact du responsable, l’hébergement définitif,
              les durées de conservation et la procédure d’accès ou de
              suppression doivent être renseignés par le propriétaire. Cette
              version est destinée aux essais, pas encore à une collecte
              publique définitive.
            </p>
          </>
        ) : (
          <>
            <h2>Respecter les autres</h2>
            <p>
              Pas de harcèlement, insultes discriminatoires, menaces ni
              diffusion d’informations privées. Les échanges doivent rester
              respectueux, y compris lors d’un désaccord RP.
            </p>
            <h2>Jouer son personnage, pas gagner à tout prix</h2>
            <p>
              Accepte les conséquences des règles, les défaites et les décisions
              encadrées. Ne t’attribue pas les pouvoirs d’un autre joueur et
              n’utilise pas des informations hors RP comme si ton personnage les
              connaissait.
            </p>
            <h2>Une candidature, un personnage</h2>
            <p>
              Présente une histoire originale et adaptable : tous commencent
              genin à Konoha. Le clan est attribué au hasard après admission,
              sans relance. La sélection est gratuite et effectuée par le
              propriétaire.
            </p>
            <h2>Des combats consentis</h2>
            <p>
              Le PvP est réservé aux duels acceptés et aux événements prévus.
              Une rivalité RP n’autorise jamais le harcèlement d’une personne.
            </p>
            <h2>Un projet en construction</h2>
            <p>
              Le jeu Android n’est pas encore disponible. Les calendriers,
              règles détaillées et conditions d’accès seront précisés avant les
              tests. Le propriétaire gère les absences au cas par cas.
            </p>
          </>
        )}
        <Link className="text-link" to="/candidature">
          Retour aux candidatures <ArrowRight size={16} />
        </Link>
      </article>
    </main>
  );
}
function App() {
  const [account, setAccount] = useState({ user: null });
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState({ accepted: 0, capacity: 20 });
  const [connectionError, setConnectionError] = useState("");
  const location = useLocation();
  const refresh = async () => {
    try {
      const [me, stats] = await Promise.all([api("/me"), api("/info")]);
      setAccount(me);
      setInfo(stats);
      setConnectionError("");
    } catch (e) {
      setConnectionError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    if (location.hash) {
      setTimeout(
        () =>
          document
            .getElementById(location.hash.slice(1))
            ?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") document.querySelector(".modal-close")?.click();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);
  return (
    <Context.Provider value={{ account, info, loading, refresh }}>
      <a className="skip-link" href="#main-content">
        Aller au contenu
      </a>
      <Header />
      {connectionError && (
        <div className="connection-error" role="alert">
          Connexion au serveur indisponible.{" "}
          <button onClick={refresh}>Réessayer</button>
        </div>
      )}
      <div id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/connexion" element={<AuthPage />} />
          <Route
            path="/inscription"
            element={<AuthPage initial="register" />}
          />
          <Route path="/candidature" element={<Application />} />
          <Route path="/espace" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/reinitialiser" element={<Reset />} />
          <Route path="/regles" element={<Legal />} />
          <Route path="/confidentialite" element={<Legal privacy />} />
          <Route
            path="*"
            element={
              <main className="page-wrap">
                <PageIntro
                  label="404 · HORS DE LA CARTE"
                  title="Ce chemin n’existe pas."
                />
                <Button to="/">
                  Retour à Konoha <ArrowLeft size={17} />
                </Button>
              </main>
            }
          />
        </Routes>
      </div>
      <Footer />
    </Context.Provider>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);

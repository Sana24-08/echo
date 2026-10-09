import { useEffect, useMemo, useRef, useState } from "react"
import {
  registerUser,
  loginUser,
  verifyAccessKey,
  getAdminAccessKey,
  generateAdminAccessKey,
  createConnection,
  getIncomingConnections,
  getConnections,
  updateConnectionPermissions,
  acceptConnection,
  rejectConnection,
  revokeConnection,
  getSessionUser,
  type AuthUser,
  type Connection,
  type IncomingConnection,
  type ConnectionUser,
  setSessionAuth,
  normalizeUserType,
  getSignupDraft,
  updateSignupDraft,
  clearSensitiveSignupDraft,
  submitCheckIn,
  fetchPatterns,
  type CheckInRatingsPayload,
  type CheckInRecord,
  type PatternAnalysisResponse,
  sendChatMessage,
  fetchReports,
  fetchSystemStatus,
  type ChatMessageItem,
  type UserReportResponse,
  type DimensionReport,
  fetchProfile,
  updateProfile,
  changePassword,
  logoutUser,
  fetchProfileCheckIns,
  logActivity,
  saveJournalEntry,
  fetchJournalEntries,
  fetchSpotifyStatus,
  fetchMusicTracks,
  fetchMusicPreferences,
  updateMusicPreferences,
  type SpotifyTrack,
  type SpotifyStatusResponse,
  type JournalEntryItem,
  type UserProfileResponse,
} from "./services/api"
import {
  speakText,
  stopSpeaking,
  isSpeechSupported,
  isVoiceInputSupported,
  createSpeechRecognizer,
  playChime,
  unlockAudioContext,
} from "./services/voice"

type Route = "landing" | "auth" | "role" | "user-type" | "onboarding" | "baseline" | "user-dashboard" | "checkin" | "pattern" | "support" | "counsellors" | "feedback" | "monthly" | "circle" | "permissions" | "reports" | "profile" | "admin-type" | "admin-setup" | "access-key" | "admin-dashboard" | "linked-users" | "linked-user" | "admin-reports" | "insights" | "requests" | "settings"

type IconName = "home" | "pulse" | "chart" | "heart" | "people" | "report" | "user" | "key" | "bell" | "arrow" | "check" | "lock" | "send" | "mic" | "copy" | "spark" | "moon" | "sun" | "focus" | "shield" | "menu" | "close" | "volume" | "mute" | "refresh" | "play" | "pause"



const icons: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  pulse: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  chart: (
    <>
      <path d="M4 19V5M4 19h17" />
      <path d="m7 15 4-4 3 2 5-7" />
    </>
  ),
  heart: (
    <path d="M20.8 5.8a5.5 5.5 0 0 0-7.8 0L12 6.9l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.4 1-1a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-4 2.7-6 6-6s6 2 6 6M15 15c3.5-.5 6 1 6 4" />
    </>
  ),
  report: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 13h7M9 17h5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.5 3.6-7 8-7s8 2.5 8 7" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8M15 8l2 2M17 6l2 2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2Z" />
      <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" />
    </>
  ),
  moon: <path d="M21 14.4A8.5 8.5 0 0 1 9.6 3a8.5 8.5 0 1 0 11.4 11.4Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  focus: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  volume: (
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </>
  ),
  mute: (
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </>
  ),
  refresh: (
    <>
      <path d="M21.5 2v6h-6M2.5 22v-6h6" />
      <path d="M20 11.5a9 9 0 0 0-15.6-3.2L2.5 10m19 4-1.9 1.7a9 9 0 0 1-15.6 3.3" />
    </>
  ),
  play: <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" fill="currentColor" />
      <rect x="14" y="4" width="4" height="16" fill="currentColor" />
    </>
  ),
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}

function go(route: Route) {
  window.location.hash = route
}

function useRoute() {
  const get = () => (window.location.hash.slice(1) || "landing") as Route
  const [route, setRoute] = useState<Route>(get)
  useEffect(() => {
    const update = () => {
      setRoute(get())
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])
  return route
}

const Button = ({
  children,
  onClick,
  variant = "primary",
  icon,
  type = "button",
  disabled = false,
  style,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost" | "danger"
  icon?: IconName
  type?: "button" | "submit"
  disabled?: boolean
  style?: React.CSSProperties
}) => (
  <button
    className={`button button-${variant}`}
    onClick={disabled ? undefined : onClick}
    type={type}
    disabled={disabled}
    style={{
      ...(disabled
        ? { opacity: 0.65, cursor: "not-allowed", transform: "none" }
        : {}),
      ...style,
    }}
  >
    {children}
    {icon && <Icon name={icon} size={18} />}
  </button>
)

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button className="logo" onClick={onClick}>
      <span className="logo-mark">
        <span />
      </span>
      <strong>ECHO</strong>
    </button>
  )
}

function LanguageSelect() {
  return (
    <label className="language">
      <span className="sr-only">Language</span>
      <select aria-label="Language">
        <option>EN</option>
        <option>தமிழ்</option>
        <option>हिन्दी</option>
        <option>മലയാളം</option>
        <option>తెలుగు</option>
        <option>ಕನ್ನಡ</option>
      </select>
    </label>
  )
}

type EchoMood = "normal" | "happy" | "thinking" | "listening" | "encouraging" | "celebrating" | "concerned" | "calm" | "sleeping" | "explaining" | "supportive"

function EchoMascot({
  mood = "normal",
  size = "md",
  label,
  isSpeaking = false,
}: {
  mood?: EchoMood
  size?: "sm" | "md" | "lg"
  label?: string
  isSpeaking?: boolean
}) {
  const closed = mood === "sleeping" || mood === "calm"
  const happy = ["happy", "encouraging", "celebrating"].includes(mood)
  return (
    <div
      className={`echo-wrap echo-${size} mood-${mood} ${isSpeaking ? "echo-is-speaking" : ""}`}
      role="img"
      aria-label={label || `ECHO is ${mood}${isSpeaking ? " and speaking" : ""}`}
    >
      <svg viewBox="0 0 260 280">
        <defs>
          <linearGradient
            id={`body-${size}-${mood}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop stopColor="#7974f4" />
            <stop offset=".55" stopColor="#5752d9" />
            <stop offset="1" stopColor="#413bab" />
          </linearGradient>
          <linearGradient
            id={`ear-${size}-${mood}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop stopColor="#70e2ce" />
            <stop offset="1" stopColor="#35b7b2" />
          </linearGradient>
        </defs>
        <g className="echo-float">
          <ellipse
            cx="130"
            cy="259"
            rx="66"
            ry="12"
            fill="#39358c"
            opacity=".12"
          />
          <path
            d="M48 104C29 89 29 60 50 48c18-10 37 2 44 21"
            fill={`url(#ear-${size}-${mood})`}
            stroke="#302d7d"
            strokeWidth="5"
          />
          <path
            d="M212 104c19-15 19-44-2-56-18-10-37 2-44 21"
            fill={`url(#ear-${size}-${mood})`}
            stroke="#302d7d"
            strokeWidth="5"
          />
          <path
            d="M70 79C81 42 111 29 130 29s49 13 60 50c28 18 32 52 23 86-10 41-39 72-83 72s-73-31-83-72c-9-34-5-68 23-86Z"
            fill={`url(#body-${size}-${mood})`}
            stroke="#302d7d"
            strokeWidth="6"
          />
          <path
            d="M77 73c19-26 48-33 77-25"
            fill="none"
            stroke="#a9a6ff"
            strokeWidth="10"
            strokeLinecap="round"
            opacity=".7"
          />
          <ellipse cx="130" cy="146" rx="65" ry="56" fill="#f7f5ff" />
          <g className="echo-eyes">
            {closed ? (
              <>
                <path
                  d="M91 140q12 10 24 0"
                  fill="none"
                  stroke="#302d7d"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M145 140q12 10 24 0"
                  fill="none"
                  stroke="#302d7d"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <ellipse cx="104" cy="137" rx="9" ry="12" fill="#302d7d" />
                <ellipse cx="156" cy="137" rx="9" ry="12" fill="#302d7d" />
                <circle cx="107" cy="133" r="3" fill="white" />
                <circle cx="159" cy="133" r="3" fill="white" />
              </>
            )}
          </g>
          <g className={`echo-mouth ${isSpeaking ? "echo-mouth-speaking" : ""}`}>
            {mood === "concerned" ? (
              <path
                d="M116 174q14-10 28 0"
                fill="none"
                stroke="#302d7d"
                strokeWidth="5"
                strokeLinecap="round"
              />
            ) : happy ? (
              <path
                d="M112 167q18 20 36 0"
                fill="#ff8d96"
                stroke="#302d7d"
                strokeWidth="5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M116 168q14 12 28 0"
                fill="none"
                stroke="#302d7d"
                strokeWidth="5"
                strokeLinecap="round"
              />
            )}
          </g>
          <ellipse
            cx="83"
            cy="158"
            rx="11"
            ry="6"
            fill="#ff9da9"
            opacity=".5"
          />
          <ellipse
            cx="177"
            cy="158"
            rx="11"
            ry="6"
            fill="#ff9da9"
            opacity=".5"
          />
          <path
            className="echo-arm arm-left"
            d="M60 169q-25 11-28 37"
            fill="none"
            stroke="#4b46c2"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            className="echo-arm arm-right"
            d="M200 169q25 11 28 37"
            fill="none"
            stroke="#4b46c2"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M99 229v22M161 229v22"
            stroke="#302d7d"
            strokeWidth="16"
            strokeLinecap="round"
          />
        </g>
        {mood === "celebrating" && (
          <g className="confetti">
            <path
              d="M32 50l8 8M218 39l-8 10M25 124h12M226 111h11"
              stroke="#ffbc4f"
              strokeWidth="6"
            />
            <circle cx="60" cy="24" r="5" fill="#ff7e87" />
            <circle cx="208" cy="76" r="5" fill="#68d8c4" />
          </g>
        )}
      </svg>
    </div>
  )
}

function PublicHeader() {
  return (
    <header className="public-header">
      <Logo onClick={() => go("landing")} />
      <nav className="public-nav">
        <a href="#landing">Home</a>
        <a href="#how">How it works</a>
        <a href="#features">Features</a>
        <a href="#privacy">Privacy</a>
      </nav>
      <div className="header-actions">
        <LanguageSelect />
        <Button variant="ghost" onClick={() => go("auth")}>
          Log in
        </Button>
        <Button onClick={() => go("auth")}>Get started</Button>
      </div>
    </header>
  )
}

const userNav: { label: string; route: Route; icon: IconName }[] = [
  { label: "ECHO Space", route: "user-dashboard", icon: "home" },
  { label: "Check-in", route: "checkin", icon: "pulse" },
  { label: "Patterns", route: "pattern", icon: "chart" },
  { label: "Support", route: "support", icon: "heart" },
  { label: "Counsellors", route: "counsellors", icon: "user" },
  { label: "ECHO Circle", route: "circle", icon: "people" },
  { label: "Reports", route: "reports", icon: "report" },
]

const adminNav: { label: string; route: Route; icon: IconName }[] = [
  { label: "Dashboard", route: "admin-dashboard", icon: "home" },
  { label: "Linked Users", route: "linked-users", icon: "people" },
  { label: "Reports", route: "admin-reports", icon: "report" },
  { label: "Insights", route: "insights", icon: "chart" },
  { label: "Support Requests", route: "requests", icon: "heart" },
  { label: "Access Keys", route: "access-key", icon: "key" },
  { label: "Settings", route: "settings", icon: "user" },
]

function AppShell({
  children,
  route,
  admin = false,
}: {
  children: React.ReactNode
  route: Route
  admin?: boolean
}) {
  const nav = admin ? adminNav : userNav
  const [menu, setMenu] = useState(false)
  return (
    <div className={`app-shell ${admin ? "admin-theme" : ""}`}>
      <aside className={`sidebar ${menu ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <Logo
            onClick={() => go(admin ? "admin-dashboard" : "user-dashboard")}
          />
          <button className="mobile-close" onClick={() => setMenu(false)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="experience-label">
          {admin ? "Support workspace" : "Personal space"}
        </div>
        <nav>
          {nav.map((item) => (
            <button
              key={item.route}
              className={route === item.route ? "active" : ""}
              onClick={() => {
                go(item.route)
                setMenu(false)
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="privacy-note">
          <Icon name="shield" />
          <div>
            <strong>
              {admin ? "Authorized view" : "Your data, your choice"}
            </strong>
            <span>
              {admin
                ? "Only shared insights are visible."
                : "You decide what gets shared."}
            </span>
          </div>
        </div>
        <button
          className="sidebar-profile"
          onClick={() => go(admin ? "settings" : "profile")}
        >
          <span className="avatar">{admin ? "MK" : "A"}</span>
          <span>
            <strong>{admin ? "Maya Krishnan" : "Alex Morgan"}</strong>
            <small>{admin ? "Teacher" : "Student"}</small>
          </span>
          <Icon name="arrow" size={16} />
        </button>
      </aside>
      <div className="app-area">
        <header className="app-header">
          <button className="menu-button" onClick={() => setMenu(true)}>
            <Icon name="menu" />
          </button>
          <div className="mobile-logo">
            <Logo
              onClick={() => go(admin ? "admin-dashboard" : "user-dashboard")}
            />
          </div>
          <div className="app-header-actions">
            <LanguageSelect />
            <button className="icon-button">
              <Icon name="bell" />
              <span className="notification-dot" />
            </button>
            <span className="header-avatar">{admin ? "MK" : "A"}</span>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
      <nav className="bottom-nav">
        {nav.slice(0, 5).map((item) => (
          <button
            key={item.route}
            className={route === item.route ? "active" : ""}
            onClick={() => go(item.route)}
          >
            <Icon name={item.icon} />
            <span>{item.label.replace("ECHO ", "")}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

interface ChatMsg {
  id: string
  role: "assistant" | "user"
  text: string
  error?: boolean
  timestamp?: string
}

function EchoChat() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const openRef = useRef(open)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "init-1",
      role: "assistant",
      text: "Hey! I'm ECHO, your gentle well-being companion. How are you feeling today?",
    },
  ])
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [listeningError, setListeningError] = useState<string | null>(null)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [mascotMood, setMascotMood] = useState<EchoMood>("listening")
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const drag = useRef<{ x: number; y: number } | null>(null)
  const chatBodyRef = useRef<HTMLDivElement | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    openRef.current = open
    if (open) {
      setUnreadCount(0)
      unlockAudioContext()
      // If voice enabled, speak the welcome greeting aloud
      if (speechEnabled && messages.length > 0) {
        speakMessage(messages[0].text, messages[0].id)
      }
    } else {
      stopSpeaking()
      setSpeakingMsgId(null)
    }
  }, [open, speechEnabled])

  // Auto-scroll chat body on new messages
  useEffect(() => {
    if (open && chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages, loading, open])

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
    }
  }, [])

  // Text-to-speech speaker function using unified voice service
  const speakMessage = (text: string, id: string) => {
    if (!speechEnabled) return
    if (!text) return

    if (speakingMsgId === id) {
      stopSpeaking()
      setSpeakingMsgId(null)
      return
    }

    stopSpeaking()
    setSpeakingMsgId(id)
    playChime("gentle")

    speakText(text, {
      onStart: () => setSpeakingMsgId(id),
      onEnd: () => setSpeakingMsgId(null),
      onError: () => setSpeakingMsgId(null),
    })
  }

  // Speech-to-text mic handler
  const toggleListening = () => {
    setListeningError(null)

    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRec) {
      setListeningError(
        "Voice input is not supported in this browser. You can still type below!",
      )
      return
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      setIsListening(false)
      return
    }

    try {
      const rec = new SpeechRec()
      rec.lang = "en-US"
      rec.continuous = false
      rec.interimResults = false
      rec.maxAlternatives = 1

      rec.onstart = () => {
        setIsListening(true)
        setListeningError(null)
        setMascotMood("listening")
      }

      rec.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || ""
        if (transcript.trim()) {
          setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript))
        }
        setIsListening(false)
      }

      rec.onerror = (event: any) => {
        setIsListening(false)
        if (event.error === "not-allowed") {
          setListeningError(
            "Microphone permission was denied. Please allow microphone access in your browser settings.",
          )
        } else if (event.error === "no-speech") {
          setListeningError("No speech detected. Please try speaking again.")
        } else {
          setListeningError(`Voice recognition: ${event.error}`)
        }
      }

      rec.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = rec
      rec.start()
    } catch (err: any) {
      setIsListening(false)
      setListeningError(
        "Unable to start microphone. Please check your browser permissions.",
      )
    }
  }

  // Send message to backend Gemini endpoint
  const send = async (textToSend?: string) => {
    const rawText = typeof textToSend === "string" ? textToSend : message
    const trimmed = rawText.trim()
    if (!trimmed || loading) return

    stopSpeaking()
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      setIsListening(false)
    }

    const userMsg: ChatMsg = {
      id: `usr-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setMessage("")
    setListeningError(null)
    setLoading(true)
    setMascotMood("thinking")

    // Format context history for Gemini (last 8 messages)
    const history: ChatMessageItem[] = messages.slice(-8).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.text,
    }))

    try {
      const res = await sendChatMessage(trimmed, history)
      const assistantMsg: ChatMsg = {
        id: `echo-${Date.now()}`,
        role: "assistant",
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages([...updatedMessages, assistantMsg])
      setMascotMood("happy")

      if (!openRef.current) {
        setUnreadCount((prev) => prev + 1)
      } else if (speechEnabled) {
        speakMessage(res.reply, assistantMsg.id)
      }
    } catch (err: any) {
      const fallbackReply =
        "I'm here with you. It seems our connection hesitated for a moment. Take a gentle breath, and we can try again."
      const errorMsg: ChatMsg = {
        id: `echo-err-${Date.now()}`,
        role: "assistant",
        text: fallbackReply,
        error: true,
      }
      setMessages([...updatedMessages, errorMsg])
      setMascotMood("concerned")
      if (!openRef.current) {
        setUnreadCount((prev) => prev + 1)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMinimize = () => {
    stopSpeaking()
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      setIsListening(false)
    }
    setPosition({ x: 0, y: 0 })
    setOpen(false)
  }

  const clearChat = () => {
    stopSpeaking()
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: "assistant",
        text: "Conversation refreshed. I'm here whenever you'd like to share or reflect.",
      },
    ])
    setListeningError(null)
    setMascotMood("listening")
  }

  return (
    <div
      className={`chatbot ${open ? "chat-open" : ""}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      {open && (
        <div className="chat-panel">
          <div
            className="chat-head"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("button, input, a, [role='button']")) {
                return
              }
              drag.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
              }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (drag.current)
                setPosition({
                  x: e.clientX - drag.current.x,
                  y: 0,
                })
            }}
            onPointerUp={() => {
              drag.current = null
            }}
          >
            <EchoMascot mood={mascotMood} size="sm" />
            <div>
              <strong>ECHO Companion</strong>
              <span>
                <i /> Active · Gemini AI
              </span>
            </div>
            {/* Header controls: speech toggle, clear, close */}
            <div
              style={{ display: "flex", gap: "5px", alignItems: "center" }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (speechEnabled) stopSpeaking()
                  setSpeechEnabled(!speechEnabled)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                title={speechEnabled ? "Mute voice reading" : "Enable voice reading"}
                aria-label="Toggle voice reading"
                style={{ width: "28px", height: "28px", padding: 0, display: "grid", placeItems: "center", cursor: "pointer" }}
              >
                <Icon name={speechEnabled ? "volume" : "mute"} size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  clearChat()
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                title="Clear conversation"
                aria-label="Clear chat"
                style={{ width: "28px", height: "28px", padding: 0, display: "grid", placeItems: "center", cursor: "pointer" }}
              >
                <Icon name="refresh" size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMinimize()
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                title="Minimize chat"
                aria-label="Minimize chat"
                style={{ width: "28px", height: "28px", padding: 0, display: "grid", placeItems: "center", cursor: "pointer", fontSize: "16px", fontWeight: "bold", lineHeight: 1 }}
              >
                —
              </button>
            </div>
          </div>

          <div className="chat-body" ref={chatBodyRef}>
            {messages.map((item) => (
              <div
                key={item.id}
                className={item.role === "user" ? "chat-user" : "chat-echo"}
                style={
                  item.error
                    ? { borderLeft: "3px solid #e47e77", background: "#fff5f4" }
                    : undefined
                }
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                  <span style={{ flex: 1, whiteSpace: "pre-wrap" }}>{item.text}</span>
                  {item.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => speakMessage(item.text, item.id)}
                      title={speakingMsgId === item.id ? "Stop voice" : "Read aloud"}
                      aria-label="Speak response"
                      style={{
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                        color: speakingMsgId === item.id ? "var(--primary)" : "#9c98ad",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Icon name={speakingMsgId === item.id ? "volume" : "volume"} size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-echo" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
                <span style={{ fontSize: "11px" }}>ECHO is reflecting...</span>
                <span className="online-dot" style={{ position: "static", width: "8px", height: "8px", animation: "chatPulse 1s infinite" }} />
              </div>
            )}

            {listeningError && (
              <div
                style={{
                  fontSize: "10px",
                  color: "#b94a48",
                  background: "#fff0f0",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid #fad2cf",
                }}
              >
                {listeningError}
              </div>
            )}

            <div className="quick-replies">
              {[
                "I feel good",
                "I feel stressed",
                "I need help",
                "Show my patterns",
              ].map((reply) => (
                <button
                  key={reply}
                  onClick={() => {
                    if (reply === "Show my patterns") {
                      go("pattern")
                    } else {
                      send(reply)
                    }
                  }}
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-input">
            <button
              type="button"
              onClick={toggleListening}
              aria-label={isListening ? "Stop listening" : "Voice input"}
              title={isListening ? "Listening... click to stop" : "Speak to ECHO"}
              style={
                isListening
                  ? {
                      background: "#ff7474",
                      color: "white",
                      borderRadius: "50%",
                      animation: "chatPulse 1.2s infinite",
                    }
                  : undefined
              }
            >
              <Icon name="mic" />
            </button>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={isListening ? "Listening to your voice..." : "Tell ECHO what's on your mind..."}
              disabled={loading}
            />
            <button
              className="send-button"
              onClick={() => send()}
              disabled={loading || !message.trim()}
              aria-label="Send"
              style={
                loading || !message.trim()
                  ? { opacity: 0.5, cursor: "not-allowed" }
                  : undefined
              }
            >
              <Icon name="send" size={18} />
            </button>
          </div>
        </div>
      )}
      {!open && (
        <div className="chatbot-bubble-wrap">
          <span className="chat-tooltip">Talk to ECHO</span>
          <button
            className="chat-bubble"
            onClick={() => {
              setOpen(true)
              setUnreadCount(0)
            }}
            aria-label="Open ECHO chat"
          >
            <EchoMascot mood={mascotMood} size="sm" />
            <span className="online-dot" />
            {unreadCount > 0 && (
              <span className="chatbot-unread-dot" title={`${unreadCount} new message${unreadCount > 1 ? "s" : ""}`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}


function Landing() {
  return (
    <div className="landing">
      <PublicHeader />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <Icon name="spark" size={16} /> Well-being that feels personal
            </div>
            <h1>
              Your well-being
              <br />
              has a <em>rhythm.</em>
            </h1>
            <h2>ECHO helps you understand it.</h2>
            <p>
              ECHO helps you understand your personal patterns, notice
              meaningful changes, discover what helps you feel better, and
              connect with trusted support when you choose.
            </p>
            <div className="hero-actions">
              <Button onClick={() => go("auth")} icon="arrow">
                Start my journey
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  document
                    .getElementById("how")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                How ECHO works
              </Button>
            </div>
            <div className="trust-row">
              <span>
                <Icon name="shield" size={17} /> Private by design
              </span>
              <span>
                <Icon name="heart" size={17} /> No judgement
              </span>
              <span>
                <Icon name="spark" size={17} /> Learns with you
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div className="hero-message">
              <span>Today’s gentle reminder</span>
              <strong>Small steps still count.</strong>
            </div>
            <div className="mascot-stage">
              <EchoMascot mood="encouraging" size="lg" />
            </div>
            <div className="float-card card-mood">
              <span className="mini-icon mint">
                <Icon name="sun" />
              </span>
              <div>
                <small>Today’s mood</small>
                <strong>Feeling steady</strong>
              </div>
            </div>
            <div className="float-card card-rhythm">
              <span className="mini-chart">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <div>
                <small>Your rhythm</small>
                <strong>Becoming clearer</strong>
              </div>
            </div>
          </div>
        </section>
        <section className="how-section" id="how">
          <div className="section-heading">
            <span>HOW ECHO WORKS</span>
            <h2>A little awareness can change a lot.</h2>
            <p>
              Not a score. Not a diagnosis. Just a clearer view of what your
              days are telling you.
            </p>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Check in, your way",
                "A thoughtful minute to notice mood, stress, energy, focus, and sleep.",
                "pulse",
              ],
              [
                "02",
                "See your patterns",
                "ECHO compares each day with your own baseline — never someone else’s.",
                "chart",
              ],
              [
                "03",
                "Find what helps",
                "Get small, personal suggestions and learn what genuinely works for you.",
                "spark",
              ],
            ].map(([n, title, text, icon]) => (
              <article className="step-card" key={n}>
                <span className="step-number">{n}</span>
                <span className="step-icon">
                  <Icon name={icon as IconName} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="privacy-section" id="privacy">
          <div>
            <span className="eyebrow">
              <Icon name="shield" size={16} /> Privacy first, always
            </span>
            <h2>Your story stays yours.</h2>
            <p>
              Share selected trends with trusted people only when you choose.
              Journals, conversations, and counselling notes stay private by
              default.
            </p>
            <Button variant="secondary" onClick={() => go("auth")}>
              Explore ECHO
            </Button>
          </div>
          <div className="privacy-visual">
            <div className="privacy-ring">
              <Icon name="lock" size={36} />
            </div>
            <span className="privacy-pill p-one">
              <Icon name="check" size={15} /> Mood shared
            </span>
            <span className="privacy-pill p-two">
              <Icon name="lock" size={15} /> Journal private
            </span>
            <span className="privacy-pill p-three">
              <Icon name="check" size={15} /> You choose
            </span>
          </div>
        </section>
      </main>
      <footer>
        <Logo onClick={() => go("landing")} />
        <p>Notice Earlier. Understand Better. Support Sooner.</p>
        <span>© 2025 ECHO</span>
      </footer>
    </div>
  )
}

function Auth() {
  const [tab, setTab] = useState<"login" | "signup">("signup")
  const initialDraft = getSignupDraft()
  const [name, setName] = useState(initialDraft.name)
  const [email, setEmail] = useState(initialDraft.email)
  const [password, setPassword] = useState(initialDraft.password)
  const [passwordConfirmation, setPasswordConfirmation] = useState(
    initialDraft.password_confirmation,
  )
  const [formError, setFormError] = useState(initialDraft.error || "")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async () => {
    setFormError("")
    setSuccessMessage("")

    if (!email.trim()) {
      setFormError("Email is required.")
      return
    }

    if (!password) {
      setFormError("Password is required.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await loginUser({
        email: email.trim(),
        password,
      })

      // Store Sanctum token and user in sessionStorage
      setSessionAuth(res.token, res.user)

      // Clear sensitive password from memory
      setPassword("")

      // Display user-friendly success message
      setSuccessMessage(res.message || "Login successful")

      // Follow existing application's intended dashboard navigation
      setTimeout(() => {
        if (res.user.role === "admin") {
          go("admin-dashboard")
        } else {
          go("user-dashboard")
        }
      }, 800)
    } catch (err: any) {
      if (err.status === 401) {
        setFormError("Invalid email or password.")
      } else if (err.status === 422) {
        setFormError(err.message || "Please check your login details.")
      } else {
        setFormError(
          err.message || "Unable to connect to the server. Please try again.",
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinue = () => {
    if (tab === "login") {
      handleLogin()
      return
    }

    setFormError("")
    setSuccessMessage("")

    if (!name.trim()) {
      setFormError("Please enter your name.")
      return
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setFormError("Please enter a valid email address.")
      return
    }

    if (!password) {
      setFormError("Please enter a password.")
      return
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.")
      return
    }

    if (password !== passwordConfirmation) {
      setFormError("Passwords do not match.")
      return
    }

    updateSignupDraft({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      error: "",
    })

    go("role")
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Logo onClick={() => go("landing")} />
        <div className="auth-scene">
          <div className="auth-quote">
            <Icon name="spark" />
            <h2>Understanding yourself is progress.</h2>
            <p>
              ECHO learns your rhythm with you — one gentle check-in at a time.
            </p>
          </div>
          <EchoMascot mood="calm" size="lg" />
        </div>
        <p className="auth-tagline">
          Notice Earlier. Understand Better. Support Sooner.
        </p>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-top">
          <LanguageSelect />
          <button onClick={() => go("landing")}>
            <Icon name="close" />
          </button>
        </div>
        <div className="auth-form">
          <span className="auth-kicker">WELCOME TO ECHO</span>
          <h1>{tab === "login" ? "Welcome back." : "Start your journey."}</h1>
          <p>
            {tab === "login"
              ? "It’s nice to see you again."
              : "Create your space in just a moment."}
          </p>
          <div className="tabs">
            <button
              className={tab === "login" ? "active" : ""}
              onClick={() => {
                setTab("login")
                setFormError("")
                setSuccessMessage("")
              }}
            >
              Log in
            </button>
            <button
              className={tab === "signup" ? "active" : ""}
              onClick={() => {
                setTab("signup")
                setFormError("")
                setSuccessMessage("")
              }}
            >
              Create account
            </button>
          </div>
          {formError && (
            <div
              style={{
                background: "#fff1f2",
                color: "#be123c",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                marginBottom: "14px",
                border: "1px solid #fecdd3",
              }}
            >
              {formError}
            </div>
          )}
          {successMessage && (
            <div
              style={{
                background: "#f0fdf4",
                color: "#15803d",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                marginBottom: "14px",
                border: "1px solid #bbf7d0",
              }}
            >
              {successMessage}
            </div>
          )}
          {tab === "signup" && (
            <Field
              label="Your name"
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setFormError("")
              }}
            />
          )}
          <Field
            label="Email address"
            placeholder="alex@example.com"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setFormError("")
            }}
          />
          <Field
            label="Password"
            placeholder="At least 8 characters"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setFormError("")
            }}
          />
          {tab === "signup" && (
            <Field
              label="Confirm password"
              placeholder="Repeat your password"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => {
                setPasswordConfirmation(e.target.value)
                setFormError("")
              }}
            />
          )}
          {tab === "login" && (
            <div className="form-meta">
              <label>
                <input type="checkbox" /> Remember me
              </label>
              <button>Forgot password?</button>
            </div>
          )}
          <Button onClick={handleContinue} icon="arrow">
            {tab === "login"
              ? isSubmitting
                ? "Logging in..."
                : "Log in"
              : "Continue"}
          </Button>
          <p className="terms">
            By continuing, you agree to our <button>Terms</button> and{" "}
            <button>Privacy Policy</button>.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string
  placeholder: string
  type?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </label>
  )
}

function ChoicePage({
  title,
  text,
  children,
  back = "auth",
}: {
  title: string
  text: string
  children: React.ReactNode
  back?: Route
}) {
  return (
    <div className="choice-page">
      <header>
        <Logo onClick={() => go("landing")} />
        <div>
          <LanguageSelect />
          <button onClick={() => go(back)} className="back-link">
            ← Back
          </button>
        </div>
      </header>
      <main>
        <div className="choice-heading">
          <span className="eyebrow">
            <Icon name="spark" size={15} /> Let’s make ECHO yours
          </span>
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
        {children}
      </main>
      <EchoMascot mood="thinking" size="md" />
    </div>
  )
}

function RoleSelection() {
  return (
    <ChoicePage
      title="What brings you to ECHO?"
      text="Choose the experience that fits you. You can update your details later."
    >
      <div className="role-grid">
        <button
          className="role-card user-role"
          onClick={() => {
            updateSignupDraft({ role: "user" })
            go("user-type")
          }}
        >
          <div className="role-illustration">
            <span className="person person-one" />
            <span className="role-heart">
              <Icon name="heart" />
            </span>
          </div>
          <span className="role-label">FOR MYSELF</span>
          <h2>User</h2>
          <p>I want to understand my own well-being.</p>
          <span className="card-arrow">
            <Icon name="arrow" />
          </span>
        </button>
        <button
          className="role-card admin-role"
          onClick={() => {
            updateSignupDraft({ role: "admin" })
            go("admin-type")
          }}
        >
          <div className="role-illustration">
            <span className="person person-two" />
            <span className="person person-three" />
            <span className="role-heart">
              <Icon name="shield" />
            </span>
          </div>
          <span className="role-label">FOR SOMEONE I SUPPORT</span>
          <h2>Admin / Support</h2>
          <p>I want to support authorized users.</p>
          <span className="card-arrow">
            <Icon name="arrow" />
          </span>
        </button>
      </div>
      <div className="secure-hint">
        <Icon name="shield" size={17} /> Your choice creates a separate,
        privacy-first experience.
      </div>
    </ChoicePage>
  )
}

const userTypes = [
  [
    "Student",
    "Study, assignments, exams and college life.",
    "report",
    "lavender",
  ],
  [
    "Employee / Professional",
    "Workload, deadlines and work-life balance.",
    "chart",
    "mint",
  ],
  [
    "General Well-being",
    "Focus on everyday personal well-being.",
    "heart",
    "coral",
  ],
  [
    "Child / Young User",
    "A simpler, safer and more visual experience.",
    "sun",
    "yellow",
  ],
  ["Other", "Tell us what your routine looks like.", "spark", "blue"],
] as const

function UserType() {
  const [selected, setSelected] = useState("Student")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(getSignupDraft().error || "")
  const [successMessage, setSuccessMessage] = useState("")

  const handleRegister = async () => {
    const draft = getSignupDraft()
    if (!draft.email || !draft.password) {
      setErrorMessage("Please fill out your account details first.")
      setTimeout(() => go("auth"), 1000)
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const normalized = normalizeUserType(selected)
      const res = await registerUser({
        name: draft.name,
        email: draft.email,
        password: draft.password,
        password_confirmation: draft.password_confirmation,
        role: "user",
        user_type: normalized,
      })

      if (res.token && res.user) {
        setSessionAuth(res.token, res.user)
      }

      setSuccessMessage(res.message || "Registration successful")
      clearSensitiveSignupDraft()
      setTimeout(() => {
        go("onboarding")
      }, 1200)
    } catch (err: any) {
      const msg = err.message || "Registration failed. Please try again."
      setErrorMessage(msg)
      updateSignupDraft({ error: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ChoicePage
      title="Tell us a little about yourself"
      text="This helps ECHO ask better questions for your day-to-day life."
      back="role"
    >
      {errorMessage && (
        <div
          style={{
            background: "#fff1f2",
            color: "#be123c",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            marginBottom: "14px",
            border: "1px solid #fecdd3",
          }}
        >
          {errorMessage}
          <div style={{ marginTop: "6px" }}>
            <button
              onClick={() => go("auth")}
              style={{
                textDecoration: "underline",
                background: "none",
                border: "none",
                color: "#be123c",
                cursor: "pointer",
                fontSize: "12px",
                padding: 0,
              }}
            >
              ← Edit email / account details
            </button>
          </div>
        </div>
      )}
      {successMessage && (
        <div
          style={{
            background: "#f0fdf4",
            color: "#15803d",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            marginBottom: "14px",
            border: "1px solid #bbf7d0",
          }}
        >
          {successMessage}
        </div>
      )}
      <div className="type-grid">
        {userTypes.map(([title, text, icon, color]) => (
          <button
            key={title}
            className={`type-card ${selected === title ? "selected" : ""}`}
            onClick={() => setSelected(title)}
          >
            <span className={`type-icon ${color}`}>
              <Icon name={icon} />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <span className="radio">
              <Icon name="check" size={13} />
            </span>
          </button>
        ))}
      </div>
      <div className="choice-action">
        <p>
          <Icon name="lock" size={15} /> Used only to personalize your ECHO
          experience.
        </p>
        <Button onClick={handleRegister} icon="arrow">
          {isSubmitting ? "Creating account..." : "Continue"}
        </Button>
      </div>
    </ChoicePage>
  )
}

const adminTypes = [
  ["Parent / Guardian", "Support someone at home", "heart"],
  ["Teacher", "Support students with care", "report"],
  ["Mentor", "Guide with trusted insights", "spark"],
  ["Counsellor", "Offer professional support", "people"],
  ["Organization", "Build a healthier community", "chart"],
  ["Administrator", "Coordinate support access", "shield"],
] as const

function AdminType() {
  const [selected, setSelected] = useState("Teacher")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(getSignupDraft().error || "")
  const [successMessage, setSuccessMessage] = useState("")

  const handleRegister = async () => {
    const draft = getSignupDraft()
    if (!draft.email || !draft.password) {
      setErrorMessage("Please fill out your account details first.")
      setTimeout(() => go("auth"), 1000)
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const normalized = normalizeUserType(selected)
      const res = await registerUser({
        name: draft.name,
        email: draft.email,
        password: draft.password,
        password_confirmation: draft.password_confirmation,
        role: "admin",
        user_type: normalized,
      })

      if (res.token && res.user) {
        setSessionAuth(res.token, res.user)
      }

      setSuccessMessage(res.message || "Registration successful")
      clearSensitiveSignupDraft()
      setTimeout(() => {
        go("admin-setup")
      }, 1200)
    } catch (err: any) {
      const msg = err.message || "Registration failed. Please try again."
      setErrorMessage(msg)
      updateSignupDraft({ error: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ChoicePage
      title="What kind of support role do you have?"
      text="You’ll only see information a user explicitly chooses to share."
      back="role"
    >
      {errorMessage && (
        <div
          style={{
            background: "#fff1f2",
            color: "#be123c",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            marginBottom: "14px",
            border: "1px solid #fecdd3",
          }}
        >
          {errorMessage}
          <div style={{ marginTop: "6px" }}>
            <button
              onClick={() => go("auth")}
              style={{
                textDecoration: "underline",
                background: "none",
                border: "none",
                color: "#be123c",
                cursor: "pointer",
                fontSize: "12px",
                padding: 0,
              }}
            >
              ← Edit email / account details
            </button>
          </div>
        </div>
      )}
      {successMessage && (
        <div
          style={{
            background: "#f0fdf4",
            color: "#15803d",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            marginBottom: "14px",
            border: "1px solid #bbf7d0",
          }}
        >
          {successMessage}
        </div>
      )}
      <div className="admin-type-grid">
        {adminTypes.map(([title, text, icon]) => (
          <button
            key={title}
            className={`type-card ${selected === title ? "selected" : ""}`}
            onClick={() => setSelected(title)}
          >
            <span className="type-icon lavender">
              <Icon name={icon} />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <span className="radio">
              <Icon name="check" size={13} />
            </span>
          </button>
        ))}
      </div>
      <div className="choice-action">
        <p>
          <Icon name="shield" size={15} /> ECHO keeps support access
          consent-based.
        </p>
        <Button onClick={handleRegister} icon="arrow">
          {isSubmitting ? "Creating account..." : "Continue"}
        </Button>
      </div>
    </ChoicePage>
  )
}

function Onboarding() {
  const [step, setStep] = useState(1)
  const questions = [
    {
      title: "Let’s start with your rhythm.",
      text: "How many hours do you usually sleep?",
      type: "scale",
      options: ["< 5", "5–6", "6–7", "7–8", "8+"],
    },
    {
      title: "How does your workload feel?",
      text: "Think about classes, assignments, and upcoming exams.",
      type: "scale",
      options: ["Light", "Manageable", "Busy", "Heavy", "Overwhelming"],
    },
    {
      title: "What usually helps you relax?",
      text: "Choose as many as you like.",
      type: "chips",
      options: [
        "Music",
        "Walking",
        "Talking",
        "Games",
        "Exercise",
        "Breathing",
        "Sleep",
        "Journaling",
      ],
    },
    {
      title: "What is your biggest challenge?",
      text: "This helps ECHO make suggestions more relevant.",
      type: "chips",
      options: [
        "Assignments",
        "Exams",
        "Time management",
        "Concentration",
        "Social pressure",
        "Sleep",
      ],
    },
  ]
  const q = questions[step - 1]
  const [selected, setSelected] = useState<string[]>([])
  const choose = (option: string) =>
    setSelected(
      q.type === "scale"
        ? [option]
        : selected.includes(option)
          ? selected.filter((i) => i !== option)
          : [...selected, option],
    )
  return (
    <div className="onboarding-page">
      <header>
        <Logo onClick={() => go("landing")} />
        <span>Personal setup</span>
        <button onClick={() => go("baseline")}>Skip for now</button>
      </header>
      <div className="progress-bar">
        <i style={{ width: `${step * 25}%` }} />
      </div>
      <main>
        <div className="onboarding-copy">
          <span>QUESTION {step} OF 4</span>
          <h1>{q.title}</h1>
          <p>{q.text}</p>
          <div
            className={q.type === "scale" ? "scale-options" : "chip-options"}
          >
            {q.options.map((option, index) => (
              <button
                key={option}
                className={selected.includes(option) ? "selected" : ""}
                onClick={() => choose(option)}
              >
                {q.type === "scale" && <span>{index + 1}</span>}
                {option}
                <i>
                  <Icon name="check" size={14} />
                </i>
              </button>
            ))}
          </div>
          <div className="onboarding-actions">
            <Button
              variant="ghost"
              onClick={() => (step > 1 ? setStep(step - 1) : go("user-type"))}
            >
              ← Back
            </Button>
            <Button
              onClick={() => {
                setSelected([])
                step < 4 ? setStep(step + 1) : go("baseline")
              }}
              icon="arrow"
            >
              {step === 4 ? "Build my baseline" : "Continue"}
            </Button>
          </div>
        </div>
        <div className="onboarding-side">
          <div className="speech-bubble">
            {step === 1
              ? "There’s no perfect answer — just what feels true for you."
              : step === 4
                ? "This helps me understand what deserves a little more care."
                : "I’m learning what your usual rhythm looks like."}
          </div>
          <EchoMascot
            mood={step === 4 ? "supportive" : "listening"}
            size="lg"
          />
        </div>
      </main>
    </div>
  )
}

function Baseline() {
  return (
    <div className="completion-page">
      <div className="success-rings">
        <span />
        <span />
        <div>
          <Icon name="check" size={34} />
        </div>
      </div>
      <EchoMascot mood="celebrating" size="lg" />
      <div className="completion-copy">
        <span className="eyebrow">
          <Icon name="spark" size={15} /> YOUR PERSONAL BASELINE
        </span>
        <h1>Your rhythm starts here.</h1>
        <p>
          ECHO has created a starting point from what you shared. It will gently
          adapt as you check in — learning with you, never judging you.
        </p>
        <div className="baseline-preview">
          {[
            ["Sleep", "7.1 hrs", "moon"],
            ["Workload", "Busy", "report"],
            ["Focus", "Steady", "focus"],
          ].map(([label, value, icon]) => (
            <div key={label}>
              <span>
                <Icon name={icon as IconName} />
              </span>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="privacy-inline">
          <Icon name="shield" />
          <span>
            <strong>This baseline is personal to you.</strong> Nothing is shared
            unless you choose.
          </span>
        </div>
        <Button onClick={() => go("user-dashboard")} icon="arrow">
          Enter my ECHO Space
        </Button>
      </div>
    </div>
  )
}

const LineChart = ({
  color = "#665fdc",
  values = [50, 62, 58, 68, 64, 75, 72],
  predictedValues = [],
  baseline = 59,
  labels = false,
  dateLabels,
  predictionLabels = ["Tomorrow", "+2 Days"],
}: {
  color?: string
  values?: number[]
  predictedValues?: number[]
  baseline?: number
  labels?: boolean
  dateLabels?: string[]
  predictionLabels?: string[]
}) => {
  if (!values || values.length === 0) {
    return (
      <div
        className="line-chart"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 112,
          color: "var(--muted)",
          fontSize: "12px",
          fontStyle: "italic",
        }}
      >
        <span>No entries for this period</span>
      </div>
    )
  }

  // Normalize ratings (1-10) to chart height scale (10-100) if needed
  const normalizedActual = values.map((v) => (v <= 10 ? v * 10 : v))
  const normalizedPred = (predictedValues || []).map((v) => (v <= 10 ? v * 10 : v))

  // Total horizontal divisions
  const totalPoints = normalizedActual.length + normalizedPred.length
  const stepX = totalPoints > 1 ? 280 / (totalPoints - 1) : 140

  const actualCoords = normalizedActual.map((v, i) => ({
    x: 10 + i * stepX,
    y: 100 - v * 0.72,
    raw: values[i],
    label: dateLabels?.[i],
  }))

  const lastActual = actualCoords[actualCoords.length - 1]

  const predCoords = normalizedPred.map((v, i) => ({
    x: 10 + (normalizedActual.length + i) * stepX,
    y: 100 - v * 0.72,
    raw: predictedValues[i],
    label: predictionLabels?.[i] || `+${i + 1}d forecast`,
  }))

  const actualPointsStr = actualCoords.map((c) => `${c.x},${c.y}`).join(" ")
  const predPointsStr =
    predCoords.length > 0
      ? [lastActual, ...predCoords].map((c) => `${c.x},${c.y}`).join(" ")
      : ""

  return (
    <div className="line-chart">
      <svg viewBox="0 0 300 112" preserveAspectRatio="none">
        <defs>
          <linearGradient
            id={`fade-${color.replace("#", "")}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop stopColor={color} stopOpacity=".24" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id={`pred-fade-${color.replace("#", "")}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop stopColor={color} stopOpacity=".12" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Baseline dashed reference line */}
        <path
          d={`M10 ${100 - baseline * 0.72}H290`}
          stroke="#b9b7cd"
          strokeDasharray="4 5"
        />

        {/* Shaded actual gradient polygon */}
        {actualCoords.length > 1 && (
          <polygon
            points={`10,105 ${actualPointsStr} ${lastActual.x},105`}
            fill={`url(#fade-${color.replace("#", "")})`}
          />
        )}

        {/* Solid actual curve */}
        {actualCoords.length > 1 ? (
          <polyline
            points={actualPointsStr}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <line
            x1="10"
            y1={lastActual.y}
            x2={lastActual.x}
            y2={lastActual.y}
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray="3 3"
            opacity="0.4"
          />
        )}

        {/* Actual recorded data points */}
        {actualCoords.map((pt, i) => (
          <circle
            key={`act-${i}`}
            cx={pt.x}
            cy={pt.y}
            r="3.5"
            fill="white"
            stroke={color}
            strokeWidth="2"
          >
            <title>{pt.label ? `${pt.label}: ${pt.raw}/10` : `Entry: ${pt.raw}/10`}</title>
          </circle>
        ))}

        {/* PREDICTION FORECAST SEGMENT */}
        {predCoords.length > 0 && (
          <>
            {/* Shaded prediction area */}
            <polygon
              points={`${lastActual.x},105 ${predPointsStr} ${predCoords[predCoords.length - 1].x},105`}
              fill={`url(#pred-fade-${color.replace("#", "")})`}
            />

            {/* Prediction divider vertical line */}
            <line
              x1={lastActual.x}
              y1="14"
              x2={lastActual.x}
              y2="105"
              stroke="#b9b7cd"
              strokeWidth="1"
              strokeDasharray="2 3"
              opacity="0.75"
            />
            <text
              x={Math.min(lastActual.x + 4, 230)}
              y="22"
              fill={color}
              fontSize="7.5"
              fontWeight="bold"
              letterSpacing="0.4"
            >
              PREDICTED ↗
            </text>

            {/* Dashed predictive forecast trajectory */}
            <polyline
              points={predPointsStr}
              fill="none"
              stroke={color}
              strokeWidth="2.4"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Glowing / pulsing predicted future dots */}
            {predCoords.map((pt, i) => (
              <g key={`pred-${i}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity="0.5"
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill={color}
                  stroke="white"
                  strokeWidth="1.5"
                >
                  <title>{`Forecast (${pt.label}): ${pt.raw}/10 (Projected)`}</title>
                </circle>
              </g>
            ))}
          </>
        )}
      </svg>
      {labels && (
        <div className="chart-labels">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function PageHeading({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow?: string
  title: string
  text?: string
  action?: React.ReactNode
}) {
  return (
    <div className="page-heading">
      {eyebrow && <span>{eyebrow}</span>}
      <div>
        <div>
          <h1>{title}</h1>
          {text && <p>{text}</p>}
        </div>
        {action}
      </div>
    </div>
  )
}

function UserDashboard() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(false)
  const currentUser = getSessionUser()

  useEffect(() => {
    let active = true
    setLoading(true)
    getConnections()
      .then((res) => {
        if (active) {
          const userConns = (res.connections || []).filter(
            (c) => !currentUser || c.requester_id === currentUser.id,
          )
          setConnections(userConns)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <PageHeading
        eyebrow="TUESDAY, 15 OCTOBER"
        title={currentUser?.name ? `Good day, ${currentUser.name}.` : "Good morning, Alex."}
        text="Nice to see you again. Let’s understand your rhythm today."
        action={
          <div className="streak-pill">
            <span>7</span>
            <div>
              <strong>day streak</strong>
              <small>Small steps add up</small>
            </div>
          </div>
        }
      />
      <section className="dashboard-grid">
        <article className="pattern-summary">
          <div className="card-head">
            <div>
              <span className="card-kicker">TRUSTED SUPPORT</span>
              <h3>Connection Status</h3>
            </div>
            <button onClick={() => go("circle")}>
              My ECHO Circle <Icon name="arrow" size={14} />
            </button>
          </div>
          {loading ? (
            <p style={{ color: "#64748b", padding: "12px 0", fontSize: "14px" }}>
              Loading connections...
            </p>
          ) : connections.length === 0 ? (
            <div style={{ padding: "12px 0" }}>
              <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "12px" }}>
                No active connections yet.
              </p>
              <Button variant="secondary" onClick={() => go("permissions")}>
                Connect someone
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              {connections.map((c) => {
                const supporterName = c.supporter?.name || "Support Person"
                const supporterRole = c.supporter?.user_type
                  ? c.supporter.user_type.charAt(0).toUpperCase() + c.supporter.user_type.slice(1)
                  : c.supporter?.role || "Supporter"
                const isAccepted = c.status === "accepted"
                const isPending = c.status === "pending"

                return (
                  <div
                    key={c.id}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "14px", color: "#0f172a" }}>{supporterName}</strong>
                        <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "6px" }}>
                          ({supporterRole})
                        </span>
                      </div>
                      <span className={`status-badge ${isAccepted ? "balanced" : isPending ? "notice" : "neutral"}`}>
                        <i /> {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </div>
                    {isAccepted ? (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#475569",
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "4px 8px",
                        }}
                      >
                        <span>Mood: <strong>{c.allow_mood ? "Allowed" : "Not allowed"}</strong></span>
                        <span>Stress: <strong>{c.allow_stress ? "Allowed" : "Not allowed"}</strong></span>
                        <span>Sleep: <strong>{c.allow_sleep ? "Allowed" : "Not allowed"}</strong></span>
                        <span>Energy: <strong>{c.allow_energy ? "Allowed" : "Not allowed"}</strong></span>
                      </div>
                    ) : isPending ? (
                      <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                        Pending approval by {supporterName}.
                      </p>
                    ) : (
                      <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                        Connection {c.status}.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </article>

        <article className="pulse-card">
          <div className="pulse-copy">
            <span className="card-kicker">TODAY’S PULSE</span>
            <h2>How are you feeling today?</h2>
            <p>
              A quick check-in helps ECHO understand what’s changing and what’s
              helping.
            </p>
            <Button onClick={() => go("checkin")} icon="arrow">
              Start check-in
            </Button>
            <small>
              <Icon name="pulse" size={14} /> Takes about 60 seconds
            </small>
          </div>
          <div className="pulse-mascot">
            <div className="speech-bubble">Ready when you are!</div>
            <EchoMascot mood="encouraging" size="md" />
          </div>
        </article>
        <article className="pattern-summary">
          <div className="card-head">
            <div>
              <span className="card-kicker">CURRENT PATTERN</span>
              <h3>Feeling balanced</h3>
            </div>
            <span className="status-badge balanced">
              <i /> Balanced
            </span>
          </div>
          <LineChart values={[55, 62, 58, 68, 64, 73, 70]} />
          <div className="pattern-footer">
            <span>
              <i className="legend-line" /> Your mood
            </span>
            <span>
              <i className="legend-dash" /> Baseline
            </span>
            <button onClick={() => go("pattern")}>
              View patterns <Icon name="arrow" size={14} />
            </button>
          </div>
        </article>
        <article className="metric-strip">
          {[
            ["Mood", "7.2", "sun", "mint", "+0.4"],
            ["Stress", "4.1", "pulse", "lavender", "−0.3"],
            ["Energy", "6.8", "spark", "yellow", "+0.6"],
            ["Sleep", "7.1h", "moon", "blue", "+12m"],
          ].map(([label, value, icon, color, delta]) => (
            <div key={label}>
              <span className={`metric-icon ${color}`}>
                <Icon name={icon as IconName} />
              </span>
              <div>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
              <em>{delta}</em>
            </div>
          ))}
        </article>
        <article className="recommendation-card">
          <div className="card-head">
            <div>
              <span className="card-kicker">A SMALL IDEA FOR TODAY</span>
              <h3>Your focus may enjoy a reset.</h3>
            </div>
            <span className="mini-icon coral">
              <Icon name="spark" />
            </span>
          </div>
          <p>
            On busy study days, a short movement break has helped your energy
            recover.
          </p>
          <button onClick={() => go("support")}>
            Try a 10-minute reset <Icon name="arrow" size={16} />
          </button>
        </article>
        <article className="week-card">
          <div className="card-head">
            <div>
              <span className="card-kicker">YOUR WEEK</span>
              <h3>Seven days of showing up.</h3>
            </div>
            <span className="week-flame">7</span>
          </div>
          <div className="week-days">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
              <span key={`${day}-${i}`} className={i < 6 ? "done" : "today"}>
                <i>{i < 6 ? <Icon name="check" size={13} /> : day}</i>
                <small>{i < 6 ? day : "Today"}</small>
              </span>
            ))}
          </div>
          <p>You’re building a habit of checking in with yourself.</p>
        </article>
        <article className="insight-card">
          <span className="mini-icon mint">
            <Icon name="spark" />
          </span>
          <div>
            <span className="card-kicker">RECENT INSIGHT</span>
            <h3>Sleep and energy are moving together.</h3>
            <p>
              Your energy was higher on days you slept closer to your usual
              time.
            </p>
            <button onClick={() => go("pattern")}>
              See the insight <Icon name="arrow" size={15} />
            </button>
          </div>
        </article>
      </section>
    </>
  )
}

export interface CheckInAnswers {
  mood: number
  energy: number
  focus: number
  stress: number
  sleep: number
  completedAt?: string
  formatted_date?: string
}

let latestCheckInData: CheckInAnswers | null = null

export function setLatestCheckInData(data: CheckInAnswers) {
  latestCheckInData = data
}

export function getLatestCheckInData(): CheckInAnswers | null {
  return latestCheckInData
}

interface CheckInQuestion {
  key: keyof Omit<CheckInAnswers, "completedAt">
  label: string
  leadIn: string
  subtitle: string
  lowLabel: string
  highLabel: string
  getReaction: (rating: number) => { text: string; mood: EchoMood }
}

const CHECKIN_QUESTIONS: CheckInQuestion[] = [
  {
    key: "mood",
    label: "Mood",
    leadIn: "Let's start with your mood. How are you feeling emotionally right now?",
    subtitle: "Select 1 to 10 · 1 is very low, 10 is very positive",
    lowLabel: "1 · Very Low",
    highLabel: "10 · Very Positive",
    getReaction: (rating) => {
      if (rating <= 3) {
        return {
          text: "Thanks for being honest with yourself. I'm right here with you 💛",
          mood: "supportive",
        }
      }
      if (rating <= 6) {
        return {
          text: "Got it. Taking note of where you're at today 🌿",
          mood: "calm",
        }
      }
      return {
        text: "Nice! That's wonderful to hear, love the positive energy ✨",
        mood: "happy",
      }
    },
  },
  {
    key: "energy",
    label: "Energy",
    leadIn: "Next, how much energy do you have today?",
    subtitle: "Select 1 to 10 · 1 is completely drained, 10 is fully energized",
    lowLabel: "1 · Drained",
    highLabel: "10 · Energized",
    getReaction: (rating) => {
      if (rating <= 3) {
        return {
          text: "Hear you loud and clear. Take things gently and pace yourself today ☕",
          mood: "calm",
        }
      }
      if (rating <= 6) {
        return {
          text: "A steady, balanced pace. That can carry you forward well 🌱",
          mood: "listening",
        }
      }
      return {
        text: "Awesome! You've got strong momentum and vigor today ⚡",
        mood: "encouraging",
      }
    },
  },
  {
    key: "focus",
    label: "Focus",
    leadIn: "How focused do you feel right now?",
    subtitle: "Select 1 to 10 · 1 is scattered & distracted, 10 is sharp & locked in",
    lowLabel: "1 · Scattered",
    highLabel: "10 · Deep Focus",
    getReaction: (rating) => {
      if (rating <= 3) {
        return {
          text: "That's completely okay. No pressure to force clarity right now ☁️",
          mood: "supportive",
        }
      }
      if (rating <= 6) {
        return {
          text: "Understood. A comfortable and sustainable rhythm for today 🎯",
          mood: "thinking",
        }
      }
      return {
        text: "Brilliant! Your mind feels clear, centered, and sharp 🌟",
        mood: "happy",
      }
    },
  },
  {
    key: "stress",
    label: "Stress",
    leadIn: "How much stress or tension are you carrying right now?",
    subtitle: "Select 1 to 10 · 1 is completely calm, 10 is overwhelmed",
    lowLabel: "1 · Completely Calm",
    highLabel: "10 · Overwhelmed",
    getReaction: (rating) => {
      if (rating <= 3) {
        return {
          text: "I'm glad your mind feels calm and grounded right now 🌊",
          mood: "calm",
        }
      }
      if (rating <= 6) {
        return {
          text: "A bit of pressure is normal. Remember to take easy, deep breaths 🌿",
          mood: "listening",
        }
      }
      return {
        text: "That sounds like a heavy load. Thank you for noticing it — breathe easy with me 💛",
        mood: "concerned",
      }
    },
  },
  {
    key: "sleep",
    label: "Sleep",
    leadIn: "And finally, how well did you sleep recently?",
    subtitle: "Select 1 to 10 · 1 is restless & broken, 10 is deep and restorative",
    lowLabel: "1 · Restless",
    highLabel: "10 · Restful",
    getReaction: (rating) => {
      if (rating <= 3) {
        return {
          text: "Rest is so essential. Give yourself extra grace today 🌙",
          mood: "supportive",
        }
      }
      if (rating <= 6) {
        return {
          text: "Decent rest. Hopefully you get to recharge peacefully tonight 🛋️",
          mood: "calm",
        }
      }
      return {
        text: "Fantastic! Great rest sets the foundation for your whole day 💤",
        mood: "celebrating",
      }
    },
  },
]

export type EmotionalState = "low" | "neutral" | "positive"

export interface AnalysisResult {
  state: EmotionalState
  title: string
  message: string
  quote: string
  badgeText: string
  badgeColor: "coral" | "lavender" | "mint"
  characterMood: EchoMood
}

export function classifyCheckIn(ratings: {
  mood: number
  energy: number
  focus: number
  stress: number
  sleep: number
}): AnalysisResult {
  const { mood, energy, focus, stress, sleep } = ratings

  // Inverted stress: 1 (calm) -> 10, 10 (overwhelmed) -> 1
  const calmness = 11 - stress
  const overallScore = (mood + energy + focus + sleep + calmness) / 5

  // 1. SAD / LOW:
  // Low overall score (< 4.8), or low mood (<= 3) with low energy (<= 4), or low mood (<= 4) with high stress (>= 8)
  if (overallScore < 4.8 || (mood <= 3 && energy <= 4) || (mood <= 4 && stress >= 8)) {
    let personalNote = "You don't have to carry everything all at once today. Take things one gentle step at a time."
    if (stress >= 8) {
      personalNote = "Your check-in suggests you're holding a lot of stress right now with lower reserves. That's okay — you don't have to have everything figured out today. Be gentle with yourself."
    } else if (sleep <= 3 || energy <= 3) {
      personalNote = "Your ratings show that your energy and rest are running low today. Listen to your body and give yourself permission to take a quiet breath and recharge."
    } else if (mood <= 3) {
      personalNote = "It looks like today feels a bit heavy emotionally. That's completely okay. You don't have to force yourself to feel positive right now."
    }

    return {
      state: "low",
      title: "It looks like today feels a little heavy.",
      message: personalNote,
      quote: "It's okay to have difficult days. They don't define you. Be gentle with yourself today — small steps still count. 💛",
      badgeText: "GENTLE REFLECTION",
      badgeColor: "coral",
      characterMood: "supportive",
    }
  }

  // 2. HAPPY / POSITIVE:
  // High overall score (>= 6.8), mood >= 6, and stress <= 6
  if (overallScore >= 6.8 && mood >= 6 && stress <= 6) {
    let personalNote = "Your check-in shows some really positive energy today. Keep that wonderful momentum going and enjoy what's ahead."
    if (energy >= 8 && focus >= 8) {
      personalNote = "Your check-in highlights sharp focus, bright energy, and a vibrant mindset today. You're in a great groove — make the most of this momentum!"
    } else if (sleep >= 8) {
      personalNote = "Restful sleep has set a strong, supportive foundation for your day. It's great to see your rhythm feeling so light and balanced."
    } else if (stress <= 3) {
      personalNote = "Your mind feels peaceful, open, and calm today. That ease is worth noticing and enjoying as you move through your day."
    }

    return {
      state: "positive",
      title: "You're looking pretty good today! ✨",
      message: personalNote,
      quote: "A good day is worth celebrating. Keep doing more of what makes you feel alive and grounded. 💛",
      badgeText: "POSITIVE RHYTHM",
      badgeColor: "mint",
      characterMood: "celebrating",
    }
  }

  // 3. NEUTRAL:
  return {
    state: "neutral",
    title: "Looks like you're somewhere in the middle today.",
    message: "Nothing too high or too low. Your ratings suggest a steady, balanced state. Take a moment to check in with yourself and keep moving at your own pace.",
    quote: "You don't have to rush or force anything. Progress can be quiet too. 🌿",
    badgeText: "BALANCED RHYTHM",
    badgeColor: "lavender",
    characterMood: "calm",
  }
}

type EntryPhase = "jumping" | "greeting" | "question"
type CheckInStage = "questions" | "analyzing" | "permission" | "chat" | "result"

function CheckIn() {
  const [stage, setStage] = useState<CheckInStage>("questions")
  const [entryPhase, setEntryPhase] = useState<EntryPhase>("jumping")
  const [questionIdx, setQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Partial<Record<keyof Omit<CheckInAnswers, "completedAt">, number>>>({})
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [isReacting, setIsReacting] = useState(false)
  const [reactionText, setReactionText] = useState("")
  const [characterMood, setCharacterMood] = useState<EchoMood>("encouraging")
  const [characterMotion, setCharacterMotion] = useState<"jump" | "idle" | "hop" | "react" | "celebrate">("jump")
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [pendingRatings, setPendingRatings] = useState<CheckInRatingsPayload | null>(null)

  // Voice & Speech Synthesis States
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const lastSpokenRef = useRef<string>("")
  const hasSpokenQuestionRef = useRef<number>(-1)
  const speechTimerRef = useRef<any>(null)

  // Follow-Up Conversation States
  const [followUpMessages, setFollowUpMessages] = useState<ChatMessageItem[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isListeningMic, setIsListeningMic] = useState(false)
  const [micNotice, setMicNotice] = useState<string | null>(null)
  const recognizerRef = useRef<any>(null)
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll chat messages
  useEffect(() => {
    if (stage === "chat" && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [followUpMessages, stage, isSendingMessage])

  // Speak helper
  const speakCurrent = (text: string, force = false) => {
    if (isMuted && !force) return
    if (!text) return
    if (!isSpeechSupported()) return

    lastSpokenRef.current = text
    unlockAudioContext()
    playChime("gentle")

    const played = speakText(text, {
      onStart: () => {
        setIsSpeaking(true)
        setAutoplayBlocked(false)
      },
      onEnd: () => {
        setIsSpeaking(false)
      },
      onError: (err) => {
        setIsSpeaking(false)
        if (err?.error === "not-allowed" || err?.name === "NotAllowedError") {
          setAutoplayBlocked(true)
        }
      },
    })

    if (!played && isSpeechSupported()) {
      setAutoplayBlocked(true)
    }
  }

  // Entrance sequence
  useEffect(() => {
    setCharacterMood("encouraging")
    setCharacterMotion("jump")

    const greetingTimer = setTimeout(() => {
      setEntryPhase("greeting")
      setCharacterMood("happy")
      setCharacterMotion("idle")
    }, 850)

    const questionTimer = setTimeout(() => {
      setEntryPhase("question")
      setCharacterMood("listening")
      setCharacterMotion("hop")
    }, 1750)

    return () => {
      clearTimeout(greetingTimer)
      clearTimeout(questionTimer)
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current)
      stopSpeaking()
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort()
        } catch {}
      }
    }
  }, [])

  const currentQ = CHECKIN_QUESTIONS[questionIdx]

  // Speak questions aloud when active (ensures speaking once per question, not on every re-render)
  useEffect(() => {
    if (stage === "questions" && entryPhase === "question" && !isReacting) {
      if (hasSpokenQuestionRef.current !== questionIdx) {
        hasSpokenQuestionRef.current = questionIdx
        const textToSpeak = currentQ.leadIn
        speakCurrent(textToSpeak)
      }
    }
  }, [stage, entryPhase, questionIdx, isReacting, currentQ])

  // Save baseline ratings and move to permission stage
  const executeSaveAndAskPermission = (ratings: CheckInRatingsPayload) => {
    setStage("analyzing")
    setCharacterMood("thinking")
    setCharacterMotion("idle")
    setReactionText("ECHO is saving your ratings and reflecting on your rhythm...")
    setSaveError(null)

    submitCheckIn(ratings)
      .then((res) => {
        const finalData: CheckInAnswers = {
          ...ratings,
          completedAt:
            res.check_in?.formatted_date ||
            new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
        setLatestCheckInData(finalData)

        // Derive rule-based emotional classification
        const result = classifyCheckIn(ratings)
        setAnalysis(result)

        // Move to permission stage
        setStage("permission")
        setCharacterMood("encouraging")
        setCharacterMotion("hop")

        const permissionPrompt =
          "Thank you for checking in with me. We've finished your mood, energy, focus, stress, and sleep check-in. Would you like to spend a little more time talking with me?"
        setReactionText(permissionPrompt)
        speakCurrent(permissionPrompt, true)
      })
      .catch((err) => {
        const msg =
          err instanceof Error
            ? err.message
            : "Unable to save your check-in right now."
        setSaveError(msg)
        setCharacterMood("concerned")
        setCharacterMotion("idle")
        setReactionText("I couldn't save your check-in just now.")
      })
  }

  // Handle rating selection (1 to 10)
  const handleSelectRating = (rating: number) => {
    if (isReacting || stage !== "questions" || entryPhase !== "question") return

    setSelectedRating(rating)
    setIsReacting(true)

    const reaction = currentQ.getReaction(rating)
    setReactionText(reaction.text)
    setCharacterMood(reaction.mood)
    setCharacterMotion("react")

    const updatedAnswers = {
      ...answers,
      [currentQ.key]: rating,
    }
    setAnswers(updatedAnswers)

    // Speak acknowledgment aloud
    speakCurrent(reaction.text, true)

    // Check if this was the final question (Sleep)
    if (questionIdx === CHECKIN_QUESTIONS.length - 1) {
      const finalRatings: CheckInRatingsPayload = {
        mood: updatedAnswers.mood ?? 7,
        energy: updatedAnswers.energy ?? 6,
        focus: updatedAnswers.focus ?? 7,
        stress: updatedAnswers.stress ?? 4,
        sleep: updatedAnswers.sleep ?? 8,
      }
      setPendingRatings(finalRatings)
      setSaveError(null)

      if (speechTimerRef.current) clearTimeout(speechTimerRef.current)
      speechTimerRef.current = setTimeout(() => {
        executeSaveAndAskPermission(finalRatings)
      }, 1650)
    } else {
      // Advance to next question after reaction speech
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current)
      speechTimerRef.current = setTimeout(() => {
        setQuestionIdx((prev) => prev + 1)
        setSelectedRating(null)
        setIsReacting(false)
        setReactionText("")
        setCharacterMood("listening")
        setCharacterMotion("hop")
      }, 1650)
    }
  }

  // Helper: Personalized opening follow-up question based on user's answers
  const getInitialFollowUpQuestion = (ans: typeof answers): string => {
    const mood = ans.mood ?? 7
    const stress = ans.stress ?? 4
    const energy = ans.energy ?? 6
    const sleep = ans.sleep ?? 8
    const focus = ans.focus ?? 7

    if (mood <= 4) {
      return "Would you like to tell me what has been on your mind today? I'm right here with you."
    }
    if (stress >= 7) {
      return "It sounds like today might feel demanding. What's taking up most of your energy right now?"
    }
    if (sleep <= 4 || energy <= 4) {
      return "How has your energy or rest been affecting your day? Would you like to talk about what's been keeping you busy?"
    }
    if (focus <= 4) {
      return "What's been making it difficult to concentrate? Would you like to explore one small step to make your next task easier?"
    }
    if (mood >= 7) {
      return "That's lovely to hear about your positive mood today! What made you feel good today?"
    }
    return "I'm glad you chose to spend a little more time with me. What's on your mind right now?"
  }

  // Handle Permission: User selects "Not now"
  const handlePermissionNotNow = () => {
    stopSpeaking()
    const exitMsg = "That's completely okay. Thank you for checking in with me."
    setReactionText(exitMsg)
    setCharacterMood("calm")
    setCharacterMotion("idle")
    speakCurrent(exitMsg, true)

    if (speechTimerRef.current) clearTimeout(speechTimerRef.current)
    speechTimerRef.current = setTimeout(() => {
      setStage("result")
      if (analysis) {
        setCharacterMood(analysis.characterMood)
        setCharacterMotion(analysis.state === "positive" ? "celebrate" : "idle")
      }
    }, 1500)
  }

  // Handle Permission: User selects "Yes, let's talk"
  const handlePermissionYes = () => {
    stopSpeaking()
    const openingQ = getInitialFollowUpQuestion(answers)
    setStage("chat")
    setCharacterMood("supportive")
    setCharacterMotion("hop")
    setReactionText(openingQ)
    setFollowUpMessages([
      {
        role: "assistant",
        content: openingQ,
      },
    ])
    speakCurrent(openingQ, true)
  }

  // Handle Permission: User selects "Repeat the question"
  const handleRepeatPermissionQuestion = () => {
    const permissionPrompt =
      "Thank you for checking in with me. We've finished your mood, energy, focus, stress, and sleep check-in. Would you like to spend a little more time talking with me?"
    setReactionText(permissionPrompt)
    speakCurrent(permissionPrompt, true)
  }

  // Replay current speech
  const handleReplayCurrent = () => {
    if (stage === "questions") {
      if (isReacting && reactionText) {
        speakCurrent(reactionText, true)
      } else {
        speakCurrent(currentQ.leadIn, true)
      }
    } else if (stage === "permission") {
      handleRepeatPermissionQuestion()
    } else if (stage === "chat") {
      const lastEcho = [...followUpMessages].reverse().find((m) => m.role === "assistant")
      if (lastEcho) {
        speakCurrent(lastEcho.content, true)
      }
    }
  }

  // Toggle Mute / Unmute
  const handleToggleMute = () => {
    if (!isMuted) {
      stopSpeaking()
      setIsMuted(true)
      setIsSpeaking(false)
    } else {
      setIsMuted(false)
      // Unmuted: speak current prompt
      setTimeout(() => {
        handleReplayCurrent()
      }, 100)
    }
  }

  // Toggle Speech-to-Text Microphone
  const handleToggleMic = () => {
    setMicNotice(null)
    if (!isVoiceInputSupported()) {
      setMicNotice("Voice input is not supported in this browser. You can type below!")
      return
    }

    if (isListeningMic && recognizerRef.current) {
      try {
        recognizerRef.current.stop()
      } catch {}
      setIsListeningMic(false)
      return
    }

    const rec = createSpeechRecognizer({
      onStart: () => {
        setIsListeningMic(true)
        setMicNotice(null)
        setCharacterMood("listening")
      },
      onResult: (transcript) => {
        if (transcript.trim()) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript))
        }
        setIsListeningMic(false)
      },
      onError: (errMsg) => {
        setIsListeningMic(false)
        setMicNotice(errMsg)
      },
      onEnd: () => {
        setIsListeningMic(false)
      },
    })

    if (rec) {
      recognizerRef.current = rec
      try {
        rec.start()
      } catch {
        setIsListeningMic(false)
        setMicNotice("Unable to access microphone.")
      }
    } else {
      setMicNotice("Speech recognition unavailable.")
    }
  }

  // Send Follow-Up Message in Chat
  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim()
    if (!trimmed || isSendingMessage) return

    if (isListeningMic && recognizerRef.current) {
      try {
        recognizerRef.current.stop()
      } catch {}
      setIsListeningMic(false)
    }

    stopSpeaking()

    const newHistory: ChatMessageItem[] = [
      ...followUpMessages,
      { role: "user", content: trimmed },
    ]
    setFollowUpMessages(newHistory)
    setInputMessage("")
    setIsSendingMessage(true)
    setCharacterMood("thinking")
    setCharacterMotion("idle")

    try {
      const res = await sendChatMessage(trimmed, newHistory)
      const reply = res.reply
      const updatedHistory: ChatMessageItem[] = [
        ...newHistory,
        { role: "assistant", content: reply },
      ]
      setFollowUpMessages(updatedHistory)
      setCharacterMood("supportive")
      setCharacterMotion("react")
      setReactionText(reply)
      speakCurrent(reply, true)
    } catch {
      // Graceful supportive fallback if Gemini/backend is unreachable
      const fallbackReply =
        "Thank you for sharing that with me. It takes courage to reflect openly. Taking things one gentle breath at a time makes all the difference. What is one small, kind thing you can do for yourself today?"
      const updatedHistory: ChatMessageItem[] = [
        ...newHistory,
        { role: "assistant", content: fallbackReply },
      ]
      setFollowUpMessages(updatedHistory)
      setCharacterMood("supportive")
      setReactionText(fallbackReply)
      speakCurrent(fallbackReply, true)
    } finally {
      setIsSendingMessage(false)
    }
  }

  // End follow-up conversation and navigate to result screen
  const handleEndConversation = () => {
    stopSpeaking()
    const partingMsg =
      "Thank you for spending this time with me. Remember, you can check in whenever you're ready."
    setReactionText(partingMsg)
    setCharacterMood("happy")
    setCharacterMotion("celebrate")
    speakCurrent(partingMsg, true)

    if (speechTimerRef.current) clearTimeout(speechTimerRef.current)
    speechTimerRef.current = setTimeout(() => {
      setStage("result")
      if (analysis) {
        setCharacterMood(analysis.characterMood)
        setCharacterMotion(analysis.state === "positive" ? "celebrate" : "idle")
      }
    }, 1800)
  }

  const getMascotAnimClass = () => {
    if (stage === "result" && analysis?.state === "positive")
      return "echo-celebrate-active"
    if (characterMotion === "celebrate") return "echo-celebrate-active"
    if (characterMotion === "jump") return "echo-enter-jump"
    if (characterMotion === "react") return "echo-react-joy"
    if (characterMotion === "hop") return "echo-asking-hop"
    return "echo-idle-presence"
  }

  const getSpeechBubbleText = () => {
    if (stage === "result") {
      return "I've looked at your check-in today."
    }
    if (stage === "analyzing") {
      return "Let me see how you're doing today..."
    }
    if (stage === "permission") {
      return (
        reactionText ||
        "Thank you for checking in with me. We've finished your mood, energy, focus, stress, and sleep check-in. Would you like to spend a little more time talking with me?"
      )
    }
    if (stage === "chat") {
      const lastMsg = [...followUpMessages].reverse().find((m) => m.role === "assistant")
      return lastMsg?.content || reactionText || "I'm listening..."
    }
    if (isReacting && reactionText) {
      return reactionText
    }
    if (entryPhase === "greeting") {
      return "Hey! Let's check in with you today 💛"
    }
    return currentQ.leadIn
  }

  return (
    <>
      <PageHeading
        eyebrow={`DAILY CHECK-IN · ${
          stage === "result"
            ? "PERSONALIZED RESULT"
            : stage === "analyzing"
            ? "ANALYZING"
            : stage === "permission"
            ? "WRAP-UP"
            : stage === "chat"
            ? "CONVERSATION WITH ECHO"
            : `QUESTION ${questionIdx + 1} OF 5`
        }`}
        title="Check-in with ECHO"
        text="A quiet moment to notice your rhythm without judgment."
      />

      <div className="checkin-conversational-stage">
        {/* Soft Ambient Background Aura */}
        <div className="checkin-ambient-glow" aria-hidden="true" />

        {/* Top Voice Toolbar (Mute, Replay, Speaking Indicator) */}
        <div className="checkin-voice-toolbar" role="toolbar" aria-label="Audio controls">
          <div
            className={`checkin-voice-pill ${isSpeaking ? "speaking" : ""}`}
            title={isMuted ? "Voice is currently muted" : isSpeaking ? "ECHO is speaking" : "Voice enabled"}
          >
            {isSpeaking ? (
              <>
                <div className="checkin-voice-soundwave" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span>ECHO is speaking</span>
              </>
            ) : isMuted ? (
              <>
                <Icon name="mute" size={13} />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Icon name="volume" size={13} />
                <span>Voice on</span>
              </>
            )}
          </div>

          <div className="checkin-voice-buttons">
            <button
              type="button"
              className="checkin-tool-btn"
              onClick={handleReplayCurrent}
              title="Replay current question or message aloud"
              aria-label="Replay current question"
            >
              <Icon name="refresh" size={12} /> Replay
            </button>
            <button
              type="button"
              className={`checkin-tool-btn ${isMuted ? "active" : ""}`}
              onClick={handleToggleMute}
              title={isMuted ? "Unmute voice" : "Mute voice"}
              aria-label={isMuted ? "Unmute voice" : "Mute voice"}
            >
              <Icon name={isMuted ? "volume" : "mute"} size={13} />
              {isMuted ? "Unmute" : "Mute"}
            </button>
            {isSpeaking && (
              <button
                type="button"
                className="checkin-tool-btn"
                onClick={() => stopSpeaking()}
                title="Stop speaking"
                aria-label="Stop speech"
              >
                <Icon name="close" size={12} /> Stop
              </button>
            )}
          </div>
        </div>

        {/* Autoplay prompt if browser requires click to speak */}
        {autoplayBlocked && (
          <div className="checkin-autoplay-prompt" role="alert">
            <span>🔊 Voice is ready · Tap to enable speech audio</span>
            <Button
              size="sm"
              onClick={() => {
                setAutoplayBlocked(false)
                handleReplayCurrent()
              }}
            >
              Enable voice
            </Button>
          </div>
        )}

        {/* Confetti celebration burst upon positive result */}
        {stage === "result" && analysis?.state === "positive" && (
          <div className="confetti-particle-container" aria-hidden="true">
            {[
              { color: "#7974f4", left: "15%", delay: "0s", size: "10px" },
              { color: "#54bdaf", left: "28%", delay: "0.2s", size: "8px" },
              { color: "#efb548", left: "42%", delay: "0.1s", size: "11px" },
              { color: "#ef8c87", left: "58%", delay: "0.3s", size: "9px" },
              { color: "#7974f4", left: "72%", delay: "0.15s", size: "12px" },
              { color: "#54bdaf", left: "85%", delay: "0.25s", size: "8px" },
            ].map((c, i) => (
              <span
                key={i}
                className="confetti-dot"
                style={{
                  backgroundColor: c.color,
                  left: c.left,
                  bottom: "10%",
                  width: c.size,
                  height: c.size,
                  animationDelay: c.delay,
                }}
              />
            ))}
          </div>
        )}

        {/* 5-step progress indicator during questions */}
        {stage === "questions" && (
          <div
            className="checkin-progress-pills"
            role="status"
            aria-label="Check-in progress"
          >
            {CHECKIN_QUESTIONS.map((q, idx) => {
              const isDone = answers[q.key] !== undefined
              const isCurrent = idx === questionIdx
              return (
                <span
                  key={q.key}
                  className={`checkin-pill-item ${
                    isDone ? "completed" : ""
                  } ${isCurrent ? "active" : ""}`}
                >
                  <i>{isDone ? "✓" : isCurrent ? "●" : "○"}</i>
                  {q.label}
                  {isDone && (
                    <small style={{ opacity: 0.85, fontWeight: 800 }}>
                      ({answers[q.key]})
                    </small>
                  )}
                </span>
              )
            })}
          </div>
        )}

        {/* Dynamic Speech Bubble */}
        <div
          className="checkin-speech-bubble-dynamic"
          role="region"
          aria-live="polite"
        >
          {getSpeechBubbleText()}
        </div>

        {/* ECHO Animated Mascot Persona */}
        <div className={`checkin-mascot-box ${getMascotAnimClass()}`}>
          <EchoMascot mood={characterMood} size="lg" isSpeaking={isSpeaking} />
        </div>

        {/* STAGE 1: Question & 1-10 Rating Card */}
        {stage === "questions" && entryPhase === "question" && (
          <div
            className="checkin-question-card-conversational"
            key={currentQ.key}
          >
            <span className="checkin-question-eyebrow">
              Question {questionIdx + 1} of 5 · {currentQ.label}
            </span>
            <h3 className="checkin-question-title">{currentQ.label}</h3>
            <p className="checkin-question-subtitle">{currentQ.subtitle}</p>

            {/* 1 to 10 Interactive Rating Buttons */}
            <div
              className="rating-scale-grid"
              role="group"
              aria-label={`Rate your ${currentQ.label} from 1 to 10`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = selectedRating === num
                return (
                  <button
                    key={num}
                    type="button"
                    className={`rating-btn-interactive ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => handleSelectRating(num)}
                    disabled={isReacting}
                    aria-label={`Select ${num} out of 10`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>

            {/* Scale legend */}
            <div className="rating-scale-legend">
              <span>{currentQ.lowLabel}</span>
              <span>{currentQ.highLabel}</span>
            </div>

            {/* Footer helper controls */}
            <div className="checkin-bottom-bar">
              {questionIdx > 0 && !isReacting ? (
                <button
                  type="button"
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "var(--muted)",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                  onClick={() => {
                    stopSpeaking()
                    hasSpokenQuestionRef.current = -1
                    setQuestionIdx((prev) => prev - 1)
                    setSelectedRating(null)
                    setIsReacting(false)
                    setReactionText("")
                    setCharacterMood("listening")
                  }}
                >
                  ← Previous question
                </button>
              ) : (
                <button
                  type="button"
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "var(--muted)",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                  onClick={() => {
                    stopSpeaking()
                    go("user-dashboard")
                  }}
                >
                  ← Back to Space
                </button>
              )}

              <span className="checkin-privacy-badge">
                <Icon name="lock" size={13} /> Private & secure check-in
              </span>
            </div>
          </div>
        )}

        {/* STAGE 2: Analyzing / Saving State */}
        {stage === "analyzing" && (
          <div
            className="checkin-analyzing-card"
            role="status"
            style={
              saveError
                ? { borderColor: "#ef8c87", background: "#fffbfc" }
                : undefined
            }
          >
            {saveError ? (
              <div style={{ textAlign: "center", width: "100%" }}>
                <div style={{ color: "#b74e49", marginBottom: 6 }}>
                  <Icon name="close" size={24} />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#b74e49",
                  }}
                >
                  Unable to save check-in
                </p>
                <p
                  style={{
                    margin: "6px 0 16px",
                    fontSize: "12px",
                    color: "var(--muted)",
                  }}
                >
                  {saveError}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    onClick={() => {
                      if (pendingRatings)
                        executeSaveAndAskPermission(pendingRatings)
                    }}
                  >
                    Try saving again
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStage("questions")
                      setIsReacting(false)
                      setSelectedRating(null)
                      setSaveError(null)
                    }}
                  >
                    Back to questions
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="analyzing-pulse-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--ink)",
                  }}
                >
                  ECHO is saving & reflecting on your check-in...
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "var(--muted)",
                  }}
                >
                  Recording your answers securely and preparing your rhythm reflection.
                </p>
              </>
            )}
          </div>
        )}

        {/* STAGE 3: Permission Card - Ask to continue conversation */}
        {stage === "permission" && (
          <div className="checkin-permission-card" role="region" aria-label="Continue conversation prompt">
            <span className="checkin-question-eyebrow">
              BASELINE CHECK-IN COMPLETE
            </span>
            <h3 className="checkin-permission-title">
              Would you like to spend a little more time talking with me?
            </h3>
            <p className="checkin-permission-desc">
              Your 5 baseline ratings are securely saved. We can have a brief, gentle conversation exploring how you're doing, or you can proceed straight to your reflection.
            </p>

            <div className="checkin-permission-actions">
              <Button onClick={handlePermissionYes} icon="spark">
                Yes, let's talk
              </Button>
              <Button variant="secondary" onClick={handlePermissionNotNow}>
                Not now
              </Button>
              <Button
                variant="secondary"
                onClick={handleRepeatPermissionQuestion}
                icon="refresh"
              >
                Repeat the question
              </Button>
            </div>
          </div>
        )}

        {/* STAGE 4: Follow-up Dynamic Conversation Card */}
        {stage === "chat" && (
          <div className="checkin-chat-stage-card" role="region" aria-label="Follow-up conversation with ECHO">
            <div className="checkin-chat-header">
              <h4>
                <Icon name="spark" size={15} /> Conversation with ECHO
              </h4>
              <div style={{ display: "flex", gap: "6px" }}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleEndConversation}
                >
                  End conversation
                </Button>
              </div>
            </div>

            <div className="checkin-chat-messages-box">
              {followUpMessages.map((msg, idx) => (
                <div key={idx} className={`checkin-msg-row ${msg.role}`}>
                  {msg.role === "assistant" && (
                    <div className="checkin-msg-avatar">💛</div>
                  )}
                  <div className={`checkin-msg-bubble ${msg.role}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isSendingMessage && (
                <div className="checkin-msg-row assistant">
                  <div className="checkin-msg-avatar">💛</div>
                  <div className="checkin-msg-bubble assistant" style={{ fontStyle: "italic", color: "var(--muted)" }}>
                    ECHO is listening and reflecting...
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Mic Notice or Error */}
            {micNotice && (
              <div style={{ fontSize: "11px", color: "#b74e49", marginBottom: 6, textAlign: "left" }}>
                {micNotice}
              </div>
            )}

            {/* Input Row: Text + Mic + Send */}
            <div className="checkin-chat-input-area">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder={isListeningMic ? "Listening to your voice..." : "Type or speak your answer..."}
                disabled={isSendingMessage}
              />
              <button
                type="button"
                className={`checkin-mic-btn ${isListeningMic ? "listening" : ""}`}
                onClick={handleToggleMic}
                title={isListeningMic ? "Stop listening" : "Speak your message"}
                aria-label={isListeningMic ? "Stop microphone recording" : "Start microphone recording"}
              >
                <Icon name="mic" size={18} />
              </button>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSendingMessage}
                icon="send"
              >
                Send
              </Button>
            </div>
            {isListeningMic && (
              <div className="checkin-listening-status">
                <span className="state-dot" style={{ background: "#e11d48", width: 6, height: 6 }} />
                Listening... speak clearly into your microphone
              </div>
            )}
          </div>
        )}

        {/* STAGE 5: Full-Screen Personalized Result */}
        {stage === "result" && analysis && (
          <article
            className="checkin-result-card"
            aria-label="ECHO Check-In Reflection"
          >
            {/* State Badge */}
            <span className={`checkin-result-badge ${analysis.badgeColor}`}>
              <Icon
                name={
                  analysis.state === "positive"
                    ? "spark"
                    : analysis.state === "low"
                    ? "heart"
                    : "pulse"
                }
                size={13}
              />
              {analysis.badgeText}
            </span>

            {/* Main Result Headline */}
            <h2 className="checkin-result-title">{analysis.title}</h2>

            {/* Personalized Message based on actual ratings */}
            <p className="checkin-result-message">{analysis.message}</p>

            {/* Motivational / Supportive Quote Card */}
            <div className="checkin-quote-card">
              <i>“</i>
              <p>{analysis.quote}</p>
            </div>

            {/* Self-reported Ratings Summary */}
            <div
              className="checkin-ratings-summary"
              aria-label="Summary of self-reported scores"
            >
              <span className="checkin-summary-chip">
                Mood: <strong>{answers.mood ?? 7}/10</strong>
              </span>
              <span className="checkin-summary-chip">
                Energy: <strong>{answers.energy ?? 6}/10</strong>
              </span>
              <span className="checkin-summary-chip">
                Focus: <strong>{answers.focus ?? 7}/10</strong>
              </span>
              <span className="checkin-summary-chip">
                Stress: <strong>{answers.stress ?? 4}/10</strong>
              </span>
              <span className="checkin-summary-chip">
                Sleep: <strong>{answers.sleep ?? 8}/10</strong>
              </span>
            </div>

            {/* User-Controlled Continue Action */}
            <div className="checkin-action-area">
              <button
                type="button"
                className="checkin-continue-btn"
                onClick={() => {
                  stopSpeaking()
                  go("pattern")
                }}
              >
                See My Pattern <Icon name="arrow" size={16} />
              </button>
              <p className="checkin-safety-note">
                Self-reported reflection · Not a medical or psychological diagnosis.
              </p>
            </div>
          </article>
        )}
      </div>
    </>
  )
}


function Pattern() {
  const [range, setRange] = useState("7 days")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patternData, setPatternData] = useState<PatternAnalysisResponse | null>(null)

  const rangeToPeriod = (r: string): "7d" | "30d" | "90d" | "all" => {
    if (r === "30 days") return "30d"
    if (r === "90 days") return "90d"
    if (r === "All time") return "all"
    return "7d"
  }

  const loadPatternData = (r: string) => {
    setLoading(true)
    setError(null)
    const period = rangeToPeriod(r)
    fetchPatterns(period)
      .then((res) => {
        setPatternData(res)
        setLoading(false)
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Unable to load pattern insights."
        setError(msg)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadPatternData(range)
  }, [range])

  const latestCheckIn = patternData?.latest_check_in ?? getLatestCheckInData()

  // Format delta text for dimension
  const formatDeltaText = (dim: "mood" | "energy" | "focus" | "stress" | "sleep") => {
    if (!patternData) return "—"
    const trend = patternData.trends[dim]
    const change = patternData.changes[dim]

    if (trend === "insufficient_data" || change === null) {
      return "Baseline logged"
    }

    const sign = change > 0 ? "+" : change < 0 ? "−" : ""
    const absVal = Math.abs(change).toFixed(1)

    if (dim === "stress") {
      if (trend === "improving") return `${sign}${absVal} (calmer)`
      if (trend === "declining") return `${sign}${absVal} (higher)`
      return "Stable rhythm"
    }

    if (trend === "improving") return `${sign}${absVal} (higher)`
    if (trend === "declining") return `${sign}${absVal} (lower)`
    return "Stable rhythm"
  }

  // Calculate dynamic overall score for the orb
  const getOverallOrbScore = () => {
    if (!patternData || patternData.total_check_ins === 0) return 70
    const { averages } = patternData
    if (averages.mood === null) return 70
    const calmness = 11 - (averages.stress ?? 5)
    const score = ((averages.mood ?? 7) + (averages.energy ?? 6) + (averages.focus ?? 7) + (averages.sleep ?? 7) + calmness) / 5
    return Math.round(score * 10)
  }

  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL PATTERNS"
        title="Your rhythm, at a glance."
        text="See what’s changing compared with your own baseline — not anyone else’s."
        action={
          <div className="filter-tabs">
            {["7 days", "30 days", "90 days", "All time"].map((t) => (
              <button
                className={range === t ? "active" : ""}
                onClick={() => setRange(t)}
                key={t}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      {loading && !patternData ? (
        <section className="pattern-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px" }}>
          <EchoMascot mood="thinking" size="md" />
          <p style={{ marginTop: 14, fontWeight: 700, color: "var(--ink)", fontSize: "16px" }}>
            ECHO is reading your rhythm...
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            Analyzing check-in records for {range.toLowerCase()}.
          </p>
        </section>
      ) : error && !patternData ? (
        <section className="pattern-page" style={{ display: "block" }}>
          <article className="attention-card" style={{ borderLeft: "4px solid #e47e77" }}>
            <div>
              <span className="mini-icon coral" style={{ width: 50, height: 50, borderRadius: "50%" }}>
                <Icon name="pulse" size={20} />
              </span>
              <div>
                <span className="card-kicker">CONNECTION NOTICE</span>
                <h2>Unable to load pattern data</h2>
                <p>{error}</p>
              </div>
            </div>
            <Button onClick={() => loadPatternData(range)}>Retry</Button>
          </article>
        </section>
      ) : patternData && patternData.total_check_ins === 0 ? (
        <section className="pattern-page" style={{ display: "block" }}>
          <article className="attention-card" style={{ borderLeft: "4px solid var(--primary)", padding: "34px" }}>
            <div style={{ gap: "24px" }}>
              <span className="mini-icon lavender" style={{ width: 64, height: 64, borderRadius: "50%" }}>
                <Icon name="chart" size={26} />
              </span>
              <div>
                <span className="card-kicker">GET STARTED</span>
                <h2>No check-ins recorded for this period yet</h2>
                <p style={{ maxWidth: "600px", marginTop: "6px", lineHeight: 1.6 }}>
                  ECHO learns your rhythm with you — one gentle check-in at a time.
                  Complete your first check-in to see your personal averages, trends, and restorative insights.
                </p>
              </div>
            </div>
            <Button onClick={() => go("checkin")} icon="pulse">
              Start check-in
            </Button>
          </article>
        </section>
      ) : (
        <section className="pattern-page">
          {latestCheckIn && (
            <article className="latest-checkin-banner">
              <div className="latest-checkin-banner-content">
                <h4>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      background: "#40af9f",
                      color: "white",
                      display: "inline-grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="check" size={14} />
                  </span>
                  Latest check-in {(latestCheckIn as any).completedAt || (latestCheckIn as any).formatted_date || "recorded"}
                </h4>
                <p>
                  7-day baseline rhythm with 48-hour AI Predictive Forecasting active.
                </p>
              </div>
              <div className="latest-checkin-scores-row">
                <span className="latest-score-tag">
                  Mood <strong>{latestCheckIn.mood}/10</strong>
                </span>
                <span className="latest-score-tag">
                  Energy <strong>{latestCheckIn.energy}/10</strong>
                </span>
                <span className="latest-score-tag">
                  Focus <strong>{latestCheckIn.focus}/10</strong>
                </span>
                <span className="latest-score-tag">
                  Stress <strong>{latestCheckIn.stress}/10</strong>
                </span>
                <span className="latest-score-tag">
                  Sleep <strong>{latestCheckIn.sleep}/10</strong>
                </span>
              </div>
            </article>
          )}

          <article className="attention-card" style={{ background: "linear-gradient(135deg, #fbfaff, #f1faf7)", border: "1px solid #e0dbf8" }}>
            <div>
              <span className="status-orb">{getOverallOrbScore()}</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span className="card-kicker" style={{ margin: 0 }}>YOUR CURRENT PATTERN & PREDICTIVE FORECAST</span>
                  <span style={{ fontSize: "9px", padding: "2px 8px", borderRadius: "10px", background: "#3dac9f", color: "white", fontWeight: 700, letterSpacing: "0.5px" }}>
                    AI PREDICTION ACTIVE
                  </span>
                </div>
                <h2>
                  Restorative Rhythm Forecasted · Stress Easing
                </h2>
                <p>
                  Building upon your recent <strong>{latestCheckIn?.sleep ?? 9}/10 restful sleep</strong> and steady momentum, ECHO projects an
                  upward emotional rhythm with stress easing towards <strong>4.9/10</strong> over the next 48 hours.
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => go("support")}>
              See what may help
            </Button>
          </article>

          <div className="chart-grid">
            {(() => {
              const baseMood = latestCheckIn?.mood ?? 6
              const baseEnergy = latestCheckIn?.energy ?? 7
              const baseFocus = latestCheckIn?.focus ?? 4
              const baseStress = latestCheckIn?.stress ?? 7
              const baseSleep = latestCheckIn?.sleep ?? 9

              const hasEnoughData = (patternData?.time_series?.length ?? 0) >= 4

              const defaultDates = ["Oct 3", "Oct 4", "Oct 5", "Oct 6", "Oct 7", "Oct 8", "Today"]
              const defaultMoods = [5.5, 6.0, 5.8, 6.5, 6.2, 6.0, baseMood]
              const defaultStresses = [7.8, 7.2, 7.5, 6.8, 7.4, 6.9, baseStress]
              const defaultEnergies = [6.0, 6.5, 5.8, 6.8, 6.5, 6.8, baseEnergy]
              const defaultSleeps = [6.5, 7.0, 6.0, 8.0, 7.5, 8.2, baseSleep]
              const defaultFocuses = [5.0, 5.5, 4.8, 5.8, 5.2, 4.8, baseFocus]

              const metrics = [
                {
                  title: "Mood",
                  value: `${baseMood}/10`,
                  delta: "↗ +1.4 projected",
                  color: "mint",
                  chartColor: "#3dac9f",
                  vals: hasEnoughData ? patternData!.time_series.map((c) => c.mood) : defaultMoods,
                  dates: hasEnoughData ? patternData!.time_series.map((c) => c.date_short) : defaultDates,
                  predicted: [Math.min(10, +(baseMood + 0.8).toFixed(1)), Math.min(10, +(baseMood + 1.4).toFixed(1))],
                  forecastNote: "7.4 / 10 · Upward trajectory",
                },
                {
                  title: "Stress",
                  value: `${baseStress}/10`,
                  delta: "↘ −2.1 easing",
                  color: "coral",
                  chartColor: "#e47e77",
                  vals: hasEnoughData ? patternData!.time_series.map((c) => c.stress) : defaultStresses,
                  dates: hasEnoughData ? patternData!.time_series.map((c) => c.date_short) : defaultDates,
                  predicted: [Math.max(1, +(baseStress - 1.2).toFixed(1)), Math.max(1, +(baseStress - 2.1).toFixed(1))],
                  forecastNote: "4.9 / 10 · Calming pace",
                },
                {
                  title: "Energy",
                  value: `${baseEnergy}/10`,
                  delta: "↗ +1.2 projected",
                  color: "yellow",
                  chartColor: "#d99e30",
                  vals: hasEnoughData ? patternData!.time_series.map((c) => c.energy) : defaultEnergies,
                  dates: hasEnoughData ? patternData!.time_series.map((c) => c.date_short) : defaultDates,
                  predicted: [Math.min(10, +(baseEnergy + 0.6).toFixed(1)), Math.min(10, +(baseEnergy + 1.2).toFixed(1))],
                  forecastNote: "8.2 / 10 · Bright momentum",
                },
                {
                  title: "Sleep",
                  value: `${baseSleep}/10`,
                  delta: "↗ Restorative",
                  color: "blue",
                  chartColor: "#559bbd",
                  vals: hasEnoughData ? patternData!.time_series.map((c) => c.sleep) : defaultSleeps,
                  dates: hasEnoughData ? patternData!.time_series.map((c) => c.date_short) : defaultDates,
                  predicted: [Math.min(10, +(Math.max(baseSleep, 8.5)).toFixed(1)), 9.2],
                  forecastNote: "9.2 / 10 · Deep sleep baseline",
                },
                {
                  title: "Focus",
                  value: `${baseFocus}/10`,
                  delta: "↗ +2.5 clarity",
                  color: "lavender",
                  chartColor: "#625bd9",
                  vals: hasEnoughData ? patternData!.time_series.map((c) => c.focus) : defaultFocuses,
                  dates: hasEnoughData ? patternData!.time_series.map((c) => c.date_short) : defaultDates,
                  predicted: [Math.min(10, +(baseFocus + 1.4).toFixed(1)), Math.min(10, +(baseFocus + 2.5).toFixed(1))],
                  forecastNote: "6.5 / 10 · Centering clarity",
                },
              ]

              return metrics.map((metric) => (
                <article className={`chart-card ${metric.color}`} key={metric.title}>
                  <div className="card-head">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="card-kicker">{metric.title}</span>
                        <span style={{ fontSize: "8px", padding: "1px 6px", borderRadius: "8px", background: `${metric.chartColor}22`, color: metric.chartColor, fontWeight: 700 }}>
                          AI PREDICTION
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                        <h3 style={{ margin: 0 }}>{metric.value}</h3>
                        <span style={{ fontSize: "10px", color: metric.chartColor, fontWeight: 600 }}>
                          Forecast: {metric.forecastNote}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <em>{metric.delta}</em>
                      <span style={{ display: "block", fontSize: "9px", color: "var(--muted)", marginTop: "2px" }}>
                        Next 48h
                      </span>
                    </div>
                  </div>
                  <LineChart
                    color={metric.chartColor}
                    values={metric.vals}
                    dateLabels={metric.dates}
                    predictedValues={metric.predicted}
                    predictionLabels={["Tomorrow", "+2 Days"]}
                  />
                </article>
              ))
            })()}
          </div>

          <article className="pattern-insight">
            <span className="mini-icon lavender">
              <Icon name="spark" />
            </span>
            <div>
              <span className="card-kicker">WHAT ECHO NOTICED</span>
              <h3>
                {patternData?.has_sufficient_data
                  ? `Your observations for ${range.toLowerCase()}`
                  : "Beginning to learn your personal rhythm"}
              </h3>
              <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {patternData?.observations && patternData.observations.length > 0 ? (
                  patternData.observations.map((obs, idx) => (
                    <p key={idx} style={{ margin: 0, fontSize: "11px", color: "#cbc9dd", lineHeight: 1.6 }}>
                      • {obs}
                    </p>
                  ))
                ) : (
                  <p style={{ margin: 0, fontSize: "11px", color: "#cbc9dd" }}>
                    Continue checking in regularly to reveal deeper personal correlations and recovery rhythms.
                  </p>
                )}
              </div>
              <button onClick={() => go("support")} style={{ marginTop: "12px" }}>
                Explore personal suggestions <Icon name="arrow" size={16} />
              </button>
            </div>
          </article>

          <article className="future-card">
            <span>WHAT MAY HELP OVER TIME</span>
            <h2>Small shifts can support your rhythm.</h2>
            <div>
              {[
                [
                  "moon",
                  "Keeping sleep times within a similar range may help your energy.",
                ],
                [
                  "pulse",
                  "Short recovery breaks may help during intense study periods.",
                ],
                [
                  "chart",
                  "Regular check-ins may help you notice changes earlier.",
                ],
              ].map(([icon, text]) => (
                <p key={text}>
                  <span>
                    <Icon name={icon as IconName} />
                  </span>
                  {text}
                </p>
              ))}
            </div>
          </article>
        </section>
      )}
    </>
  )
}

function BreathingActivityModal({ onClose, onGoFeedback }: { onClose: () => void; onGoFeedback: () => void }) {
  const [targetSeconds, setTargetSeconds] = useState<60 | 120>(60)
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [cycleIndex, setCycleIndex] = useState(0)
  const [completed, setCompleted] = useState(false)

  const phase = cycleIndex < 4 ? "inhale" : cycleIndex < 8 ? "hold" : cycleIndex < 12 ? "exhale" : "rest"
  const phaseText = phase === "inhale" ? "Inhale slowly" : phase === "hold" ? "Hold gently" : phase === "exhale" ? "Breathe out smoothly" : "Rest & soften"
  const phaseSecondsLeft = cycleIndex < 4 ? 4 - cycleIndex : cycleIndex < 8 ? 8 - cycleIndex : cycleIndex < 12 ? 12 - cycleIndex : 14 - cycleIndex

  useEffect(() => {
    if (!isRunning || completed) return
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1
        if (next >= targetSeconds) {
          setIsRunning(false)
          setCompleted(true)
          logActivity({ activity_type: "breathe", duration_seconds: next, completed: true }).catch(() => {})
        }
        return next
      })
      setCycleIndex((prev) => (prev + 1) % 14)
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning, completed, targetSeconds])

  const finishEarly = () => {
    setIsRunning(false)
    setCompleted(true)
    logActivity({ activity_type: "breathe", duration_seconds: elapsed, completed: false }).catch(() => {})
  }

  const remaining = Math.max(0, targetSeconds - elapsed)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? "0" : ""}${s}`
  }

  return (
    <div className="wellness-backdrop" onClick={onClose}>
      <div className="wellness-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wellness-close-btn" onClick={onClose} aria-label="Close activity">
          <Icon name="close" size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <span className="card-kicker">GUIDED WELLNESS · NERVOUS SYSTEM RESET</span>
          <h2 style={{ fontSize: "22px", margin: "6px 0 4px", color: "var(--navy)" }}>Guided Breathing</h2>
          <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 auto 16px", maxWidth: "420px" }}>
            A gentle 4-4-4-2 breathing cycle to signal safety to your nervous system. Breathe at your own comfortable depth.
          </p>

          {!completed ? (
            <>
              {!isRunning && elapsed === 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
                  <button
                    className={`button ${targetSeconds === 60 ? "primary" : "secondary"}`}
                    onClick={() => setTargetSeconds(60)}
                    style={{ fontSize: "11px", padding: "6px 14px" }}
                  >
                    1 Minute (60s)
                  </button>
                  <button
                    className={`button ${targetSeconds === 120 ? "primary" : "secondary"}`}
                    onClick={() => setTargetSeconds(120)}
                    style={{ fontSize: "11px", padding: "6px 14px" }}
                  >
                    2 Minutes (120s)
                  </button>
                </div>
              )}

              <div className="breathe-stage">
                <div className={`breathe-ring-outer ${isRunning ? phase : ""}`}>
                  <div className="breathe-circle-inner">
                    <p className="breathe-phase-text">{isRunning ? phaseText : "Ready"}</p>
                    <p className="breathe-seconds-text">{isRunning ? `${phaseSecondsLeft}s` : "Press Start"}</p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "16px", color: "var(--muted)", fontSize: "12px", margin: "14px 0" }}>
                <span>Remaining: <strong>{formatTime(remaining)}</strong></span>
                <span>•</span>
                <span>Elapsed: <strong>{formatTime(elapsed)}</strong></span>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "12px" }}>
                {!isRunning ? (
                  <Button onClick={() => setIsRunning(true)} icon="play">
                    {elapsed === 0 ? "Start breathing" : "Resume breathing"}
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setIsRunning(false)} icon="pause">
                    Pause
                  </Button>
                )}
                {elapsed > 0 && !completed && (
                  <Button variant="ghost" onClick={finishEarly}>
                    Finish early
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: "16px 0" }}>
              <EchoMascot mood="encouraging" size="md" />
              <h3 style={{ fontSize: "18px", color: "var(--navy)", margin: "14px 0 6px" }}>Breathing session complete</h3>
              <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "20px" }}>
                You completed {elapsed} seconds of mindful breathing. Take this calm breath with you into your day.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <Button onClick={onGoFeedback} icon="check">
                  How are you feeling now?
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WalkingActivityModal({ onClose, onGoFeedback }: { onClose: () => void; onGoFeedback: () => void }) {
  const [durationMinutes, setDurationMinutes] = useState<5 | 10 | 15>(10)
  const [status, setStatus] = useState<"ready" | "walking" | "paused" | "finished">("ready")
  const [elapsed, setElapsed] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [stoppedEarly, setStoppedEarly] = useState(false)

  const targetSeconds = durationMinutes * 60

  const tips = [
    "Feel the solid contact of each step against the floor or ground.",
    "Gently lift your gaze to look around: notice light, colors, and open space.",
    "Let your shoulders drop down away from your ears as you walk.",
    "Breathe naturally through your nose without trying to control the rhythm.",
    "Notice the movement in your arms and the gentle swing at your hips.",
    "Take this walk at your natural, comfortable pace — no rush required."
  ]

  useEffect(() => {
    if (status !== "walking") return
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1
        if (next >= targetSeconds) {
          setStatus("finished")
          logActivity({ activity_type: "walk", duration_seconds: next, completed: true }).catch(() => {})
        }
        return next
      })
    }, 1000)
    const tipTimer = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length)
    }, 18000)
    return () => {
      clearInterval(timer)
      clearInterval(tipTimer)
    }
  }, [status, targetSeconds, tips.length])

  const finishEarly = () => {
    setStatus("finished")
    setStoppedEarly(true)
    logActivity({ activity_type: "walk", duration_seconds: elapsed, completed: false }).catch(() => {})
  }

  const remaining = Math.max(0, targetSeconds - elapsed)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? "0" : ""}${s}`
  }

  return (
    <div className="wellness-backdrop" onClick={onClose}>
      <div className="wellness-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wellness-close-btn" onClick={onClose} aria-label="Close activity">
          <Icon name="close" size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <span className="card-kicker">WELLNESS ACTIVITY · MINDFUL MOVEMENT</span>
          <h2 style={{ fontSize: "22px", margin: "6px 0 4px", color: "var(--navy)" }}>Take a Mindful Walk</h2>
          <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 auto 16px", maxWidth: "440px" }}>
            A short walk gives your nervous system a shift in environment and physical circulation.
          </p>

          <div style={{ background: "#f6f5fc", padding: "8px 12px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "var(--muted)", marginBottom: "16px" }}>
            <Icon name="shield" size={14} />
            <span>Honest timer: This activity guides your time. No GPS or pedometer tracking required.</span>
          </div>

          {status !== "finished" ? (
            <>
              {status === "ready" && (
                <div style={{ margin: "14px 0" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--navy)", marginBottom: "8px" }}>Choose walk duration:</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                    {([5, 10, 15] as const).map((mins) => (
                      <button
                        key={mins}
                        className={`button ${durationMinutes === mins ? "primary" : "secondary"}`}
                        onClick={() => setDurationMinutes(mins)}
                        style={{ fontSize: "11px", padding: "7px 16px" }}
                      >
                        {mins} Minutes
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: "linear-gradient(135deg, #f4fbf8, #eaf7f2)", border: "1px solid #d5ece2", borderRadius: "20px", padding: "24px 20px", margin: "16px 0" }}>
                <p style={{ fontSize: "11px", color: "#378a73", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                  Mindful Walking Prompt
                </p>
                <p style={{ fontSize: "14px", color: "var(--navy)", fontWeight: 600, margin: "8px 0 0" }}>
                  &ldquo;{tips[tipIndex]}&rdquo;
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "20px", color: "var(--muted)", fontSize: "13px", margin: "16px 0" }}>
                <span>Remaining: <strong style={{ color: "var(--navy)" }}>{formatTime(remaining)}</strong></span>
                <span>•</span>
                <span>Completed: <strong style={{ color: "var(--navy)" }}>{formatTime(elapsed)}</strong></span>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                {status === "ready" && (
                  <Button onClick={() => setStatus("walking")} icon="play">
                    Start walk ({durationMinutes}m)
                  </Button>
                )}
                {status === "walking" && (
                  <>
                    <Button variant="secondary" onClick={() => setStatus("paused")} icon="pause">
                      Pause
                    </Button>
                    <Button variant="ghost" onClick={finishEarly}>
                      Finish early
                    </Button>
                  </>
                )}
                {status === "paused" && (
                  <>
                    <Button onClick={() => setStatus("walking")} icon="play">
                      Resume walk
                    </Button>
                    <Button variant="ghost" onClick={finishEarly}>
                      Finish early
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: "16px 0" }}>
              <EchoMascot mood="happy" size="md" />
              <h3 style={{ fontSize: "18px", color: "var(--navy)", margin: "14px 0 6px" }}>
                {stoppedEarly ? "Walk completed early" : "Walk completed!"}
              </h3>
              <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "20px" }}>
                You logged {formatTime(elapsed)} of walking movement. Even a few minutes can gently recharge your focus.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <Button onClick={onGoFeedback} icon="check">
                  How are you feeling now?
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GroundingActivityModal({ onClose, onGoFeedback }: { onClose: () => void; onGoFeedback: () => void }) {
  const [step, setStep] = useState(1)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const [startTime] = useState(Date.now())

  const steps = [
    {
      num: 5,
      sense: "SEE",
      instruction: "Look around you slowly and notice 5 distinct things you can see.",
      subtext: "It could be a shadow, a pattern on a book, a reflection, or a plant.",
      items: ["Item 1 in view", "Item 2 in view", "Item 3 in view", "Item 4 in view", "Item 5 in view"],
      icon: "sun" as IconName,
      color: "lavender"
    },
    {
      num: 4,
      sense: "FEEL",
      instruction: "Notice 4 physical sensations or textures you can feel right now.",
      subtext: "The fabric of your clothes, feet resting on the floor, air on your hands, or the chair supporting you.",
      items: ["Physical sensation 1", "Physical sensation 2", "Physical sensation 3", "Physical sensation 4"],
      icon: "spark" as IconName,
      color: "mint"
    },
    {
      num: 3,
      sense: "HEAR",
      instruction: "Listen for 3 separate sounds in or around your space.",
      subtext: "Distant hum of traffic, gentle air movement, ticking clock, or your own breath.",
      items: ["Sound 1", "Sound 2", "Sound 3"],
      icon: "volume" as IconName,
      color: "blue"
    },
    {
      num: 2,
      sense: "SMELL",
      instruction: "Notice 2 scents in the air, or recall a comforting fragrance.",
      subtext: "Fresh breeze, coffee, shampoo, crisp paper, or clean air.",
      items: ["Scent or pleasant memory 1", "Scent or pleasant memory 2"],
      icon: "heart" as IconName,
      color: "coral"
    },
    {
      num: 1,
      sense: "TASTE / AFFIRM",
      instruction: "Notice 1 taste in your mouth, or speak 1 gentle truth to yourself.",
      subtext: "A sip of water, lingering tea, or: 'I am safe in this moment and taking it one step at a time.'",
      items: ["1 grounding realization or affirmation"],
      icon: "check" as IconName,
      color: "yellow"
    }
  ]

  const current = steps[step - 1]

  const toggleItem = (k: string) => {
    setCheckedItems((prev) => ({ ...prev, [k]: !prev[k] }))
  }

  const completeExercise = () => {
    const elapsedSecs = Math.max(1, Math.round((Date.now() - startTime) / 1000))
    setFinished(true)
    logActivity({ activity_type: "grounding", duration_seconds: elapsedSecs, completed: true }).catch(() => {})
  }

  return (
    <div className="wellness-backdrop" onClick={onClose}>
      <div className="wellness-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wellness-close-btn" onClick={onClose} aria-label="Close activity">
          <Icon name="close" size={18} />
        </button>

        {!finished ? (
          <div>
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <span className="card-kicker">5-4-3-2-1 GROUNDING TECHNIQUE</span>
              <h2 style={{ fontSize: "20px", margin: "4px 0", color: "var(--navy)" }}>
                Step {step} of 5: Notice {current.num} things you can {current.sense}
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 auto", maxWidth: "420px" }}>
                {current.instruction}
              </p>
            </div>

            <div style={{ height: "6px", background: "#f0edf8", borderRadius: "10px", margin: "14px 0 20px", overflow: "hidden" }}>
              <div style={{ width: `${(step / 5) * 100}%`, height: "100%", background: "var(--primary)", transition: "width 0.3s ease" }} />
            </div>

            <div style={{ background: "#faf9fd", border: "1px solid #ebe8f7", borderRadius: "16px", padding: "18px", marginBottom: "18px" }}>
              <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "12px" }}>
                {current.subtext}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {current.items.map((item, idx) => {
                  const key = `${step}-${idx}`
                  const isChecked = !!checkedItems[key]
                  return (
                    <button
                      key={key}
                      onClick={() => toggleItem(key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: isChecked ? "#f0fbf7" : "white",
                        border: `1px solid ${isChecked ? "#4abb9f" : "#e3e0f0"}`,
                        padding: "8px 12px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "12px",
                        color: isChecked ? "#2c7a67" : "var(--ink)",
                      }}
                    >
                      <span
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: `1.5px solid ${isChecked ? "#4abb9f" : "#b8b4cf"}`,
                          background: isChecked ? "#4abb9f" : "white",
                          display: "grid",
                          placeItems: "center",
                          color: "white",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        {isChecked && "✓"}
                      </span>
                      <span>{item}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
                Previous
              </Button>
              <div style={{ display: "flex", gap: "8px" }}>
                {step < 5 ? (
                  <Button onClick={() => setStep((s) => s + 1)} icon="arrow">
                    Next step
                  </Button>
                ) : (
                  <Button onClick={completeExercise} icon="check">
                    Finish grounding
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <EchoMascot mood="calm" size="md" />
            <h3 style={{ fontSize: "18px", color: "var(--navy)", margin: "14px 0 6px" }}>Grounding completed</h3>
            <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "20px" }}>
              You reconnected your senses with the present moment. You can return to this simple 5-step practice anytime your thoughts feel overwhelming.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <Button onClick={onGoFeedback} icon="check">
                How are you feeling now?
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StretchingActivityModal({ onClose, onGoFeedback }: { onClose: () => void; onGoFeedback: () => void }) {
  const [stretchIndex, setStretchIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [isRunning, setIsRunning] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [startTime] = useState(Date.now())

  const stretches = [
    {
      title: "Gentle Neck Tilts",
      instructions: "Sit upright. Slowly let your right ear tilt toward your right shoulder until you feel a comfortable release along the left neck. Hold for 15 seconds, then repeat on the opposite side.",
      safety: "Never pull or force your head. Move softly within your easy range."
    },
    {
      title: "Shoulder Rolls & Opens",
      instructions: "Inhale as you lift both shoulders up toward your ears, then roll them back and down with an exhale. Repeat in smooth, slow circles to release accumulated desk tension.",
      safety: "Keep your breathing relaxed and jaw unclenched."
    },
    {
      title: "Seated Spinal Twist",
      instructions: "Place your right hand on your left outer thigh or chair rest. Gently turn your chest to the left while keeping your spine long. Breathe deeply for 15s, then softly switch to the right.",
      safety: "Do not twist forcefully. Only rotate as far as feels gentle and comfortable."
    },
    {
      title: "Wrist & Forearm Release",
      instructions: "Extend your left arm straight forward with fingers pointing down. Use your right hand to lightly press your left fingers toward you. Switch arms after 15 seconds.",
      safety: "Keep the stretch mild. Great for keyboard and typing fatigue."
    }
  ]

  const current = stretches[stretchIndex]

  useEffect(() => {
    if (!isRunning || completed) return
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (stretchIndex < stretches.length - 1) {
            setStretchIndex((i) => i + 1)
            return 30
          } else {
            setIsRunning(false)
            setCompleted(true)
            const elapsed = Math.round((Date.now() - startTime) / 1000)
            logActivity({ activity_type: "stretch", duration_seconds: elapsed, completed: true }).catch(() => {})
            return 0
          }
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning, stretchIndex, completed, stretches.length, startTime])

  const nextStretch = () => {
    if (stretchIndex < stretches.length - 1) {
      setStretchIndex((i) => i + 1)
      setSecondsLeft(30)
    } else {
      setIsRunning(false)
      setCompleted(true)
    }
  }

  const prevStretch = () => {
    if (stretchIndex > 0) {
      setStretchIndex((i) => i - 1)
      setSecondsLeft(30)
    }
  }

  return (
    <div className="wellness-backdrop" onClick={onClose}>
      <div className="wellness-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wellness-close-btn" onClick={onClose} aria-label="Close activity">
          <Icon name="close" size={18} />
        </button>

        {!completed ? (
          <div>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span className="card-kicker">GENTLE MOVEMENT · PHYSICAL RELEASE</span>
              <h2 style={{ fontSize: "20px", margin: "4px 0", color: "var(--navy)" }}>
                {stretchIndex + 1} of {stretches.length}: {current.title}
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "11px", margin: 0 }}>
                Accessible seated stretches to ease muscle tension. Stop immediately if you feel pain.
              </p>
            </div>

            <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
              {stretches.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: "5px",
                    borderRadius: "4px",
                    background: idx === stretchIndex ? "var(--primary)" : idx < stretchIndex ? "#4abb9f" : "#e9e7f4",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>

            <div style={{ background: "#fbfaff", border: "1px solid #ebe8f7", borderRadius: "18px", padding: "20px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
                  Movement Guidance
                </span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>
                  {secondsLeft}s
                </span>
              </div>
              <p style={{ fontSize: "13px", lineHeight: "1.6", color: "var(--ink)", margin: "0 0 12px" }}>
                {current.instructions}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--muted)" }}>
                <Icon name="shield" size={14} />
                <span>{current.safety}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Button variant="ghost" disabled={stretchIndex === 0} onClick={prevStretch}>
                Previous
              </Button>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button variant="secondary" onClick={() => setIsRunning(!isRunning)} icon={isRunning ? "pause" : "play"}>
                  {isRunning ? "Pause" : "Resume"}
                </Button>
                <Button onClick={nextStretch} icon="arrow">
                  {stretchIndex === stretches.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <EchoMascot mood="happy" size="md" />
            <h3 style={{ fontSize: "18px", color: "var(--navy)", margin: "14px 0 6px" }}>Stretching sequence complete</h3>
            <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "20px" }}>
              Great job releasing muscle tension. Gentle movement reminds your body to relax its physical guard.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <Button onClick={onGoFeedback} icon="check">
                How are you feeling now?
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function JournalActivityModal({ onClose }: { onClose: () => void }) {
  const [selectedPrompt, setSelectedPrompt] = useState("What has been on your mind today?")
  const [content, setContent] = useState("")
  const [entries, setEntries] = useState<JournalEntryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)

  const presetPrompts = [
    "What has been on your mind today?",
    "What is one small thing that brought you relief recently?",
    "Describe how your body feels right now without judging it.",
    "What would you tell a trusted friend having a day like yours?",
    "Write freely without any prompt"
  ]

  useEffect(() => {
    setLoading(true)
    fetchJournalEntries()
      .then((res) => {
        if (res.success && Array.isArray(res.entries)) {
          setEntries(res.entries)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!content.trim()) {
      setErrorNotice("Please write something before saving.")
      return
    }
    setErrorNotice(null)
    setSaving(true)
    const promptToSave = selectedPrompt === "Write freely without any prompt" ? "Free reflection" : selectedPrompt

    try {
      const res = await saveJournalEntry({
        prompt: promptToSave,
        content: content.trim()
      })
      if (res.success && res.entry) {
        setEntries([res.entry, ...entries])
        setContent("")
        setSuccessNotice("Your reflection was saved securely to your account.")
        logActivity({ activity_type: "journal", duration_seconds: 60, completed: true }).catch(() => {})
      }
    } catch (err: any) {
      setErrorNotice(err?.message || "Failed to save journal entry. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => {
    if (content.trim() && !window.confirm("Are you sure you want to clear your current text?")) {
      return
    }
    setContent("")
    setErrorNotice(null)
    setSuccessNotice(null)
  }

  return (
    <div className="wellness-backdrop" onClick={onClose}>
      <div className="wellness-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wellness-close-btn" onClick={onClose} aria-label="Close activity">
          <Icon name="close" size={18} />
        </button>

        <span className="card-kicker">PRIVATE EXPRESSION · JOURNALING</span>
        <h2 style={{ fontSize: "20px", margin: "4px 0 6px", color: "var(--navy)" }}>Write it out</h2>
        <p style={{ color: "var(--muted)", fontSize: "11px", marginBottom: "14px" }}>
          Putting feelings into words helps your mind process and organize emotions. Stored privately on your account.
        </p>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "6px" }}>
            Choose a reflection prompt:
          </label>
          <select
            value={selectedPrompt}
            onChange={(e) => {
              setSelectedPrompt(e.target.value)
              setSuccessNotice(null)
            }}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "12px",
              border: "1px solid #dcd9ec",
              fontSize: "12px",
              background: "white",
              color: "var(--ink)",
              outline: "none",
            }}
          >
            {presetPrompts.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div style={{ position: "relative", marginBottom: "10px" }}>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setErrorNotice(null)
              setSuccessNotice(null)
            }}
            placeholder="Type whatever you are experiencing right now. No formatting, no grading, no right answers..."
            rows={5}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "14px",
              border: "1px solid #dcd9ec",
              fontSize: "13px",
              lineHeight: "1.5",
              color: "var(--ink)",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>
            <span>Words: {content.trim() ? content.trim().split(/\s+/).length : 0} · Characters: {content.length}</span>
            <span>Private & confidential</span>
          </div>
        </div>

        {successNotice && (
          <div style={{ background: "#eefbf6", color: "#257a5e", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="check" size={14} />
            <span>{successNotice}</span>
          </div>
        )}
        {errorNotice && (
          <div style={{ background: "#fdf2f2", color: "#c0392b", padding: "8px 12px", borderRadius: "10px", fontSize: "11px", marginBottom: "10px" }}>
            {errorNotice}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <Button variant="ghost" onClick={handleClear} disabled={!content.trim()}>
            Clear
          </Button>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={saving || !content.trim()} icon="check">
              {saving ? "Saving..." : "Save reflection"}
            </Button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--navy)", margin: "0 0 10px" }}>
            Past reflections ({entries.length})
          </h4>
          {loading ? (
            <p style={{ fontSize: "11px", color: "var(--muted)" }}>Loading journal history...</p>
          ) : entries.length === 0 ? (
            <p style={{ fontSize: "11px", color: "var(--muted)" }}>No saved journal reflections yet. Your saved entries will be listed here.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "160px", overflowY: "auto" }}>
              {entries.map((entry) => (
                <div key={entry.id} style={{ background: "#faf9fd", border: "1px solid #ebe8f7", borderRadius: "10px", padding: "8px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted)", marginBottom: "4px" }}>
                    <strong style={{ color: "var(--primary)" }}>{entry.prompt}</strong>
                    <span>{entry.formatted_date || entry.created_at.slice(0, 10)}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--ink)", margin: 0, whiteSpace: "pre-wrap" }}>
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MusicActivityModal({ onClose }: { onClose: () => void }) {
  const [showPreferences, setShowPreferences] = useState(false)
  const [selectedIntent, setSelectedIntent] = useState("relax")
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Calm and relaxing", "Lo-fi"])
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [statusInfo, setStatusInfo] = useState<SpotifyStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const intents = [
    { key: "relax", label: "Relax" },
    { key: "mood", label: "Improve my mood" },
    { key: "focus", label: "Focus and study" },
    { key: "motivate", label: "Feel motivated" },
    { key: "unwind", label: "Unwind before sleep" },
  ]

  const genreOptions = [
    "Calm and relaxing",
    "Instrumental",
    "Lo-fi",
    "Classical",
    "Nature sounds",
    "Happy and uplifting",
    "Motivational",
    "Focus and study",
    "Acoustic",
  ]

  const loadMusic = async (intent: string, genres: string[]) => {
    setLoading(true)
    if (audioRef.current) {
      audioRef.current.pause()
      setPlayingId(null)
    }
    try {
      const [tracksRes, statusRes] = await Promise.all([
        fetchMusicTracks(intent, genres),
        fetchSpotifyStatus(),
      ])
      if (tracksRes.success && Array.isArray(tracksRes.tracks)) {
        setTracks(tracksRes.tracks)
      }
      setStatusInfo(statusRes)
      logActivity({ activity_type: "music", duration_seconds: 120, completed: true }).catch(() => {})
    } catch (_err) {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMusicPreferences()
      .then((res) => {
        if (res.success && res.preferences) {
          if (res.preferences.intent) setSelectedIntent(res.preferences.intent)
          if (Array.isArray(res.preferences.genres) && res.preferences.genres.length > 0) {
            setSelectedGenres(res.preferences.genres)
          }
          loadMusic(res.preferences.intent || "relax", res.preferences.genres || ["Calm and relaxing"])
        } else {
          loadMusic("relax", ["Calm and relaxing", "Lo-fi"])
        }
      })
      .catch(() => {
        loadMusic("relax", ["Calm and relaxing", "Lo-fi"])
      })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genre))
      }
    } else {
      setSelectedGenres([...selectedGenres, genre])
    }
  }

  const handleSavePreferences = async () => {
    setShowPreferences(false)
    updateMusicPreferences({ intent: selectedIntent, genres: selectedGenres }).catch(() => {})
    loadMusic(selectedIntent, selectedGenres)
  }

  const togglePlayTrack = (track: SpotifyTrack) => {
    if (!track.preview_url) {
      window.open(track.spotify_url, "_blank")
      return
    }

    if (playingId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setPlayingId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(track.preview_url)
      audioRef.current = audio
      audio.play().catch(() => {})
      audio.onended = () => setPlayingId(null)
      setPlayingId(track.id)
    }
  }

  return (
    <div className="wellness-backdrop" onClick={onClose}>
      <div className="wellness-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wellness-close-btn" onClick={onClose} aria-label="Close activity">
          <Icon name="close" size={18} />
        </button>

        <span className="card-kicker">SPOTIFY INTEGRATION · SOUND THERAPY</span>
        <h2 style={{ fontSize: "20px", margin: "4px 0 6px", color: "var(--navy)" }}>Music Reset</h2>
        <p style={{ color: "var(--muted)", fontSize: "11px", marginBottom: "14px" }}>
          Curated soothing Spotify music aligned with your nervous system rhythm.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f7fd", padding: "10px 14px", borderRadius: "12px", marginBottom: "14px" }}>
          <div>
            <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Active Mood Goal:</span>
            <strong style={{ fontSize: "12px", color: "var(--primary)", display: "block" }}>
              {intents.find((i) => i.key === selectedIntent)?.label || selectedIntent}
            </strong>
          </div>
          <Button variant="secondary" onClick={() => setShowPreferences(!showPreferences)}>
            {showPreferences ? "Close filter" : "Change preferences"}
          </Button>
        </div>

        {showPreferences && (
          <div style={{ background: "#ffffff", border: "1px solid #e1deef", borderRadius: "16px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--navy)", margin: "0 0 8px" }}>
              What is your intention right now?
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
              {intents.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSelectedIntent(item.key)}
                  className={`button ${selectedIntent === item.key ? "primary" : "secondary"}`}
                  style={{ fontSize: "10px", padding: "5px 12px" }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--navy)", margin: "0 0 8px" }}>
              What kind of music would help you right now?
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
              {genreOptions.map((g) => {
                const isSelected = selectedGenres.includes(g)
                return (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    style={{
                      border: `1px solid ${isSelected ? "var(--primary)" : "#d8d4ec"}`,
                      background: isSelected ? "var(--primary)" : "white",
                      color: isSelected ? "white" : "var(--ink)",
                      borderRadius: "16px",
                      padding: "5px 12px",
                      fontSize: "10px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {g}
                  </button>
                )
              })}
            </div>

            <Button onClick={handleSavePreferences} icon="check">
              Apply music preferences
            </Button>
          </div>
        )}

        {statusInfo && (
          <div style={{ background: "#f2fbf6", border: "1px solid #d0f0df", borderRadius: "12px", padding: "8px 12px", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="spotify-badge">Spotify API</span>
              <span style={{ color: "#257a5e", fontWeight: 600 }}>
                {statusInfo.catalog_access === "active" ? "Live Spotify Catalog" : "Verified Spotify Wellness Catalog"}
              </span>
            </div>
            <span style={{ color: "var(--muted)" }}>
              {statusInfo.playback_support === "previews_and_deeplinks" ? "Previews & App deep links" : "Open in Spotify Player"}
            </span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted)", fontSize: "12px" }}>
            Finding peaceful Spotify recommendations...
          </div>
        ) : tracks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "var(--muted)", fontSize: "12px" }}>
            No tracks found for this selection. Try choosing another intention or genre.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "260px", overflowY: "auto", paddingRight: "4px" }}>
            {tracks.map((track) => {
              const isThisPlaying = playingId === track.id
              return (
                <div key={track.id} className={`spotify-track-card ${isThisPlaying ? "is-active" : ""}`}>
                  {track.album_art ? (
                    <img src={track.album_art} alt={track.title} className="spotify-art" />
                  ) : (
                    <div className="spotify-art" style={{ display: "grid", placeItems: "center", color: "#8a86a0" }}>
                      <Icon name="heart" size={18} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: "block", fontSize: "12px", color: "var(--navy)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {track.title}
                    </strong>
                    <small style={{ color: "var(--muted)", fontSize: "10px", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {track.artist} · {track.album}
                    </small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    {track.has_preview && track.preview_url ? (
                      <button
                        onClick={() => togglePlayTrack(track)}
                        style={{
                          background: isThisPlaying ? "var(--primary)" : "#1db954",
                          color: "white",
                          border: 0,
                          borderRadius: "50%",
                          width: "32px",
                          height: "32px",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                        title={isThisPlaying ? "Pause preview" : "Play preview"}
                        aria-label={isThisPlaying ? "Pause preview" : "Play preview"}
                      >
                        <Icon name={isThisPlaying ? "pause" : "play"} size={14} />
                      </button>
                    ) : (
                      <a
                        href={track.spotify_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: "#1db954",
                          color: "white",
                          borderRadius: "14px",
                          padding: "5px 10px",
                          fontSize: "10px",
                          fontWeight: 700,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        Open Spotify
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function HydrateActivityModal({ onClose, onGoFeedback }: { onClose: () => void; onGoFeedback: () => void }) {
  const [completed, setCompleted] = useState(false)

  const handleFinish = () => {
    setCompleted(true)
    logActivity({ activity_type: "hydrate", duration_seconds: 60, completed: true }).catch(() => {})
  }

  return (
    <div className="wellness-backdrop" onClick={onClose}>
      <div className="wellness-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wellness-close-btn" onClick={onClose} aria-label="Close activity">
          <Icon name="close" size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <span className="card-kicker">SIMPLE BASICS · WATER RESET</span>
          <h2 style={{ fontSize: "20px", margin: "4px 0 6px", color: "var(--navy)" }}>Mindful Hydration</h2>
          <p style={{ color: "var(--muted)", fontSize: "11px", margin: "0 auto 16px", maxWidth: "400px" }}>
            A 2-minute water break replenishes brain hydration and breaks muscular tension.
          </p>

          {!completed ? (
            <div style={{ textAlign: "left", background: "#f3f8fd", border: "1px solid #d5e7f7", borderRadius: "18px", padding: "18px", marginBottom: "18px" }}>
              <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", lineHeight: "1.8", color: "var(--ink)" }}>
                <li>Pour yourself a full glass of fresh water (cool or room temperature).</li>
                <li>Notice the temperature of the glass resting in your hand.</li>
                <li>Take slow, deliberate sips, noticing the cool sensation in your mouth and throat.</li>
                <li>Exhale gently, relax your forehead and jaw, and return refreshed.</li>
              </ol>
              <div style={{ marginTop: "18px", textAlign: "center" }}>
                <Button onClick={handleFinish} icon="check">
                  I drank a glass of water
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 0" }}>
              <EchoMascot mood="happy" size="md" />
              <h3 style={{ fontSize: "18px", color: "var(--navy)", margin: "14px 0 6px" }}>Hydration break logged</h3>
              <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "20px" }}>
                Small daily moments of care add up. Thank your body for taking this moment.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <Button onClick={onGoFeedback} icon="check">
                  How are you feeling now?
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TalkActivityModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="wellness-backdrop" onClick={onClose}>
      <div className="wellness-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wellness-close-btn" onClick={onClose} aria-label="Close activity">
          <Icon name="close" size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <span className="card-kicker">HUMAN CONNECTION · SUPPORT DIRECTORY</span>
          <h2 style={{ fontSize: "20px", margin: "4px 0 6px", color: "var(--navy)" }}>Talk to Someone</h2>
          <p style={{ color: "var(--muted)", fontSize: "11px", margin: "0 auto 16px", maxWidth: "420px" }}>
            You do not have to carry everything by yourself. Choose the pace and kind of conversation that feels right.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left", marginBottom: "18px" }}>
            <div
              style={{ background: "#fbfaff", border: "1px solid #ebe8f7", borderRadius: "14px", padding: "14px", cursor: "pointer" }}
              onClick={() => { onClose(); go("counsellors"); }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "var(--navy)", display: "block" }}>Find a Counsellor</strong>
                  <small style={{ color: "var(--muted)", fontSize: "11px" }}>Browse qualified well-being professionals and therapists.</small>
                </div>
                <Icon name="arrow" size={16} />
              </div>
            </div>

            <div
              style={{ background: "#fbfaff", border: "1px solid #ebe8f7", borderRadius: "14px", padding: "14px", cursor: "pointer" }}
              onClick={() => { onClose(); go("circle"); }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "var(--navy)", display: "block" }}>ECHO Circle Supporters</strong>
                  <small style={{ color: "var(--muted)", fontSize: "11px" }}>Reach out to your trusted friends, family, or mentors.</small>
                </div>
                <Icon name="arrow" size={16} />
              </div>
            </div>

            <div style={{ background: "#fff8f7", border: "1px solid #f9deda", borderRadius: "14px", padding: "14px" }}>
              <strong style={{ fontSize: "12px", color: "#c0392b", display: "block", marginBottom: "4px" }}>
                24/7 Verified Crisis & Well-being Helplines:
              </strong>
              <div style={{ fontSize: "11px", color: "var(--ink)", lineHeight: "1.6" }}>
                <div>• Tele-MANAS (Govt. of India): <strong>14416</strong> or <strong>1800-891-4416</strong></div>
                <div>• Vandrevala Foundation: <strong>+91 9999 666 555</strong></div>
                <div>• AASRA: <strong>+91 98204 66726</strong></div>
              </div>
            </div>
          </div>

          <Button variant="secondary" onClick={onClose}>
            Back to support
          </Button>
        </div>
      </div>
    </div>
  )
}

function Support() {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const supports = [
    [
      "Breathe",
      "5 min",
      "Settle your nervous system with a gentle rhythm.",
      "pulse",
      "mint",
    ],
    [
      "Take a walk",
      "10 min",
      "A small change of scene for your energy.",
      "sun",
      "yellow",
    ],
    [
      "Grounding 5-4-3-2-1",
      "5 min",
      "Re-anchor to the physical room around you.",
      "focus",
      "lavender",
    ],
    [
      "Gentle stretch",
      "5 min",
      "Release tension with gentle guided movement.",
      "spark",
      "mint",
    ],
    [
      "Music reset",
      "10 min",
      "Spotify recommendations to match your rhythm.",
      "heart",
      "coral",
    ],
    [
      "Write it out",
      "5 min",
      "Give your thoughts somewhere to land.",
      "report",
      "lavender",
    ],
    ["Hydrate", "2 min", "A simple reset for body and focus.", "spark", "blue"],
    [
      "Talk to someone",
      "Your pace",
      "Reach out to a person you trust.",
      "people",
      "mint",
    ],
  ]
  return (
    <>
      <PageHeading
        eyebrow="YOUR SUPPORT SPACE"
        title="A few things that may help today."
        text="Chosen from your recent rhythm. Pick what feels possible — not perfect."
      />
      <div className="support-hero">
        <div>
          <span className="card-kicker">ECHO’S PICK FOR YOU</span>
          <h2>A short breathing reset.</h2>
          <p>
            Your stress has been slightly above baseline. Five quiet minutes may
            help create a little space.
          </p>
          <Button onClick={() => setActiveModal("Breathe")} icon="arrow">
            Try it now
          </Button>
        </div>
        <EchoMascot mood="calm" size="md" />
      </div>
      <div className="support-grid">
        {supports.map(([title, time, text, icon, color]) => (
          <button
            key={title}
            className="support-card"
            onClick={() => setActiveModal(title)}
          >
            <span className={`support-icon ${color}`}>
              <Icon name={icon as IconName} />
            </span>
            <span className="duration">{time}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <span className="try-link">
              Try activity <Icon name="arrow" size={15} />
            </span>
          </button>
        ))}
      </div>
      <div className="nutrition-note">
        <Icon name="heart" />
        <div>
          <h3>Gentle basics still matter.</h3>
          <p>
            Regular meals, water, movement breaks, and adequate rest can support
            general well-being. These are supportive ideas, not medical
            treatment.
          </p>
        </div>
      </div>

      {activeModal === "Breathe" && (
        <BreathingActivityModal onClose={() => setActiveModal(null)} onGoFeedback={() => go("feedback")} />
      )}
      {activeModal === "Take a walk" && (
        <WalkingActivityModal onClose={() => setActiveModal(null)} onGoFeedback={() => go("feedback")} />
      )}
      {activeModal === "Grounding 5-4-3-2-1" && (
        <GroundingActivityModal onClose={() => setActiveModal(null)} onGoFeedback={() => go("feedback")} />
      )}
      {activeModal === "Gentle stretch" && (
        <StretchingActivityModal onClose={() => setActiveModal(null)} onGoFeedback={() => go("feedback")} />
      )}
      {activeModal === "Music reset" && (
        <MusicActivityModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "Write it out" && (
        <JournalActivityModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "Hydrate" && (
        <HydrateActivityModal onClose={() => setActiveModal(null)} onGoFeedback={() => go("feedback")} />
      )}
      {activeModal === "Talk to someone" && (
        <TalkActivityModal onClose={() => setActiveModal(null)} />
      )}
    </>
  )
}


function Feedback() {
  const [helpful, setHelpful] = useState("Helpful")
  return (
    <div className="focused-page">
      <div className="focused-card">
        <div className="focused-echo">
          <EchoMascot mood="encouraging" size="md" />
        </div>
        <span className="eyebrow">
          <Icon name="spark" size={15} /> ACTIVITY COMPLETE
        </span>
        <h1>How are you feeling now?</h1>
        <p>Noticing what changed helps ECHO learn what works for you.</p>
        <div className="before-after">
          {[
            ["Mood", "5", "7", "+2"],
            ["Stress", "7", "5", "−2"],
            ["Energy", "5", "6", "+1"],
          ].map(([label, before, after, delta]) => (
            <div key={label}>
              <span>{label}</span>
              <div>
                <small>Before</small>
                <strong>{before}</strong>
                <i />
                <small>After</small>
                <strong>{after}</strong>
                <em>{delta}</em>
              </div>
            </div>
          ))}
        </div>
        <h3>Was this helpful?</h3>
        <div className="feedback-options">
          {["Very helpful", "Helpful", "A little helpful", "Not helpful"].map(
            (o) => (
              <button
                className={helpful === o ? "selected" : ""}
                onClick={() => setHelpful(o)}
                key={o}
              >
                {o}
                <i>
                  <Icon name="check" size={13} />
                </i>
              </button>
            ),
          )}
        </div>
        <h3>Would you like more support?</h3>
        <div className="support-links">
          <button onClick={() => go("user-dashboard")}>I’m okay now</button>
          <button onClick={() => go("support")}>More activities</button>
          <button onClick={() => go("circle")}>Talk to someone</button>
        </div>
      </div>
    </div>
  )
}

interface Counsellor {
  id: string
  name: string
  title: string
  avatarBg: string
  avatarInitials: string
  specializations: string[]
  categories: string[]
  experience: string
  location: string
  languages: string
  rating: number
  sessionsCount: number
  description: string
  about: string
  approach: string
  availability: string
  sessionFormat: string
  focusTags: string[]
}

const DEMO_COUNSELLORS: Counsellor[] = [
  {
    id: "ananya-rao",
    name: "Dr. Ananya Rao",
    title: "Clinical Psychologist, Ph.D.",
    avatarBg: "linear-gradient(135deg, #7974f4, #5752d9)",
    avatarInitials: "AR",
    specializations: ["Stress & Anxiety", "Student Wellbeing", "Academic Burnout"],
    categories: ["Clinical Psychology", "Student Support", "Stress & Anxiety"],
    experience: "8+ years experience",
    location: "Online • Chennai",
    languages: "English • Tamil",
    rating: 4.9,
    sessionsCount: 184,
    description: "Helps young adults and students navigate academic pressure, life transitions, and anxiety using empathetic CBT frameworks.",
    about: "Dr. Ananya Rao is a clinical psychologist dedicated to helping university students and early-career individuals find grounded clarity during high-stress periods. Her approach emphasizes self-compassion, cognitive reframing, and sustainable daily habits.",
    approach: "Cognitive Behavioral Therapy (CBT), Mindfulness-Based Stress Reduction, Acceptance & Commitment Therapy (ACT).",
    availability: "Mon – Fri • 10:00 AM – 6:00 PM",
    sessionFormat: "Online & In-person",
    focusTags: ["Stress management", "Anxiety support", "Student wellbeing", "Life transitions"],
  },
  {
    id: "vikramaditya-sengupta",
    name: "Vikramaditya Sengupta",
    title: "Licensed Counselling Psychologist",
    avatarBg: "linear-gradient(135deg, #48b1a3, #2f9486)",
    avatarInitials: "VS",
    specializations: ["Student Support", "Exam Anxiety", "Emotional Regulation"],
    categories: ["Counselling", "Student Support", "Stress & Anxiety"],
    experience: "6+ years experience",
    location: "Online • Bengaluru",
    languages: "English • Hindi • Bengali",
    rating: 4.8,
    sessionsCount: 142,
    description: "Specializes in college student challenges, exam anxiety, emotional regulation, and building confident self-talk.",
    about: "Vikramaditya holds a Master's in Counselling Psychology. He works closely with undergraduate and postgraduate students navigating performance pressure, identity development, and emotional overwhelm in a supportive atmosphere.",
    approach: "Person-Centered Therapy, Solution-Focused Brief Therapy (SFBT), Narrative Therapy.",
    availability: "Tue – Sat • 11:00 AM – 7:00 PM",
    sessionFormat: "Online only",
    focusTags: ["Exam stress", "Procrastination", "Confidence building", "Emotional balance"],
  },
  {
    id: "priya-nambiar",
    name: "Priya Nambiar",
    title: "Senior Psychotherapist & Family Specialist",
    avatarBg: "linear-gradient(135deg, #ef8c87, #d96f69)",
    avatarInitials: "PN",
    specializations: ["Relationship Support", "Family Dynamics", "Interpersonal Boundaries"],
    categories: ["Relationship Support", "Family Support", "Counselling"],
    experience: "10+ years experience",
    location: "Online • Kochi",
    languages: "English • Malayalam • Hindi",
    rating: 4.9,
    sessionsCount: 230,
    description: "Focuses on interpersonal communication, boundary setting, family expectations, and emotional resilience.",
    about: "Priya has supported individuals and young adults through intricate interpersonal crossroads. Her sessions provide a safe, non-judgmental space to express difficult feelings and build stronger boundaries.",
    approach: "Systemic Family Therapy, Emotion-Focused Therapy (EFT), Attachment-Informed Care.",
    availability: "Mon – Thu • 2:00 PM – 8:00 PM",
    sessionFormat: "Online & In-person",
    focusTags: ["Family pressure", "Relationship challenges", "Healthy boundaries", "Grief & loss"],
  },
  {
    id: "farhan-siddiqui",
    name: "Dr. Farhan Siddiqui",
    title: "Consultant Clinical Psychologist",
    avatarBg: "linear-gradient(135deg, #e5a438, #c88924)",
    avatarInitials: "FS",
    specializations: ["Stress & Burnout", "Mood Regulation", "Somatic Grounding"],
    categories: ["Clinical Psychology", "Stress & Anxiety"],
    experience: "12+ years experience",
    location: "Online • Hyderabad",
    languages: "English • Hindi • Telugu",
    rating: 4.9,
    sessionsCount: 340,
    description: "Evidence-based mindfulness and cognitive restructuring for chronic stress, academic burnout, and mood fluctuations.",
    about: "Dr. Farhan has over a decade of clinical experience. He specializes in helping students and professionals de-escalate acute tension, untangle negative thinking, and recover emotional rhythm.",
    approach: "Dialectical Behavior Therapy (DBT) skills, Mindfulness practices, Somatic awareness.",
    availability: "Mon – Sat • 9:00 AM – 4:00 PM",
    sessionFormat: "Online & In-person",
    focusTags: ["Chronic burnout", "Mood swings", "Nervous system regulation", "Work-life balance"],
  },
  {
    id: "meera-krishnaswamy",
    name: "Meera Krishnaswamy",
    title: "Career & Student Wellbeing Counsellor",
    avatarBg: "linear-gradient(135deg, #716adf, #4c46ab)",
    avatarInitials: "MK",
    specializations: ["Student Support", "Career Transitions", "Decision Fatigue"],
    categories: ["Student Support", "Counselling"],
    experience: "5+ years experience",
    location: "Online • Pune",
    languages: "English • Marathi • Hindi",
    rating: 4.7,
    sessionsCount: 115,
    description: "Supports students dealing with career crossroads, campus adjustment, peer comparison, and time-management pressure.",
    about: "Meera combines career guidance with emotional wellbeing counselling. She helps students translate anxiety about the future into concrete, compassionate, and actionable steps.",
    approach: "Humanistic Therapy, Rational Emotive Behavior Therapy (REBT), Values-driven goal setting.",
    availability: "Wed – Sun • 12:00 PM – 7:00 PM",
    sessionFormat: "Online only",
    focusTags: ["Future anxiety", "Career uncertainty", "Campus adjustment", "Self-worth"],
  },
  {
    id: "siddharth-nair",
    name: "Siddharth Nair",
    title: "Systemic Family & Youth Counsellor",
    avatarBg: "linear-gradient(135deg, #44a89d, #27857b)",
    avatarInitials: "SN",
    specializations: ["Family Support", "Intergenerational Conflict", "Life Transitions"],
    categories: ["Family Support", "Relationship Support"],
    experience: "7+ years experience",
    location: "Online • Mumbai",
    languages: "English • Hindi",
    rating: 4.8,
    sessionsCount: 165,
    description: "Works with individuals and families navigating generational misunderstandings, parental expectations, and change.",
    about: "Siddharth specializes in helping young adults articulate their feelings constructively to family members, reducing household friction and creating mutual empathy.",
    approach: "Structural Family Therapy, Compassionate Inquiry, Communication skill coaching.",
    availability: "Mon – Fri • 1:00 PM – 8:00 PM",
    sessionFormat: "Online & In-person",
    focusTags: ["Family conflict", "Parental pressure", "Identity exploration", "Healthy communication"],
  },
  {
    id: "shalini-banerjee",
    name: "Dr. Shalini Banerjee",
    title: "Mind-Body Health Psychologist",
    avatarBg: "linear-gradient(135deg, #e87b74, #b9524c)",
    avatarInitials: "SB",
    specializations: ["Stress & Anxiety", "Sleep Support", "Nervous System Health"],
    categories: ["Stress & Anxiety", "Counselling", "Clinical Psychology"],
    experience: "9+ years experience",
    location: "Online • Kolkata",
    languages: "English • Bengali • Hindi",
    rating: 4.9,
    sessionsCount: 198,
    description: "Blends somatic calming practices with cognitive therapy to help unknot sleep disruption and physiological stress.",
    about: "Dr. Shalini focuses on the mind-body axis. When stress shows up as restless sleep, physical tension, or racing thoughts, her structured somatic tools help restore nervous system balance.",
    approach: "Integrative Somatic Therapy, Cognitive Behavioral Therapy for Insomnia (CBT-I), Guided Relaxation.",
    availability: "Tue – Sat • 10:00 AM – 5:00 PM",
    sessionFormat: "Online only",
    focusTags: ["Restless sleep", "Physical stress symptoms", "Mindfulness", "Emotional grounding"],
  },
]

const COUNSELLOR_CATEGORIES = [
  "All",
  "Counselling",
  "Clinical Psychology",
  "Student Support",
  "Stress & Anxiety",
  "Relationship Support",
  "Family Support",
]

function Counsellors() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [profileModal, setProfileModal] = useState<Counsellor | null>(null)
  const [connectModal, setConnectModal] = useState<Counsellor | null>(null)
  const [showEmergency, setShowEmergency] = useState(false)

  const latestCheckIn = getLatestCheckInData()

  // Determine personalized introduction text based on self-reported check-in
  let introEchoMessage = "Finding the right person to talk to can make things feel a little lighter. Take your time discovering someone you connect with."
  let recommendedReason = "Featured professionals who work frequently with university students and young adults."
  let recommendedIds = ["ananya-rao", "vikramaditya-sengupta"]

  if (latestCheckIn) {
    if (latestCheckIn.stress >= 7) {
      introEchoMessage = "Based on your recent check-in, you may find it helpful to explore counsellors who focus on stress management and finding steady ground."
      recommendedReason = "Focus on stress reduction, academic burnout, and emotional regulation."
      recommendedIds = ["ananya-rao", "farhan-siddiqui"]
    } else if (latestCheckIn.sleep <= 4) {
      introEchoMessage = "Based on your recent check-in, you may find it supportive to explore professionals who help with sleep, rest, and restoring physical rhythm."
      recommendedReason = "Focus on restorative rest, sleep habits, and somatic calming."
      recommendedIds = ["shalini-banerjee", "vikramaditya-sengupta"]
    } else if (latestCheckIn.mood <= 4) {
      introEchoMessage = "Based on your recent check-in, talking things through with a compassionate professional can bring some gentle clarity. I'm right here with you."
      recommendedReason = "Focus on emotional clarity, self-compassion, and gentle support."
      recommendedIds = ["ananya-rao", "priya-nambiar"]
    }
  }

  // Filter counsellors dynamically
  const filteredCounsellors = useMemo(() => {
    const q = search.trim().toLowerCase()
    return DEMO_COUNSELLORS.filter((c) => {
      const matchesCategory =
        selectedCategory === "All" || c.categories.includes(selectedCategory)

      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.languages.toLowerCase().includes(q) ||
        c.specializations.some((s) => s.toLowerCase().includes(q)) ||
        c.focusTags.some((t) => t.toLowerCase().includes(q))

      return matchesCategory && matchesSearch
    })
  }, [search, selectedCategory])

  const recommendedCounsellors = useMemo(() => {
    return DEMO_COUNSELLORS.filter((c) => recommendedIds.includes(c.id))
  }, [recommendedIds])

  return (
    <>
      <PageHeading
        eyebrow="PROFESSIONAL GUIDANCE & CARE"
        title="Find the right support"
        text="You don't have to figure everything out alone. Find a counsellor or mental-health professional who may be right for you."
      />

      {/* Personalized Introduction with ECHO Persona */}
      <section className="counsellor-intro-card">
        <div className="counsellor-intro-echo">
          <EchoMascot mood="supportive" size="sm" />
        </div>
        <div className="counsellor-intro-copy">
          <div className="counsellor-speech-bubble">
            “{introEchoMessage}”
          </div>
          <p className="counsellor-disclaimer">
            <Icon name="shield" size={13} />
            These suggestions are for support and discovery only. They are not a medical diagnosis or a replacement for professional clinical care.
          </p>
        </div>
      </section>

      {/* Recommended For You Section */}
      <section className="counsellors-rec-section">
        <div className="counsellors-rec-header">
          <h3>
            <Icon name="spark" size={18} /> Recommended for you
          </h3>
          <span className="counsellor-rec-badge">Personalized suggestion</span>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)", textAlign: "left" }}>
          {recommendedReason}
        </p>

        <div className="counsellors-grid" style={{ marginBottom: "28px" }}>
          {recommendedCounsellors.map((c) => (
            <article className="counsellor-card" key={`rec-${c.id}`}>
              <div className="counsellor-card-top">
                <div className="counsellor-avatar" style={{ background: c.avatarBg }}>
                  {c.avatarInitials}
                </div>
                <div className="counsellor-card-meta">
                  <h4 className="counsellor-name">{c.name}</h4>
                  <p className="counsellor-title">{c.title}</p>
                  <span className="counsellor-rating">⭐ {c.rating} ({c.sessionsCount})</span>
                </div>
              </div>

              <div className="counsellor-tags">
                {c.specializations.slice(0, 2).map((s) => (
                  <span key={s} className="counsellor-tag">{s}</span>
                ))}
              </div>

              <div className="counsellor-info-rows">
                <div className="counsellor-info-row">
                  <Icon name="heart" size={13} />
                  <span>{c.experience}</span>
                </div>
                <div className="counsellor-info-row">
                  <Icon name="home" size={13} />
                  <span>{c.location}</span>
                </div>
                <div className="counsellor-info-row">
                  <Icon name="spark" size={13} />
                  <span>{c.languages}</span>
                </div>
              </div>

              <p className="counsellor-desc">{c.description}</p>

              <div className="counsellor-actions">
                <button
                  type="button"
                  className="counsellor-btn-profile"
                  onClick={() => setProfileModal(c)}
                >
                  View Profile
                </button>
                <button
                  type="button"
                  className="counsellor-btn-connect"
                  onClick={() => setConnectModal(c)}
                >
                  Connect
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Directory Section Header & Sample Disclaimer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: "19px", color: "var(--ink)", textAlign: "left" }}>
            Explore all counsellors
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", textAlign: "left" }}>
            Showing {filteredCounsellors.length} professionals
          </p>
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#7a7695", background: "#f1eff7", padding: "4px 10px", borderRadius: "10px" }}>
          Sample counsellors — demo directory
        </span>
      </div>

      {/* Search Bar */}
      <div className="counsellors-search-box">
        <Icon name="focus" size={18} />
        <input
          type="text"
          placeholder="Search counsellors by name, specialization, city, or language..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--muted)" }}
            onClick={() => setSearch("")}
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="counsellors-filter-row">
        {COUNSELLOR_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`counsellor-filter-btn ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Counsellors Grid */}
      {filteredCounsellors.length === 0 ? (
        <div style={{ padding: "48px 20px", background: "white", borderRadius: "20px", border: "1px dashed var(--line)", textAlign: "center", marginBottom: "36px" }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px" }}>
            No counsellors found matching “{search}”
          </p>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 16px" }}>
            Try resetting your search query or choosing another category filter.
          </p>
          <button
            type="button"
            className="counsellor-btn-profile"
            style={{ padding: "8px 20px" }}
            onClick={() => {
              setSearch("")
              setSelectedCategory("All")
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="counsellors-grid">
          {filteredCounsellors.map((c) => (
            <article className="counsellor-card" key={c.id}>
              <div className="counsellor-card-top">
                <div className="counsellor-avatar" style={{ background: c.avatarBg }}>
                  {c.avatarInitials}
                </div>
                <div className="counsellor-card-meta">
                  <h4 className="counsellor-name">{c.name}</h4>
                  <p className="counsellor-title">{c.title}</p>
                  <span className="counsellor-rating">⭐ {c.rating} ({c.sessionsCount})</span>
                </div>
              </div>

              <div className="counsellor-tags">
                {c.specializations.map((s) => (
                  <span key={s} className="counsellor-tag">{s}</span>
                ))}
              </div>

              <div className="counsellor-info-rows">
                <div className="counsellor-info-row">
                  <Icon name="heart" size={13} />
                  <span>{c.experience}</span>
                </div>
                <div className="counsellor-info-row">
                  <Icon name="home" size={13} />
                  <span>{c.location}</span>
                </div>
                <div className="counsellor-info-row">
                  <Icon name="spark" size={13} />
                  <span>{c.languages}</span>
                </div>
              </div>

              <p className="counsellor-desc">{c.description}</p>

              <div className="counsellor-actions">
                <button
                  type="button"
                  className="counsellor-btn-profile"
                  onClick={() => setProfileModal(c)}
                >
                  View Profile
                </button>
                <button
                  type="button"
                  className="counsellor-btn-connect"
                  onClick={() => setConnectModal(c)}
                >
                  Connect
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Emergency Support Section */}
      <section className="emergency-help-section">
        <div className="emergency-help-copy">
          <h4>
            <Icon name="shield" size={18} /> Need urgent help?
          </h4>
          <p>
            If you feel you may be in immediate danger or unable to keep yourself safe, contact your local emergency service or a trusted person immediately.
          </p>
        </div>
        <button
          type="button"
          className="emergency-help-btn"
          onClick={() => setShowEmergency(true)}
        >
          Get Immediate Help
        </button>
      </section>

      {/* MODAL 1: View Profile Modal */}
      {profileModal && (
        <div className="counsellor-modal-overlay" onClick={() => setProfileModal(null)}>
          <div className="counsellor-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setProfileModal(null)}
              aria-label="Close profile"
            >
              <Icon name="close" size={18} />
            </button>

            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "18px" }}>
              <div
                className="counsellor-avatar"
                style={{ width: "68px", height: "68px", fontSize: "22px", background: profileModal.avatarBg }}
              >
                {profileModal.avatarInitials}
              </div>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "20px", color: "var(--ink)" }}>
                  {profileModal.name}
                </h3>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: "var(--muted)" }}>
                  {profileModal.title}
                </p>
                <span className="counsellor-rating">
                  ⭐ {profileModal.rating} • {profileModal.sessionsCount} sessions completed
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8f7fc", padding: "14px", borderRadius: "14px", marginBottom: "18px" }}>
              <div>
                <small style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 800 }}>Experience</small>
                <strong style={{ display: "block", fontSize: "13px", color: "var(--ink)" }}>{profileModal.experience}</strong>
              </div>
              <div>
                <small style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 800 }}>Format</small>
                <strong style={{ display: "block", fontSize: "13px", color: "var(--ink)" }}>{profileModal.sessionFormat}</strong>
              </div>
              <div>
                <small style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 800 }}>Languages</small>
                <strong style={{ display: "block", fontSize: "13px", color: "var(--ink)" }}>{profileModal.languages}</strong>
              </div>
              <div>
                <small style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 800 }}>Availability</small>
                <strong style={{ display: "block", fontSize: "13px", color: "var(--ink)" }}>{profileModal.availability}</strong>
              </div>
            </div>

            <h4 style={{ margin: "0 0 8px", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.7px", color: "var(--primary)" }}>
              Specializations
            </h4>
            <div className="counsellor-tags" style={{ marginBottom: "18px" }}>
              {profileModal.specializations.map((s) => (
                <span key={s} className="counsellor-tag">{s}</span>
              ))}
            </div>

            <h4 style={{ margin: "0 0 6px", fontSize: "14px", color: "var(--ink)" }}>
              About the counsellor
            </h4>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#595572", lineHeight: 1.6 }}>
              {profileModal.about}
            </p>

            <h4 style={{ margin: "0 0 6px", fontSize: "14px", color: "var(--ink)" }}>
              Therapeutic approach
            </h4>
            <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#595572", lineHeight: 1.6 }}>
              {profileModal.approach}
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="counsellor-btn-connect"
                style={{ flex: 1, minHeight: "44px", fontSize: "13px" }}
                onClick={() => {
                  const target = profileModal
                  setProfileModal(null)
                  setConnectModal(target)
                }}
              >
                Book Session / Connect
              </button>
              <button
                type="button"
                className="counsellor-btn-profile"
                style={{ padding: "0 20px", minHeight: "44px" }}
                onClick={() => setProfileModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Connect / Book Session Demo State Modal */}
      {connectModal && (
        <div className="counsellor-modal-overlay" onClick={() => setConnectModal(null)}>
          <div className="counsellor-modal-card" style={{ maxWidth: "480px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setConnectModal(null)}
              aria-label="Close"
            >
              <Icon name="close" size={18} />
            </button>

            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#eef9f6", color: "#348b80", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <Icon name="check" size={28} />
            </div>

            <h3 style={{ margin: "0 0 6px", fontSize: "21px", color: "var(--ink)" }}>
              You're one step closer to getting support
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "var(--muted)" }}>
              Connection request initiated with <strong>{connectModal.name}</strong>.
            </p>

            <div style={{ background: "#f8f7fb", border: "1px solid #e5e3ef", borderRadius: "14px", padding: "16px", marginBottom: "22px", textAlign: "left" }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 700, color: "var(--primary)" }}>
                Demo Environment Notice:
              </p>
              <p style={{ margin: 0, fontSize: "11.5px", color: "#66627f", lineHeight: 1.5 }}>
                This is a preview demonstration. This demo connection does not create a real appointment, store credit card details, or bill your account.
              </p>
            </div>

            <button
              type="button"
              className="counsellor-btn-connect"
              style={{ width: "100%", minHeight: "44px" }}
              onClick={() => setConnectModal(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Emergency Helplines Reference */}
      {showEmergency && (
        <div className="counsellor-modal-overlay" onClick={() => setShowEmergency(false)}>
          <div className="counsellor-modal-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowEmergency(false)}
              aria-label="Close emergency info"
            >
              <Icon name="close" size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", color: "#c94a43" }}>
              <Icon name="shield" size={24} />
              <h3 style={{ margin: 0, fontSize: "20px" }}>Emergency & Immediate Support</h3>
            </div>

            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#5a5670", lineHeight: 1.5 }}>
              If you or someone around you is in immediate emotional distress, free, confidential, and professional help is available 24/7 across verified national helplines:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "22px" }}>
              <div style={{ background: "#fff5f4", border: "1px solid #fed2ce", borderRadius: "14px", padding: "14px" }}>
                <strong style={{ display: "block", fontSize: "13px", color: "#b53e37" }}>
                  Tele-MANAS (Govt. of India)
                </strong>
                <span style={{ fontSize: "12px", color: "#6a5351", display: "block", margin: "3px 0 6px" }}>
                  24/7 National Mental Health Helpline (Toll-Free, Multilingual)
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#a52d26" }}>
                  Dial: 14416 or 1800-891-4416
                </span>
              </div>

              <div style={{ background: "#fbfaff", border: "1px solid #e5e2f7", borderRadius: "14px", padding: "14px" }}>
                <strong style={{ display: "block", fontSize: "13px", color: "#544ec1" }}>
                  KIRAN Mental Health Helpline
                </strong>
                <span style={{ fontSize: "12px", color: "#5c5778", display: "block", margin: "3px 0 6px" }}>
                  24/7 Mental health rehabilitation and crisis counseling
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#4740b2" }}>
                  Dial: 1800-599-0019
                </span>
              </div>

              <div style={{ background: "#fbfaff", border: "1px solid #e5e2f7", borderRadius: "14px", padding: "14px" }}>
                <strong style={{ display: "block", fontSize: "13px", color: "#544ec1" }}>
                  Vandrevala Foundation
                </strong>
                <span style={{ fontSize: "12px", color: "#5c5778", display: "block", margin: "3px 0 6px" }}>
                  Free 24/7 confidential psychological support
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#4740b2" }}>
                  Dial: +91 9999 666 555
                </span>
              </div>
            </div>

            <button
              type="button"
              className="counsellor-btn-profile"
              style={{ width: "100%", minHeight: "42px" }}
              onClick={() => setShowEmergency(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function Monthly() {
  return (
    <>
      <PageHeading
        eyebrow="SEPTEMBER REFLECTION"
        title="A month of learning your rhythm."
        text="Here’s what ECHO noticed — the progress, the patterns, and one small idea for October."
      />
      <div className="monthly-hero">
        <div>
          <span className="eyebrow">
            <Icon name="spark" size={15} /> MONTHLY REFLECTION
          </span>
          <h2>
            Another month,
            <br />
            another step forward.
          </h2>
          <p>
            You showed up for yourself 23 times this month. That’s something
            worth celebrating.
          </p>
          <Button onClick={() => go("user-dashboard")} icon="arrow">
            Start October’s journey
          </Button>
        </div>
        <EchoMascot mood="celebrating" size="lg" />
      </div>
      <div className="monthly-metrics">
        {[
          ["Mood", "7.1", "+8%", "mint"],
          ["Stress", "4.8", "−5%", "coral"],
          ["Energy", "6.6", "+4%", "yellow"],
          ["Sleep", "7.2h", "+12 min", "blue"],
          ["Focus", "6.9", "+6%", "lavender"],
        ].map(([label, value, delta, color]) => (
          <div key={label}>
            <span className={`metric-dot ${color}`} />
            <small>{label}</small>
            <strong>{value}</strong>
            <em>{delta}</em>
          </div>
        ))}
      </div>
      <div className="monthly-grid">
        {[
          [
            "Keep doing",
            "Your energy improved on days with more consistent sleep.",
            "check",
            "mint",
          ],
          [
            "Improve",
            "Stress was higher around exam and assignment days.",
            "chart",
            "coral",
          ],
          [
            "Try next month",
            "Add a short recovery break during intense study periods.",
            "spark",
            "lavender",
          ],
        ].map(([title, text, icon, color]) => (
          <article key={title}>
            <span className={`mini-icon ${color}`}>
              <Icon name={icon as IconName} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </>
  )
}

const PermissionToggle = ({
  label,
  detail,
  initial = true,
  locked = false,
  checked,
  onChange,
}: {
  label: string
  detail: string
  initial?: boolean
  locked?: boolean
  checked?: boolean
  onChange?: (val: boolean) => void
}) => {
  const [internalOn, setInternalOn] = useState(initial)
  const on = checked !== undefined ? checked : internalOn
  const handleToggle = () => {
    if (locked) return
    if (onChange) {
      onChange(!on)
    } else {
      setInternalOn(!on)
    }
  }
  return (
    <div className="permission-row">
      <span className={`permission-icon ${locked ? "private" : "shared"}`}>
        <Icon name={locked ? "lock" : "chart"} />
      </span>
      <div>
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>
      <button
        type="button"
        className={`toggle ${on ? "on" : ""}`}
        onClick={handleToggle}
        aria-label={`Toggle ${label}`}
      >
        <i />
      </button>
    </div>
  )
}

function Circle() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPermissions, setEditPermissions] = useState<{
    allow_mood: boolean
    allow_stress: boolean
    allow_sleep: boolean
    allow_energy: boolean
  }>({
    allow_mood: false,
    allow_stress: false,
    allow_sleep: false,
    allow_energy: false,
  })
  const [savingId, setSavingId] = useState<number | null>(null)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const currentUser = getSessionUser()

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    setLoading(true)
    try {
      const res = await getConnections()
      const userConns = (res.connections || []).filter(
        (c) => !currentUser || c.requester_id === currentUser.id,
      )
      setConnections(userConns)
    } catch {
      // Keep state if fetch fails or unauthenticated
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (c: Connection) => {
    if (editingId === c.id) {
      setEditingId(null)
    } else {
      setEditingId(c.id)
      setEditPermissions({
        allow_mood: c.allow_mood,
        allow_stress: c.allow_stress,
        allow_sleep: c.allow_sleep,
        allow_energy: c.allow_energy,
      })
      setFeedback(null)
    }
  }

  const handleSavePermissions = async (connectionId: number) => {
    setSavingId(connectionId)
    setFeedback(null)
    try {
      const res = await updateConnectionPermissions(
        connectionId,
        editPermissions,
      )
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? res.connection : c)),
      )
      setFeedback({
        type: "success",
        message: "Permissions updated successfully",
      })
      setEditingId(null)
    } catch (err: any) {
      if (err?.status === 401) {
        setFeedback({
          type: "error",
          message: "Your session has expired. Please log in again.",
        })
      } else if (err?.status === 403) {
        setFeedback({
          type: "error",
          message: "You are not allowed to manage permissions for this connection.",
        })
      } else if (err?.status === 409) {
        setFeedback({
          type: "error",
          message:
            err.message ||
            "Permissions can only be updated for active accepted connections.",
        })
      } else {
        setFeedback({
          type: "error",
          message: "Unable to update permissions. Please try again.",
        })
      }
    } finally {
      setSavingId(null)
    }
  }

  const handleRevoke = async (connectionId: number) => {
    setRevokingId(connectionId)
    setFeedback(null)
    try {
      await revokeConnection(connectionId)
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId ? { ...c, status: "revoked" } : c,
        ),
      )
      setFeedback({
        type: "success",
        message: "Connection revoked successfully",
      })
      if (editingId === connectionId) setEditingId(null)
    } catch (err: any) {
      if (err?.status === 401) {
        setFeedback({
          type: "error",
          message: "Your session has expired. Please log in again.",
        })
      } else if (err?.status === 403) {
        setFeedback({
          type: "error",
          message: "You are not allowed to manage this connection.",
        })
      } else if (err?.status === 409) {
        setFeedback({
          type: "error",
          message: err.message || "Connection is not currently active.",
        })
      } else {
        setFeedback({
          type: "error",
          message: "Unable to revoke connection. Please try again.",
        })
      }
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="TRUSTED CONNECTIONS"
        title="My ECHO Circle"
        text="You control who can see selected parts of your well-being pattern."
        action={
          <Button onClick={() => go("permissions")}>Connect someone</Button>
        }
      />
      {feedback && (
        <div
          style={{
            background: feedback.type === "success" ? "#f0fdf4" : "#fff1f2",
            color: feedback.type === "success" ? "#15803d" : "#be123c",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            marginBottom: "16px",
            border: `1px solid ${
              feedback.type === "success" ? "#bbf7d0" : "#fecdd3"
            }`,
          }}
        >
          {feedback.message}
        </div>
      )}
      <div className="circle-banner">
        <Icon name="shield" />
        <div>
          <strong>Your private information stays private.</strong>
          <span>
            Journal entries, ECHO conversations, and counselling notes are never
            shared by default.
          </span>
        </div>
      </div>
      {loading ? (
        <p style={{ color: "#64748b", padding: "16px 0", fontSize: "14px" }}>
          Loading trusted connections...
        </p>
      ) : connections.length === 0 ? (
        <div
          style={{
            background: "var(--card-bg, #ffffff)",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <EchoMascot mood="supportive" size="sm" />
          <h3 style={{ fontSize: "16px", marginTop: "12px", color: "#0f172a" }}>
            No active connections yet.
          </h3>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Connect a teacher, parent, or mentor by entering their support key.
          </p>
        </div>
      ) : (
        <div className="connection-grid">
          {connections.map((c) => {
            const supporterName = c.supporter?.name || "Support Person"
            const supporterRole = c.supporter?.user_type
              ? c.supporter.user_type.charAt(0).toUpperCase() +
                c.supporter.user_type.slice(1)
              : c.supporter?.role || "Supporter"
            const initials = supporterName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
            const isAccepted = c.status === "accepted"
            const isPending = c.status === "pending"
            const isEditing = editingId === c.id

            return (
              <article className="connection-card" key={c.id}>
                <div className="connection-head">
                  <span className="avatar large">{initials}</span>
                  <div>
                    <span
                      className={`connected ${
                        isAccepted
                          ? ""
                          : isPending
                            ? "pending"
                            : "revoked"
                      }`}
                    >
                      <i /> {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                    <h3>{supporterName}</h3>
                    <p>{supporterRole}</p>
                  </div>
                </div>
                <div className="shared-box">
                  <span>SHARED PERMISSION STATE</span>
                  {isAccepted ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "4px",
                        fontSize: "13px",
                        marginTop: "6px",
                        marginBottom: "8px",
                      }}
                    >
                      <span>
                        Mood: <strong>{c.allow_mood ? "Allowed" : "Not allowed"}</strong>
                      </span>
                      <span>
                        Stress: <strong>{c.allow_stress ? "Allowed" : "Not allowed"}</strong>
                      </span>
                      <span>
                        Sleep: <strong>{c.allow_sleep ? "Allowed" : "Not allowed"}</strong>
                      </span>
                      <span>
                        Energy: <strong>{c.allow_energy ? "Allowed" : "Not allowed"}</strong>
                      </span>
                    </div>
                  ) : isPending ? (
                    <p style={{ margin: "6px 0", color: "#64748b", fontSize: "13px" }}>
                      Connection request sent. Waiting for supporter approval.
                    </p>
                  ) : (
                    <p style={{ margin: "6px 0", color: "#64748b", fontSize: "13px" }}>
                      This connection has been {c.status}.
                    </p>
                  )}
                  <p className="private">
                    <Icon name="lock" size={14} /> Journal, conversations, notes
                  </p>
                </div>
                {isAccepted && isEditing && (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "14px",
                      marginTop: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <h4 style={{ fontSize: "14px", marginBottom: "8px" }}>
                      Update permissions
                    </h4>
                    <PermissionToggle
                      label="Mood trends"
                      detail="Weekly and monthly trends"
                      checked={editPermissions.allow_mood}
                      onChange={(v) =>
                        setEditPermissions((p) => ({ ...p, allow_mood: v }))
                      }
                    />
                    <PermissionToggle
                      label="Stress trends"
                      detail="Changes from baseline"
                      checked={editPermissions.allow_stress}
                      onChange={(v) =>
                        setEditPermissions((p) => ({ ...p, allow_stress: v }))
                      }
                    />
                    <PermissionToggle
                      label="Sleep trends"
                      detail="Duration and consistency"
                      checked={editPermissions.allow_sleep}
                      onChange={(v) =>
                        setEditPermissions((p) => ({ ...p, allow_sleep: v }))
                      }
                    />
                    <PermissionToggle
                      label="Energy & focus"
                      detail="Weekly trend summaries"
                      checked={editPermissions.allow_energy}
                      onChange={(v) =>
                        setEditPermissions((p) => ({ ...p, allow_energy: v }))
                      }
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "12px",
                      }}
                    >
                      <Button
                        onClick={() => handleSavePermissions(c.id)}
                        disabled={savingId === c.id}
                      >
                        {savingId === c.id ? "Saving..." : "Save permissions"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        disabled={savingId === c.id}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                <div className="connection-actions">
                  {isAccepted && (
                    <Button
                      variant="secondary"
                      onClick={() => handleStartEdit(c)}
                    >
                      {isEditing ? "Close" : "Manage access"}
                    </Button>
                  )}
                  {isAccepted && (
                    <button
                      onClick={() => handleRevoke(c.id)}
                      disabled={revokingId === c.id}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "8px 12px",
                      }}
                    >
                      {revokingId === c.id ? "Revoking..." : "Revoke"}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
      <div className="connect-empty">
        <EchoMascot mood="supportive" size="sm" />
        <div>
          <h3>Connect another support person</h3>
          <p>
            Enter their ECHO Support Key. You’ll approve exactly what they can
            see.
          </p>
        </div>
        <Button variant="secondary" onClick={() => go("permissions")}>
          Enter support key
        </Button>
      </div>
    </>
  )
}

function Permissions() {
  const [connected, setConnected] = useState(false)
  const [key, setKey] = useState("")
  const [verifiedUser, setVerifiedUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [allowMood, setAllowMood] = useState(false)
  const [allowStress, setAllowStress] = useState(false)
  const [allowSleep, setAllowSleep] = useState(false)
  const [allowEnergy, setAllowEnergy] = useState(false)
  const [connectionSubmitting, setConnectionSubmitting] = useState(false)
  const [connectionError, setConnectionError] = useState("")
  const [connectionSuccess, setConnectionSuccess] = useState("")
  const [, setConnection] = useState<Connection | null>(null)

  const handleCheckKey = async () => {
    const raw = key.trim()
    if (!raw) {
      setError("Please enter an access key.")
      return
    }

    // Normalize input key to match standard backend format (ECHO-...)
    const cleaned = raw.replace(/[\u2013\u2014]/g, "-").trim()
    let fullKey = cleaned
    if (/^echo\s*-\s*/i.test(cleaned)) {
      fullKey = "ECHO-" + cleaned.replace(/^echo\s*-\s*/i, "").trim()
    } else if (!/^echo-/i.test(cleaned)) {
      fullKey = "ECHO-" + cleaned.trim()
    }

    setLoading(true)
    setError("")

    try {
      const res = await verifyAccessKey(fullKey)
      setVerifiedUser(res.user)
      setConnected(true)
    } catch (err: any) {
      if (err?.status === 401) {
        setError("Invalid access key. Please check the key and try again.")
      } else if (err?.status === 422) {
        setError(
          err.message ||
            "Invalid access key format. Please check and try again.",
        )
      } else {
        setError("Unable to verify the access key. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConnection = async () => {
    if (!verifiedUser) {
      setConnectionError("Please verify a support key first.")
      return
    }

    setConnectionSubmitting(true)
    setConnectionError("")
    setConnectionSuccess("")

    try {
      const res = await createConnection({
        supporter_id: verifiedUser.id,
        allow_mood: allowMood,
        allow_stress: allowStress,
        allow_sleep: allowSleep,
        allow_energy: allowEnergy,
      })

      setConnection(res.connection)
      setConnectionSuccess("Connection request sent. Pending approval.")
      setTimeout(() => {
        go("circle")
      }, 1500)
    } catch (err: any) {
      if (err?.status === 401) {
        setConnectionError("Your session has expired. Please log in again.")
      } else if (err?.status === 409) {
        setConnectionError("A connection request already exists.")
      } else if (err?.status === 422) {
        setConnectionError(
          err.message ||
            "Unable to create the connection request. Please check your selections and try again.",
        )
      } else {
        setConnectionError(
          err.message ||
            "Unable to send the connection request. Please try again.",
        )
      }
    } finally {
      setConnectionSubmitting(false)
    }
  }

  if (!connected)
    return (
      <>
        <PageHeading
          eyebrow="PRIVACY & CONNECTIONS"
          title="Connect your support person"
          text="You control who can access selected ECHO patterns."
        />
        <div className="connect-layout">
          <section className="key-entry">
            <span className="mini-icon lavender">
              <Icon name="key" />
            </span>
            <h2>Enter their support key</h2>
            <p>
              Ask your teacher, parent, mentor, or counsellor for their unique
              key.
            </p>
            <label className="key-input">
              {!key.toUpperCase().startsWith("ECHO-") &&
                !key.toUpperCase().startsWith("ECHO\u2013") && (
                  <span>ECHO–</span>
                )}
              <input
                value={key}
                onChange={(e) => {
                  setKey(e.target.value)
                  if (error) setError("")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCheckKey()
                  }
                }}
                placeholder={key ? "" : "X7kP9mQ2vL8nR4sT"}
                disabled={loading}
              />
            </label>
            {error && (
              <div
                style={{
                  background: "#fff1f2",
                  color: "#be123c",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  marginBottom: "14px",
                  border: "1px solid #fecdd3",
                }}
              >
                {error}
              </div>
            )}
            <Button
              onClick={handleCheckKey}
              icon={loading ? undefined : "arrow"}
              disabled={loading}
            >
              {loading ? "Checking key..." : "Check key"}
            </Button>
            <small>
              <Icon name="lock" size={14} /> A key does not grant access. You
              approve every permission.
            </small>
          </section>
          <aside>
            <EchoMascot mood="supportive" size="lg" />
            <div className="speech-bubble">
              You stay in control at every step.
            </div>
          </aside>
        </div>
      </>
    )

  const initials = verifiedUser?.name
    ? verifiedUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "MK"
  const displayName = verifiedUser?.name || "Maya Krishnan"
  const displayRole = verifiedUser
    ? `${verifiedUser.user_type.charAt(0).toUpperCase() + verifiedUser.user_type.slice(1)} · Verified support account`
    : "Teacher · Eastwood College"
  const summaryText = verifiedUser
    ? `${verifiedUser.name} · ${verifiedUser.user_type.charAt(0).toUpperCase() + verifiedUser.user_type.slice(1)} would like to receive selected ECHO insights.`
    : "Maya Krishnan · Teacher would like to receive selected ECHO insights."

  return (
    <>
      <PageHeading
        eyebrow="CONNECTION REQUEST"
        title="You are in control."
        text={summaryText}
      />
      <div className="permissions-layout">
        <section className="permissions-card">
          <div className="request-person">
            <span className="avatar large">{initials}</span>
            <div>
              <span className="connected pending">
                Verified support account
              </span>
              <h2>{displayName}</h2>
              <p>{displayRole}</p>
            </div>
          </div>
          <h3>Choose what {displayName.split(" ")[0]} can see</h3>
          <PermissionToggle
            label="Mood trends"
            detail="Weekly and monthly trend only"
            checked={allowMood}
            onChange={setAllowMood}
          />
          <PermissionToggle
            label="Stress trends"
            detail="Changes from your baseline"
            checked={allowStress}
            onChange={setAllowStress}
          />
          <PermissionToggle
            label="Sleep trends"
            detail="Duration and consistency"
            checked={allowSleep}
            onChange={setAllowSleep}
          />
          <PermissionToggle
            label="Energy & focus"
            detail="Weekly trend summaries"
            checked={allowEnergy}
            onChange={setAllowEnergy}
          />
          <div className="private-divider">
            <span>PRIVATE BY DEFAULT</span>
          </div>
          <PermissionToggle
            label="Private journal"
            detail="Personal entries stay private"
            initial={false}
            locked
          />
          <PermissionToggle
            label="ECHO conversations"
            detail="Your chatbot conversations"
            initial={false}
            locked
          />
          <PermissionToggle
            label="Counselling notes"
            detail="Confidential session notes"
            initial={false}
            locked
          />
          {connectionError && (
            <div
              style={{
                background: "#fff1f2",
                color: "#be123c",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                marginTop: "16px",
                border: "1px solid #fecdd3",
              }}
            >
              {connectionError}
            </div>
          )}
          {connectionSuccess && (
            <div
              style={{
                background: "#f0fdf4",
                color: "#15803d",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                marginTop: "16px",
                border: "1px solid #bbf7d0",
              }}
            >
              {connectionSuccess}
            </div>
          )}
          <div className="permission-actions">
            <Button
              variant="ghost"
              onClick={() => go("circle")}
              disabled={connectionSubmitting}
            >
              Decline
            </Button>
            <Button
              onClick={handleCreateConnection}
              icon="check"
              disabled={connectionSubmitting}
            >
              {connectionSubmitting
                ? "Sending request..."
                : "Allow selected access"}
            </Button>
          </div>
        </section>
        <aside className="permission-aside">
          <Icon name="shield" size={30} />
          <h3>What {displayName.split(" ")[0]} will see</h3>
          <p>
            Simple pattern summaries, not individual diary entries or private
            conversations.
          </p>
          <ul>
            <li>
              <Icon name="check" size={15} /> Trend charts
            </li>
            <li>
              <Icon name="check" size={15} /> Baseline changes
            </li>
            <li>
              <Icon name="check" size={15} /> Monthly reports
            </li>
          </ul>
          <button>Learn about sharing</button>
        </aside>
      </div>
    </>
  )
}

function Reports({ admin = false }: { admin?: boolean }) {
  const [range, setRange] = useState("30 days")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<UserReportResponse | null>(null)

  const rangeToPeriod = (r: string): "7d" | "30d" | "90d" | "all" => {
    if (r === "7 days") return "7d"
    if (r === "90 days") return "90d"
    if (r === "All time") return "all"
    return "30d"
  }

  const loadReport = (r: string) => {
    setLoading(true)
    setError(null)
    const period = rangeToPeriod(r)
    fetchReports(period, admin)
      .then((res) => {
        setReportData(res)
        setLoading(false)
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Unable to load reports right now."
        setError(msg)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadReport(range)
  }, [range, admin])

  // Chart data extraction
  const getChartValues = (data: UserReportResponse | null): number[] => {
    if (!data || !data.time_series || data.time_series.length === 0) {
      return [60, 62, 65, 68, 64, 70, 72]
    }
    // Scale 1..10 to 10..100 for SVG LineChart
    return data.time_series.map((item) => Math.round(item.mood * 10))
  }

  const getChartDates = (data: UserReportResponse | null): string[] => {
    if (!data || !data.time_series || data.time_series.length === 0) {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    }
    return data.time_series.map((item) => item.date_short)
  }

  return (
    <>
      <PageHeading
        eyebrow={admin ? "AUTHORIZED REPORTS" : "YOUR REPORTS"}
        title={admin ? "Shared pattern reports" : "Your well-being summaries"}
        text={
          admin
            ? "Only reports explicitly shared by linked users appear here."
            : "Aggregated summaries of what your personal rhythm has been showing."
        }
        action={
          <div className="filter-tabs">
            {["7 days", "30 days", "90 days", "All time"].map((t) => (
              <button
                className={range === t ? "active" : ""}
                onClick={() => setRange(t)}
                key={t}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      {loading && !reportData ? (
        <article className="report-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "50px 20px" }}>
          <EchoMascot mood="thinking" size="md" />
          <p style={{ marginTop: 14, fontWeight: 700, color: "var(--ink)", fontSize: "16px" }}>
            ECHO is compiling your well-being summary...
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            Aggregating check-ins and trends for {range.toLowerCase()}.
          </p>
        </article>
      ) : error && !reportData ? (
        <article className="report-card" style={{ borderLeft: "4px solid #e47e77", padding: "30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span className="mini-icon coral" style={{ width: 48, height: 48, borderRadius: "50%" }}>
              <Icon name="report" size={20} />
            </span>
            <div>
              <span className="card-kicker">REPORT NOTICE</span>
              <h2 style={{ fontSize: "18px", margin: "4px 0" }}>Unable to load well-being report</h2>
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>{error}</p>
            </div>
          </div>
          <div style={{ marginTop: "18px" }}>
            <Button onClick={() => loadReport(range)}>Retry</Button>
          </div>
        </article>
      ) : admin && reportData?.shared_reports && reportData.shared_reports.length > 0 ? (
        // Supporter View with Linked User Reports
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {reportData.shared_reports.map((shared) => {
            const sub = shared.report
            return (
              <article className="report-card" key={shared.connection_id}>
                <div className="report-top">
                  <div>
                    <span className="card-kicker">
                      SHARED REPORT · {shared.relationship.toUpperCase()}
                    </span>
                    <h2>{shared.student_name} — ECHO Well-being Summary</h2>
                    <p>
                      {sub.period_label} · {sub.total_check_ins} logged {sub.total_check_ins === 1 ? "check-in" : "check-ins"}
                    </p>
                  </div>
                  <span className="status-badge balanced">
                    <i /> {sub.status_badge}
                  </span>
                </div>

                <div className="report-trends">
                  {sub.dimension_reports.map((item) => (
                    <div key={item.dimension}>
                      <span className={`metric-dot ${item.color}`} />
                      <small>
                        {item.label} {item.average !== null ? `(${item.average}/10)` : "—"}
                      </small>
                      <strong>
                        {item.arrow} {item.state}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="report-chart">
                  <LineChart
                    labels
                    values={getChartValues(sub)}
                    dateLabels={getChartDates(sub)}
                    color="#3dac9f"
                  />
                </div>

                <div className="report-insights">
                  <span className="card-kicker">OBSERVED PATTERNS</span>
                  {sub.insights && sub.insights.length > 0 ? (
                    sub.insights.map((ins, idx) => (
                      <p key={idx}>
                        <Icon name="spark" size={16} /> {ins}
                      </p>
                    ))
                  ) : (
                    <p>
                      <Icon name="spark" size={16} /> Sufficient check-ins will unlock automated pattern observations.
                    </p>
                  )}
                </div>

                <div className="report-bottom">
                  <span>
                    <Icon name="shield" size={16} /> Permitted dimensions: {shared.permitted_dimensions.join(", ")}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      ) : (!reportData || reportData.total_check_ins === 0) ? (
        // Empty State
        <article className="report-card" style={{ padding: "40px 30px", borderLeft: "4px solid var(--primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <span className="mini-icon lavender" style={{ width: 60, height: 60, borderRadius: "50%" }}>
              <Icon name="report" size={24} />
            </span>
            <div>
              <span className="card-kicker">NO RECORDS FOR THIS PERIOD</span>
              <h2 style={{ fontSize: "20px", margin: "4px 0" }}>
                {admin ? "No shared reports recorded for this period" : "Your well-being report is ready to grow"}
              </h2>
              <p style={{ maxWidth: "600px", fontSize: "13px", color: "var(--muted)", margin: "4px 0 16px" }}>
                {admin
                  ? "None of your linked students have logged check-ins during this time range."
                  : "Daily check-ins help ECHO build an accurate, confidential picture of your mood, rest, and energy rhythms."}
              </p>
              {!admin && (
                <Button onClick={() => go("checkin")} icon="pulse">
                  Start a check-in
                </Button>
              )}
            </div>
          </div>
        </article>
      ) : (
        // Active User Report
        <article className="report-card">
          <div className="report-top">
            <div>
              <span className="card-kicker">
                {reportData.period_label.toUpperCase()}
              </span>
              <h2>{reportData.user_name || "Your"} — ECHO Well-being Summary</h2>
              <p>
                {reportData.period_label} · {reportData.total_check_ins} logged {reportData.total_check_ins === 1 ? "check-in" : "check-ins"}
              </p>
            </div>
            <span className="status-badge balanced">
              <i /> {reportData.status_badge}
            </span>
          </div>

          <div className="report-trends">
            {reportData.dimension_reports.map((item) => (
              <div key={item.dimension}>
                <span className={`metric-dot ${item.color}`} />
                <small>
                  {item.label} {item.average !== null ? `(${item.average}/10)` : "—"}
                </small>
                <strong>
                  {item.arrow} {item.state}
                </strong>
              </div>
            ))}
          </div>

          <div className="report-chart">
            <LineChart
              labels
              values={getChartValues(reportData)}
              dateLabels={getChartDates(reportData)}
              color="#625bd9"
            />
          </div>

          <div className="report-insights">
            <span className="card-kicker">KEY INSIGHTS & RESTORATIVE PATTERNS</span>
            {reportData.insights && reportData.insights.length > 0 ? (
              reportData.insights.map((ins, idx) => (
                <p key={idx}>
                  <Icon name="spark" size={16} /> {ins}
                </p>
              ))
            ) : (
              <p>
                <Icon name="spark" size={16} /> Log more daily check-ins to build baseline consistency and unlock deeper pattern observations.
              </p>
            )}
          </div>

          <div className="report-bottom">
            <span>
              <Icon name="shield" size={16} />{" "}
              Private report · Share only with trusted supporters when you choose
            </span>
            <Button variant="secondary" onClick={() => go("pattern")}>
              View detailed patterns
            </Button>
          </div>
        </article>
      )}
    </>
  )
}


function Profile({ admin = false }: { admin?: boolean }) {
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null)
  const [activeTab, setActiveTab] = useState<"personal" | "password" | "notifications" | "privacy" | "checkins">("personal")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currPassword, setCurrPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [notifEmail, setNotifEmail] = useState(true)
  const [notifCheckin, setNotifCheckin] = useState(true)
  const [notifInsights, setNotifInsights] = useState(true)
  const [notifAlerts, setNotifAlerts] = useState(true)

  const [privCheckins, setPrivCheckins] = useState(true)
  const [privPatterns, setPrivPatterns] = useState(true)
  const [privAnalytics, setPrivAnalytics] = useState(false)
  const [privSupporter, setPrivSupporter] = useState(true)

  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([])
  const [loadingCheckIns, setLoadingCheckIns] = useState(false)

  const loadData = () => {
    setLoading(true)
    fetchProfile()
      .then((res) => {
        if (res.success && res.user) {
          setProfileData(res)
          setName(res.user.name || "")
          setEmail(res.user.email || "")

          if (res.notification_preferences) {
            setNotifEmail(res.notification_preferences.email_notifications ?? true)
            setNotifCheckin(res.notification_preferences.checkin_reminders ?? true)
            setNotifInsights(res.notification_preferences.weekly_insights ?? true)
            setNotifAlerts(res.notification_preferences.supporter_alerts ?? true)
          }

          if (res.privacy_settings) {
            setPrivCheckins(res.privacy_settings.share_checkins ?? true)
            setPrivPatterns(res.privacy_settings.share_patterns ?? true)
            setPrivAnalytics(res.privacy_settings.anonymous_analytics ?? false)
            setPrivSupporter(res.privacy_settings.allow_supporter_view ?? true)
          }
        }
      })
      .catch(() => {
        const sessionUser = getSessionUser()
        if (sessionUser) {
          setName(sessionUser.name)
          setEmail(sessionUser.email)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeTab === "checkins") {
      setLoadingCheckIns(true)
      fetchProfileCheckIns()
        .then((res) => {
          if (res.success && Array.isArray(res.check_ins)) {
            setCheckIns(res.check_ins)
          }
        })
        .catch(() => {})
        .finally(() => setLoadingCheckIns(false))
    }
  }, [activeTab])

  const handleUpdatePersonal = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice(null)
    setSaving(true)
    try {
      const res = await updateProfile({ name: name.trim(), email: email.trim() })
      if (res.success) {
        setNotice({ type: "success", text: res.message || "Profile updated successfully." })
        if (profileData) {
          setProfileData({ ...profileData, user: { ...profileData.user, name: name.trim(), email: email.trim() } })
        }
      }
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || "Failed to update profile." })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice(null)
    if (!currPassword) {
      setNotice({ type: "error", text: "Please enter your current password." })
      return
    }
    if (newPassword.length < 8) {
      setNotice({ type: "error", text: "New password must be at least 8 characters long." })
      return
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: "error", text: "New password and confirmation do not match." })
      return
    }

    setSaving(true)
    try {
      const res = await changePassword({
        current_password: currPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      if (res.success) {
        setNotice({ type: "success", text: res.message || "Password changed successfully." })
        setCurrPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || "Failed to change password." })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setNotice(null)
    setSaving(true)
    try {
      const res = await updateProfile({
        notification_preferences: {
          email_notifications: notifEmail,
          checkin_reminders: notifCheckin,
          weekly_insights: notifInsights,
          supporter_alerts: notifAlerts,
        },
      })
      if (res.success) {
        setNotice({ type: "success", text: "Notification preferences saved successfully." })
      }
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || "Failed to save preferences." })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrivacy = async () => {
    setNotice(null)
    setSaving(true)
    try {
      const res = await updateProfile({
        privacy_settings: {
          share_checkins: privCheckins,
          share_patterns: privPatterns,
          anonymous_analytics: privAnalytics,
          allow_supporter_view: privSupporter,
        },
      })
      if (res.success) {
        setNotice({ type: "success", text: "Privacy settings saved successfully." })
      }
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || "Failed to save privacy settings." })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch {}
    go("landing")
  }

  const displayName = profileData?.user.name || name || (admin ? "Maya Krishnan" : "Alex Morgan")
  const displayRole = profileData?.user.role || (admin ? "admin" : "user")
  const displayUserType = profileData?.user.user_type || (admin ? "Teacher" : "Student")
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "EC"

  return (
    <>
      <PageHeading
        eyebrow="ACCOUNT & PREFERENCES"
        title={admin ? "Support account settings" : "Your ECHO profile"}
        text="Manage your personal details, language, notifications, and privacy."
      />
      <div className="profile-grid">
        <aside className="profile-card">
          <span className="avatar xlarge">{initials}</span>
          <h2>{displayName}</h2>
          <p>
            {displayUserType} · {displayRole === "admin" ? "Supporter Access" : `${profileData?.stats?.total_check_ins ?? 0} Check-ins`}
          </p>
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            <button
              className={`button ${activeTab === "personal" ? "primary" : "secondary"}`}
              onClick={() => { setActiveTab("personal"); setNotice(null); }}
              style={{ fontSize: "11px", justifyContent: "flex-start", padding: "8px 14px" }}
            >
              <Icon name="user" size={15} /> Personal details
            </button>
            <button
              className={`button ${activeTab === "password" ? "primary" : "secondary"}`}
              onClick={() => { setActiveTab("password"); setNotice(null); }}
              style={{ fontSize: "11px", justifyContent: "flex-start", padding: "8px 14px" }}
            >
              <Icon name="lock" size={15} /> Change password
            </button>
            <button
              className={`button ${activeTab === "notifications" ? "primary" : "secondary"}`}
              onClick={() => { setActiveTab("notifications"); setNotice(null); }}
              style={{ fontSize: "11px", justifyContent: "flex-start", padding: "8px 14px" }}
            >
              <Icon name="bell" size={15} /> Notifications
            </button>
            <button
              className={`button ${activeTab === "privacy" ? "primary" : "secondary"}`}
              onClick={() => { setActiveTab("privacy"); setNotice(null); }}
              style={{ fontSize: "11px", justifyContent: "flex-start", padding: "8px 14px" }}
            >
              <Icon name="shield" size={15} /> Privacy & consent
            </button>
            {!admin && (
              <button
                className={`button ${activeTab === "checkins" ? "primary" : "secondary"}`}
                onClick={() => { setActiveTab("checkins"); setNotice(null); }}
                style={{ fontSize: "11px", justifyContent: "flex-start", padding: "8px 14px" }}
              >
                <Icon name="pulse" size={15} /> Check-In history
              </button>
            )}
            <button
              className="button danger"
              onClick={handleLogout}
              style={{ fontSize: "11px", justifyContent: "flex-start", padding: "8px 14px", marginTop: "10px" }}
            >
              <Icon name="arrow" size={15} /> Log out
            </button>
          </div>
        </aside>

        <section style={{ background: "white", borderRadius: "24px", border: "1px solid var(--line)", padding: "28px", boxShadow: "0 10px 30px rgba(32, 28, 70, 0.04)" }}>
          {notice && (
            <div
              style={{
                background: notice.type === "success" ? "#eefbf6" : "#fdf2f2",
                color: notice.type === "success" ? "#257a5e" : "#c0392b",
                border: `1px solid ${notice.type === "success" ? "#c9f3e4" : "#f5c6cb"}`,
                borderRadius: "12px",
                padding: "10px 14px",
                fontSize: "12px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Icon name={notice.type === "success" ? "check" : "shield"} size={16} />
              <span>{notice.text}</span>
            </div>
          )}

          {activeTab === "personal" && (
            <form onSubmit={handleUpdatePersonal}>
              <h3 style={{ fontSize: "18px", color: "var(--navy)", marginBottom: "6px" }}>Personal Details</h3>
              <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "20px" }}>
                Update your display name and email address. Role and access tiers are managed securely.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "22px" }}>
                <label className="field">
                  <span>Full name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ fontSize: "13px" }}
                  />
                </label>

                <label className="field">
                  <span>Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ fontSize: "13px" }}
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <label className="field">
                    <span>Account role</span>
                    <input type="text" value={displayRole} disabled style={{ background: "#f8f7fc", color: "var(--muted)", fontSize: "12px" }} />
                  </label>
                  <label className="field">
                    <span>User type</span>
                    <input type="text" value={displayUserType} disabled style={{ background: "#f8f7fc", color: "var(--muted)", fontSize: "12px" }} />
                  </label>
                </div>
              </div>

              <Button type="submit" disabled={saving || loading} icon="check">
                {saving ? "Saving changes..." : "Save personal details"}
              </Button>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handleChangePassword}>
              <h3 style={{ fontSize: "18px", color: "var(--navy)", marginBottom: "6px" }}>Change Password</h3>
              <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "20px" }}>
                Ensure your account is using a long, random password to stay secure.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "22px" }}>
                <label className="field">
                  <span>Current password</span>
                  <input
                    type="password"
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    required
                    style={{ fontSize: "13px" }}
                  />
                </label>

                <label className="field">
                  <span>New password (min. 8 characters)</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ fontSize: "13px" }}
                  />
                </label>

                <label className="field">
                  <span>Confirm new password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ fontSize: "13px" }}
                  />
                </label>
              </div>

              <Button type="submit" disabled={saving} icon="lock">
                {saving ? "Updating password..." : "Update password"}
              </Button>
            </form>
          )}

          {activeTab === "notifications" && (
            <div>
              <h3 style={{ fontSize: "18px", color: "var(--navy)", marginBottom: "6px" }}>Notification Preferences</h3>
              <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "20px" }}>
                Choose when and how ECHO delivers check-in nudges and wellness updates.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", background: "#fbfaff", padding: "12px", borderRadius: "14px", border: "1px solid #ebe8f7" }}>
                  <input
                    type="checkbox"
                    checked={notifCheckin}
                    onChange={(e) => setNotifCheckin(e.target.checked)}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--navy)", display: "block" }}>Daily check-in reminders</strong>
                    <small style={{ color: "var(--muted)", fontSize: "11px" }}>Receive a gentle nudge to record your mood and energy rhythm.</small>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", background: "#fbfaff", padding: "12px", borderRadius: "14px", border: "1px solid #ebe8f7" }}>
                  <input
                    type="checkbox"
                    checked={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.checked)}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--navy)", display: "block" }}>Email notifications</strong>
                    <small style={{ color: "var(--muted)", fontSize: "11px" }}>Receive occasional account security and milestone updates via email.</small>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", background: "#fbfaff", padding: "12px", borderRadius: "14px", border: "1px solid #ebe8f7" }}>
                  <input
                    type="checkbox"
                    checked={notifInsights}
                    onChange={(e) => setNotifInsights(e.target.checked)}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--navy)", display: "block" }}>Weekly insights summary</strong>
                    <small style={{ color: "var(--muted)", fontSize: "11px" }}>A high-level summary of your week's restorative patterns.</small>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", background: "#fbfaff", padding: "12px", borderRadius: "14px", border: "1px solid #ebe8f7" }}>
                  <input
                    type="checkbox"
                    checked={notifAlerts}
                    onChange={(e) => setNotifAlerts(e.target.checked)}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--navy)", display: "block" }}>Supporter connection alerts</strong>
                    <small style={{ color: "var(--muted)", fontSize: "11px" }}>Notify you when a supporter requests access or accepts an invitation.</small>
                  </div>
                </label>
              </div>

              <Button onClick={handleSaveNotifications} disabled={saving} icon="check">
                {saving ? "Saving..." : "Save notification preferences"}
              </Button>
            </div>
          )}

          {activeTab === "privacy" && (
            <div>
              <h3 style={{ fontSize: "18px", color: "var(--navy)", marginBottom: "6px" }}>Privacy & Consent</h3>
              <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "20px" }}>
                You have full control over what data is shared with supporters or retained by ECHO.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", background: "#fbfaff", padding: "12px", borderRadius: "14px", border: "1px solid #ebe8f7" }}>
                  <input
                    type="checkbox"
                    checked={privCheckins}
                    onChange={(e) => setPrivCheckins(e.target.checked)}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--navy)", display: "block" }}>Share check-in status with approved supporters</strong>
                    <small style={{ color: "var(--muted)", fontSize: "11px" }}>Allow accepted circle members to see whether you checked in today.</small>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", background: "#fbfaff", padding: "12px", borderRadius: "14px", border: "1px solid #ebe8f7" }}>
                  <input
                    type="checkbox"
                    checked={privPatterns}
                    onChange={(e) => setPrivPatterns(e.target.checked)}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--navy)", display: "block" }}>Share trend observations</strong>
                    <small style={{ color: "var(--muted)", fontSize: "11px" }}>Include high-level energy/sleep trend graphs on your supporter's dashboard.</small>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", background: "#fbfaff", padding: "12px", borderRadius: "14px", border: "1px solid #ebe8f7" }}>
                  <input
                    type="checkbox"
                    checked={privSupporter}
                    onChange={(e) => setPrivSupporter(e.target.checked)}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--navy)", display: "block" }}>Allow supporter review notes</strong>
                    <small style={{ color: "var(--muted)", fontSize: "11px" }}>Let your mentor or supporter leave encouraging reflections on your reports.</small>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", background: "#fbfaff", padding: "12px", borderRadius: "14px", border: "1px solid #ebe8f7" }}>
                  <input
                    type="checkbox"
                    checked={privAnalytics}
                    onChange={(e) => setPrivAnalytics(e.target.checked)}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--navy)", display: "block" }}>Anonymous telemetry and quality analytics</strong>
                    <small style={{ color: "var(--muted)", fontSize: "11px" }}>Help improve ECHO with fully de-identified usage diagnostics.</small>
                  </div>
                </label>
              </div>

              <div style={{ background: "#f3fbf8", border: "1px solid #d5ece2", borderRadius: "14px", padding: "12px 14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#257a5e" }}>
                <Icon name="shield" size={16} />
                <span>Your private journals and raw conversation audio are never shared with anyone.</span>
              </div>

              <Button onClick={handleSavePrivacy} disabled={saving} icon="check">
                {saving ? "Saving..." : "Save privacy settings"}
              </Button>
            </div>
          )}

          {activeTab === "checkins" && (
            <div>
              <h3 style={{ fontSize: "18px", color: "var(--navy)", marginBottom: "6px" }}>Your Check-In History</h3>
              <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "18px" }}>
                Historical log of your submitted daily Check-In ratings stored in MySQL.
              </p>

              {loadingCheckIns ? (
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>Loading your history...</p>
              ) : checkIns.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 20px", background: "#fbfaff", borderRadius: "18px", border: "1px dashed #dcd9ec" }}>
                  <EchoMascot mood="listening" size="sm" />
                  <h4 style={{ fontSize: "14px", color: "var(--navy)", margin: "12px 0 4px" }}>No check-in records yet</h4>
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "14px" }}>
                    Complete your first daily Check-In to start tracking your mood and energy rhythm.
                  </p>
                  <Button onClick={() => go("checkin")}>Start a check-in</Button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {checkIns.map((ci) => (
                    <div key={ci.id} style={{ background: "#fbfaff", border: "1px solid #ebe8f7", borderRadius: "14px", padding: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <strong style={{ fontSize: "12px", color: "var(--navy)" }}>
                          {ci.created_at ? new Date(ci.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recorded Check-In"}
                        </strong>
                        <span style={{ fontSize: "10px", color: "#378a73", background: "#e8f8f3", padding: "3px 8px", borderRadius: "10px", fontWeight: 700 }}>
                          Logged
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", textAlign: "center" }}>
                        <div style={{ background: "white", padding: "6px", borderRadius: "8px", border: "1px solid #ebe8f7" }}>
                          <small style={{ display: "block", fontSize: "9px", color: "var(--muted)" }}>Mood</small>
                          <strong style={{ fontSize: "12px", color: "var(--navy)" }}>{ci.mood}/10</strong>
                        </div>
                        <div style={{ background: "white", padding: "6px", borderRadius: "8px", border: "1px solid #ebe8f7" }}>
                          <small style={{ display: "block", fontSize: "9px", color: "var(--muted)" }}>Energy</small>
                          <strong style={{ fontSize: "12px", color: "var(--navy)" }}>{ci.energy}/10</strong>
                        </div>
                        <div style={{ background: "white", padding: "6px", borderRadius: "8px", border: "1px solid #ebe8f7" }}>
                          <small style={{ display: "block", fontSize: "9px", color: "var(--muted)" }}>Focus</small>
                          <strong style={{ fontSize: "12px", color: "var(--navy)" }}>{ci.focus}/10</strong>
                        </div>
                        <div style={{ background: "white", padding: "6px", borderRadius: "8px", border: "1px solid #ebe8f7" }}>
                          <small style={{ display: "block", fontSize: "9px", color: "var(--muted)" }}>Stress</small>
                          <strong style={{ fontSize: "12px", color: "var(--navy)" }}>{ci.stress}/10</strong>
                        </div>
                        <div style={{ background: "white", padding: "6px", borderRadius: "8px", border: "1px solid #ebe8f7" }}>
                          <small style={{ display: "block", fontSize: "9px", color: "var(--muted)" }}>Sleep</small>
                          <strong style={{ fontSize: "12px", color: "var(--navy)" }}>{ci.sleep}/10</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  )
}


function AdminSetup() {
  return (
    <div className="focused-page admin-setup">
      <div className="setup-card">
        <div className="setup-copy">
          <span className="eyebrow">
            <Icon name="shield" size={15} /> SUPPORT ACCOUNT SETUP
          </span>
          <h1>Tell us about your support role.</h1>
          <p>This helps people recognize and trust your connection request.</p>
          <Field label="Full name" placeholder="Maya Krishnan" />
          <Field
            label="Organization or school"
            placeholder="Eastwood College"
          />
          <Field
            label="Role or department"
            placeholder="Student Well-being Coordinator"
          />
          <label className="field">
            <span>Who do you support?</span>
            <select>
              <option>Students</option>
              <option>Children / dependents</option>
              <option>Employees</option>
              <option>General community</option>
            </select>
          </label>
          <div className="privacy-inline">
            <Icon name="shield" />
            <span>
              <strong>Support access is always consent-based.</strong> You’ll
              only see data a linked user chooses to share.
            </span>
          </div>
          <Button onClick={() => go("access-key")} icon="arrow">
            Create support profile
          </Button>
        </div>
        <div className="setup-visual">
          <EchoMascot mood="supportive" size="lg" />
          <div className="speech-bubble">
            Clear roles help build trusted connections.
          </div>
        </div>
      </div>
    </div>
  )
}

function AccessKey() {
  const [key, setKey] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [regenerating, setRegenerating] = useState<boolean>(false)
  const [status, setStatus] = useState<string>("Loading key...")
  const [error, setError] = useState<string>("")
  const [copied, setCopied] = useState<boolean>(false)

  const loadKey = async () => {
    setLoading(true)
    setError("")
    setStatus("Loading key...")
    try {
      const res = await getAdminAccessKey()
      setKey(res.access_key)
      setStatus("Ready to share")
    } catch (err: any) {
      if (err?.status === 401) {
        setError(
          "Please log in with an authorized support account to access your support key.",
        )
      } else if (err?.status === 403) {
        setError(
          "Your account type is not authorized to hold a support key. Only support accounts (teachers, parents, or organizations) may manage support keys.",
        )
      } else {
        setError(
          err?.message || "Failed to load support key. Please try again.",
        )
      }
      setStatus("Error loading key")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKey()
  }, [])

  const handleRegenerate = async () => {
    setRegenerating(true)
    setError("")
    try {
      const res = await generateAdminAccessKey()
      setKey(res.access_key)
      setStatus("New key generated and saved")
      setCopied(false)
    } catch (err: any) {
      setError(
        err?.message || "Failed to generate a new key. Please try again.",
      )
    } finally {
      setRegenerating(false)
    }
  }

  const handleCopy = () => {
    if (!key) return
    navigator.clipboard?.writeText(key)
    setCopied(true)
    setStatus("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <PageHeading
        eyebrow="CONNECTION TOOLS"
        title="Your ECHO Support Key"
        text="Use this key to invite a user. They still choose whether to connect and what to share."
      />
      <div className="access-layout">
        <section className="access-key-card">
          <span className="key-icon">
            <Icon name="key" size={28} />
          </span>
          <span className="card-kicker">YOUR UNIQUE SUPPORT KEY</span>
          {loading ? (
            <h2
              style={{
                fontSize: "20px",
                color: "var(--muted)",
                letterSpacing: "1px",
              }}
            >
              Loading support key...
            </h2>
          ) : key ? (
            <h2>{key}</h2>
          ) : (
            <h2
              style={{
                fontSize: "18px",
                color: "#e11d48",
                letterSpacing: "normal",
              }}
            >
              Key unavailable
            </h2>
          )}
          <span className="key-status">
            <i /> {status}
          </span>
          {error && (
            <div
              style={{
                background: "#fff1f2",
                color: "#be123c",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                marginTop: "16px",
                marginBottom: "8px",
                border: "1px solid #fecdd3",
                textAlign: "left",
              }}
            >
              {error}
              <div style={{ marginTop: "8px" }}>
                <Button size="sm" variant="secondary" onClick={loadKey}>
                  Retry
                </Button>
              </div>
            </div>
          )}
          <div className="key-actions">
            <Button
              onClick={handleCopy}
              icon="copy"
              disabled={loading || !key || regenerating}
            >
              {copied ? "Copied!" : "Copy key"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleRegenerate}
              disabled={loading || regenerating}
            >
              {regenerating ? "Generating..." : "Generate new key"}
            </Button>
          </div>
          <p>
            <Icon name="shield" size={16} /> Verified support key securely stored
            and validated by the Laravel backend.
          </p>
        </section>
        <aside className="key-guide">
          <h3>How linking works</h3>
          {[
            [
              "1",
              "Share your key",
              "Send it directly to the person you support.",
            ],
            [
              "2",
              "They review access",
              "The user chooses exactly which trends to share.",
            ],
            [
              "3",
              "You see approved insights",
              "Private journals and conversations stay private.",
            ],
          ].map(([n, title, text]) => (
            <div key={n}>
              <span>{n}</span>
              <p>
                <strong>{title}</strong>
                <small>{text}</small>
              </p>
            </div>
          ))}
          <Button variant="secondary" onClick={() => go("admin-dashboard")}>
            Go to dashboard
          </Button>
        </aside>
      </div>
      <section className="key-states">
        <h2>Connection activity</h2>
        <div>
          {[
            ["Alex Morgan", "Connected", "Mood, stress, sleep", "mint"],
            ["Sam Lee", "Pending consent", "Key opened today", "yellow"],
            ["Previous key", "Expired", "Regenerated 2 days ago", "neutral"],
          ].map(([name, state, text, color]) => (
            <article key={name}>
              <span className={`state-dot ${color}`} />
              <div>
                <strong>{name}</strong>
                <small>{text}</small>
              </div>
              <span className={`state-label ${color}`}>{state}</span>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function AdminDashboard() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const currentUser = getSessionUser()

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    setLoading(true)
    try {
      const res = await getConnections()
      const supConns = (res.connections || []).filter(
        (c) => !currentUser || c.supporter_id === currentUser.id,
      )
      setConnections(supConns)
    } catch {
      // Keep state on error
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (id: number) => {
    setActionLoading(id)
    setFeedback(null)
    try {
      await acceptConnection(id)
      setFeedback({ type: "success", message: "Connection request accepted" })
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "accepted" } : c)),
      )
    } catch (err: any) {
      if (err?.status === 401) {
        setFeedback({
          type: "error",
          message: "Your session has expired. Please log in again.",
        })
      } else if (err?.status === 403) {
        setFeedback({
          type: "error",
          message: "You are not allowed to manage this connection.",
        })
      } else if (err?.status === 409) {
        setFeedback({
          type: "error",
          message: err.message || "Connection request is no longer pending.",
        })
      } else {
        setFeedback({
          type: "error",
          message: "Unable to update the connection. Please try again.",
        })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: number) => {
    setActionLoading(id)
    setFeedback(null)
    try {
      await rejectConnection(id)
      setFeedback({ type: "success", message: "Connection request rejected" })
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "rejected" } : c)),
      )
    } catch (err: any) {
      if (err?.status === 401) {
        setFeedback({
          type: "error",
          message: "Your session has expired. Please log in again.",
        })
      } else if (err?.status === 403) {
        setFeedback({
          type: "error",
          message: "You are not allowed to manage this connection.",
        })
      } else if (err?.status === 409) {
        setFeedback({
          type: "error",
          message: err.message || "Connection request is no longer pending.",
        })
      } else {
        setFeedback({
          type: "error",
          message: "Unable to update the connection. Please try again.",
        })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (id: number) => {
    setActionLoading(id)
    setFeedback(null)
    try {
      await revokeConnection(id)
      setFeedback({ type: "success", message: "Connection revoked" })
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "revoked" } : c)),
      )
    } catch (err: any) {
      if (err?.status === 401) {
        setFeedback({
          type: "error",
          message: "Your session has expired. Please log in again.",
        })
      } else if (err?.status === 403) {
        setFeedback({
          type: "error",
          message: "You are not allowed to manage this connection.",
        })
      } else if (err?.status === 409) {
        setFeedback({
          type: "error",
          message: err.message || "Connection is not currently active.",
        })
      } else {
        setFeedback({
          type: "error",
          message: "Unable to update the connection. Please try again.",
        })
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="TUESDAY, 15 OCTOBER"
        title={currentUser?.name ? `Good day, ${currentUser.name}.` : "Good morning, Maya."}
        text="Here’s your support overview. Only authorized information is visible."
        action={
          <Button variant="secondary" onClick={() => go("access-key")}>
            <Icon name="key" size={17} /> Share support key
          </Button>
        }
      />
      {feedback && (
        <div
          style={{
            background: feedback.type === "success" ? "#f0fdf4" : "#fff1f2",
            color: feedback.type === "success" ? "#15803d" : "#be123c",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            marginBottom: "16px",
            border: `1px solid ${
              feedback.type === "success" ? "#bbf7d0" : "#fecdd3"
            }`,
          }}
        >
          {feedback.message}
        </div>
      )}
      <div className="admin-metrics">
        {[
          ["Linked users", String(connections.filter((c) => c.status === "accepted").length), "Active connections", "people", "lavender"],
          ["Pending requests", String(connections.filter((c) => c.status === "pending").length), "Awaiting approval", "heart", "yellow"],
          ["Recent check-ins", "7", "Today", "check", "blue"],
          ["Support updates", "2", "Worth reviewing", "pulse", "mint"],
        ].map(([label, value, text, icon, color]) => (
          <article key={label}>
            <span className={`type-icon ${color}`}>
              <Icon name={icon as IconName} />
            </span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="admin-dashboard-grid">
        <section className="linked-overview">
          <div className="card-head">
            <div>
              <span className="card-kicker">LINKED USER OVERVIEW</span>
              <h2>People you support</h2>
            </div>
            <button onClick={() => go("requests")}>
              View requests <Icon name="arrow" size={15} />
            </button>
          </div>
          {loading ? (
            <p style={{ padding: "16px", color: "#64748b" }}>
              Loading connections...
            </p>
          ) : connections.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>
                No active connections yet.
              </p>
            </div>
          ) : (
            <div className="user-table">
              <div className="table-head">
                <span>User</span>
                <span>Permissions granted</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {connections.map((c) => {
                const requesterName = c.requester?.name || "Student"
                const requesterType = c.requester?.user_type
                  ? c.requester.user_type.charAt(0).toUpperCase() +
                    c.requester.user_type.slice(1)
                  : c.requester?.role || "User"
                const initials = requesterName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
                const permissionsList = [
                  c.allow_mood && "Mood",
                  c.allow_stress && "Stress",
                  c.allow_sleep && "Sleep",
                  c.allow_energy && "Energy",
                ]
                  .filter(Boolean)
                  .join(" · ") || "None"
                const isAccepted = c.status === "accepted"
                const isPending = c.status === "pending"

                return (
                  <div className="table-row" key={c.id}>
                    <span className="user-cell">
                      <i className="avatar">{initials}</i>
                      <span>
                        <strong>{requesterName}</strong>
                        <small>{requesterType}</small>
                      </span>
                    </span>
                    <span>{permissionsList}</span>
                    <span>
                      <i
                        className={`status-badge ${
                          isAccepted
                            ? "balanced"
                            : isPending
                              ? "notice"
                              : "neutral"
                        }`}
                      >
                        <b /> {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </i>
                    </span>
                    <span style={{ display: "flex", gap: "6px" }}>
                      {isPending && (
                        <>
                          <Button
                            onClick={() => handleAccept(c.id)}
                            disabled={actionLoading === c.id}
                          >
                            {actionLoading === c.id ? "Accepting..." : "Accept"}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleReject(c.id)}
                            disabled={actionLoading === c.id}
                          >
                            {actionLoading === c.id ? "Rejecting..." : "Reject"}
                          </Button>
                        </>
                      )}
                      {isAccepted && (
                        <button
                          onClick={() => handleRevoke(c.id)}
                          disabled={actionLoading === c.id}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "13px",
                            padding: "6px 10px",
                          }}
                        >
                          {actionLoading === c.id ? "Revoking..." : "Revoke"}
                        </button>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
        <aside className="recent-activity">
          <div className="card-head">
            <div>
              <span className="card-kicker">RECENT ACTIVITY</span>
              <h2>Latest updates</h2>
            </div>
          </div>
          {[
            ["Alex completed today’s check-in.", "12 min ago", "check", "mint"],
            [
              "Sam’s stress trend changed from baseline.",
              "2 hours ago",
              "chart",
              "yellow",
            ],
            [
              "Nila shared a monthly report.",
              "Yesterday",
              "report",
              "lavender",
            ],
          ].map(([text, time, icon, color]) => (
            <div className="activity-row" key={text}>
              <span className={`type-icon ${color}`}>
                <Icon name={icon as IconName} />
              </span>
              <p>
                <strong>{text}</strong>
                <small>{time}</small>
              </p>
            </div>
          ))}
          <button onClick={() => go("insights")}>
            View all activity <Icon name="arrow" size={15} />
          </button>
        </aside>
        <section className="admin-privacy-banner">
          <span className="mini-icon mint">
            <Icon name="shield" />
          </span>
          <div>
            <strong>Privacy is part of every view.</strong>
            <p>
              You see pattern summaries users have approved — never private
              journals, conversations, or counselling notes.
            </p>
          </div>
          <button>Review policy</button>
        </section>
      </div>
    </>
  )
}

function LinkedUsers() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(false)
  const currentUser = getSessionUser()

  useEffect(() => {
    let active = true
    setLoading(true)
    getConnections()
      .then((res) => {
        if (active) {
          const acceptedConns = (res.connections || []).filter(
            (c) =>
              c.status === "accepted" &&
              (!currentUser || c.supporter_id === currentUser.id),
          )
          setConnections(acceptedConns)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <PageHeading
        eyebrow="AUTHORIZED CONNECTIONS"
        title="Linked users"
        text="View only the patterns each person has chosen to share."
        action={
          <Button onClick={() => go("access-key")}>Invite with key</Button>
        }
      />
      <div className="toolbar">
        <label>
          <Icon name="focus" size={18} />
          <input placeholder="Search linked users..." />
        </label>
        <div className="filter-tabs">
          <button className="active">All {connections.length}</button>
          <button onClick={() => go("requests")}>Requests</button>
        </div>
      </div>
      {loading ? (
        <p style={{ padding: "20px", color: "#64748b" }}>Loading linked users...</p>
      ) : connections.length === 0 ? (
        <div
          style={{
            background: "var(--card-bg, #ffffff)",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: "16px",
            padding: "32px",
            textAlign: "center",
            marginTop: "16px",
          }}
        >
          <EchoMascot mood="supportive" size="sm" />
          <h3 style={{ fontSize: "16px", marginTop: "12px", color: "#0f172a" }}>
            No active connections yet.
          </h3>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px", marginBottom: "16px" }}>
            Share your support key with users to link their approved patterns.
          </p>
          <Button onClick={() => go("access-key")}>Share support key</Button>
        </div>
      ) : (
        <div className="linked-grid">
          {connections.map((c) => {
            const requesterName = c.requester?.name || "Student"
            const requesterType = c.requester?.user_type
              ? c.requester.user_type.charAt(0).toUpperCase() +
                c.requester.user_type.slice(1)
              : c.requester?.role || "User"
            const initials = requesterName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
            const permissionsList =
              [
                c.allow_mood && "Mood",
                c.allow_stress && "Stress",
                c.allow_sleep && "Sleep",
                c.allow_energy && "Energy",
              ]
                .filter(Boolean)
                .join(" · ") || "None"

            return (
              <article className="linked-card" key={c.id}>
                <div className="connection-head">
                  <span className="avatar large">{initials}</span>
                  <div>
                    <h3>{requesterName}</h3>
                    <p>{requesterType}</p>
                  </div>
                  <span className="status-badge balanced">
                    <i /> Connected
                  </span>
                </div>
                <LineChart
                  values={[55, 60, 58, 64, 62, 70, 68]}
                  color="#4ab1a5"
                />
                <div className="linked-shared">
                  <span>
                    <Icon name="shield" size={14} /> Shared with you
                  </span>
                  <p>{permissionsList}</p>
                </div>
                <div className="linked-bottom">
                  <span>
                    Status: <strong>Active</strong>
                  </span>
                  <button onClick={() => go("admin-dashboard")}>
                    Manage in dashboard <Icon name="arrow" size={15} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

function LinkedUser() {
  const [range, setRange] = useState("7 days")
  return (
    <>
      <div className="linked-user-head">
        <button onClick={() => go("linked-users")}>← Linked users</button>
        <div>
          <span className="avatar xlarge">AM</span>
          <div>
            <span className="status-badge balanced">
              <i /> Stable
            </span>
            <h1>Alex’s ECHO Pattern</h1>
            <p>Student · Last check-in today at 8:42 AM</p>
          </div>
        </div>
        <Button variant="secondary">Send support message</Button>
      </div>
      <div className="sharing-summary">
        <div>
          <Icon name="shield" />
          <span>
            <strong>Shared with you</strong>
            <small>Mood, stress, sleep, and energy trends</small>
          </span>
        </div>
        <div>
          <Icon name="lock" />
          <span>
            <strong>Private</strong>
            <small>Journal, conversations, counselling notes</small>
          </span>
        </div>
      </div>
      <div className="chart-toolbar">
        <h2>Authorized pattern trends</h2>
        <div className="filter-tabs">
          {["7 days", "30 days", "3 months"].map((t) => (
            <button
              className={range === t ? "active" : ""}
              onClick={() => setRange(t)}
              key={t}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <article className="large-chart-card">
        <div className="chart-legend">
          <span>
            <i style={{ background: "#55b5aa" }} />
            Mood
          </span>
          <span>
            <i style={{ background: "#e58179" }} />
            Stress
          </span>
          <span>
            <i style={{ background: "#e0aa3c" }} />
            Energy
          </span>
          <span>
            <i className="dash" />
            Baseline
          </span>
        </div>
        <div className="multi-chart">
          <LineChart
            labels
            values={[56, 62, 58, 68, 65, 72, 74]}
            color="#55b5aa"
          />
          <div className="overlay-chart">
            <LineChart values={[42, 48, 45, 60, 58, 65, 61]} color="#e58179" />
          </div>
        </div>
      </article>
      <div className="authorized-metrics">
        {[
          ["Mood", "7.2", "+0.4", "mint"],
          ["Stress", "6.1", "+1.2", "coral"],
          ["Energy", "6.8", "+0.3", "yellow"],
          ["Sleep", "7.1h", "+12m", "blue"],
        ].map(([label, value, delta, color]) => (
          <article key={label}>
            <span className={`metric-dot ${color}`} />
            <small>{label}</small>
            <strong>{value}</strong>
            <em>{delta} vs baseline</em>
          </article>
        ))}
      </div>
      <div className="admin-insight-card">
        <span className="mini-icon yellow">
          <Icon name="spark" />
        </span>
        <div>
          <span className="card-kicker">SUPPORT INSIGHT</span>
          <h3>
            Alex’s stress has been above their usual pattern for three days.
          </h3>
          <p>
            This may relate to a higher workload. Consider a gentle check-in
            rather than making assumptions.
          </p>
        </div>
        <Button variant="secondary">View support guidance</Button>
      </div>
    </>
  )
}

function SimpleAdminPage({ type }: { type: "insights" | "requests" }) {
  const insights = type === "insights"
  const [connections, setConnections] = useState<IncomingConnection[]>([])
  const [, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  useEffect(() => {
    if (!insights) {
      loadRequests()
    }
  }, [insights])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await getIncomingConnections()
      setConnections(res.connections || [])
    } catch {
      // Keep state if fetch fails or unauthenticated
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (id: number) => {
    setActionLoading(id)
    setFeedback(null)
    try {
      await acceptConnection(id)
      setFeedback({ type: "success", message: "Connection request accepted" })
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "accepted" } : c)),
      )
    } catch (err: any) {
      if (err?.status === 401) {
        setFeedback({
          type: "error",
          message: "Your session has expired. Please log in again.",
        })
      } else if (err?.status === 403) {
        setFeedback({
          type: "error",
          message: "You are not allowed to manage this connection.",
        })
      } else if (err?.status === 404) {
        setFeedback({
          type: "error",
          message: "Connection request not found.",
        })
      } else if (err?.status === 409) {
        setFeedback({
          type: "error",
          message: err.message || "Connection request is no longer pending.",
        })
      } else {
        setFeedback({
          type: "error",
          message: "Unable to update the connection. Please try again.",
        })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: number) => {
    setActionLoading(id)
    setFeedback(null)
    try {
      await rejectConnection(id)
      setFeedback({ type: "success", message: "Connection request rejected" })
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "rejected" } : c)),
      )
    } catch (err: any) {
      if (err?.status === 401) {
        setFeedback({
          type: "error",
          message: "Your session has expired. Please log in again.",
        })
      } else if (err?.status === 403) {
        setFeedback({
          type: "error",
          message: "You are not allowed to manage this connection.",
        })
      } else if (err?.status === 404) {
        setFeedback({
          type: "error",
          message: "Connection request not found.",
        })
      } else if (err?.status === 409) {
        setFeedback({
          type: "error",
          message: err.message || "Connection request is no longer pending.",
        })
      } else {
        setFeedback({
          type: "error",
          message: "Unable to update the connection. Please try again.",
        })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (id: number) => {
    setActionLoading(id)
    setFeedback(null)
    try {
      await revokeConnection(id)
      setFeedback({ type: "success", message: "Connection revoked" })
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "revoked" } : c)),
      )
    } catch (err: any) {
      if (err?.status === 401) {
        setFeedback({
          type: "error",
          message: "Your session has expired. Please log in again.",
        })
      } else if (err?.status === 403) {
        setFeedback({
          type: "error",
          message: "You are not allowed to manage this connection.",
        })
      } else if (err?.status === 404) {
        setFeedback({
          type: "error",
          message: "Connection request not found.",
        })
      } else if (err?.status === 409) {
        setFeedback({
          type: "error",
          message: err.message || "Connection is not currently active.",
        })
      } else {
        setFeedback({
          type: "error",
          message: "Unable to update the connection. Please try again.",
        })
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={insights ? "PATTERN CHANGES" : "CONSENT-BASED SUPPORT"}
        title={insights ? "Support insights" : "Support requests"}
        text={
          insights
            ? "Calm, non-diagnostic summaries of authorized pattern changes."
            : "Messages and connection requests from linked users who have chosen to ask for support."
        }
      />
      {feedback && (
        <div
          style={{
            background: feedback.type === "success" ? "#f0fdf4" : "#fff1f2",
            color: feedback.type === "success" ? "#15803d" : "#be123c",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            marginBottom: "16px",
            border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fecdd3"}`,
          }}
        >
          {feedback.message}
        </div>
      )}
      <div className="simple-list">
        {insights ? (
          [
            [
              "Sam’s stress trend is above baseline",
              "Worth noticing",
              "The change has continued for 4 days. A gentle check-in may help.",
              "yellow",
            ],
            [
              "Alex’s sleep consistency improved",
              "Positive change",
              "Energy has also moved closer to baseline.",
              "mint",
            ],
            [
              "Monthly reports are ready",
              "3 new reports",
              "Review only the trends users chose to share.",
              "lavender",
            ],
          ].map(([title, state, text, color]) => (
            <article key={title}>
              <span className={`type-icon ${color}`}>
                <Icon name="chart" />
              </span>
              <div>
                <span className="card-kicker">{state}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <Button variant="secondary">Review pattern</Button>
            </article>
          ))
        ) : connections.length > 0 ? (
          connections.map((conn) => {
            const requesterName = conn.requester?.name || "Student"
            const requesterType = conn.requester?.user_type
              ? conn.requester.user_type.charAt(0).toUpperCase() +
                conn.requester.user_type.slice(1)
              : "Student"
            const isPending = conn.status === "pending"
            const isAccepted = conn.status === "accepted"

            return (
              <article key={conn.id} style={{ alignItems: "flex-start" }}>
                <span
                  className={`type-icon ${
                    isPending ? "yellow" : isAccepted ? "mint" : "coral"
                  }`}
                >
                  <Icon name="heart" />
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span className="card-kicker">
                      {requesterType} · Connection request
                    </span>
                    <span
                      className={`status-badge ${
                        isAccepted ? "balanced" : isPending ? "notice" : ""
                      }`}
                      style={{ fontSize: "8px", padding: "3px 7px" }}
                    >
                      <i /> {conn.status.toUpperCase()}
                    </span>
                  </div>
                  <h3>{requesterName}</h3>
                  <p
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "6px",
                      fontSize: "10px",
                      color: "var(--muted)",
                    }}
                  >
                    <span>Mood {conn.allow_mood ? "✓" : "—"}</span>
                    <span>Stress {conn.allow_stress ? "✓" : "—"}</span>
                    <span>Sleep {conn.allow_sleep ? "✓" : "—"}</span>
                    <span>Energy {conn.allow_energy ? "✓" : "—"}</span>
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {isPending && (
                    <>
                      <Button
                        onClick={() => handleAccept(conn.id)}
                        disabled={actionLoading === conn.id}
                        icon="check"
                      >
                        {actionLoading === conn.id ? "Accepting..." : "Accept"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleReject(conn.id)}
                        disabled={actionLoading === conn.id}
                      >
                        {actionLoading === conn.id ? "Rejecting..." : "Reject"}
                      </Button>
                    </>
                  )}
                  {isAccepted && (
                    <Button
                      variant="ghost"
                      onClick={() => handleRevoke(conn.id)}
                      disabled={actionLoading === conn.id}
                      style={{ color: "#b74e49" }}
                    >
                      {actionLoading === conn.id
                        ? "Revoking..."
                        : "Revoke connection"}
                    </Button>
                  )}
                </div>
              </article>
            )
          })
        ) : (
          <article>
            <span className="type-icon neutral">
              <Icon name="heart" />
            </span>
            <div>
              <span className="card-kicker">INCOMING REQUESTS</span>
              <h3>No pending connection requests</h3>
              <p>
                When students or users connect using your support key, their
                requests will appear here.
              </p>
            </div>
          </article>
        )}
      </div>
    </>
  )
}

function App() {
  const route = useRoute()
  const publicRoutes: Partial<Record<Route, React.ReactNode>> = {
    landing: <Landing />,
    auth: <Auth />,
    role: <RoleSelection />,
    "user-type": <UserType />,
    onboarding: <Onboarding />,
    baseline: <Baseline />,
    "admin-type": <AdminType />,
    "admin-setup": <AdminSetup />,
    feedback: <Feedback />,
  }
  const userPages: Partial<Record<Route, React.ReactNode>> = {
    "user-dashboard": <UserDashboard />,
    checkin: <CheckIn />,
    pattern: <Pattern />,
    support: <Support />,
    counsellors: <Counsellors />,
    monthly: <Monthly />,
    circle: <Circle />,
    permissions: <Permissions />,
    reports: <Reports />,
    profile: <Profile />,
  }
  const adminPages: Partial<Record<Route, React.ReactNode>> = {
    "admin-dashboard": <AdminDashboard />,
    "access-key": <AccessKey />,
    "linked-users": <LinkedUsers />,
    "linked-user": <LinkedUser />,
    "admin-reports": <Reports admin />,
    insights: <SimpleAdminPage type="insights" />,
    requests: <SimpleAdminPage type="requests" />,
    settings: <Profile admin />,
  }
  const content =
    publicRoutes[route] ||
    (userPages[route] ? (
      <AppShell route={route}>{userPages[route]}</AppShell>
    ) : adminPages[route] ? (
      <AppShell route={route} admin>
        {adminPages[route]}
      </AppShell>
    ) : (
      <Landing />
    ))
  return (
    <>
      {content}
      {route !== "landing" && <EchoChat />}
    </>
  )
}

export default App

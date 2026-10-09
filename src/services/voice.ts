// Voice Service - src/services/voice.ts
// Provides Text-to-Speech (TTS), Web Audio Sound Synthesizer, and Speech-to-Text (STT)

export interface SpeakOptions {
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (err?: any) => void
}

let cachedVoices: SpeechSynthesisVoice[] = []
let globalAudioCtx: AudioContext | null = null

// Set to prevent Garbage Collection of utterances in Chromium (Chrome / Edge)
const activeUtterances = new Set<SpeechSynthesisUtterance>()

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

export function isVoiceInputSupported(): boolean {
  if (typeof window === "undefined") return false
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  )
}

/**
 * Initialize / resume AudioContext to unlock browser audio hardware and speech synthesis.
 */
export function unlockAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return null
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioCtx()
    }
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume()
    }
  } catch {}

  if (isSpeechSupported()) {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
    } catch {}
  }

  return globalAudioCtx
}

// Auto-unlock audio on any initial user gesture
if (typeof window !== "undefined") {
  const onGesture = () => {
    unlockAudioContext()
  }
  window.addEventListener("pointerdown", onGesture, { passive: true, once: false })
  window.addEventListener("click", onGesture, { passive: true, once: false })
  window.addEventListener("keydown", onGesture, { passive: true, once: false })
}

/**
 * Play a gentle, soothing audio chime using Web Audio API.
 * This primes the audio subsystem and provides immediate audible feedback.
 */
export function playChime(type: "gentle" | "sparkle" | "pop" = "gentle"): void {
  try {
    const ctx = unlockAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    if (type === "gentle") {
      // Warm twin harmonic chime (C5 -> E5)
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = "sine"
      osc2.type = "sine"
      osc1.frequency.setValueAtTime(523.25, now) // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.14) // E5
      osc2.frequency.setValueAtTime(659.25, now)
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.14) // G5

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.35)
      osc2.stop(now + 0.35)
    } else if (type === "pop") {
      // Friendly soft confirmation blip
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.18)
    } else {
      // Sparkle chime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.2)

      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    }
  } catch {}
}

/**
 * Remove emojis, markdown symbols, and formatting that sound awkward when read aloud by TTS.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return ""
  return text
    // Replace markdown symbols
    .replace(/[*_#`~]/g, "")
    // Remove common emojis & pictographs
    .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "")
    // Clean up multiple spaces and dashes
    .replace(/\s+/g, " ")
    .trim()
}

export function loadVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return []
  try {
    const voices = window.speechSynthesis.getVoices()
    if (voices && voices.length > 0) {
      cachedVoices = voices
    }
  } catch {}
  return cachedVoices
}

// Pre-load voices on module import
if (isSpeechSupported()) {
  loadVoices()
  if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices()
    }
  }
}

export function getPreferredVoice(): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length > 0 ? cachedVoices : loadVoices()
  if (!voices || voices.length === 0) return null

  // Prioritize natural, friendly English voices (e.g. Samantha, Google, Natural, Jenny)
  const enVoices = voices.filter((v) => v.lang.startsWith("en"))
  if (enVoices.length === 0) return voices[0] || null

  const naturalVoice = enVoices.find(
    (v) =>
      v.name.includes("Natural") ||
      v.name.includes("Google") ||
      v.name.includes("Samantha") ||
      v.name.includes("Jenny") ||
      v.name.includes("Victoria") ||
      v.name.includes("Female") ||
      v.name.includes("Zira") ||
      v.name.includes("David"),
  )
  return naturalVoice || enVoices[0] || null
}

let currentUtterance: SpeechSynthesisUtterance | null = null
let speechHeartbeatTimer: any = null

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return
  try {
    if (speechHeartbeatTimer) {
      clearInterval(speechHeartbeatTimer)
      speechHeartbeatTimer = null
    }
    window.speechSynthesis.cancel()
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
  } catch {}
  activeUtterances.clear()
  currentUtterance = null
}

/**
 * Speak text aloud with voice synthesis.
 * Uses timing safeguards and utterance references to guarantee playback in Chromium and WebKit.
 */
export function speakText(text: string, options: SpeakOptions = {}): boolean {
  if (!isSpeechSupported()) {
    options.onError?.(new Error("Speech synthesis not supported"))
    return false
  }

  const cleaned = cleanTextForSpeech(text)
  if (!cleaned) {
    options.onEnd?.()
    return false
  }

  // Unlock audio context and audio hardware
  unlockAudioContext()

  // Cancel prior speech
  try {
    window.speechSynthesis.cancel()
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
  } catch {}

  // 40ms timeout allows Chromium IPC cancel queue to settle before queueing fresh utterance
  setTimeout(() => {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }

      const utterance = new SpeechSynthesisUtterance(cleaned)
      utterance.rate = options.rate ?? 0.95
      utterance.pitch = options.pitch ?? 1.05
      utterance.volume = options.volume ?? 1.0

      const voice = getPreferredVoice()
      if (voice) {
        utterance.voice = voice
      }

      // Store in Set and global window to protect from V8 garbage collection
      activeUtterances.add(utterance)
      currentUtterance = utterance
      if (typeof window !== "undefined") {
        ;(window as any).__echoUtterance = utterance
      }

      let hasStarted = false

      utterance.onstart = () => {
        hasStarted = true
        options.onStart?.()

        // Keep Chromium's engine active for longer utterances
        if (!speechHeartbeatTimer) {
          speechHeartbeatTimer = setInterval(() => {
            if (isSpeechSupported() && window.speechSynthesis.speaking) {
              window.speechSynthesis.pause()
              window.speechSynthesis.resume()
            } else {
              clearInterval(speechHeartbeatTimer)
              speechHeartbeatTimer = null
            }
          }, 8000)
        }
      }

      utterance.onend = () => {
        activeUtterances.delete(utterance)
        if (currentUtterance === utterance) {
          currentUtterance = null
        }
        if (speechHeartbeatTimer) {
          clearInterval(speechHeartbeatTimer)
          speechHeartbeatTimer = null
        }
        options.onEnd?.()
      }

      utterance.onerror = (e) => {
        activeUtterances.delete(utterance)
        if (currentUtterance === utterance) {
          currentUtterance = null
        }
        if (speechHeartbeatTimer) {
          clearInterval(speechHeartbeatTimer)
          speechHeartbeatTimer = null
        }
        if (e.error !== "canceled" && e.error !== "interrupted") {
          options.onError?.(e)
        } else {
          options.onEnd?.()
        }
      }

      window.speechSynthesis.speak(utterance)

      // Watchdog: If onstart hasn't fired in 300ms, call resume()
      setTimeout(() => {
        if (!hasStarted && isSpeechSupported()) {
          try {
            window.speechSynthesis.resume()
          } catch {}
        }
      }, 300)
    } catch (err) {
      options.onError?.(err)
    }
  }, 40)

  return true
}

export interface SpeechRecognitionHandlers {
  onStart?: () => void
  onResult?: (transcript: string) => void
  onError?: (errorMessage: string) => void
  onEnd?: () => void
}

export function createSpeechRecognizer(handlers: SpeechRecognitionHandlers) {
  if (!isVoiceInputSupported()) return null

  const SpeechRec =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  if (!SpeechRec) return null

  try {
    const rec = new SpeechRec()
    rec.lang = "en-US"
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      handlers.onStart?.()
    }

    rec.onresult = (event: any) => {
      let fullTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript
      }
      if (fullTranscript.trim()) {
        handlers.onResult?.(fullTranscript.trim())
      }
    }

    rec.onerror = (event: any) => {
      let message = "Speech recognition error"
      if (event.error === "not-allowed") {
        message = "Microphone access was denied. Please allow microphone permission in your browser."
      } else if (event.error === "no-speech") {
        message = "No speech detected. Please try speaking again."
      } else if (event.error === "network") {
        message = "Network error during speech recognition."
      } else {
        message = `Recognition notice: ${event.error}`
      }
      handlers.onError?.(message)
    }

    rec.onend = () => {
      handlers.onEnd?.()
    }

    return rec
  } catch {
    return null
  }
}

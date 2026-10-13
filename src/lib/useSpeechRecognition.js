// Web Speech API as an enhancement, never a requirement (docs/UI.md rule 7,
// docs/RISKS.md R6). Firefox has no implementation by default; Chrome/Edge
// route audio through a cloud recognition service, so voice is explicitly
// NOT part of the "runs on your device" privacy claim, only the quote
// building after transcription is.

import { useEffect, useRef, useState } from 'react'

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useSpeechRecognition({ onResult } = {}) {
  const Ctor = getRecognitionCtor()
  const supported = Boolean(Ctor)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!supported) return
    const recognition = new Ctor()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
      onResult?.(text)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    return () => recognition.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported])

  function start() {
    if (!recognitionRef.current) return
    setListening(true)
    recognitionRef.current.start()
  }

  function stop() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return { supported, listening, start, stop }
}

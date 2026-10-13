import { createContext, useContext, useEffect, useState } from 'react'
import { BusinessProfile } from '../lib/schema'
import { loadJSON, saveJSON, KEYS } from '../lib/storage'

const DEFAULT_PROFILE = {
  name: 'Your business',
  trade: '',
  contact: '',
  currency: 'USD',
  taxRate: 0,
}

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() =>
    loadJSON(KEYS.profile, BusinessProfile, DEFAULT_PROFILE)
  )

  useEffect(() => {
    saveJSON(KEYS.profile, profile)
  }, [profile])

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}

'use client'

import React from "react"

import { useEffect } from 'react'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[v0] Service Worker registered:', registration.scope)
            
            // Check for updates periodically
            setInterval(() => {
              registration.update()
            }, 60 * 1000) // Check every minute
          })
          .catch((error) => {
            console.error('[v0] Service Worker registration failed:', error)
          })
      })
    }
  }, [])

  return <>{children}</>
}

import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './styles.css'
import App from './App'
import MobileGate from './MobileGate'

const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || (window.innerWidth < 768 && 'ontouchstart' in window)

createRoot(document.getElementById('root')).render(
  <>{isMobile ? <MobileGate /> : <App />}<Analytics /></>
)

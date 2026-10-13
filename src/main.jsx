// No StrictMode: ModelProvider's mount effect acquires a native OPFS
// sync-access-handle through wllama's cache manager. StrictMode's deliberate
// double-invoke-then-cleanup of effects in development collides with that
// handle (the second mount races the first one's teardown), throwing
// NoModificationAllowedError. Same category of issue as a WebGL/Pixi
// double-init; the fix is the same, don't double-invoke this effect.
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)

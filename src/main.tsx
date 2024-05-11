import { App } from './components/App'
import './main.css'
import 'uno.css'

// Mount our app in its own module, so hot-reloading doesn't create duplicate instances of our App component.
document.body.append(<App />)

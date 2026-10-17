/**
 * main.ts — the app's starting point. The browser runs this file first.
 * It loads the styles (fonts, then tokens, then base, then components) and draws the page.
 */
import '@fontsource-variable/public-sans';
import '@fontsource-variable/source-serif-4';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { renderHome } from './pages/home';

const root = document.getElementById('app');
if (root) renderHome(root);

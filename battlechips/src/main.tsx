import { createRoot } from 'react-dom/client';
import BattleChips from './BattleChips';
import './index.css';

// No StrictMode: it double-invokes effects, which would run the turn timers and
// the opponent's fire loop twice over.
createRoot(document.getElementById('root')!).render(<BattleChips />);

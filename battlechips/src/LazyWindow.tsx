/* The funding window arrives over the network, long after the page did. That can
   fail — a dropped connection, a stale chunk after a deploy — and when it does the
   button must not just sit there doing nothing. This catches the failure, says so,
   and offers another go. */
import React from 'react';

interface Props { children: React.ReactNode; onClose: () => void }
interface State { failed: boolean; key: number }

const raised =
  'bg-[#c3c3c3] border-2 border-t-white border-l-white border-b-[#5c5c5c] border-r-[#5c5c5c] ' +
  'shadow-[inset_1px_1px_0_#e6e6e6,inset_-1px_-1px_0_#8a8a8a]';
const btn98 =
  `${raised} px-5 py-1.5 font-bold text-black text-sm active:border-t-[#5c5c5c] active:border-l-[#5c5c5c] ` +
  'active:border-b-white active:border-r-white select-none';

export class LazyWindow extends React.Component<Props, State> {
  state: State = { failed: false, key: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  /** Remounting the subtree makes React retry the dynamic import. */
  private retry = () => this.setState((s) => ({ failed: false, key: s.key + 1 }));

  render() {
    if (!this.state.failed) return <React.Fragment key={this.state.key}>{this.props.children}</React.Fragment>;
    return (
      <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4" onClick={this.props.onClose}>
        <div className={`${raised} w-full max-w-sm p-1`} onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#000080] text-white font-bold text-sm px-2 py-1">Fund your account</div>
          <div className="p-4 text-center space-y-3">
            <p className="text-sm text-black">Couldn&apos;t load the funding window. Check your connection and try again.</p>
            <div className="flex justify-center gap-3">
              <button onClick={this.retry} className={btn98}>RETRY</button>
              <button onClick={this.props.onClose} className={btn98}>CLOSE</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

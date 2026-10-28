import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Sparkles } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-900 bg-mesh flex items-center justify-center p-4">
      <div className="text-center max-w-md animate-fade-in">
        {/* Glowing 404 */}
        <div className="relative mb-8">
          <div className="text-[120px] font-black font-display leading-none gradient-text select-none">
            404
          </div>
          <div className="absolute inset-0 text-[120px] font-black font-display leading-none text-purple-500/20 blur-2xl select-none">
            404
          </div>
        </div>

        <div className="text-5xl mb-4 animate-float">🎭</div>
        <h1 className="text-2xl font-bold text-white font-display mb-3">Page Not Found</h1>
        <p className="text-slate-400 mb-8">
          Looks like this page wandered off the venue. Let's get you back to the party!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => window.history.back()} className="btn-secondary btn-lg">
            <ArrowLeft size={18} /> Go Back
          </button>
          <Link to="/dashboard" className="btn-primary btn-lg">
            <Home size={18} /> Back to Dashboard
          </Link>
        </div>

        <div className="mt-8 text-xs text-slate-600 flex items-center justify-center gap-1">
          <Sparkles size={12} className="text-purple-400" />
          EventCEO AI
        </div>
      </div>
    </div>
  )
}

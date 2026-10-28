import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { QrCode, Users, CheckCircle2, Clock, RefreshCw, ChevronLeft, Camera, X } from 'lucide-react'
import { checkinApi } from '../services/api'
import toast from 'react-hot-toast'

export default function CheckInPage() {
  const { id: eventId } = useParams()
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const scannerRef = useRef(null)
  const htmlScannerRef = useRef(null)

  const { data: stats, refetch, isLoading } = useQuery({
    queryKey: ['checkin-stats', eventId],
    queryFn: () => checkinApi.stats(eventId).then(r => r.data),
    refetchInterval: scanning ? 5000 : 10000,
  })

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (htmlScannerRef.current) {
        htmlScannerRef.current.stop().catch(() => {})
        htmlScannerRef.current = null
      }
    }
  }, [])

  async function startScanner() {
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode')
      setScanning(true)

      // Wait for DOM to be ready
      await new Promise(r => setTimeout(r, 200))

      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      }, false)

      htmlScannerRef.current = scanner

      scanner.render(
        async (decodedText) => {
          // Pause scanning to process
          try {
            const parsed = JSON.parse(decodedText)
            const res = await checkinApi.scan(parsed.token, eventId)
            const guest = res.data.guest
            setLastScan({ success: true, name: guest.name, time: new Date() })
            toast.success(`✅ Checked in: ${guest.name}`)
            refetch()
          } catch (err) {
            const msg = err.response?.data?.error || 'Invalid QR code'
            setLastScan({ success: false, error: msg, time: new Date() })
            toast.error(msg)
          }
        },
        (error) => {
          // Scan errors are normal (camera still scanning)
        }
      )
    } catch (err) {
      toast.error('Could not start camera: ' + err.message)
      setScanning(false)
    }
  }

  async function stopScanner() {
    if (htmlScannerRef.current) {
      try {
        await htmlScannerRef.current.stop()
        htmlScannerRef.current.clear()
      } catch (e) {}
      htmlScannerRef.current = null
    }
    setScanning(false)
  }

  const checkInRate = stats
    ? stats.rsvpYes > 0
      ? Math.round((stats.checkedIn / stats.rsvpYes) * 100)
      : 0
    : 0

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/events/${eventId}`} className="btn-icon text-slate-400">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white font-display">QR Check-In</h1>
          <p className="text-sm text-slate-400">Scan guest QR codes at the entrance</p>
        </div>
        <button onClick={() => refetch()} className="btn-icon text-slate-400" title="Refresh stats">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-sm p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">{stats?.checkedIn || 0}</div>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Checked In</div>
        </div>
        <div className="glass-sm p-4 text-center">
          <div className="text-3xl font-bold text-white">{stats?.rsvpYes || 0}</div>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Expected</div>
        </div>
        <div className="glass-sm p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{checkInRate}%</div>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Attendance</div>
        </div>
      </div>

      {/* Progress bar */}
      {stats && (
        <div className="glass-sm p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Check-in progress</span>
            <span className="text-white font-semibold">{stats.checkedIn} / {stats.rsvpYes}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill bg-gradient-to-r from-emerald-500 to-green-400"
              style={{ width: `${checkInRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>{stats.notCheckedIn || (stats.rsvpYes - stats.checkedIn)} still awaited</span>
            <span>{stats.checkedIn} arrived</span>
          </div>
        </div>
      )}

      {/* Scanner Section */}
      <div className="glass p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <QrCode size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="font-bold text-white font-display">QR Scanner</h2>
            <p className="text-xs text-slate-400">Use your device camera to scan guest QR codes</p>
          </div>
        </div>

        {!scanning ? (
          <div className="text-center py-8">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-purple-500/40 flex items-center justify-center mx-auto mb-4">
              <Camera size={36} className="text-purple-400 opacity-60" />
            </div>
            <p className="text-slate-400 text-sm mb-4">Start the camera to begin scanning guest QR codes</p>
            <button onClick={startScanner} className="btn-primary btn-lg">
              <Camera size={20} /> Start Camera
            </button>
          </div>
        ) : (
          <div>
            <div id="qr-reader" ref={scannerRef} className="rounded-xl overflow-hidden" />
            <button onClick={stopScanner} className="btn-danger w-full mt-4">
              <X size={16} /> Stop Camera
            </button>
          </div>
        )}
      </div>

      {/* Last scan result */}
      {lastScan && (
        <div className={`glass p-5 mb-6 animate-slide-up ${lastScan.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="flex items-center gap-3">
            {lastScan.success ? (
              <CheckCircle2 size={24} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <X size={24} className="text-red-400 flex-shrink-0" />
            )}
            <div>
              <div className={`font-bold ${lastScan.success ? 'text-emerald-300' : 'text-red-300'}`}>
                {lastScan.success ? `✅ Welcome, ${lastScan.name}!` : '❌ Check-in failed'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {lastScan.success
                  ? `Checked in at ${lastScan.time.toLocaleTimeString()}`
                  : lastScan.error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent check-ins */}
      {stats?.recentCheckIns && stats.recentCheckIns.length > 0 && (
        <div className="glass p-5">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            Recent Check-ins
          </h3>
          <div className="space-y-2">
            {stats.recentCheckIns.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-bold">
                  {entry.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white">{entry.name}</div>
                  {entry.group && <div className="text-xs text-slate-500">{entry.group}</div>}
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(entry.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 alert-info text-xs">
        💡 <strong>How it works:</strong> Guest receives their QR code via WhatsApp or email. At the venue, scan it with the camera above to mark them as arrived.
      </div>
    </div>
  )
}

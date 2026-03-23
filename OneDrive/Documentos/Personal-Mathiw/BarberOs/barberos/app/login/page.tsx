'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<'owner' | 'barber'>('owner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleQuickLogin = (role: 'owner' | 'barber') => {
    setSelectedRole(role)
    setEmail(role === 'owner' ? 'owner@demo.com' : 'barber@demo.com')
    setPassword('demo123')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Por favor completá todos los campos')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // Obtener el perfil del usuario para saber su rol
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      console.log('User ID:', data.user.id)
      console.log('Profile data:', profile)
      console.log('Profile error:', profileError)

      // Redirigir según el rol
      if (profile?.role === 'owner') {
        console.log('Redirecting to /dashboard')
        router.push('/dashboard')
      } else {
        console.log('Redirecting to /mi-dashboard')
        router.push('/mi-dashboard')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al iniciar sesión'
      setError(errorMessage)
      toast.error('Error al iniciar sesión', {
        description: errorMessage === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : errorMessage
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base p-4">
      <div className="w-full max-w-5xl h-[620px] bg-bg-base rounded-[14px] overflow-hidden flex">
        {/* Lado izquierdo - Formulario */}
        <div className="flex-1 flex flex-col items-center justify-center px-10 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-9">
            <div className="w-10 h-10 rounded-[10px] bg-accent-yellow flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <path d="M4 14L9 4L14 14" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 10.5h6" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[22px] font-medium text-accent-yellow tracking-[0.02em]">BarberOS</div>
              <div className="text-[10px] text-text-muted tracking-[0.12em] uppercase mt-0.5">Sistema de gestión</div>
            </div>
          </div>

          {/* Formulario */}
          <div className="w-full max-w-[320px]">
            <h1 className="text-lg font-medium text-text-primary mb-1.5">Bienvenido de vuelta</h1>
            <p className="text-xs text-text-muted mb-7">Ingresá con tu cuenta para continuar</p>

            {error && (
              <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded-lg text-xs text-status-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-3.5">
                <label className="block text-[11px] text-[#666] uppercase tracking-[0.06em] mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-bg-surface border-[0.5px] border-[#2e2e2e] rounded-lg px-3.5 py-[11px] text-[13px] text-[#e0e0e0] outline-none transition-colors focus:border-accent-yellow placeholder:text-[#3a3a3a]"
                />
              </div>

              <div className="mb-3.5">
                <label className="block text-[11px] text-[#666] uppercase tracking-[0.06em] mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-surface border-[0.5px] border-[#2e2e2e] rounded-lg px-3.5 py-[11px] text-[13px] text-[#e0e0e0] outline-none transition-colors focus:border-accent-yellow placeholder:text-[#3a3a3a]"
                />
              </div>

              <div className="text-right -mt-2 mb-5">
                <a href="#" className="text-[11px] text-text-muted hover:text-accent-yellow cursor-pointer transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent-yellow text-bg-base rounded-lg py-3 text-[13px] font-medium tracking-[0.02em] hover:bg-[#e6b83a] transition-colors disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-[0.5px] bg-[#222]" />
                <span className="text-[11px] text-[#444]">o ingresá como</span>
                <div className="flex-1 h-[0.5px] bg-[#222]" />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('owner')}
                  className="flex-1 bg-accent-yellow-dim text-accent-yellow border-[0.5px] border-[#3a3000] rounded-lg py-2 text-[11px] hover:bg-[#2a2200] transition-colors"
                >
                  Dueño (demo)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('barber')}
                  className="flex-1 bg-accent-blue-dim text-accent-blue border-[0.5px] border-[#1e3a4a] rounded-lg py-2 text-[11px] hover:bg-[#0d1f33] transition-colors"
                >
                  Barbero (demo)
                </button>
              </div>
            </form>

            <div className="mt-5 text-[11px] text-[#333] text-center">
              BarberOS · v1.0 · Solo para uso interno
            </div>
          </div>
        </div>

        {/* Lado derecho - Tarjetas de roles */}
        <div className="w-[340px] bg-[#0e0e0e] border-l-[0.5px] border-border-default flex flex-col items-center justify-center px-8 py-10 gap-3">
          <div className="text-[13px] font-medium text-text-secondary self-start mb-1">
            Acceso según tu rol
          </div>
          <div className="text-[11px] text-[#444] self-start mb-2">
            Cada rol tiene su propia vista y permisos
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            {/* Card Owner */}
            <div
              onClick={() => setSelectedRole('owner')}
              className={`bg-bg-surface border-[0.5px] rounded-[10px] p-3.5 cursor-pointer transition-all flex items-center gap-3 ${
                selectedRole === 'owner'
                  ? 'border-accent-yellow bg-accent-yellow-dim'
                  : 'border-border-default hover:border-[#3a3a3a]'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#2a2000] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 1L9.5 5.5H14L10.5 8.5L12 13L7.5 10.5L3 13L4.5 8.5L1 5.5H5.5L7.5 1Z" stroke="#f5c542" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[#e0e0e0]">Dueño</div>
                <div className="text-[11px] text-text-muted">Dashboard · Finanzas · Equipo</div>
              </div>
              <div className={`w-4 h-4 rounded-full border-[0.5px] flex items-center justify-center ${
                selectedRole === 'owner'
                  ? 'bg-accent-yellow border-accent-yellow'
                  : 'border-[#333]'
              }`}>
                {selectedRole === 'owner' && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>

            {/* Card Barber */}
            <div
              onClick={() => setSelectedRole('barber')}
              className={`bg-bg-surface border-[0.5px] rounded-[10px] p-3.5 cursor-pointer transition-all flex items-center gap-3 ${
                selectedRole === 'barber'
                  ? 'border-accent-yellow bg-accent-yellow-dim'
                  : 'border-border-default hover:border-[#3a3a3a]'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-accent-blue-dim flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="4.5" r="2.5" stroke="#5bb8f5" strokeWidth="1.2"/>
                  <path d="M2 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="#5bb8f5" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[#e0e0e0]">Barbero</div>
                <div className="text-[11px] text-text-muted">Mi agenda · Mis ganancias</div>
              </div>
              <div className={`w-4 h-4 rounded-full border-[0.5px] flex items-center justify-center ${
                selectedRole === 'barber'
                  ? 'bg-accent-yellow border-accent-yellow'
                  : 'border-[#333]'
              }`}>
                {selectedRole === 'barber' && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="mt-5 bg-[#161616] rounded-[10px] p-3.5 w-full border-[0.5px] border-[#222]">
            <div className="text-[10px] text-text-muted uppercase tracking-[0.06em] mb-2.5">Acceso por rol</div>
            <div className="text-[11px] text-[#666] leading-[1.8]">
              <span className="text-accent-yellow">Dueño</span> — ve todo, gestiona finanzas y personal<br/>
              <span className="text-accent-blue">Barbero</span> — ve solo su agenda y sus ganancias<br/>
              <span className="text-accent-green">Cliente</span> — accede solo al sistema de turnos
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name, role, barbershopId, commissionPct, color, initials } = body

    if (!email || !password || !name || !role || !barbershopId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      const msg = authError?.message ?? 'Error al crear el usuario'
      const isDuplicate = msg.toLowerCase().includes('already')
      return NextResponse.json(
        { error: isDuplicate ? 'Ya existe un usuario con ese email' : msg },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // Crear el perfil en la tabla profiles
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: userId,
      barbershop_id: barbershopId,
      role,
      name,
      initials: initials || name.slice(0, 2).toUpperCase(),
      color: color || (role === 'owner' ? 'yellow' : 'blue'),
      commission_pct: role === 'barber' ? (commissionPct ?? 50) : 0,
      is_active: true,
    })

    if (profileError) {
      // Rollback: eliminar el usuario de auth si el perfil falló
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Error al crear el perfil' }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId }, { status: 201 })
  } catch (error) {
    console.error('create-user error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

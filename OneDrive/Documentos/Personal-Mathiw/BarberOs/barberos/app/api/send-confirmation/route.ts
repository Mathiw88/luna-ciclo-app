import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import AppointmentConfirmation from '@/emails/appointment-confirmation'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { to, appointment } = body

    if (!to || !appointment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'BarberOS <noreply@barberos.com>',
      to,
      subject: `Tu turno está confirmado - ${appointment.barbershopName}`,
      react: AppointmentConfirmation({ appointment }),
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Send confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

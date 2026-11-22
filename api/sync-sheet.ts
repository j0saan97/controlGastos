// Botón "Refrescar" del front: sincroniza solo las carteras del usuario logueado
import { adminClient, syncSheetWallets } from './_lib/sync.js'

export async function POST(request: Request): Promise<Response> {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!token) return new Response('Unauthorized', { status: 401 })

  try {
    const db = adminClient()
    const { data, error } = await db.auth.getUser(token)
    if (error || !data.user) return new Response('Unauthorized', { status: 401 })

    const results = await syncSheetWallets(db, data.user.id)
    return Response.json({ results })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

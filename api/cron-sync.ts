// Llamado por Supabase pg_cron a las 03:00 Europe/Madrid (ver supabase/02_cron.sql)
import { adminClient, syncSheetWallets } from './_lib/sync.js'

export async function GET(request: Request): Promise<Response> {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const results = await syncSheetWallets(adminClient())
    const failed = results.filter((r) => !r.ok)
    return Response.json({ synced: results.length - failed.length, failed })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}

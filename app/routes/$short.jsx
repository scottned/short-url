import { json, redirect } from '@remix-run/node'
import { PrismaClient } from '@prisma/client'
import { db } from '~/utils/db.server'

export const loader = async ({ request, params }) => {
  const short = params.short
  
  const url = await db.urls.findUnique({
    where: {
      short
    }
  })

  if (url) {
    return redirect(url.target)
  } else {
    throw new Response("Not Found", {
      status: 404,
    }) 
  }
}

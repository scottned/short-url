import { PrismaClient } from '@prisma/client'
import { json } from '@remix-run/node'
import { useLoaderData, useActionData, Form } from '@remix-run/react'
import { db } from '~/utils/db.server'

const hashCode = str => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0].toString(36)
}

export const loader = async () => {
  return json({
    urls: await db.urls.findMany()
  })
}

export const action = async ({ request }) => {
  const form = await request.formData()
  let url = null

  try {
    url = (new URL(form.get('url'))).toString()
  } catch(e) {
    return json({ url: 'Not a valid URL' }, { status: 422 })
  }

  try {
    const short = hashCode(url)
    if (await db.urls.findUnique({ where: { short } })) {
      return json({ url: 'URL already exists' }, { status: 422 })
    }
    
    await db.urls.create({
      data: { short, target: url.toString() }
    })  
  } catch (e) {
    console.error(e)
    return json({ message: 'URL cannot be created' }, { status: 422 })
  }
  return null
}

export default function Index() {
  const errors = useActionData()
  const { urls } = useLoaderData()

  return (
    <div>
      <h1>URL Shortener</h1>

      <ul>
      {urls.map(url => {
        return <li key={url.short}><a href={url.short}>{url.short}</a> to {url.target}</li>
      })}
      </ul>

      <Form method='post'>
        <label>
          URL: <input type='text' size='80' name='url' /> <button type='submit'>Add</button>
          {errors?.url && <p>{errors.url}</p>}
        </label>
      </Form>
      {errors?.message && <p>{errors.message}</p>}

    </div>
  )
}

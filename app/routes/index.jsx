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
  const { _action, ...values } = Object.fromEntries(form)

  if (_action === 'delete') {
    return db.urls.delete({ where: { id: values.id } })
  }

  if (_action === 'create') {
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

  return null
}

export default function Index() {
  const errors = useActionData()
  const { urls } = useLoaderData()

  return (
    <div className='p-6 max-w-4xl mx-auto bg-slate-100 rounded-xl shadow-lg'>
      <h1 className='text-xl font-medium'>URL Shortener</h1>

      <ul className='m-4'>
      {urls.map(url => {
        return <li key={url.short}>
          <a href={url.short}>{url.short}</a> <span className='text-slate-500'>to {url.target}</span>
          <Form method='post' className='inline-block'>
            <input type='hidden' name='id' value={url.id} />
            <button name='_action' value='delete' aria-label='delete' className='ml-4 px-3 py-0.5 text-xs text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2'>x</button>
          </Form>
        </li>
      })}
      </ul>

      <Form method='post'>
        <label>
          <span className='text-lg mr-4'>URL</span>
          <input type='text' size='70' name='url' />
          <button type='submit' name='_action' value='create' className='ml-4 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2'>Add</button>
          {errors?.url && <p className='py-2 text-center text-red-800'>{errors.url}</p>}
        </label>
      </Form>
      {errors?.message && <p className='py-2 text-center text-red-800'>{errors.message}</p>}

    </div>
  )
}

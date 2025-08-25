
'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const submit = async () => {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    if (res.ok) { window.location.href = '/' } else { setMsg('Invalid credentials') }
  }
  return <main className="container-app py-16">
    <div className="max-w-sm mx-auto card p-6">
      <h1 className="text-lg font-semibold mb-4">Sign in</h1>
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="input w-full mb-3" placeholder="Admin Password"/>
      <button onClick={submit} className="btn btn-primary w-full">Sign in</button>
      {msg && <div className="text-danger text-sm mt-2">{msg}</div>}
    </div>
  </main>
}

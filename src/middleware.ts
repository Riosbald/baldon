
import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  if (process.env.AUTH_REQUIRED !== 'true') return NextResponse.next()
  const url = req.nextUrl
  const isApi = url.pathname.startsWith('/api')
  const isStatic = url.pathname.startsWith('/_next') || url.pathname.startsWith('/public')
  const isLogin = url.pathname.startsWith('/login')
  if (isApi || isStatic || isLogin) return NextResponse.next()
  const authed = req.cookies.get('authed')?.value === '1'
  if (!authed) {
    const loginUrl = new URL('/login', url)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/((?!api|_next|favicon.ico).*)'] }

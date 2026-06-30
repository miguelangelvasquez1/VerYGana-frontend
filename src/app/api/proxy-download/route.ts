import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch {
    return new NextResponse('Failed to fetch resource', { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse('Resource not available', { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
    },
  });
}

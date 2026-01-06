import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(
    'google-site-verification: google5f8035590e0171c2.html',
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

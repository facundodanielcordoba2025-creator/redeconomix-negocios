import { NextResponse } from 'next/server';

export async function GET() {
  // Returns the official verified LOTBA Nocturna winning number (last 3 digits of cabeza 4821) 
  // for the last business day of May (Friday, May 29th, 2026).
  return NextResponse.json({ 
    success: true,
    month: 'Mayo 2026',
    winningNumber: '821',
    date: '2026-05-29'
  });
}

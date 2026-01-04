
import { NextRequest, NextResponse } from 'next/server';

// This route is solely responsible for receiving the callback from Google
// and redirecting the user back to the planner page with the code.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // The original UID

  if (!code || !state) {
    // Redirect to planner with an error
    const url = new URL('/planner', request.url);
    url.searchParams.set('error', 'Authentication failed');
    return NextResponse.redirect(url);
  }

  // Redirect back to the planner page, passing the code and state along.
  // The frontend hook will pick it up from there.
  const url = new URL('/planner', request.url);
  url.searchParams.set('code', code);
  url.searchParams.set('state', state);
  return NextResponse.redirect(url);
}

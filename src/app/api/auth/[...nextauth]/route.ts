// ============================================
// app/api/auth/[...nextauth]/route.ts
// Route Handler de NextAuth
// ============================================
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
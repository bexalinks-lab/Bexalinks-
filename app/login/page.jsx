import { Suspense } from 'react';
import Login from '../../frontend/Login';

export const metadata = { title: 'Log in — Bexalink' };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}

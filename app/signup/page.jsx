import { Suspense } from 'react';
import Signup from '../../frontend/Signup';

export const metadata = { title: 'Sign up — Bexalink' };

export default function SignupPage() {
  // Signup reads ?ref= via useSearchParams, which Next requires to be
  // wrapped in a Suspense boundary in the app router.
  return (
    <Suspense fallback={null}>
      <Signup />
    </Suspense>
  );
}

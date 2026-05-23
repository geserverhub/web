import { redirect } from 'next/navigation';

/** Legacy URL — redirects to energy dashboard developer page */
export default function DeveloperRedirectPage() {
  redirect('/energy-dashboard/developer');
}

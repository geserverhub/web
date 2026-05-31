import PrivacyPolicyPage from '@/components/ge-energy-tech/PrivacyPolicyPage';
import '../ge-energy-tech.css';

export const metadata = {
  title: 'Privacy Policy | GE Energy Tech Co., Ltd.',
  description:
    'Privacy policy for GE Energy Tech website, Momoge space app, Customer Dashboard, and related energy monitoring services.',
};

export default function GeEnergyTechPrivacyPage() {
  return <PrivacyPolicyPage homeHref="/ge-energy-tech" />;
}

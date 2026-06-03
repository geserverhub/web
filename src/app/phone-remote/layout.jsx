import SoftwareDownloadAccessGate from "@/components/downloads/SoftwareDownloadAccessGate";

export default function PhoneRemoteLayout({ children }) {
  return (
    <SoftwareDownloadAccessGate productSlug="phone-remote-android">{children}</SoftwareDownloadAccessGate>
  );
}

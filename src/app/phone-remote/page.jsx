import Link from "next/link";

export const metadata = {
  title: "Phone Remote — รีโมทหน้าจอโทรศัพท์",
  description: "แชร์และดูหน้าจอโทรศัพท์ผ่านเว็บและมือถือ",
};

export default function PhoneRemoteHomePage() {
  return (
    <main className="container py-5" style={{ maxWidth: 720 }}>
      <h1 className="mb-3">Phone Remote</h1>
      <p className="text-muted mb-4">
        ระบบรีโมทหน้าจอผ่าน WebRTC — โทรศัพท์แชร์หน้าจอ ฝั่งเว็บหรือมือถืออีกเครื่องดูได้ด้วยรหัสห้อง
      </p>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card h-100 shadow-sm border-primary">
            <div className="card-body">
              <h2 className="h5">📱 แชร์หน้าจอ (Host)</h2>
              <p className="small text-muted">
                เปิดบนโทรศัพท์หรือคอมพิวเตอร์ที่ต้องการให้คนอื่นดู แล้วกดแชร์หน้าจอ
              </p>
              <Link href="/phone-remote/host" className="btn btn-primary">
                เริ่มแชร์หน้าจอ
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h2 className="h5">🖥️ ดูหน้าจอ (Viewer)</h2>
              <p className="small text-muted">
                เปิดบนเว็บหรือมือถือ ใส่รหัสห้องที่ Host แจ้ง แล้วดูหน้าจอแบบเรียลไทม์
              </p>
              <Link href="/phone-remote/view" className="btn btn-outline-primary">
                เข้าดูหน้าจอ
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="alert alert-info mt-4 mb-0 small">
        <strong>หมายเหตุ:</strong> Android Chrome รองรับแชร์หน้าจอได้ดี iOS Safari จำกัด —
        ใช้ HTTPS หรือ localhost และอนุญาตสิทธิ์แชร์หน้าจอเมื่อเบราว์เซอร์ถาม
      </div>
    </main>
  );
}

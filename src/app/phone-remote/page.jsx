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
        ระบบรีโมทหน้าจอผ่าน WebRTC — Host แชร์หน้าจอ Viewer ดูและควบคุมได้ด้วยรหัสห้อง
        รองรับทั้งแอป Android (ควบคุมทั้งเครื่อง) และ <strong>ควบคุมผ่านหน้าเว็บ</strong> (แชร์แท็บเบราว์เซอร์)
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
                เปิดบนเว็บหรือมือถือ ใส่รหัสห้องที่ Host แจ้ง แล้วดูและควบคุมหน้าจอแบบเรียลไทม์ (แตะ/พิมพ์)
              </p>
              <Link href="/phone-remote/view" className="btn btn-outline-primary">
                เข้าดูหน้าจอ
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-4 border-0" style={{ background: "#1e3a5f", color: "#e2e8f0" }}>
        <div className="card-body">
          <h2 className="h6 mb-2">📲 แอป Android — Phone Remote</h2>
          <p className="small mb-2">
            ระบบรีโมทแยกจาก Momoge space เป็นแอปต่างหาก — โหลด UI จากเซิร์ฟเวอร์และมีสิทธิ์ Accessibility
            สำหรับให้ Viewer ควบคุมหน้าจอ Host บน Android ได้เต็มรูปแบบ
          </p>
          <p className="small mb-0 text-white-50">
            Package: <code>phoneremote.myapp</code> · Build: <code>mobile/phone-remote</code> (
            <code>npm run cap:sync</code>)
          </p>
        </div>
      </div>

      <div className="alert alert-info mt-4 mb-0 small">
        <strong>ควบคุมผ่านเว็บ:</strong> Host กด 「เปิดแท็บควบคุมเว็บ」 แล้วแชร์ <strong>แท็บนั้น</strong> —
        Viewer แตะบนภาพเพื่อคลิก/เลื่อนบนหน้าเว็บได้ · ฝังหน้าในระบบ:{" "}
        <code>/phone-remote/web-target?room=รหัส&embed=/path</code>
        <br />
        <strong>Android เต็มรูปแบบ:</strong> แอป <strong>Phone Remote</strong> + Accessibility · ใช้ HTTPS หรือ localhost
      </div>
    </main>
  );
}

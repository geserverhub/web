'use client';

import { useState, useEffect, useCallback } from 'react';

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [backups, setBackups] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const loadBackups = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      if (data.success) setBackups(data.backups || []);
    } catch (_) {}
    setListLoading(false);
  }, []);

  useEffect(() => { loadBackups(); }, [loadBackups]);

  const handleBackup = async () => {
    setLoading(true);
    setMessage('');
    setStatus('');

    try {
      const response = await fetch('/api/backup', { method: 'POST' });
      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(`✅ Backup สำเร็จ! ไฟล์: ${data.filename}  (${data.size})`);
        await loadBackups();
      } else {
        setStatus('error');
        setMessage(`❌ Backup ล้มเหลว: ${data.message}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">🗄️ Database Backup</h1>
        <p className="text-gray-600 mb-8">สร้าง Full Backup ฐานข้อมูลทั้งหมด (.tar.gz)</p>

        <div className="space-y-6">
          {/* Manual Backup */}
          <div className="border-l-4 border-blue-500 bg-blue-50 p-6 rounded">
            <h2 className="text-xl font-bold mb-1">📌 Backup ตอนนี้</h2>
            <p className="text-gray-600 text-sm mb-4">
              สร้าง Full backup ฐานข้อมูลทั้งหมด พร้อมระบุวันที่และเวลาในชื่อไฟล์
              <br />
              <span className="font-mono text-xs bg-blue-100 px-1 rounded">
                geserverhub_backup_YYYY-MM-DD_HH-MM-SS.tar.gz
              </span>
            </p>
            <button
              onClick={handleBackup}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              {loading ? '⏳ กำลังสร้าง Full Backup...' : '💾 สร้าง Full Backup'}
            </button>
          </div>

          {/* Automatic Backup */}
          <div className="border-l-4 border-green-500 bg-green-50 p-6 rounded">
            <h2 className="text-xl font-bold mb-2">⏰ Automatic Backup</h2>
            <div className="bg-white p-4 rounded border border-green-200 text-sm text-gray-700 space-y-1">
              <p>✅ สถานะ: เปิดใช้งาน</p>
              <p>📅 ตารางเวลา: ทุกวันจันทร์ 00:00</p>
              <p>💾 ตำแหน่งจัดเก็บ: /home/pavinee/web/backups/</p>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              status === 'success'
                ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
                : 'bg-red-100 border-l-4 border-red-500 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Backup History */}
          <div className="border-l-4 border-gray-400 bg-gray-50 p-6 rounded">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">📋 Backup History</h2>
              <button
                onClick={loadBackups}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                🔄 รีเฟรช
              </button>
            </div>

            {listLoading ? (
              <p className="text-gray-500 text-sm">กำลังโหลด...</p>
            ) : backups.length === 0 ? (
              <p className="text-gray-500 text-sm">ไม่มีไฟล์ backup</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300 text-gray-600 text-left">
                      <th className="pb-2 pr-4">ชื่อไฟล์</th>
                      <th className="pb-2 pr-4 text-right">ขนาด</th>
                      <th className="pb-2 text-right">วันที่</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {backups.map((b) => (
                      <tr key={b.filename} className="hover:bg-gray-100">
                        <td className="py-2 pr-4 font-mono text-xs text-gray-700 break-all">{b.filename}</td>
                        <td className="py-2 pr-4 text-right text-gray-600 whitespace-nowrap">{b.size}</td>
                        <td className="py-2 text-right text-gray-500 whitespace-nowrap text-xs">{b.createdDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleBackup = async () => {
    setLoading(true);
    setMessage('');
    setStatus('');

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(`✅ Backup สำเร็จ! File: ${data.filename}`);
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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">🗄️ Database Backup</h1>
        <p className="text-gray-600 mb-8">สร้าง backup ฐานข้อมูล geserverhub</p>

        <div className="space-y-6">
          {/* Manual Backup */}
          <div className="border-l-4 border-blue-500 bg-blue-50 p-6 rounded">
            <h2 className="text-xl font-bold mb-4">📌 Backup ตอนนี้</h2>
            <p className="text-gray-700 mb-4">
              สร้าง backup ฐานข้อมูลทันที และบันทึกเป็นไฟล์ SQL
            </p>
            <button
              onClick={handleBackup}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              {loading ? '⏳ กำลังสร้าง Backup...' : '💾 สร้าง Backup'}
            </button>
          </div>

          {/* Automatic Backup */}
          <div className="border-l-4 border-green-500 bg-green-50 p-6 rounded">
            <h2 className="text-xl font-bold mb-4">⏰ Automatic Backup</h2>
            <p className="text-gray-700 mb-4">
              Backup อัตโนมัติทุกวันจันทร์เวลา 00:00 (UTC+7)
            </p>
            <div className="bg-white p-4 rounded border border-green-200">
              <p className="text-sm text-gray-600">
                ✅ สถานะ: เปิดใช้งาน<br/>
                📅 ตารางเวลา: ทุกวันจันทร์ 00:00<br/>
                💾 ตำแหน่งจัดเก็บ: /home/pavinee/web/backups/
              </p>
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
            <h2 className="text-xl font-bold mb-4">📋 Backup History</h2>
            <p className="text-gray-600 text-sm">
              ตรวจสอบไฟล์ backup ที่บันทึกในโฟลเดอร์:
              <code className="block bg-gray-200 p-2 rounded mt-2">/backups/</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

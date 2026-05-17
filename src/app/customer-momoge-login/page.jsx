'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function CustomerMomogeLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, pageName: '/momoge-product' }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Invalid username or password');
        return;
      }

      localStorage.setItem('k_system_admin_token', data.token || '');
      localStorage.setItem('k_system_admin_user', JSON.stringify({
        userId: data.userId,
        username: data.username,
        name: data.name,
        email: data.email,
        site: data.site,
        typeID: data.typeID,
        departmentID: data.departmentID,
      }));

      router.push('/momoge-product');
    } catch (err) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0b1120 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        right: '-120px',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #1d4ed822 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        left: '-100px',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #2563eb18 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: '#0f1929',
        border: '1px solid #1e293b',
        borderRadius: 24,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: 20,
            overflow: 'hidden',
            display: 'inline-block',
            marginBottom: 20,
            border: '2px solid #1e293b',
            boxShadow: '0 4px 24px rgba(29,78,216,0.3)',
          }}>
            <Image
              src="/momoge/Logo-brand.png"
              alt="Momoge Logo"
              width={100}
              height={100}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Momoge
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>
            Partner Connected Marketplace
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#1d4ed81a',
            border: '1px solid #3b82f644',
            borderRadius: 999,
            padding: '4px 14px',
            marginTop: 10,
            fontSize: 11,
            fontWeight: 600,
            color: '#93c5fd',
            letterSpacing: '0.05em',
          }}>
            CUSTOMER PORTAL
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{
                position: 'absolute', left: 13, top: '50%',
                transform: 'translateY(-50%)', color: '#475569',
              }} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="Enter username or email"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 40px',
                  borderRadius: 10,
                  border: '1.5px solid #1e293b',
                  background: '#111827',
                  color: '#e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#1e293b'}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', left: 13, top: '50%',
                transform: 'translateY(-50%)', color: '#475569',
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 40px',
                  borderRadius: 10,
                  border: '1.5px solid #1e293b',
                  background: '#111827',
                  color: '#e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#1e293b'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: '#475569', padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#450a0a44',
              border: '1px solid #ef444466',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: 13,
              marginBottom: 18,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading
                ? '#1e3a8a'
                : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <a
            href="/"
            style={{ fontSize: 13, color: '#4b6cb7', textDecoration: 'none' }}
            onClick={e => { e.preventDefault(); window.location.href = '/'; }}
          >
            ← กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}

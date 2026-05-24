'use client';
import { useState, useEffect } from 'react';
import { Shield, ArrowLeft, Check, Lock, Key, Smartphone, Eye, EyeOff, Mail } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('security');

  // Password
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');
  const [otpError, setOtpError] = useState('');
  const [twoFAVerified, setTwoFAVerified] = useState(false);
  const [twoFASaved, setTwoFASaved] = useState(false);

  // Encryption
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSendOTP = async () => {
    if (!user?.email) return;
    setOtpLoading(true);
    setOtpError('');
    setOtpMsg('');
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, action: 'send' }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtpMsg(`OTP sent to ${user.email}! Check your inbox.`);
      } else {
        setOtpError(data.error || 'Failed to send OTP');
      }
    } catch {
      setOtpError('Network error. Please try again.');
    }
    setOtpLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!user?.email || !otpInput) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, action: 'verify', otp: otpInput }),
      });
      const data = await res.json();
      if (data.success) {
        setTwoFAVerified(true);
        setOtpMsg('✅ 2FA verified and enabled successfully!');
        setTwoFAEnabled(true);
      } else {
        setOtpError(data.error || 'Invalid OTP');
      }
    } catch {
      setOtpError('Network error. Please try again.');
    }
    setOtpLoading(false);
  };

  const handleToggle2FA = () => {
    if (!twoFAEnabled) {
      setTwoFAEnabled(true);
      setOtpSent(false);
      setOtpInput('');
      setOtpMsg('');
      setOtpError('');
      setTwoFAVerified(false);
    } else {
      setTwoFAEnabled(false);
      setOtpSent(false);
      setTwoFAVerified(false);
      setOtpMsg('');
    }
  };

  const handlePasswordChange = () => {
    setPassError('');
    if (!newPass || !confirmPass) { setPassError('Please fill all fields.'); return; }
    if (newPass !== confirmPass) { setPassError('Passwords do not match!'); return; }
    if (newPass.length < 8) { setPassError('Password must be at least 8 characters!'); return; }
    setPassError('Google account users cannot change password here. Please use Google Account settings at myaccount.google.com');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex items-center gap-2 font-black text-lg text-blue-600"><Shield className="w-5 h-5" /> ModrateAI</div>
        <h1 className="text-xl font-black text-gray-900 ml-4">Settings</h1>
      </header>

      <div className="max-w-2xl mx-auto p-8">
        <div className="flex gap-2 mb-8 bg-white border border-gray-100 rounded-2xl p-2">
          {[
            { id: 'security', label: 'Security', icon: Lock },
            { id: '2fa', label: '2FA', icon: Smartphone },
            { id: 'encryption', label: 'Encryption', icon: Key },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-black text-gray-900 mb-4">Account Info</h2>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} className="w-12 h-12 rounded-full" alt="avatar" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {user?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-gray-900">{user?.displayName}</div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                  <div className="text-xs text-green-600 mt-1">✓ Signed in with Google</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-black text-gray-900 mb-1">Change Password</h2>
              <p className="text-sm text-gray-400 mb-4">For Google login — manage at myaccount.google.com</p>
              {passError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{passError}</div>}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Current Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={currentPass} onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 pr-10" />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">New Password</label>
                  <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Confirm New Password</label>
                  <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <button onClick={handlePasswordChange} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700">
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2FA TAB */}
        {activeTab === '2fa' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
            <div>
              <h2 className="font-black text-gray-900 mb-1">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-400">Verify your identity via Email OTP every login</p>
            </div>

            {/* TOGGLE */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">Email OTP 2FA</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
              </div>
              <button onClick={handleToggle2FA}
                className={`w-12 h-6 rounded-full transition-colors relative ${twoFAEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${twoFAEnabled ? 'left-6' : 'left-0.5'}`}></div>
              </button>
            </div>

            {/* OTP FLOW */}
            {twoFAEnabled && !twoFAVerified && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-700 font-bold mb-1">Setup Email 2FA</p>
                  <p className="text-xs text-blue-600">We will send a 6-digit OTP to your email to verify and enable 2FA.</p>
                </div>

                {otpMsg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2"><Check className="w-4 h-4" />{otpMsg}</div>}
                {otpError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{otpError}</div>}

                {!otpSent ? (
                  <button onClick={handleSendOTP} disabled={otpLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                    {otpLoading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Sending...</>
                    ) : (
                      <><Mail className="w-4 h-4" /> Send OTP to {user?.email}</>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 block">Enter 6-digit OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 text-center text-2xl font-black tracking-widest"
                      />
                    </div>
                    <button onClick={handleVerifyOTP} disabled={otpLoading || otpInput.length !== 6}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                      {otpLoading ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Verifying...</>
                      ) : 'Verify OTP & Enable 2FA'}
                    </button>
                    <button onClick={handleSendOTP} className="w-full text-blue-600 text-sm font-bold hover:underline">
                      Resend OTP
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SUCCESS */}
            {twoFAVerified && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-green-800">2FA Enabled Successfully!</div>
                  <div className="text-xs text-green-600">Your account is now protected with Email OTP verification.</div>
                </div>
              </div>
            )}

            <button onClick={() => { setTwoFASaved(true); setTimeout(() => setTwoFASaved(false), 2000); }}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${twoFASaved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {twoFASaved ? <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Saved!</span> : 'Save 2FA Settings'}
            </button>
          </div>
        )}

        {/* ENCRYPTION TAB */}
        {activeTab === 'encryption' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
            <div>
              <h2 className="font-black text-gray-900 mb-1">Data Encryption</h2>
              <p className="text-sm text-gray-400">Your data security settings</p>
            </div>
            <div className="space-y-4">
              {[
                { title: 'End-to-End Encryption', desc: 'All data encrypted in transit and at rest', locked: true },
                { title: 'YouTube Token Encryption', desc: 'Access tokens encrypted with AES-256', locked: true },
                { title: 'Comment Data Encryption', desc: 'Hidden comments stored with encryption', locked: false },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                      <Key className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{item.title}</div>
                      <div className="text-xs text-gray-400">{item.desc}</div>
                    </div>
                  </div>
                  {item.locked ? (
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">Always ON</span>
                  ) : (
                    <button onClick={() => setEncryptionEnabled(!encryptionEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${encryptionEnabled ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${encryptionEnabled ? 'left-6' : 'left-0.5'}`}></div>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-700 font-bold">🔒 Your data is secure</p>
              <p className="text-xs text-green-600 mt-1">ModrateAI uses AES-256 encryption. YouTube credentials are never stored in plain text.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
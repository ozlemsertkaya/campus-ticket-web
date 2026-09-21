import React, { useState, useEffect } from 'react';
import TicketChatModal from './TicketChatModal';
import api from './api';

function App() {
  // 1. OTURUM VE TOKEN DURUMLARI
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 2. AUTH FORM DURUMLARI (Giriş / Kayıt)
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');

  // 3. BİLET VE FORM DURUMLARI
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(2);
  const [formSuccess, setFormSuccess] = useState('');
  const [activeTicketForChat, setActiveTicketForChat] = useState(null);

  // --- API ÇAĞRILARI VE İŞLEMLER ---
  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets');
      setTickets(response.data.data || response.data);
    } catch (err) {
      console.error('Talepler yüklenirken hata oluştu:', err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    if (token) {
      fetchTickets();
    }
  }, [token]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const endpoint = isRegister ? '/register' : '/login';
    const payload = isRegister ? { name, email, password, role: selectedRole } : { email, password };

    try {
      const res = await api.post(endpoint, payload);
      const newToken = res.data.token;
      const userData = res.data.user;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'İşlem başarısız, bilgileri kontrol edin.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      // Backend hata verse bile devam et
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setTickets([]);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setFormSuccess('');

    try {
      await api.post('/tickets', {
        title,
        description,
        priority_id: priority,
        category_id: 1, // Kategori hatasını garantiye almak için varsayılan 1 gönderiyoruz
      });

      setFormSuccess('Arıza talebi başarıyla oluşturuldu!');
      setTitle('');
      setDescription('');
      setPriority(2);
      fetchTickets();
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      console.error('Talep oluşturulurken hata:', err);
      if (err.response?.status === 401) {
        alert('Oturum süreniz dolmuş, lütfen tekrar giriş yapın.');
        handleLogout();
      }
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, {
        status: newStatus
      });

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );

      if (activeTicketForChat && activeTicketForChat.id === ticketId) {
        setActiveTicketForChat((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Backend hatası:", err.response?.data || err.message);
      alert(`Durum güncellenemedi: ${err.response?.data?.message || err.message}`);
    }
  };

  // İstatistik Sayaçları
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open' || t.status === 'pending').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  // Öncelik Ağırlıkları ve Sıralama
  const priorityWeights = {
    'Acil': 4,
    'Yüksek': 3,
    'Orta': 2,
    'Düşük': 1
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    const weightA = typeof a.priority === 'number' ? a.priority : (priorityWeights[a.priority] || 0);
    const weightB = typeof b.priority === 'number' ? b.priority : (priorityWeights[b.priority] || 0);
    return weightB - weightA;
  });

  const getPriorityBadge = (p) => {
    if (p === 'Acil' || p === 4) return { label: 'Acil', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
    if (p === 'Yüksek' || p === 3) return { label: 'Yüksek', bg: '#ffedd5', color: '#c2410c', border: '#fdba74' };
    if (p === 'Orta' || p === 2) return { label: 'Orta', bg: '#fef9c3', color: '#854d0e', border: '#fde047' };
    return { label: 'Düşük', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
  };

  // ========================================================
  // 1. EKRAN: GİRİŞ YAPILMAMIŞSA (KAYIT / GİRİŞ FORMU)
  // ========================================================
  if (!token || !user) {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', padding: '24px', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'Arial, sans-serif' }}>
        <h2 style={{ textAlign: 'center', marginTop: 0, color: '#8b0000' }}>
          {isRegister ? 'Kampüs Hesabı Aç' : 'Kampüs Destek Girişi'}
        </h2>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            style={{
              flex: 1,
              padding: '10px',
              border: selectedRole === 'student' ? '2px solid #8b0000' : '1px solid #cbd5e1',
              background: selectedRole === 'student' ? '#fef2f2' : '#fff',
              color: selectedRole === 'student' ? '#8b0000' : '#64748b',
              fontWeight: 'bold',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Öğrenci
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('agent')}
            style={{
              flex: 1,
              padding: '10px',
              border: selectedRole === 'agent' ? '2px solid #8b0000' : '1px solid #cbd5e1',
              background: selectedRole === 'agent' ? '#fef2f2' : '#fff',
              color: selectedRole === 'agent' ? '#8b0000' : '#64748b',
              fontWeight: 'bold',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Destek Personeli
          </button>
        </div>

        {authError && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '4px', marginBottom: '14px', fontSize: '14px' }}>
            {authError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit}>
          {isRegister && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Ad Soyad</label>
              <input
                type="text"
                placeholder="Adınız Soyadınız"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Üniversite E-postası (.edu.tr)</label>
            <input
              type="email"
              placeholder="ad.soyad@istun.edu.tr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Şifre</label>
            <input
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" style={{ width: '100%', padding: '10px', background: '#8b0000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isRegister ? 'Kayıt Ol ve Başla' : 'Giriş Yap'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
            style={{ background: 'none', border: 'none', color: '#8b0000', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegister ? 'Zaten hesabın var mı? Giriş Yap' : 'Hesabın yok mu? Kayıt Ol'}
          </button>
        </div>
      </div>
    );
  }

  // ========================================================
  // 2. EKRAN: GİRİŞ YAPILMIŞSA (ANA PANEL)
  // ========================================================
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: 'sans-serif' }}>

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderBottom: '2px solid #b91c1c',
          padding: '12px 24px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src="/logo.jpeg"
            alt="İSTÜN Logo"
            style={{ height: '45px', width: 'auto', objectFit: 'contain' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/logo.jpg';
            }}
          />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#8b0000', fontWeight: '700' }}>
              İSTÜN Kampüs Destek Sistemi
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              İstanbul Sağlık ve Teknoloji Üniversitesi
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b' }}>
              {user?.name}
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: '2px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor: user?.role === 'agent' ? '#fef2f2' : '#f0fdf4',
                color: user?.role === 'agent' ? '#b91c1c' : '#15803d',
                border: user?.role === 'agent' ? '1px solid #fecaca' : '1px solid #bbf7d0'
              }}
            >
              {user?.role === 'agent' ? 'Destek Personeli' : 'Öğrenci'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem'
            }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* İÇERİK ALANI */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px 40px' }}>

        {/* ÖĞRENCİ FORMU */}
        {user?.role === 'student' && (
          <div style={{ marginBottom: '24px', padding: '18px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>+ Yeni Arıza Talebi Bildir</h4>
            {formSuccess && <p style={{ color: 'green', fontSize: '14px', margin: '4px 0' }}>{formSuccess}</p>}

            <form onSubmit={handleCreateTicket}>
              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Başlık (örn: Kütüphane Yazıcısı Çalışmıyor)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <textarea
                  placeholder="Detaylı açıklama..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows="3"
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '14px', color: '#334155' }}>Öncelik:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value={1}>Düşük</option>
                  <option value={2}>Orta</option>
                  <option value={3}>Yüksek</option>
                  <option value={4}>Acil</option>
                </select>
                <button
                  type="submit"
                  style={{ marginLeft: 'auto', padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Talebi Gönder
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 1. İSTATİSTİK SAYAÇ KARTLARI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Toplam Talep</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{stats.total}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #fee2e2', borderLeft: '4px solid #ef4444', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: '600' }}>Açık / Bekleyen</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#b91c1c', marginTop: '4px' }}>{stats.open}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #dbeafe', borderLeft: '4px solid #3b82f6', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '600' }}>İşlemde</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>{stats.in_progress}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #dcfce7', borderLeft: '4px solid #22c55e', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Çözüldü</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#15803d', marginTop: '4px' }}>{stats.resolved}</div>
          </div>
        </div>

        {/* LİSTE BAŞLIĞI */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            {user?.role === 'student' ? 'Açtığım Arıza Talepleri' : 'İncelenecek Kampüs Talepleri'}
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Önceliğe göre sıralandı
          </span>
        </div>

        {/* 2. BİLET KARTLARI LİSTESİ */}
        {tickets.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '30px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            Henüz kayıtlı bir arıza talebi bulunmuyor.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {sortedTickets.map(ticket => {
              const badgeStyle = getPriorityBadge(ticket.priority);

              return (
                <div
                  key={ticket.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    padding: '18px 20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px'
                  }}
                >
                  {/* Sol: Bilgiler */}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
                        {ticket.title}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: `1px solid ${badgeStyle.border}`
                        }}
                      >
                        {badgeStyle.label}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#475569', lineHeight: '1.4' }}>
                      {ticket.description}
                    </p>

                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Talep No: #{ticket.id}
                    </span>
                  </div>

                  {/* Sağ: İşlemler */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {ticket.status === 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => setActiveTicketForChat(ticket)}
                        style={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.85rem'
                        }}
                      >
                        Mesajlar
                      </button>
                    )}

                    {user?.role === 'agent' ? (
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          color: '#1e293b',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="open">Açık (Bekliyor)</option>
                        <option value="in_progress">İşlemde</option>
                        <option value="resolved">Çözüldü</option>
                        <option value="closed">Kapatıldı (Spam / İptal)</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                        {ticket.status === 'open' || ticket.status === 'pending' ? 'Açık' : ''}
                        {ticket.status === 'in_progress' && 'İşlemde'}
                        {ticket.status === 'resolved' && 'Çözüldü'}
                        {ticket.status === 'closed' && 'Kapatıldı'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CHAT MODALI */}
      {activeTicketForChat && (
        <TicketChatModal
          ticket={activeTicketForChat}
          currentUser={user}
          onClose={() => setActiveTicketForChat(null)}
        />
      )}
    </div>
  );
}

export default App;
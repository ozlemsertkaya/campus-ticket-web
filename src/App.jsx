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
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' veya 'agent'

  // 3. BİLET VE FORM DURUMLARI
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(2);
  const [formSuccess, setFormSuccess] = useState('');
  const [activeTicketForChat, setActiveTicketForChat] = useState(null);

  // --- API ÇAĞRILARI VE İŞLEMLER ---

  const statusTranslations = {
    pending: 'Açık (Bekliyor)',
    in_progress: 'İşlemde',
    resolved: 'Çözüldü',
    closed: 'Kapatıldı',
  };

  // Biletleri getiren fonksiyon
  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets');
      console.log("GELEN BİLETLER:", response.data);
      setTickets(response.data.data || response.data);
    } catch (err) {
      console.error('Talepler yüklenirken hata oluştu:', err);
    }
  };

  // Sayfa açıldığında veya token değiştiğinde çalışır
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchTickets();
    }
  }, [token]);

  // Giriş / Kayıt Ortak Gönderim Fonksiyonu
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const endpoint = isRegister ? '/register' : '/login';
    const payload = isRegister ? { name, email, password, role: selectedRole } : { email, password };

    try {
      const res = await api.post(endpoint, payload);
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      setToken(newToken);
      setUser(userData);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'İşlem başarısız, bilgileri kontrol edin.');
    }
  };

  // Çıkış Yapma Fonksiyonu
  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      // Backend hata verse bile oturumu temizle
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setToken('');
    setUser(null);
    setTickets([]);
  };

  // Yeni Bilet Oluşturma Fonksiyonu (Öğrenci)
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setFormSuccess('');

    try {
      await api.post('/tickets', {
        title,
        description,
        priority_id: priority,
      });

      setFormSuccess('Arıza talebi başarıyla oluşturuldu!');
      setTitle('');
      setDescription('');
      setPriority('orta');
      fetchTickets();
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      console.error('Talep oluşturulurken hata:', err);
    }
  };

  // Personel: Talebi Üzerine Alma
  const handleAssignTicket = async (ticketId) => {
    try {
      await api.post(`/tickets/${ticketId}/assign`, {
        user_id: user?.id,
      });
      fetchTickets();
    } catch (err) {
      console.error('Talep atanırken hata oluştu:', err);
    }
  };
  const handleSendMessage = async (ticketId, messageText) => {
    try {
      await api.post(`/tickets/${ticketId}/messages`, {
        message: messageText,
      });
      //Mesaj gittikten sonra bilet detayını veya bilgileri güncelle
      fetchTickets();
    } catch (err) {
      console.error('Mesaj gönderilirken hata oluştu:', err);
      alert(err.response?.data?.message || 'Mesaj gönderilemedi!');
    }
  };

  // Personel: Talebi Çözüldü Yapma
  const handleResolveTicket = async (ticketId) => {
    try {
      await api.post(`/tickets/${ticketId}/resolve`);
      fetchTickets();
    } catch (err) {
      console.error('Talep çözülürken hata oluştu:', err);
    }
  };

  // ========================================================
  // 1. EKRAN: GİRİŞ YAPILMAMIŞSA (KAYIT / GİRİŞ FORMU)
  // ========================================================
  if (!token || !user) {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', padding: '24px', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'Arial, sans-serif' }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>
          {isRegister ? 'Kampüs Hesabı Aç' : 'Kampüs Destek Girişi'}
        </h2>
        {/*Rol seçim sekmeleri*/}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            style={{
              flex: 1,
              padding: '10px',
              border: selectedRole === 'student' ? '2px solid #2563eb' : '1px solid #cbd5e1',
              background: selectedRole === 'student' ? '#eff6ff' : '#fff',
              color: selectedRole === 'student' ? '#2563eb' : '#64748b',
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
              border: selectedRole === 'agent' ? '2px solid #2563eb' : '1px solid #cbd5e1',
              background: selectedRole === 'agent' ? '#eff6ff' : '#fff',
              color: selectedRole === 'agent' ? '#2563eb' : '#64748b',
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

          <button type="submit" style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isRegister ? 'Kayıt Ol ve Başla' : 'Giriş Yap'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegister ? 'Zaten hesabın var mı? Giriş Yap' : 'Hesabın yok mu? Üniversite mailinle Kayıt Ol'}
          </button>
        </div>
      </div>
    );
  }

  // ========================================================
  // 2. EKRAN: GİRİŞ YAPILMIŞSA (ANA PANEL & TALEP YÖNETİMİ)
  // ========================================================
  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', fontFamily: 'Arial, sans-serif', padding: '20px' }}>

      {/* ÜST PANEL: PROFİL BİLGİSİ VE ÇIKIŞ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0 }}>Hoş geldin, {user.name}</h3>
          <span style={{ fontSize: '13px', color: user.role === 'agent' ? '#2563eb' : '#059669', fontWeight: 'bold' }}>
            Rol: {user.role === 'agent' ? 'Destek Personeli' : 'Öğrenci'} ({user.email})
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{ padding: '8px 14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Çıkış Yap
        </button>
      </div>

      {/* SADECE ÖĞRENCİ GÖRÜR: TALEP AÇMA KARTI */}
      {user.role === 'student' && (
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
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
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <textarea
                placeholder="Detaylı açıklama..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows="3"
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '14px', color: '#334155' }}>Öncelik:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ padding: '6px' }}
              >
                <option value={1}>Düşük</option>
                <option value={2}>Orta</option>
                <option value={3}>Yüksek</option>
                <option value={4}>Acil</option>
              </select>
              <button
                type="submit"
                style={{ marginLeft: 'auto', padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Talebi Gönder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ARİZA TALEPLERİ LİSTESİ */}
      <h3>{user.role === 'student' ? 'Açtığım Arıza Talepleri' : 'İncelenecek Kampüs Talepleri'}</h3>

      {tickets.length === 0 ? (
        <p style={{ color: '#64748b' }}>Henüz kayıtlı bir arıza talebi bulunmuyor.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                border: '1px solid #e2e8f0',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Bilet Başlığı ve Statü Rozeti */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#1e293b' }}>{ticket.title}</h4>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  backgroundColor: ticket.status === 'in_progress' ? '#dbeafe' : '#f1f5f9',
                  color: ticket.status === 'in_progress' ? '#1e40af' : '#475569'
                }}>
                  {statusTranslations[ticket.status] || ticket.status}
                </span>
              </div>

              {/* Açıklama */}
              <p style={{ margin: '8px 0', color: '#64748b', fontSize: '0.9rem' }}>
                {ticket.description}
              </p>

              {/* Öncelik */}
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Öncelik: <strong>{ticket.priority}</strong>
              </div>

              {/* MESAJLAR BUTONU */}
              {ticket.status === 'in_progress' && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTicketForChat(ticket)}
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    Mesajlar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
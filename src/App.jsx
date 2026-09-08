import React, { useState, useEffect } from 'react'  //kullanıcının klavyeden yazdığı şeyleri bu kutuda tutucaz.
import api from './api';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');


  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/login', {
        email: email,
        password: password,
      });
      localStorage.setItem('token', response.data.token);//gelen token ı tarayıcının yerel hafızasına yaz
      setUser(response.data.user);
    } catch (err) {
      console.error(err);
      setError('Giriş başarısız!Bilgilerinizi kontrol edin.');
    }
  };
  const handleLogout = () => {
    localStorage.removeıtem('token');
    setUser(null);
  };
  const [tickets, setTickets] = useState([]);//boş çünkü backendden bir sürü talep gelecek.
  const fetchTickets = async () => {//Talepleri çeken fonk.
    try {
      //Backend GET /api/tickets rotasına istek atıyoruz.
      const response = await api.get('/tickets');
      console.log('Gelen talepler:', response.data);
      //Gelen arıza listesini state e kaydediyoruz.
      //(Eğer backend paginate ediyorsa response.data.data olabilir, kontrol edeceğiz)
      setTickets(response.data.data || response.data);
    } catch (err) {
      console.error('Talepler yüklenirken hata oluştu:', err);
    }

  }
  useEffect(() => {//sayfa yüklendiğinde veya user bilgisi değiştiğinde kontrol eder.
    if (user) {//user varsa hemen fonk çalıştırır.
      fetchTickets();
    }
  }, [user]);

  return (
    <div style={{ maxWidth: '420px', margin: '60px auto', fontFamily: 'Arial, sans-serif', padding: '24px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Kampüs Arıza Talep</h2>
      {/* Mantık: user boşsa (null) FORMU GÖSTER, doluysa HOŞ GELDİN KARTINI GÖSTER */}
      {!user ? (
        <form onSubmit={handleLogin}>
          <h3>Giriş Yap</h3>
          {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
          <div style={{ marginBottom: '12px' }}>
            <label>E-posta:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent2@ornek.com"
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label>Şifre:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="123456"
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Giriş Yap
          </button>
        </form>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <div>
              <p style={{ margin: 0 }}><strong>Kullanıcı:</strong> {user.name} ({user.role})</p>
            </div>
            <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Çıkış Yap
            </button>
          </div>

          {/* Arıza Talepleri Listesi */}
          <h3 style={{ marginTop: '24px' }}>Arıza Talepleri</h3>
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
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '16px' }}>{ticket.title}</strong>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: ticket.status === 'open' ? '#fef3c7' : '#dcfce7',
                      color: ticket.status === 'open' ? '#d97706' : '#15803d'
                    }}>
                      {ticket.status}
                    </span>
                  </div>
                  <p style={{ margin: '6px 0', fontSize: '14px', color: '#334155' }}>{ticket.description}</p>
                  <small style={{ color: '#64748b' }}>Öncelik: <b>{ticket.priority}</b></small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div >
  );

}

export default App

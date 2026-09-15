import React, { useState, useEffect, useRef } from 'react';
import api from './api';

export default function TicketChatModal({ ticket, currentUser, onClose }) {

    console.log("GİRİŞ YAPAN KİŞİ (currentUser):", currentUser);
    console.log("GELEN BİLET (ticket):", ticket);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/tickets/${ticket.id}/messages`);
            setMessages(res.data);
        } catch (err) {
            console.error('Mesajlar yüklenemedi:', err);
        }
    };

    useEffect(() => {
        if (!ticket) return;

        fetchMessages();
        const interval = setInterval(() => {
            fetchMessages();
        }, 3000);

        return () => clearInterval(interval);

    }, [ticket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || loading) return;

        setLoading(true);
        try {
            const res = await api.post(`/tickets/${ticket.id}/messages`, {
                message: newMessage,
            });
            setMessages((prev) => [...prev, { ...res.data, sender: currentUser }]);
            setNewMessage('');
        } catch (err) {
            console.error('Mesaj gönderilemedi:', err);
        } finally {
            setLoading(false);
        }
    };

    const currentUserId = currentUser?.id || currentUser?.user_id;

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <div style={modalHeaderStyle}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{ticket.title}</h3>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                            Durum: {ticket.status}
                        </span>
                    </div>
                    <button onClick={onClose} style={closeButtonStyle}>✕</button>
                </div>

                <div style={chatBodyStyle}>
                    {messages.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '20px' }}>
                            Henüz mesaj bulunmuyor. İlk mesajı yazabilirsiniz.
                        </p>
                    ) : (
                        messages.map((msg) => {
                            const isMe = Number(msg.sender_id) === Number(currentUserId);
                            return (
                                <div
                                    key={msg.id}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: isMe ? 'flex-end' : 'flex-start',
                                        marginBottom: '10px',
                                    }}
                                >
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '2px' }}>
                                        {msg.sender?.name || (isMe ? 'Siz' : 'Kullanıcı')}
                                    </span>
                                    <div
                                        style={{
                                            maxWidth: '75%',
                                            padding: '10px 14px',
                                            borderRadius: '12px',
                                            backgroundColor: isMe ? '#2563eb' : '#374151',
                                            color: '#ffffff',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {msg.message}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} style={modalFooterStyle}>
                    <input
                        type="text"
                        placeholder="Bir mesaj yazın..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        style={inputStyle}
                    />
                    <button type="submit" disabled={loading} style={sendButtonStyle}>
                        {loading ? '...' : 'Gönder'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const modalOverlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
};

const modalContentStyle = {
    backgroundColor: '#1f2937',
    color: '#f3f4f6',
    width: '100%',
    maxWidth: '500px',
    height: '520px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
};

const modalHeaderStyle = {
    padding: '16px',
    borderBottom: '1px solid #374151',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const closeButtonStyle = {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '1.2rem',
    cursor: 'pointer',
};

const chatBodyStyle = {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
};

const modalFooterStyle = {
    padding: '12px 16px',
    borderTop: '1px solid #374151',
    display: 'flex',
    gap: '8px',
};

const inputStyle = {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#ffffff',
    outline: 'none',
};

const sendButtonStyle = {
    padding: '10px 18px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
};

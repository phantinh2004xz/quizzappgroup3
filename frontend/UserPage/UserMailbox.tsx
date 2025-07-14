import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { messageService, type UserInfo } from '../services/messageService';
import { auth } from '../shared/firebase-config';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ref, onChildAdded, off, push, set, update, onValue } from 'firebase/database';
import { realtimeDb } from '../shared/firebase-config';

interface UserMailboxProps {
  onUnreadCountChange?: (count: number) => void;
}

const UserMailbox: React.FC<UserMailboxProps> = ({ onUnreadCountChange }) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<UserInfo | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userUnread, setUserUnread] = useState<{[uid: string]: number}>({});

  // Lấy danh sách tất cả users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        // Lấy user hiện tại
        const user = auth.currentUser;
        if (user) {
          setCurrentUser(user);
          
          // Lấy danh sách users từ API
          const response = await axios.get('http://localhost:8080/api/users/all');
          const allUsers = response.data.map((u: any) => ({
            uid: u.uid,
            email: u.email,
            username: u.username,
            displayName: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
            photoURL: u.photoURL || u.imageUrl || `https://picsum.photos/seed/${u.uid}/40/40`,
            role: u.role
          }));
          
          // Loại bỏ user hiện tại khỏi danh sách
          const filteredUsers = allUsers.filter((u: UserInfo) => u.uid !== user.uid);
          setUsers(filteredUsers);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách users:', error);
        toast.error('Lỗi khi tải danh sách người dùng');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Lắng nghe tất cả conversationId liên quan đến currentUser để tính unreadCount
  useEffect(() => {
    if (!currentUser) return;
    const messagesRef = ref(realtimeDb, 'messages');
    const handle = onValue(messagesRef, (snapshot) => {
      let count = 0;
      const unreadMap: {[uid: string]: number} = {};
      if (snapshot.exists()) {
        const allConvs = snapshot.val();
        Object.values(allConvs).forEach((conv: any) => {
          Object.values(conv).forEach((msg: any) => {
            if (!msg.isRead && msg.receiverId === currentUser.uid) {
              count++;
              unreadMap[msg.senderId] = (unreadMap[msg.senderId] || 0) + 1;
              if (msg.timestamp > Date.now() - 10000) {
                toast.info(`Bạn có tin nhắn mới từ ${msg.senderId}: "${msg.content}"`);
              }
            }
          });
        });
      }
      setUnreadCount(count);
      setUserUnread(unreadMap);
      if (onUnreadCountChange) onUnreadCountChange(count);
    });
    return () => handle();
  }, [currentUser, onUnreadCountChange]);

  // Tìm user theo email
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      setSearchResult(null);
      return;
    }
    // Nếu là email
    if (searchEmail.includes('@')) {
      try {
        const result = await messageService.findUserByEmail(searchEmail);
        if (result.found && result.userId) {
          const userInfo = await messageService.getUserInfo(result.userId);
          setSearchResult(userInfo);
          toast.success('Tìm thấy người dùng!');
        } else {
          setSearchResult(null);
          toast.warning(result.message || 'Không tìm thấy người dùng');
        }
      } catch (error: any) {
        console.error('Lỗi khi tìm user:', error);
        toast.error(error.message || 'Lỗi khi tìm kiếm');
      }
    } else {
      // Tìm theo username (lọc từ users đã load)
      const found = users.find(u => u.username && u.username.toLowerCase() === searchEmail.trim().toLowerCase());
      if (found) {
        setSearchResult(found);
        toast.success('Tìm thấy người dùng!');
      } else {
        setSearchResult(null);
        toast.warning('Không tìm thấy người dùng');
      }
    }
  };

  // Mở chat với user
  const handleOpenChat = (user: UserInfo) => {
    setSelectedUser(user);
    setShowChat(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            📧 Hộp thư
          </h1>
          <p className="text-slate-600 mt-1">Gửi tin nhắn cho người dùng khác trong hệ thống</p>
        </div>

        {/* Search Section */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tìm kiếm người dùng theo email
              </label>
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Nhập email người dùng..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
              />
            </div>
            <button
              onClick={handleSearchUser}
              className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium"
            >
              Tìm kiếm
            </button>
          </div>

          {/* Search Result */}
          {searchResult && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={searchResult.photoURL || `https://picsum.photos/seed/${searchResult.uid}/40/40`}
                    alt={searchResult.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-slate-800">{searchResult.username || searchResult.email}</h3>
                    <p className="text-sm text-slate-600">{searchResult.email}</p>
                    <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full mt-1">
                      {searchResult.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenChat(searchResult)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
                >
                  <span>💬</span>
                  Gửi tin nhắn
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Danh sách người dùng</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-slate-500">Đang tải danh sách người dùng...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium mb-2">Không có người dùng nào</h3>
              <p className="text-sm">Hiện tại chỉ có bạn trong hệ thống</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div style={{ position: 'relative' }}>
                      <img
                        src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`}
                        alt={user.displayName}
                        className="w-12 h-12 rounded-full"
                      />
                      {userUnread[user.uid] > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '9999px',
                          minWidth: 12,
                          height: 12,
                          fontSize: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          zIndex: 10,
                          boxShadow: '0 0 0 2px white',
                        }}></span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">{user.username || user.email}</h3>
                      <p className="text-sm text-slate-600">{user.email}</p>
                      <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full mt-1">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenChat(user)}
                    className="p-2 text-sky-500 hover:bg-sky-50 rounded-full transition-colors"
                    title="Gửi tin nhắn"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && selectedUser && (
        <ChatModal
          user={selectedUser}
          currentUser={currentUser}
          onClose={() => {
            setShowChat(false);
            setSelectedUser(null);
          }}
        />
      )}

      <ToastContainer position="top-right" />
    </div>
  );
};

// Chat Modal Component
interface ChatModalProps {
  user: UserInfo;
  currentUser: any;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ user, currentUser, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hàm tạo conversationId duy nhất giữa 2 user
  const getConversationId = (uid1: string, uid2: string) => {
    const id = [uid1, uid2].sort().join('_');
    console.log('DEBUG conversationId:', id, 'uid1:', uid1, 'uid2:', uid2);
    return id;
  };

  // Đánh dấu đã đọc tất cả tin nhắn khi mở chat
  const markAllAsRead = (msgs: any[]) => {
    if (!conversationId || !currentUser) return;
    msgs.forEach((msg) => {
      if (!msg.isRead && msg.receiverId === currentUser.uid) {
        const msgRef = ref(realtimeDb, `messages/${conversationId}/${msg.id}`);
        update(msgRef, { isRead: true });
      }
    });
  };

  // Lắng nghe realtime tin nhắn
  useEffect(() => {
    if (!currentUser || !user) return;
    const convId = getConversationId(currentUser.uid, user.uid);
    setConversationId(convId);
    console.log('DEBUG useEffect - lắng nghe conversationId:', convId);
    const messagesRef = ref(realtimeDb, `messages/${convId}`);
    setMessages([]); // clear khi đổi user
    const handleNewMessage = (snapshot: any) => {
      const msg = snapshot.val();
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        // Thông báo nếu là tin nhắn gửi đến mình và chưa đọc
        if (msg.senderId !== currentUser.uid && !msg.isRead) {
          toast.info(`Bạn có tin nhắn mới từ ${user.username || user.email}: "${msg.content}"`);
        }
        const newMsgs = [...prev, msg];
        setTimeout(() => markAllAsRead(newMsgs), 0);
        return newMsgs;
      });
    };
    onChildAdded(messagesRef, handleNewMessage);
    // Đánh dấu đã đọc tất cả khi mở chat
    onValue(messagesRef, (snap) => {
      const allMsgs = snap.exists() ? Object.values(snap.val()) : [];
      markAllAsRead(allMsgs as any[]);
    });
    return () => {
      off(messagesRef, 'child_added', handleNewMessage);
    };
  }, [currentUser, user]);

  // Gửi tin nhắn lên Realtime Database
  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser || !conversationId) return;
    setSending(true);
    try {
      console.log('DEBUG gửi message vào conversationId:', conversationId);
      const messagesRef = ref(realtimeDb, `messages/${conversationId}`);
      const newMsgRef = push(messagesRef);
      const msgData = {
        id: newMsgRef.key,
        conversationId,
        senderId: currentUser.uid,
        receiverId: user.uid,
        content: message.trim(),
        timestamp: Date.now(),
        isRead: false,
      };
      await set(newMsgRef, msgData);
      setMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  // Scroll đến cuối khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Khi mở chat, đánh dấu đã đọc tất cả
  useEffect(() => {
    if (!conversationId || !currentUser) return;
    const messagesRef = ref(realtimeDb, `messages/${conversationId}`);
    onValue(messagesRef, (snap) => {
      const allMsgs = snap.exists() ? Object.values(snap.val()) : [];
      allMsgs.forEach((msg: any) => {
        if (!msg.isRead && msg.receiverId === currentUser.uid) {
          const msgRef = ref(realtimeDb, `messages/${conversationId}/${msg.id}`);
          update(msgRef, { isRead: true });
        }
      });
    });
  }, [conversationId, currentUser]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-96 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`}
              alt={user.username || user.email}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-medium text-slate-800">{user.username || user.email}</h3>
              <p className="text-sm text-slate-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 mt-8">
              <div className="text-4xl mb-4">💬</div>
              <p>Chưa có tin nhắn nào</p>
              <p className="text-sm">Bắt đầu cuộc trò chuyện với {user.username || user.email}</p>
            </div>
          ) : (
            <div>
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`mb-2 flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderId === currentUser?.uid
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.senderId === currentUser?.uid ? 'text-sky-100' : 'text-slate-500'
                    }`}>
                      {format(new Date(msg.timestamp), 'HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={sending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
              className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMailbox; 
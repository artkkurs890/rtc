import { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from './socket';

function App() {
  const [room, setRoom] = useState("");
  const [profile, setProfile] = useState({ username: "", color: "#0084ff", avatar: "👤" });
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [users, setUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const scrollRef = useRef(null);

  const joinRoom = () => {
    if (room !== "" && profile.username !== "") {
      socket.emit("join_room", { room, profile });
      setJoined(true);
    }
  };

  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("chat_message", { 
        room, 
        message, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        profile: profile 
      });
      setMessage("");
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat]);

  useEffect(() => {
    const handleReceive = (data) => setChat((prev) => [...prev, data]);
    const handleUsers = (list) => setUsers(list);
    
    socket.off("receive_message").on("receive_message", handleReceive);
    socket.off("update_user_list").on("update_user_list", handleUsers);
    
    return () => { 
      socket.off("receive_message", handleReceive); 
      socket.off("update_user_list", handleUsers); 
    };
  }, []);

  if (!joined) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "15px", background: "#f0f2f5" }}>
        <h2>Налаштуй профіль</h2>
        <input style={{ padding: "10px" }} placeholder="Нік..." onChange={(e) => setProfile({...profile, username: e.target.value})} />
        <input type="color" value={profile.color} onChange={(e) => setProfile({...profile, color: e.target.value})} />
        <select onChange={(e) => setProfile({...profile, avatar: e.target.value})}>
          <option value="👤">👤</option><option value="😎">😎</option><option value="🚀">🚀</option>
        </select>
        <input style={{ padding: "10px" }} placeholder="ID Кімнати..." onChange={(e) => setRoom(e.target.value)} />
        <button onClick={joinRoom} style={{ padding: "10px 30px", background: "#0084ff", color: "#fff", border: "none", cursor: "pointer" }}>Увійти</button>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f0f2f5" }}>
      <div style={{ padding: "15px", background: "#fff" }}>Кімната: {room}</div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: "200px", padding: "20px", background: "#fff" }}>
          <h4>Учасники:</h4>
          {users.map((u, i) => <div key={i} style={{ color: u.color }}>{u.avatar} {u.username}</div>)}
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <AnimatePresence>
            {chat.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: m.isSystem ? "center" : (m.senderProfile?.username === profile.username ? "flex-end" : "flex-start"),
                  background: m.isSystem ? "transparent" : (m.senderProfile?.username === profile.username ? profile.color : "#fff"),
                  color: m.isSystem ? "#666" : (m.senderProfile?.username === profile.username ? "#fff" : "#333"),
                  padding: "10px 15px", borderRadius: "18px", maxWidth: "60%"
                }}>
                {!m.isSystem && m.senderProfile && (
                  <div style={{ fontSize: "10px", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }} onClick={() => setSelectedProfile(m.senderProfile)}>
                    {m.senderProfile.avatar} {m.senderProfile.username}
                  </div>
                )}
                <div>{m.message}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {selectedProfile && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedProfile(null)}>
          <div style={{ background: "#fff", padding: "30px", borderRadius: "20px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "50px" }}>{selectedProfile.avatar}</div>
            <h2>{selectedProfile.username}</h2>
            <button onClick={() => setSelectedProfile(null)}>Закрити</button>
          </div>
        </div>
      )}

      <div style={{ padding: "20px", background: "#fff", display: "flex", gap: "10px" }}>
        <input style={{ flex: 1, padding: "10px" }} value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} />
        <button onClick={sendMessage}>Надіслати</button>
      </div>
    </div>
  );
}

export default App;
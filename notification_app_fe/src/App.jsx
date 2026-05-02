import { useState, useEffect } from 'react';
import { Log } from './logging_middleware/logger';
import './App.css';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard State
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [sender, setSender] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    Log('frontend', 'info', 'notification_app_fe', 'Application loaded');
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedMode);
    
    // Check session
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      setIsAuthenticated(true);
      setSender(savedAuth);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUser.trim().length > 0) {
      setIsAuthenticated(true);
      setSender(loginUser.trim());
      setLoginError('');
      localStorage.setItem('auth', loginUser.trim());
      Log('frontend', 'info', 'notification_app_fe', `User logged in: ${loginUser}`);
    } else {
      setLoginError('Please enter a username to continue.');
      Log('frontend', 'warn', 'notification_app_fe', 'Failed login attempt: no username');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginUser('');
    localStorage.removeItem('auth');
    Log('frontend', 'info', 'notification_app_fe', 'User logged out');
  };

  const playWarningSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.4; 
      audio.play().catch(e => console.log("Audio blocked by browser policy:", e));
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const handleAddNotification = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newNotification = {
      id: Date.now(),
      sender: sender.trim() || 'System',
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    Log('frontend', 'info', 'notification_app_fe', `Added notification of type: ${type} by ${newNotification.sender}`);
    
    if (type === 'warn' || type === 'error') {
      playWarningSound();
    }

    setMessage('');
    setIsSent(true);
    setTimeout(() => setIsSent(false), 2000);
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const toggleReadStatus = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const exportToCSV = () => {
    if (notifications.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Sender', 'Type', 'Message', 'Status'];
    const csvRows = [headers.join(',')];
    for (const n of notifications) {
      const safeSender = `"${n.sender.replace(/"/g, '""')}"`;
      const safeMessage = `"${n.message.replace(/"/g, '""')}"`;
      csvRows.push([n.id, n.timestamp, safeSender, n.type, safeMessage, n.read ? 'Read' : 'Unread'].join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications_log.csv`;
    a.click();
  };

  if (!isAuthenticated) {
    return (
      <div className={`dashboard-wrapper login-bg ${isDarkMode ? 'dark-mode' : ''}`}>
        <button className="theme-toggle" onClick={toggleDarkMode} title="Toggle Dark Mode">
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        <div className="login-card glass-panel">
          <div className="login-header">
            <div className="login-icon">👋</div>
            <h2>Welcome</h2>
            <p>Enter your name to access the dashboard</p>
          </div>
          {loginError && <div className="login-error">{loginError}</div>}
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Your Name / Username</label>
              <input 
                type="text" 
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="e.g. Admin, John..."
                className="input-field"
                autoComplete="username"
                autoFocus
              />
            </div>
            <button type="submit" className="login-btn send-btn">Continue to Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  // Derived state
  const infoCount = notifications.filter(n => n.type === 'info').length;
  const warnCount = notifications.filter(n => n.type === 'warn').length;
  const errorCount = notifications.filter(n => n.type === 'error').length;
  const unreadCount = notifications.filter(n => !n.read).length;

  let filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === 'all' || n.type === filter;
    const matchesSearch = n.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.sender.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (sortOrder === 'oldest') {
    filteredNotifications = [...filteredNotifications].reverse();
  }

  return (
    <div className={`dashboard-wrapper ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="top-nav">
        <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
        <button className="theme-toggle nav-toggle" onClick={toggleDarkMode} title="Toggle Dark Mode">
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="dashboard-container">
        
        {/* Left Panel */}
        <div className="composer-panel glass-panel">
          <div className="composer-header">
            <h2>Send Notification</h2>
            <p>Broadcast a new message securely</p>
          </div>
          
          <form onSubmit={handleAddNotification} className="composer-form">
            <div className="form-group">
              <label>Sender Name</label>
              <input 
                type="text" 
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. Admin, System..."
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>Message Content</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your notification here..."
                className="input-field textarea-field"
                rows="4"
              />
            </div>
            
            <div className="form-group">
              <label>Priority / Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="select-field"
              >
                <option value="info">💬 Information</option>
                <option value="warn">⚠️ Warning</option>
                <option value="error">🚨 Critical Error</option>
              </select>
            </div>
            
            <button type="submit" className={`send-btn ${isSent ? 'sent' : ''}`}>
              <span>{isSent ? '✅ Successfully Sent!' : 'Send Message'}</span>
              {!isSent && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="send-icon">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </button>
          </form>
        </div>

        {/* Right Panel */}
        <div className="stream-panel glass-panel">
          <div className="stream-header">
            <div className="stream-title">
              <h2>Message Stream</h2>
              <span className="count-badge" title="Unread Messages">{unreadCount} Unread</span>
            </div>
            <div className="stream-actions">
              {notifications.length > 0 && (
                <>
                  <button onClick={exportToCSV} className="export-btn" title="Download Logs">📥 Export CSV</button>
                  <button onClick={clearAll} className="clear-btn" title="Delete All">🗑️ Clear All</button>
                </>
              )}
            </div>
          </div>

          <div className="analytics-panel">
            <div className="stat-card info">
              <div className="stat-value">{infoCount}</div>
              <div className="stat-label">Info</div>
            </div>
            <div className="stat-card warn">
              <div className="stat-value">{warnCount}</div>
              <div className="stat-label">Warnings</div>
            </div>
            <div className="stat-card error">
              <div className="stat-value">{errorCount}</div>
              <div className="stat-label">Errors</div>
            </div>
          </div>

          <div className="stream-controls">
            <input 
              type="text" 
              placeholder="Search messages or senders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field search-input"
            />
            
            <div className="controls-row">
              <div className="filter-tabs">
                {['all', 'info', 'warn', 'error'].map(t => (
                  <button 
                    key={t}
                    className={`filter-tab ${filter === t ? 'active' : ''} ${filter === t ? t : ''}`}
                    onClick={() => setFilter(t)}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <select 
                className="sort-select" 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="messages-container">
            {filteredNotifications.length === 0 ? (
              <div className="empty-stream">
                <div className="empty-icon">📭</div>
                <p>No messages found.</p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`message-bubble-wrapper ${notif.type} ${notif.read ? 'read' : ''}`}
                  onClick={() => toggleReadStatus(notif.id)}
                  title="Click to mark as read/unread"
                >
                  <div className="message-avatar">
                    {notif.sender.charAt(0).toUpperCase()}
                  </div>
                  <div className="message-bubble">
                    <div className="message-header">
                      <span className="message-sender">{notif.sender}</span>
                      <span className="message-time">{notif.timestamp}</span>
                    </div>
                    <div className="message-body">
                      {notif.message}
                    </div>
                    <div className="message-footer">
                      <span className={`type-indicator ${notif.type}`}>
                        {notif.type}
                      </span>
                      {notif.read && <span className="read-status">✓ Read</span>}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} 
                      className="delete-message-btn"
                      title="Delete message"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;

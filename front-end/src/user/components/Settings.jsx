import React, { useState, useRef, useEffect } from "react";
import { FiX } from "react-icons/fi";
import "../../styles/Settings.css";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useChatHistory } from "../../hooks/useChatHistory";
import ArchivedChats from "./ArchivedChats";
import { deleteAllChats, deleteCurrentUser } from "../../firebase";

const Settings = ({ onClose }) => {
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showArchivedChats, setShowArchivedChats] = useState(false);
  const [showConfirmDeleteAccount, setShowConfirmDeleteAccount] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const boxRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { clearHistory } = useChatHistory();
  const [activeTab, setActiveTab] = useState('chung');

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/chat');
    }
  };

  const handleLogoutClick = () => {
    setShowConfirmLogout(true);
  };

  const handleClearChatClick = () => {
    setShowConfirmClear(true);
  };

  const handleDeleteAccountClick = () => {
    setShowConfirmDeleteAccount(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowConfirmLogout(false);
      handleClose();
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại!");
    }
  };

  const confirmClearChat = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để thực hiện chức năng này!");
      return;
    }

    setIsDeleting(true);
    try {
      // Xóa tất cả chat từ Firebase
      await deleteAllChats(user.uid);
      
      // Xóa lịch sử chat local
      await clearHistory();
      
      // Gọi API backend để xóa dữ liệu
      const response = await fetch(`http://localhost:8000/user/delete-data`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete all data');
      }
      
      const result = await response.json();
      setShowConfirmClear(false);
      alert(result.message || "Đã xóa toàn bộ lịch sử trò chuyện!");
      
      // Reload trang để reset hoàn toàn
      window.location.reload();
    } catch (error) {
      console.error("Error deleting all data:", error);
      alert("Có lỗi xảy ra khi xóa dữ liệu: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để thực hiện chức năng này!");
      return;
    }
    setIsDeletingAccount(true);
    try {
      // Gọi API backend để xóa tài khoản và tất cả dữ liệu
      const response = await fetch(`http://localhost:8000/user/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete account');
      }

      // Xóa lịch sử chat local
      await clearHistory();

      // Đăng xuất và chuyển hướng về trang đăng nhập
      await logout();
      alert("Tài khoản đã được xóa vĩnh viễn!");
      window.location.href = "/login";
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        alert('Vui lòng đăng nhập lại để xóa tài khoản!');
      } else {
        alert("Có lỗi xảy ra khi xóa tài khoản: " + error.message);
      }
    } finally {
      setIsDeletingAccount(false);
      setShowConfirmDeleteAccount(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="settings-overlay" style={{ animation: 'none', transition: 'none', transform: 'none', opacity: 1, willChange: 'auto' }}>
      <div className="settings-box" ref={boxRef} style={{ animation: 'none', transition: 'none', transform: 'none', opacity: 1, willChange: 'auto' }}>
        <div className="settings-header">
          <div className="header-left">
            <h2>Cài đặt</h2>
          </div>
          <button className="close-btn" onClick={handleClose} title="Đóng">
            <FiX />
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <button className={`sidebar-btn${activeTab === 'chung' ? ' active' : ''}`} onClick={() => setActiveTab('chung')}>Chung</button>
            <button className={`sidebar-btn${activeTab === 'account' ? ' active' : ''}`} onClick={() => setActiveTab('account')}>Tài khoản</button>
          </div>

          <div className="settings-main">
            {/* Tab Chung: Hiển thị đầy đủ */}
            {activeTab === 'chung' && (
              <>
                <div className="settings-row">
                  <span className="settings-label">Xoá tất cả đoạn chat</span>
                  <button className="btn-fixed" onClick={handleClearChatClick}>Xóa tất cả</button>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Đoạn chat đã lưu trữ</span>
                  <button className="btn-fixed btn-manage" onClick={() => setShowArchivedChats(true)}>
                    Quản lý
                  </button>
                </div>
                <div className="settings-row">
                  <span className="settings-label" style={{ color: '#e53935' }}>Xóa tài khoản</span>
                  <button className="btn-fixed btn-delete" onClick={handleDeleteAccountClick}>
                    Xóa tài khoản
                  </button>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Quản lý đăng nhập</span>
                  <button className="btn-fixed" onClick={handleLogoutClick}>Đăng xuất</button>
                </div>
              </>
            )}
            {/* Tab Tài khoản: Chỉ hiển thị các chức năng tài khoản */}
            {activeTab === 'account' && (
              <>
                <div className="settings-row">
                  <span className="settings-label">Xoá tất cả đoạn chat</span>
                  <button className="btn-fixed" onClick={handleClearChatClick}>Xóa tất cả</button>
                </div>
                <div className="settings-row">
                  <span className="settings-label" style={{ color: '#e53935' }}>Xóa tài khoản</span>
                  <button className="btn-fixed btn-delete" onClick={handleDeleteAccountClick}>
                    Xóa tài khoản
                  </button>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Quản lý đăng nhập</span>
                  <button className="btn-fixed" onClick={handleLogoutClick}>Đăng xuất</button>
                </div>
              </>
            )}

            {showConfirmLogout && (
              <div className="confirm-popup">
                <div className="confirm-content">
                  <p>Bạn chắc chắn muốn đăng xuất?</p>
                  <div className="confirm-buttons">
                    <button className="btn btn-error btn-sm" onClick={confirmLogout}>Đăng xuất</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowConfirmLogout(false)}>Huỷ</button>
                  </div>
                </div>
              </div>
            )}

            {showConfirmClear && (
              <div className="confirm-popup">
                <div className="confirm-content">
                  <p>Bạn chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?</p>
                  <div className="confirm-buttons">
                    <button 
                      className="btn btn-error btn-sm" 
                      onClick={confirmClearChat}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Đang xóa..." : "Xóa tất cả"}
                    </button>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => setShowConfirmClear(false)}
                      disabled={isDeleting}
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showConfirmDeleteAccount && (
              <div className="confirm-popup">
                <div className="confirm-content">
                  <p>Bạn chắc chắn muốn <b>xóa vĩnh viễn</b> tài khoản này? Hành động này không thể hoàn tác!</p>
                  <div className="confirm-buttons">
                    <button 
                      className="btn btn-error btn-sm" 
                      onClick={confirmDeleteAccount}
                      disabled={isDeletingAccount}
                    >
                      {isDeletingAccount ? "Đang xóa..." : "Xóa tài khoản"}
                    </button>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => setShowConfirmDeleteAccount(false)}
                      disabled={isDeletingAccount}
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showArchivedChats && (
        <ArchivedChats onClose={() => setShowArchivedChats(false)} />
      )}
    </div>
  );
};

export default Settings; 
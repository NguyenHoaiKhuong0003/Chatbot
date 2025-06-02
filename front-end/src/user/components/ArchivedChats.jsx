import React from 'react';
import { useChatHistory } from '../../hooks/useChatHistory';
import { FiX, FiArchive, FiMessageSquare } from 'react-icons/fi';
import '../../styles/ArchivedChats.css';

const ArchivedChats = ({ onClose }) => {
  const { archivedChats, unarchiveChat } = useChatHistory();

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleUnarchive = async (chatId) => {
    try {
      await unarchiveChat(chatId);
      alert('Đã bỏ lưu trữ đoạn chat thành công!');
    } catch (error) {
      console.error('Error unarchiving chat:', error);
      alert('Có lỗi xảy ra khi bỏ lưu trữ đoạn chat. Vui lòng thử lại!');
    }
  };

  return (
    <div className="archived-chats-overlay">
      <div className="archived-chats-container">
        <div className="archived-chats-header">
          <div className="header-content">
            <FiArchive className="header-icon" />
            <h2>Đoạn Chat đã Lưu trữ</h2>
          </div>
          <button className="close-button" onClick={onClose} title="Đóng">
            <FiX />
          </button>
        </div>

        <div className="archived-chats-subheader">
          <div className="subheader-column">Tên</div>
          <div className="subheader-column">Ngày tạo</div>
          <div className="subheader-column actions">Thao tác</div>
        </div>

        <div className="archived-chats-content">
          {archivedChats && archivedChats.length > 0 ? (
            <div className="archived-chats-list">
              {archivedChats.map((chat) => (
                <div key={chat.id} className="archived-chat-item">
                  <div className="chat-title">
                    <FiMessageSquare className="chat-icon" />
                    <span>{chat.message || chat.firstMessage}</span>
                  </div>
                  <div className="chat-date">
                    {formatDate(chat.archiveDate?.toDate())}
                  </div>
                  <div className="chat-actions">
                    <button
                      className="action-button unarchive"
                      onClick={() => handleUnarchive(chat.id)}
                      title="Bỏ lưu trữ"
                    >
                      <FiArchive />
                      <span>Bỏ lưu trữ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-archived-chats">
              <FiArchive className="archive-icon" />
              <p>Chưa có đoạn chat nào được lưu trữ</p>
              <span className="help-text">Các đoạn chat được lưu trữ sẽ xuất hiện ở đây</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivedChats; 
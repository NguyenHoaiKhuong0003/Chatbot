import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { IoClose } from "react-icons/io5";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingUser, setUpdatingUser] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'lastSignInTime',
    direction: 'desc'
  });
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admin', 'user'
  const [timeFilter, setTimeFilter] = useState('all');
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/admin/users", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch users");
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedUsers = [...users].sort((a, b) => {
      if (key === 'lastSignInTime') {
        const timeA = a.lastSignInTimestamp || 0;
        const timeB = b.lastSignInTimestamp || 0;
        return direction === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (key === 'isAdmin') {
        const timeA = a.lastSignInTimestamp || 0;
        const timeB = b.lastSignInTimestamp || 0;
        if (timeA !== timeB) {
          return direction === 'asc' ? timeA - timeB : timeB - timeA;
        }
        return direction === 'asc' 
          ? (a.isAdmin === b.isAdmin ? 0 : a.isAdmin ? 1 : -1)
          : (a.isAdmin === b.isAdmin ? 0 : a.isAdmin ? -1 : 1);
      }
      return direction === 'asc'
        ? (a[key] || '').localeCompare(b[key] || '')
        : (b[key] || '').localeCompare(a[key] || '');
    });

    setUsers(sortedUsers);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ml-1" />;
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="ml-1" /> 
      : <FaSortDown className="ml-1" />;
  };

  const handleToggleAdmin = async (userId, makeAdmin, userName) => {
    const action = makeAdmin ? 'cấp' : 'thu hồi';
    if (window.confirm(`Bạn có chắc chắn muốn ${action} quyền admin cho người dùng ${userName || 'này'}?`)) {
      try {
        setUpdatingUser(userId);
        // Close the dropdown
        setOpenDropdownId(null);
        const user = auth.currentUser;
        if (!user) {
          throw new Error("User not authenticated");
        }

        const token = await user.getIdToken();
        const response = await fetch(`http://localhost:8000/admin/users/${userId}/admin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ is_admin: makeAdmin })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to update admin status");
        }

        await fetchUsers();
      } catch (err) {
        setError(err.message);
      } finally {
        setUpdatingUser(null);
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        const token = await user.getIdToken();
        const response = await fetch(`http://localhost:8000/admin/users/${userId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to delete user");
        }

        await fetchUsers();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleLogout = () => {
    navigate('/admin');
  };

  const filteredUsers = users.filter(user => {
    // Role filter
    if (roleFilter === 'admin' && !user.isAdmin) return false;
    if (roleFilter === 'user' && user.isAdmin) return false;

    // Time filter
    if (timeFilter === 'all') return true;
    
    const lastSignIn = user.lastSignInTimestamp || 0;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    switch (timeFilter) {
      case 'today':
        return now - lastSignIn <= oneDay;
      case 'week':
        return now - lastSignIn <= oneWeek;
      case 'month':
        return now - lastSignIn <= oneMonth;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-900">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 pt-12 pb-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Quản lý người dùng</h1>
            </div>
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Email
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-2">
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="text-xs font-medium text-black uppercase tracking-wider bg-transparent border-none focus:ring-0 focus:border-none cursor-pointer text-gray-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="all" className="text-gray-900">Tất cả người dùng</option>
                        <option value="admin" className="text-gray-900">Chỉ Admin</option>
                        <option value="user" className="text-gray-900">Chỉ User</option>
                      </select>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-2">
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="text-xs font-medium text-black uppercase tracking-wider bg-transparent border-none focus:ring-0 focus:border-none cursor-pointer text-gray-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="all" className="text-gray-900">Tất cả thời gian</option>
                        <option value="today" className="text-gray-900">Hôm nay</option>
                        <option value="week" className="text-gray-900">Tuần này</option>
                        <option value="month" className="text-gray-900">Tháng này</option>
                      </select>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.photoURL ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.photoURL}
                              alt="User avatar"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-800 font-semibold text-sm">
                              {(user.displayName || user.email || '').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'Chưa có tên'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap relative">
                      <div className="relative">
                       <button
                          onClick={() => setOpenDropdownId(openDropdownId === user.uid ? null : user.uid)}
                          disabled={updatingUser === user.uid}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            user.isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          } ${updatingUser === user.uid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        >
                          {updatingUser === user.uid ? 'Đang cập nhật...' : (user.isAdmin ? 'Admin' : 'User')}
                        </button>
                        {openDropdownId === user.uid && (
                          <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                              <button
                                onClick={() => handleToggleAdmin(user.uid, true, user.displayName || user.email)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                role="menuitem"
                              >
                                Cấp quyền Admin
                              </button>
                                <button
                                  onClick={() => handleToggleAdmin(user.uid, false, user.displayName || user.email)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                role="menuitem"
                                >
                                  Thu hồi quyền Admin
                                </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.lastSignInTime || 'Chưa đăng nhập'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <button
                        onClick={() => handleDeleteUser(user.uid)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
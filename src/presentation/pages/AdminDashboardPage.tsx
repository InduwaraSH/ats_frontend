import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  apiGetAllUsers,
  apiAddUser,
  apiDeleteUser,
  apiUpdateUserStatus,
  apiUpdateUserRole,
} from '../../infrastructure/api/authApi';
import type { UserResponse } from '../../infrastructure/api/authApi';
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Shield,
  UserPlus,
  Search,
  Filter,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  X,
  KeyRound,
  ShieldCheck,
  Mail,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onBack: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onBack }) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'full_name' | 'email' | 'role' | 'is_active'>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Reset page to 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, sortField, sortDirection, pageSize]);

  const handleSort = (field: 'full_name' | 'email' | 'role' | 'is_active') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Add user modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newFullName, setNewFullName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('user');
  const [addingUser, setAddingUser] = useState<boolean>(false);

  // Delete user modal state
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const [deletingUser, setDeletingUser] = useState<boolean>(false);

  // Load all users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiGetAllUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      showToast(err.message || 'Failed to fetch users from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle Add User submission
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    setAddingUser(true);
    try {
      await apiAddUser({
        full_name: newFullName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      showToast(`User '${newEmail}' added successfully!`, 'success');
      setIsAddModalOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to add user', 'error');
    } finally {
      setAddingUser(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      await apiDeleteUser(userToDelete.email);
      showToast(`User '${userToDelete.email}' deleted successfully.`, 'success');
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setDeletingUser(false);
    }
  };

  // Handle Block / Unblock toggle
  const handleToggleStatus = async (user: UserResponse) => {
    const nextStatus = !user.is_active;
    const actionText = nextStatus ? 'unblocked' : 'blocked';
    try {
      await apiUpdateUserStatus(user.email, nextStatus);
      showToast(`User '${user.email}' has been ${actionText}.`, 'info');
      setUsers((prev) =>
        prev.map((u) => (u.email === user.email ? { ...u, is_active: nextStatus } : u))
      );
    } catch (err: any) {
      showToast(err.message || `Failed to ${actionText} user`, 'error');
    }
  };

  // Handle Role update
  const handleRoleChange = async (email: string, targetRole: string) => {
    try {
      await apiUpdateUserRole(email, targetRole);
      showToast(`Role updated to '${targetRole}' for user ${email}`, 'success');
      setUsers((prev) =>
        prev.map((u) => (u.email === email ? { ...u, role: targetRole } : u))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  // 1. Filtered users list (across full dataset)
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.is_active) ||
      (statusFilter === 'blocked' && !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // 2. Sorted users list (across all filtered results)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA = (a[sortField] ?? '') as any;
    let valB = (b[sortField] ?? '') as any;

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // 3. Pagination calculation
  const totalItems = sortedUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // Metrics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const blockedUsers = users.filter((u) => !u.is_active).length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;

  return (
    <div style={styles.pageContainer}>
      {/* Header Bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={onBack} style={styles.backBtn} title="Back to Workspace">
            <ArrowLeft size={18} />
            <span>Back to ATS</span>
          </button>
          <div style={styles.headerTitleGroup}>
            <div style={styles.headerIconBadge}>
              <ShieldCheck size={22} style={{ color: 'var(--accent-indigo)' }} />
            </div>
            <div>
              <h1 style={styles.headerTitle}>Admin Control Center</h1>
              <p style={styles.headerSubtitle}>Manage user accounts, roles & system security access</p>
            </div>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button onClick={loadUsers} style={styles.refreshBtn} title="Refresh User List">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setIsAddModalOpen(true)} style={styles.addBtn}>
            <UserPlus size={16} />
            <span>Add New User</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {/* Metrics Cards Grid */}
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel}>Total Users</span>
              <div style={{ ...styles.metricIconBox, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
                <Users size={18} />
              </div>
            </div>
            <div style={styles.metricValue}>{totalUsers}</div>
            <div style={styles.metricSub}>Registered accounts</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel}>Active Users</span>
              <div style={{ ...styles.metricIconBox, background: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}>
                <UserCheck size={18} />
              </div>
            </div>
            <div style={styles.metricValue}>{activeUsers}</div>
            <div style={styles.metricSub}>Can log in & access</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel}>Blocked Users</span>
              <div style={{ ...styles.metricIconBox, background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                <UserX size={18} />
              </div>
            </div>
            <div style={styles.metricValue}>{blockedUsers}</div>
            <div style={styles.metricSub}>Access suspended</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel}>System Admins</span>
              <div style={{ ...styles.metricIconBox, background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
                <Shield size={18} />
              </div>
            </div>
            <div style={styles.metricValue}>{adminUsers}</div>
            <div style={styles.metricSub}>Full administrator rights</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={styles.filterSection}>
          <div style={styles.searchBox}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by full name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={styles.filterControls}>
            <div style={styles.filterDropdownWrapper}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">Normal User</option>
                <option value="recruiter">Recruiter</option>
                <option value="hiring_manager">Hiring Manager</option>
                <option value="interviewer">Interviewer</option>
              </select>
            </div>

            <div style={styles.filterDropdownWrapper}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div style={styles.tableCard} className="glass-panel">
          {loading ? (
            <div style={styles.emptyState}>
              <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--accent-indigo)' }} />
              <p style={{ marginTop: '12px', fontWeight: 500 }}>Loading system users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={styles.emptyState}>
              <UserX size={36} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <p style={{ marginTop: '12px', fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-title)' }}>
                No matching users found
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Try adjusting your search query or filter options.
              </p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort('full_name')}
                      style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }}
                      title="Sort by Full Name"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>User Details</span>
                        {sortField === 'full_name' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={12} style={{ color: 'var(--accent-indigo)' }} />
                          ) : (
                            <ArrowDown size={12} style={{ color: 'var(--accent-indigo)' }} />
                          )
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('email')}
                      style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }}
                      title="Sort by Email Address"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Email Address</span>
                        {sortField === 'email' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={12} style={{ color: 'var(--accent-indigo)' }} />
                          ) : (
                            <ArrowDown size={12} style={{ color: 'var(--accent-indigo)' }} />
                          )
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('role')}
                      style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }}
                      title="Sort by Role"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Role / Privilege</span>
                        {sortField === 'role' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={12} style={{ color: 'var(--accent-indigo)' }} />
                          ) : (
                            <ArrowDown size={12} style={{ color: 'var(--accent-indigo)' }} />
                          )
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('is_active')}
                      style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }}
                      title="Sort by Status"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Account Status</span>
                        {sortField === 'is_active' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={12} style={{ color: 'var(--accent-indigo)' }} />
                          ) : (
                            <ArrowDown size={12} style={{ color: 'var(--accent-indigo)' }} />
                          )
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                        )}
                      </div>
                    </th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>
                      Management Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => {
                    const isAdmin = u.role === 'admin';
                    const isSelf = currentUser?.email === u.email;

                    return (
                      <tr key={u.id || u.email} style={styles.tr}>
                        {/* Name & Avatar */}
                        <td style={styles.td}>
                          <div style={styles.userInfoCell}>
                            <div
                              style={{
                                ...styles.avatarCircle,
                                background: isAdmin
                                  ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                                  : 'linear-gradient(135deg, #0284c7, #2563eb)',
                              }}
                            >
                              {u.full_name ? u.full_name.substring(0, 2).toUpperCase() : u.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={styles.userNameText}>
                                {u.full_name || 'System User'}
                                {isSelf && <span style={styles.selfBadge}>(You)</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={styles.td}>
                          <span style={styles.userEmailText}>{u.email}</span>
                        </td>

                        {/* Role Switcher */}
                        <td style={styles.td}>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.email, e.target.value)}
                            disabled={isSelf}
                            style={{
                              ...styles.roleSelectPill,
                              ...(isAdmin ? styles.roleAdmin : styles.roleUser),
                            }}
                            title={isSelf ? "You cannot change your own role" : "Change user role"}
                          >
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                            <option value="recruiter">Recruiter</option>
                            <option value="hiring_manager">Hiring Manager</option>
                            <option value="interviewer">Interviewer</option>
                          </select>
                        </td>

                        {/* Status Badge */}
                        <td style={styles.td}>
                          {u.is_active ? (
                            <span style={styles.statusActiveBadge}>
                              <CheckCircle2 size={12} /> Active
                            </span>
                          ) : (
                            <span style={styles.statusBlockedBadge}>
                              <XCircle size={12} /> Blocked
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <div style={styles.actionButtonsRow}>
                            {/* Block / Unblock Toggle */}
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSelf}
                              style={{
                                ...styles.actionBtn,
                                ...(u.is_active ? styles.actionBlockBtn : styles.actionUnblockBtn),
                              }}
                              title={
                                isSelf
                                  ? "You cannot block yourself"
                                  : u.is_active
                                  ? "Temporary Block User"
                                  : "Unblock / Activate User"
                              }
                            >
                              {u.is_active ? <Lock size={14} /> : <Unlock size={14} />}
                              <span>{u.is_active ? 'Block' : 'Unblock'}</span>
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => setUserToDelete(u)}
                              disabled={isSelf}
                              style={{
                                ...styles.actionBtn,
                                ...styles.actionDeleteBtn,
                                opacity: isSelf ? 0.4 : 1,
                                cursor: isSelf ? 'not-allowed' : 'pointer',
                              }}
                              title={isSelf ? "You cannot delete your own account" : "Delete User Account"}
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            <div style={styles.paginationBar}>
              <div style={styles.paginationInfo}>
                Showing <strong>{totalItems > 0 ? startIndex + 1 : 0}</strong> to{' '}
                <strong>{endIndex}</strong> of <strong>{totalItems}</strong> matching users
              </div>

              <div style={styles.paginationControls}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    style={styles.pageSizeSelect}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage <= 1}
                  style={{
                    ...styles.pageBtn,
                    ...(safeCurrentPage <= 1 ? styles.pageBtnDisabled : {}),
                  }}
                  title="First Page"
                >
                  <ChevronsLeft size={16} />
                </button>

                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={safeCurrentPage <= 1}
                  style={{
                    ...styles.pageBtn,
                    ...(safeCurrentPage <= 1 ? styles.pageBtnDisabled : {}),
                  }}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                <span style={styles.pageNumberIndicator}>
                  Page <strong>{safeCurrentPage}</strong> of <strong>{totalPages}</strong>
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={safeCurrentPage >= totalPages}
                  style={{
                    ...styles.pageBtn,
                    ...(safeCurrentPage >= totalPages ? styles.pageBtnDisabled : {}),
                  }}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  style={{
                    ...styles.pageBtn,
                    ...(safeCurrentPage >= totalPages ? styles.pageBtnDisabled : {}),
                  }}
                  title="Last Page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </main>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-panel animate-scale-up">
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderTitle}>
                <UserPlus size={20} style={{ color: 'var(--accent-indigo)' }} />
                <h3>Add New System User</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <UserIcon size={14} /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Mail size={14} /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <KeyRound size={14} /> Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Shield size={14} /> Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={styles.formSelect}
                >
                  <option value="user">User (Normal User)</option>
                  <option value="admin">Admin (Administrator)</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="interviewer">Interviewer</option>
                </select>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  style={styles.submitBtn}
                >
                  {addingUser ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> Create User Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '440px' }} className="glass-panel animate-scale-up">
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderTitle}>
                <Trash2 size={20} style={{ color: 'var(--accent-rose)' }} />
                <h3 style={{ color: 'var(--accent-rose)' }}>Confirm Delete User</h3>
              </div>
              <button onClick={() => setUserToDelete(null)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 0', fontSize: '0.95rem', color: 'var(--text-body)' }}>
              Are you sure you want to permanently delete user{' '}
              <strong>{userToDelete.email}</strong> ({userToDelete.full_name})?
              <br />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                This action cannot be undone and will remove all associated user credentials.
              </span>
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingUser}
                style={styles.deleteConfirmBtn}
              >
                {deletingUser ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styling System
const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-main)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-sans)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 32px',
    backgroundColor: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-glass)',
    gap: '20px',
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    background: 'var(--bg-surface)',
    color: 'var(--text-body)',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  headerIconBadge: {
    width: '42px',
    height: '42px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent-indigo-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-title)',
    margin: 0,
    lineHeight: 1.2,
  },
  headerSubtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    margin: '2px 0 0 0',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    background: 'var(--bg-surface)',
    color: 'var(--text-body)',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 18px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--grad-primary)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-glow)',
  },
  mainContent: {
    flex: 1,
    padding: '32px',
    maxWidth: '1360px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  },
  metricCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    boxShadow: 'var(--shadow-premium)',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  metricLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  metricIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: 'var(--text-title)',
    lineHeight: 1,
    marginBottom: '6px',
  },
  metricSub: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 14px',
    flex: '1',
    minWidth: '280px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    width: '100%',
    fontSize: '0.88rem',
    color: 'var(--text-title)',
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
  },
  filterControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filterDropdownWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
  },
  filterSelect: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-body)',
    cursor: 'pointer',
  },
  tableCard: {
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '14px 20px',
    fontSize: '0.78rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    backgroundColor: 'rgba(248, 250, 252, 0.7)',
    borderBottom: '1px solid var(--border-glass)',
  },
  tr: {
    borderBottom: '1px solid var(--border-glass)',
    transition: 'var(--transition-smooth)',
  },
  td: {
    padding: '16px 20px',
    verticalAlign: 'middle',
    fontSize: '0.88rem',
  },
  userInfoCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarCircle: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-full)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.82rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userNameText: {
    fontWeight: 700,
    color: 'var(--text-title)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  selfBadge: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--accent-indigo)',
    background: 'var(--accent-indigo-glow)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  userEmailText: {
    color: 'var(--text-body)',
    fontWeight: 500,
  },
  roleSelectPill: {
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    fontWeight: 700,
    fontSize: '0.78rem',
    cursor: 'pointer',
    outline: 'none',
  },
  roleAdmin: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    color: '#7c3aed',
  },
  roleUser: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    color: '#4f46e5',
  },
  statusActiveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    color: '#059669',
    fontWeight: 600,
    fontSize: '0.78rem',
  },
  statusBlockedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    color: '#dc2626',
    fontWeight: 600,
    fontSize: '0.78rem',
  },
  actionButtonsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  actionBlockBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
    color: '#dc2626',
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  actionUnblockBtn: {
    backgroundColor: 'rgba(5, 150, 105, 0.06)',
    color: '#059669',
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  actionDeleteBtn: {
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    borderColor: 'var(--border-glass)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
  },

  // Modal styling
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '480px',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    boxShadow: 'var(--shadow-premium)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-glass)',
  },
  modalHeaderTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-title)',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-title)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  formInput: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    fontSize: '0.88rem',
    outline: 'none',
    backgroundColor: 'var(--bg-surface)',
  },
  formSelect: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    fontSize: '0.88rem',
    outline: 'none',
    backgroundColor: 'var(--bg-surface)',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
  cancelBtn: {
    padding: '9px 18px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    background: 'var(--bg-surface)',
    color: 'var(--text-body)',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 20px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--grad-primary)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  deleteConfirmBtn: {
    padding: '9px 20px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: 'var(--accent-rose)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  paginationBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    backgroundColor: 'rgba(248, 250, 252, 0.7)',
    borderTop: '1px solid var(--border-glass)',
    gap: '16px',
    flexWrap: 'wrap',
  },
  paginationInfo: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pageSizeSelect: {
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    fontSize: '0.82rem',
    fontWeight: 600,
    outline: 'none',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-body)',
    cursor: 'pointer',
  },
  pageBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    background: 'var(--bg-surface)',
    color: 'var(--text-body)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  pageBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  pageNumberIndicator: {
    fontSize: '0.84rem',
    color: 'var(--text-body)',
    padding: '0 8px',
  },
};

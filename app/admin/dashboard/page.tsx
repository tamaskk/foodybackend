'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  users: { total: number; last24h: number };
  recipes: { total: number; last24h: number };
  posts: { total: number; last24h: number };
  subscribers: { total: number; last24h: number };
}

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  subscriptionTier: string;
  subscriptionEndDate: string | null;
  isPrivate: boolean;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  body: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  user: { id: string; name: string; username: string } | null;
  createdAt: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  type: string;
  time: string;
  kcal: string;
  user: { id: string; name: string; username: string } | null;
  createdAt: string;
}

interface Notification {
  id: string;
  userId: string | null;
  user: { id: string; name: string; username: string } | null;
  title: string;
  message: string;
  type: string;
  sentBy: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type Tab = 'dashboard' | 'users' | 'posts' | 'recipes' | 'notifications';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Pagination states
  const [usersPagination, setUsersPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [postsPagination, setPostsPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [recipesPagination, setRecipesPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [notificationsPagination, setNotificationsPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState({ subscriptionTier: '', isPrivate: '' });
  const [postFilter, setPostFilter] = useState({ minLikes: '', minComments: '' });
  const [recipeFilter, setRecipeFilter] = useState({ type: '' });
  const [notificationFilter, setNotificationFilter] = useState({ type: '' });
  
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    userIds: [] as string[],
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadStats();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'posts') {
      loadPosts();
    } else if (activeTab === 'recipes') {
      loadRecipes();
    } else if (activeTab === 'notifications') {
      loadNotifications();
    }
  }, [activeTab, searchQuery, userFilter, postFilter, recipeFilter, notificationFilter, usersPagination.page, postsPagination.page, recipesPagination.page, notificationsPagination.page]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/users?search=${searchQuery}&page=${usersPagination.page}&limit=${usersPagination.limit}`;
      if (userFilter.subscriptionTier) url += `&subscriptionTier=${userFilter.subscriptionTier}`;
      if (userFilter.isPrivate) url += `&isPrivate=${userFilter.isPrivate}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setUsersPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/posts?search=${searchQuery}&page=${postsPagination.page}&limit=${postsPagination.limit}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        let filteredPosts = data.posts;
        
        // Client-side filtering for likes and comments
        if (postFilter.minLikes) {
          filteredPosts = filteredPosts.filter((p: Post) => p.likesCount >= parseInt(postFilter.minLikes));
        }
        if (postFilter.minComments) {
          filteredPosts = filteredPosts.filter((p: Post) => p.commentsCount >= parseInt(postFilter.minComments));
        }
        
        setPosts(filteredPosts);
        setPostsPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/recipes?search=${searchQuery}&page=${recipesPagination.page}&limit=${recipesPagination.limit}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        let filteredRecipes = data.recipes;
        
        // Client-side filtering for type
        if (recipeFilter.type) {
          filteredRecipes = filteredRecipes.filter((r: Recipe) => r.type.toLowerCase().includes(recipeFilter.type.toLowerCase()));
        }
        
        setRecipes(filteredRecipes);
        setRecipesPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/notifications?page=${notificationsPagination.page}&limit=${notificationsPagination.limit}`;
      if (notificationFilter.type) url += `&type=${notificationFilter.type}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setNotificationsPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const response = await fetch(`/api/admin/${type}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        alert(`${type} deleted successfully`);
        if (type === 'users') loadUsers();
        else if (type === 'posts') loadPosts();
        else if (type === 'recipes') loadRecipes();
        else if (type === 'notifications') loadNotifications();
      } else {
        alert(`Failed to delete ${type}`);
      }
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
      alert(`Error deleting ${type}`);
    }
  };

  const handleEdit = (type: string, item: any) => {
    setEditingItem({ type, ...item });
    setEditFormData({ ...item });
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    try {
      const response = await fetch(`/api/admin/${editingItem.type}/${editingItem.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        alert('Updated successfully');
        setEditingItem(null);
        setEditFormData({});
        if (editingItem.type === 'users') loadUsers();
        else if (editingItem.type === 'posts') loadPosts();
        else if (editingItem.type === 'recipes') loadRecipes();
      } else {
        alert('Failed to update');
      }
    } catch (error) {
      console.error('Failed to update:', error);
      alert('Error updating');
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      alert('Title and message are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(notificationForm),
      });

      if (response.ok) {
        alert('Notification sent successfully');
        setShowNotificationForm(false);
        setNotificationForm({
          title: '',
          message: '',
          type: 'info',
          targetType: 'all',
          userIds: [],
        });
        loadNotifications();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Error sending notification');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const changePage = (tab: Tab, newPage: number) => {
    if (tab === 'users') setUsersPagination(prev => ({ ...prev, page: newPage }));
    else if (tab === 'posts') setPostsPagination(prev => ({ ...prev, page: newPage }));
    else if (tab === 'recipes') setRecipesPagination(prev => ({ ...prev, page: newPage }));
    else if (tab === 'notifications') setNotificationsPagination(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setUserFilter({ subscriptionTier: '', isPrivate: '' });
    setPostFilter({ minLikes: '', minComments: '' });
    setRecipeFilter({ type: '' });
    setNotificationFilter({ type: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {(['dashboard', 'users', 'posts', 'recipes', 'notifications'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  clearFilters();
                }}
                className={`py-4 px-2 border-b-2 font-semibold text-sm ${
                  activeTab === tab
                    ? 'border-black text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard title="Total Users" total={stats.users.total} last24h={stats.users.last24h} icon="👥" />
              <StatsCard title="Subscribers" total={stats.subscribers.total} last24h={stats.subscribers.last24h} icon="💳" />
              <StatsCard title="Recipes" total={stats.recipes.total} last24h={stats.recipes.last24h} icon="🍽️" />
              <StatsCard title="Posts" total={stats.posts.total} last24h={stats.posts.last24h} icon="📝" />
            </div>
            
            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Growth Rate</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">User Growth</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.users.total > 0 ? ((stats.users.last24h / stats.users.total) * 100).toFixed(2) : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Subscriber Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.users.total > 0 ? ((stats.subscribers.total / stats.users.total) * 100).toFixed(2) : 0}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Content Stats</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Recipes per User</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.users.total > 0 ? (stats.recipes.total / stats.users.total).toFixed(1) : 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Posts per User</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.users.total > 0 ? (stats.posts.total / stats.users.total).toFixed(1) : 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Users</span>
                    <span className="text-lg font-bold text-gray-900">{stats.users.last24h}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Recipes</span>
                    <span className="text-lg font-bold text-gray-900">{stats.recipes.last24h}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Posts</span>
                    <span className="text-lg font-bold text-gray-900">{stats.posts.last24h}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters Bar */}
        {activeTab !== 'dashboard' && (
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-500"
              />
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Clear Filters
              </button>
            </div>
            
            {/* Users Filters */}
            {activeTab === 'users' && (
              <div className="flex gap-4">
                <select
                  value={userFilter.subscriptionTier}
                  onChange={(e) => setUserFilter({ ...userFilter, subscriptionTier: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900"
                >
                  <option value="">All Subscriptions</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
                <select
                  value={userFilter.isPrivate}
                  onChange={(e) => setUserFilter({ ...userFilter, isPrivate: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900"
                >
                  <option value="">All Privacy</option>
                  <option value="true">Private</option>
                  <option value="false">Public</option>
                </select>
              </div>
            )}
            
            {/* Posts Filters */}
            {activeTab === 'posts' && (
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Min Likes"
                  value={postFilter.minLikes}
                  onChange={(e) => setPostFilter({ ...postFilter, minLikes: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-500"
                />
                <input
                  type="number"
                  placeholder="Min Comments"
                  value={postFilter.minComments}
                  onChange={(e) => setPostFilter({ ...postFilter, minComments: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-500"
                />
              </div>
            )}
            
            {/* Recipes Filters */}
            {activeTab === 'recipes' && (
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Filter by type"
                  value={recipeFilter.type}
                  onChange={(e) => setRecipeFilter({ ...recipeFilter, type: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-500"
                />
              </div>
            )}
            
            {/* Notifications Filters */}
            {activeTab === 'notifications' && (
              <div className="flex gap-4 items-center">
                <select
                  value={notificationFilter.type}
                  onChange={(e) => setNotificationFilter({ ...notificationFilter, type: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900"
                >
                  <option value="">All Types</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
                <button
                  onClick={() => setShowNotificationForm(true)}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-semibold ml-auto"
                >
                  Send Notification
                </button>
              </div>
            )}
          </div>
        )}

        {/* Users Table with Pagination */}
        {activeTab === 'users' && (
          <>
            <UserTable users={users} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
            <Paginator pagination={usersPagination} onPageChange={(page) => changePage('users', page)} />
          </>
        )}

        {/* Posts Table with Pagination */}
        {activeTab === 'posts' && (
          <>
            <PostTable posts={posts} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
            <Paginator pagination={postsPagination} onPageChange={(page) => changePage('posts', page)} />
          </>
        )}

        {/* Recipes Table with Pagination */}
        {activeTab === 'recipes' && (
          <>
            <RecipeTable recipes={recipes} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
            <Paginator pagination={recipesPagination} onPageChange={(page) => changePage('recipes', page)} />
          </>
        )}

        {/* Notifications Table with Pagination */}
        {activeTab === 'notifications' && (
          <>
            <NotificationTable notifications={notifications} loading={loading} onDelete={handleDelete} />
            <Paginator pagination={notificationsPagination} onPageChange={(page) => changePage('notifications', page)} />
          </>
        )}
      </main>

      {/* Edit Modal */}
      {editingItem && (
        <EditModal
          item={editingItem}
          formData={editFormData}
          setFormData={setEditFormData}
          onClose={() => { setEditingItem(null); setEditFormData({}); }}
          onSave={handleUpdate}
        />
      )}

      {/* Send Notification Modal */}
      {showNotificationForm && (
        <NotificationFormModal
          form={notificationForm}
          setForm={setNotificationForm}
          onClose={() => setShowNotificationForm(false)}
          onSend={handleSendNotification}
        />
      )}
    </div>
  );
}

// Component: StatsCard
function StatsCard({ title, total, last24h, icon }: { title: string; total: number; last24h: number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-700 text-sm font-bold uppercase">{title}</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{total.toLocaleString()}</p>
          <p className="text-green-600 text-sm mt-2 font-semibold">
            +{last24h} in last 24h
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

// Component: Paginator
function Paginator({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
  let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
      <div className="text-sm text-gray-900">
        Showing <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
        <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
        <span className="font-semibold">{pagination.total}</span> results
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="px-3 py-1 border border-gray-300 rounded text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-semibold"
        >
          Previous
        </button>
        {startPage > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="px-3 py-1 border border-gray-300 rounded text-gray-900 hover:bg-gray-50">
              1
            </button>
            {startPage > 2 && <span className="px-2 text-gray-900">...</span>}
          </>
        )}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 border rounded font-semibold ${
              page === pagination.page
                ? 'bg-black text-white border-black'
                : 'border-gray-300 text-gray-900 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        {endPage < pagination.totalPages && (
          <>
            {endPage < pagination.totalPages - 1 && <span className="px-2 text-gray-900">...</span>}
            <button
              onClick={() => onPageChange(pagination.totalPages)}
              className="px-3 py-1 border border-gray-300 rounded text-gray-900 hover:bg-gray-50"
            >
              {pagination.totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="px-3 py-1 border border-gray-300 rounded text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-semibold"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Component: UserTable
function UserTable({ users, loading, onEdit, onDelete }: any) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Username</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Subscription</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Private</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-900">Loading...</td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-900">No users found</td>
            </tr>
          ) : (
            users.map((user: User) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    user.subscriptionTier === 'free' ? 'bg-gray-200 text-gray-800' : 'bg-green-200 text-green-800'
                  }`}>
                    {user.subscriptionTier}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg">{user.isPrivate ? '🔒' : '🌐'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onEdit('users', user)}
                    className="text-blue-600 hover:text-blue-900 mr-3 font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete('users', user.id)}
                    className="text-red-600 hover:text-red-900 font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Component: PostTable
function PostTable({ posts, loading, onEdit, onDelete }: any) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Likes</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Comments</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-900">Loading...</td>
            </tr>
          ) : posts.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-900">No posts found</td>
            </tr>
          ) : (
            posts.map((post: Post) => (
              <tr key={post.id}>
                <td className="px-6 py-4 text-gray-900 font-medium max-w-xs truncate">{post.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{post.user?.name || 'Unknown'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{post.likesCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{post.commentsCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onEdit('posts', post)}
                    className="text-blue-600 hover:text-blue-900 mr-3 font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete('posts', post.id)}
                    className="text-red-600 hover:text-red-900 font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Component: RecipeTable
function RecipeTable({ recipes, loading, onEdit, onDelete }: any) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Time</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-900">Loading...</td>
            </tr>
          ) : recipes.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-900">No recipes found</td>
            </tr>
          ) : (
            recipes.map((recipe: Recipe) => (
              <tr key={recipe.id}>
                <td className="px-6 py-4 text-gray-900 font-medium max-w-xs truncate">{recipe.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{recipe.user?.name || 'Unknown'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{recipe.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{recipe.time}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {new Date(recipe.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onEdit('recipes', recipe)}
                    className="text-blue-600 hover:text-blue-900 mr-3 font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete('recipes', recipe.id)}
                    className="text-red-600 hover:text-red-900 font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Component: NotificationTable
function NotificationTable({ notifications, loading, onDelete }: any) {
  const getTypeColor = (type: string) => {
    const colors: any = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[type] || colors.info;
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Message</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Target</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-900">Loading...</td>
            </tr>
          ) : notifications.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-900">No notifications found</td>
            </tr>
          ) : (
            notifications.map((notification: Notification) => (
              <tr key={notification.id}>
                <td className="px-6 py-4 text-gray-900 font-medium">{notification.title}</td>
                <td className="px-6 py-4 text-gray-900 max-w-xs truncate">{notification.message}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(notification.type)}`}>
                    {notification.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {notification.userId ? (notification.user?.name || 'Specific User') : 'All Users'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onDelete('notifications', notification.id)}
                    className="text-red-600 hover:text-red-900 font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Component: EditModal
function EditModal({ item, formData, setFormData, onClose, onSave }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Edit {item.type.slice(0, -1)}
        </h2>
        <div className="space-y-4">
          {item.type === 'users' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-900">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-900">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-900">Username</label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-900">Subscription Tier</label>
                <select
                  value={formData.subscriptionTier || 'free'}
                  onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="flex items-center text-gray-900">
                  <input
                    type="checkbox"
                    checked={formData.isPrivate || false}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="font-semibold">Private Account</span>
                </label>
              </div>
            </>
          )}
          {item.type === 'posts' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-900">Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-900">Body</label>
                <textarea
                  value={formData.body || ''}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                />
              </div>
            </>
          )}
          {item.type === 'recipes' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-900">Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-900">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-900">Type</label>
                <input
                  type="text"
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-900">Time</label>
                  <input
                    type="text"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-900">Calories</label>
                  <input
                    type="text"
                    value={formData.kcal || ''}
                    onChange={(e) => setFormData({ ...formData, kcal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-900 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Component: NotificationFormModal
function NotificationFormModal({ form, setForm, onClose, onSend }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Send Notification</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-900">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
              placeholder="Notification title"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-900">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
              placeholder="Notification message"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-900">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-900">Target</label>
              <select
                value={form.targetType}
                onChange={(e) => setForm({ ...form, targetType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
              >
                <option value="all">All Users</option>
                <option value="specific">Specific Users</option>
              </select>
            </div>
          </div>
          {form.targetType === 'specific' && (
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-900">User IDs (comma-separated)</label>
              <input
                type="text"
                value={form.userIds.join(',')}
                onChange={(e) => setForm({ ...form, userIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean) })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                placeholder="userId1, userId2, userId3"
              />
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-900 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 font-semibold"
          >
            Send Notification
          </button>
        </div>
      </div>
    </div>
  );
}

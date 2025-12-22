'use client';

import React, { useState, useEffect } from 'react';
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
  country?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  subscriptionTier: string;
  subscriptionEndDate: string | null;
  isPrivate: boolean;
  level?: number;
  xp?: number;
  followers?: number;
  following?: number;
  streak?: number;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  body: string;
  imageColor?: string;
  imageUrl?: string;
  isPoll?: boolean;
  pollOptions?: string[];
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  user: { id: string; name: string; username: string; avatarUrl?: string } | null;
  likedUsers?: Array<{
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  }>;
  comments?: Array<{
    id: string;
    text: string;
    likes: number;
    user: { id: string; name: string; username: string; avatarUrl?: string } | null;
    createdAt: string;
  }>;
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

  const handleEdit = async (type: string, item: any) => {
    // For posts, fetch full details including likedUsers
    if (type === 'posts') {
      try {
        const response = await fetch(`/api/admin/posts/${item.id}`, {
          headers: getAuthHeaders(),
        });
        
        if (response.ok) {
          const data = await response.json();
          setEditingItem({ type, ...data.post });
          setEditFormData({ ...data.post });
        } else {
          // Fallback to using the list data
          setEditingItem({ type, ...item });
          setEditFormData({ ...item });
        }
      } catch (error) {
        console.error('Failed to fetch post details:', error);
        // Fallback to using the list data
        setEditingItem({ type, ...item });
        setEditFormData({ ...item });
      }
    } else {
      setEditingItem({ type, ...item });
      setEditFormData({ ...item });
    }
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
            <UserTable 
              users={users} 
              loading={loading} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              editingItem={editingItem}
              editFormData={editFormData}
              setEditFormData={setEditFormData}
              onSave={handleUpdate}
              onCancelEdit={() => { setEditingItem(null); setEditFormData({}); }}
            />
            <Paginator pagination={usersPagination} onPageChange={(page) => changePage('users', page)} />
          </>
        )}

        {/* Posts Table with Pagination */}
        {activeTab === 'posts' && (
          <>
            <PostTable 
              posts={posts} 
              loading={loading} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              editingItem={editingItem}
              editFormData={editFormData}
              setEditFormData={setEditFormData}
              onSave={handleUpdate}
              onCancelEdit={() => { setEditingItem(null); setEditFormData({}); }}
            />
            <Paginator pagination={postsPagination} onPageChange={(page) => changePage('posts', page)} />
          </>
        )}

        {/* Recipes Table with Pagination */}
        {activeTab === 'recipes' && (
          <>
            <RecipeTable 
              recipes={recipes} 
              loading={loading} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              editingItem={editingItem}
              editFormData={editFormData}
              setEditFormData={setEditFormData}
              onSave={handleUpdate}
              onCancelEdit={() => { setEditingItem(null); setEditFormData({}); }}
            />
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
function UserTable({ users, loading, onEdit, onDelete, editingItem, editFormData, setEditFormData, onSave, onCancelEdit }: any) {
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
        <tbody className="bg-white">
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
              <React.Fragment key={user.id}>
                <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
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
                      {editingItem?.id === user.id ? '−' : 'Edit'}
                    </button>
                    <button
                      onClick={() => onDelete('users', user.id)}
                      className="text-red-600 hover:text-red-900 font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                
                {/* Expandable Edit Form */}
                {editingItem?.id === user.id && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <div className="bg-gray-50 border-t-2 border-blue-500 animate-expandDown">
                        <div className="px-8 py-6">
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Name</label>
                                <input
                                  type="text"
                                  value={editFormData.name || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                  placeholder="Enter name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Email</label>
                                <input
                                  type="email"
                                  value={editFormData.email || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                  placeholder="Enter email"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Username</label>
                                <input
                                  type="text"
                                  value={editFormData.username || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                  placeholder="Enter username"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Country</label>
                                <input
                                  type="text"
                                  value={editFormData.country || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                  placeholder="Enter country"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold mb-2 text-gray-900">Bio</label>
                              <textarea
                                value={editFormData.bio || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Enter bio"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold mb-2 text-gray-900">Avatar URL</label>
                              <input
                                type="url"
                                value={editFormData.avatarUrl || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, avatarUrl: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Enter avatar URL"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Subscription Tier</label>
                                <select
                                  value={editFormData.subscriptionTier || 'free'}
                                  onChange={(e) => setEditFormData({ ...editFormData, subscriptionTier: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                >
                                  <option value="free">Free</option>
                                  <option value="pro">Pro</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Level</label>
                                <input
                                  type="number"
                                  value={editFormData.level || 1}
                                  onChange={(e) => setEditFormData({ ...editFormData, level: parseInt(e.target.value) || 1 })}
                                  min="1"
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">XP</label>
                                <input
                                  type="number"
                                  value={editFormData.xp || 0}
                                  onChange={(e) => setEditFormData({ ...editFormData, xp: parseInt(e.target.value) || 0 })}
                                  min="0"
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Followers</label>
                                <input
                                  type="number"
                                  value={editFormData.followers || 0}
                                  onChange={(e) => setEditFormData({ ...editFormData, followers: parseInt(e.target.value) || 0 })}
                                  min="0"
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Following</label>
                                <input
                                  type="number"
                                  value={editFormData.following || 0}
                                  onChange={(e) => setEditFormData({ ...editFormData, following: parseInt(e.target.value) || 0 })}
                                  min="0"
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Streak</label>
                                <input
                                  type="number"
                                  value={editFormData.streak || 0}
                                  onChange={(e) => setEditFormData({ ...editFormData, streak: parseInt(e.target.value) || 0 })}
                                  min="0"
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                              </div>
                            </div>

                            <div className="flex items-center space-x-6 bg-white p-4 rounded-lg border border-gray-200">
                              <label className="flex items-center text-gray-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editFormData.isPrivate || false}
                                  onChange={(e) => setEditFormData({ ...editFormData, isPrivate: e.target.checked })}
                                  className="mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="font-semibold">Private Account</span>
                              </label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                              <button
                                onClick={onCancelEdit}
                                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 text-gray-900 font-semibold transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={onSave}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition shadow-lg hover:shadow-xl"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
      
      <style jsx>{`
        @keyframes expandDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 2000px;
            transform: translateY(0);
          }
        }
        .animate-expandDown {
          animation: expandDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}

// Component: PostTable
function PostTable({ posts, loading, onEdit, onDelete, editingItem, editFormData, setEditFormData, onSave, onCancelEdit }: any) {
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
        <tbody className="bg-white">
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
              <React.Fragment key={post.id}>
                <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
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
                      {editingItem?.id === post.id ? '−' : 'Edit'}
                    </button>
                    <button
                      onClick={() => onDelete('posts', post.id)}
                      className="text-red-600 hover:text-red-900 font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                
                {/* Expandable Edit Form */}
                {editingItem?.id === post.id && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <div className="bg-gray-50 border-t-2 border-blue-500 animate-expandDown">
                        <div className="px-8 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left side - Edit Form */}
                            <div className="space-y-6">
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Post Content</label>
                                <textarea
                                  value={editFormData.title || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                  rows={4}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                  placeholder="Enter post content"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold mb-2 text-gray-900">Image Color</label>
                                  <input
                                    type="color"
                                    value={editFormData.imageColor || '#FFF3D0'}
                                    onChange={(e) => setEditFormData({ ...editFormData, imageColor: e.target.value })}
                                    className="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold mb-2 text-gray-900">Image URL</label>
                                  <input
                                    type="url"
                                    value={editFormData.imageUrl || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="Enter image URL"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center space-x-6 bg-white p-4 rounded-lg border border-gray-200">
                                  <label className="flex items-center text-gray-900 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={editFormData.isPoll || false}
                                      onChange={(e) => setEditFormData({ ...editFormData, isPoll: e.target.checked })}
                                      className="mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="font-semibold">Is Poll</span>
                                  </label>
                                </div>
                              </div>

                              {editFormData.isPoll && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-gray-900">Poll Options</label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const pollOptions = editFormData.pollOptions || [];
                                        setEditFormData({ 
                                          ...editFormData, 
                                          pollOptions: [...pollOptions, '']
                                        });
                                      }}
                                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-semibold transition"
                                    >
                                      + Add Option
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {(editFormData.pollOptions || []).map((option: string, index: number) => (
                                      <div key={index} className="flex gap-2">
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => {
                                            const newOptions = [...(editFormData.pollOptions || [])];
                                            newOptions[index] = e.target.value;
                                            setEditFormData({ ...editFormData, pollOptions: newOptions });
                                          }}
                                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                          placeholder={`Option ${index + 1}`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newOptions = (editFormData.pollOptions || []).filter((_: any, i: number) => i !== index);
                                            setEditFormData({ ...editFormData, pollOptions: newOptions });
                                          }}
                                          className="px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right side - Preview */}
                            <div>
                              <h3 className="text-lg font-bold mb-4 text-gray-900">Post Preview</h3>
                              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                                {/* Post Header */}
                                <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                    {editingItem?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900">{editingItem?.user?.name || 'Unknown User'}</p>
                                    <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
                                  </div>
                                </div>

                                {/* Post Content */}
                                <div className="p-4">
                                  <p className="text-gray-900 whitespace-pre-wrap">{editFormData.title || 'No content'}</p>
                                </div>

                                {/* Post Image */}
                                {(editFormData.imageUrl || editFormData.imageColor) && (
                                  <div 
                                    className="w-full h-48 flex items-center justify-center"
                                    style={{ 
                                      backgroundColor: editFormData.imageUrl ? 'transparent' : (editFormData.imageColor || '#FFF3D0'),
                                      backgroundImage: editFormData.imageUrl ? `url(${editFormData.imageUrl})` : 'none',
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center'
                                    }}
                                  >
                                    {!editFormData.imageUrl && (
                                      <span className="text-gray-400 text-sm">Image Preview</span>
                                    )}
                                  </div>
                                )}

                                {/* Poll Preview */}
                                {editFormData.isPoll && (editFormData.pollOptions || []).length > 0 && (
                                  <div className="p-4 space-y-2">
                                    {(editFormData.pollOptions || []).map((option: string, index: number) => (
                                      <div key={index} className="border-2 border-gray-300 rounded-lg p-3 text-gray-700 font-medium">
                                        {option || `Option ${index + 1}`}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Post Stats */}
                                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                                  <span>❤️ {editingItem?.likesCount || 0} likes</span>
                                  <span>💬 {editingItem?.commentsCount || 0} comments</span>
                                </div>

                                {/* Liked Users Preview */}
                                {editingItem?.likedUsers && editingItem.likedUsers.length > 0 && (
                                  <div className="border-t border-gray-100">
                                    <div className="p-4 space-y-3">
                                      <p className="font-semibold text-gray-900">Liked by ({editingItem.likedUsers.length})</p>
                                      <div className="flex flex-wrap gap-2">
                                        {editingItem.likedUsers.map((user: any) => (
                                          <div key={user.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
                                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <span className="text-sm text-gray-900 font-medium">{user.name}</span>
                                            <span className="text-xs text-gray-500">@{user.username}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Comments Preview */}
                                {editingItem?.comments && editingItem.comments.length > 0 && (
                                  <div className="border-t border-gray-100 max-h-60 overflow-y-auto">
                                    <div className="p-4 space-y-3">
                                      <p className="font-semibold text-gray-900">Comments ({editingItem.comments.length})</p>
                                      {editingItem.comments.map((comment: any, index: number) => (
                                        <div key={index} className="flex gap-2 border-l-2 border-blue-200 pl-3">
                                          <div className="flex-1">
                                            <p className="font-semibold text-sm text-gray-900">{comment.user?.name || 'User'}</p>
                                            <p className="text-sm text-gray-700">{comment.text}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                              ❤️ {comment.likes || 0} · {new Date(comment.createdAt).toLocaleDateString()}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                            <button
                              onClick={onCancelEdit}
                              className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 text-gray-900 font-semibold transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={onSave}
                              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition shadow-lg hover:shadow-xl"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
      
      <style jsx>{`
        @keyframes expandDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 2000px;
            transform: translateY(0);
          }
        }
        .animate-expandDown {
          animation: expandDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}

// Component: RecipeTable
function RecipeTable({ recipes, loading, onEdit, onDelete, editingItem, editFormData, setEditFormData, onSave, onCancelEdit }: any) {
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
        <tbody className="bg-white">
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
              <React.Fragment key={recipe.id}>
                <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
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
                      {editingItem?.id === recipe.id ? '−' : 'Edit'}
                    </button>
                    <button
                      onClick={() => onDelete('recipes', recipe.id)}
                      className="text-red-600 hover:text-red-900 font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                
                {/* Expandable Edit Form */}
                {editingItem?.id === recipe.id && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <div className="bg-gray-50 border-t-2 border-blue-500 animate-expandDown">
                        <div className="px-8 py-6">
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Title</label>
                                <input
                                  type="text"
                                  value={editFormData.title || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                  placeholder="Enter title"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Recipe Code</label>
                                <input
                                  type="text"
                                  value={editFormData.code || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                  placeholder="5-digit code"
                                  maxLength={5}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold mb-2 text-gray-900">Description</label>
                              <textarea
                                value={editFormData.description || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Enter description"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Type</label>
                                <select
                                  value={editFormData.type || 'breakfast'}
                                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                >
                                  <option value="breakfast">Breakfast</option>
                                  <option value="lunch">Lunch</option>
                                  <option value="dinner">Dinner</option>
                                  <option value="snack">Snack</option>
                                  <option value="drink">Drink</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Time</label>
                                <input
                                  type="text"
                                  value={editFormData.time || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                  placeholder="e.g., 30 min"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Calories</label>
                                <input
                                  type="text"
                                  value={editFormData.kcal || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, kcal: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                  placeholder="e.g., 350 kcal"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Picture Type</label>
                                <select
                                  value={editFormData.picture?.type || 'emoji'}
                                  onChange={(e) => setEditFormData({ 
                                    ...editFormData, 
                                    picture: { ...editFormData.picture, type: e.target.value }
                                  })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                >
                                  <option value="emoji">Emoji</option>
                                  <option value="color">Color</option>
                                  <option value="image">Image</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-900">Picture Value</label>
                                <input
                                  type="text"
                                  value={editFormData.picture?.value || ''}
                                  onChange={(e) => setEditFormData({ 
                                    ...editFormData, 
                                    picture: { ...editFormData.picture, value: e.target.value }
                                  })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                  placeholder="Emoji, color code, or URL"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold mb-2 text-gray-900">Image URL</label>
                              <input
                                type="url"
                                value={editFormData.image || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, image: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Enter image URL"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-900">Ingredients</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ingredients = editFormData.ingredients || [];
                                    setEditFormData({ 
                                      ...editFormData, 
                                      ingredients: [...ingredients, '']
                                    });
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-semibold transition"
                                >
                                  + Add Ingredient
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(editFormData.ingredients || []).map((ingredient: string, index: number) => (
                                  <div key={index} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={ingredient}
                                      onChange={(e) => {
                                        const newIngredients = [...(editFormData.ingredients || [])];
                                        newIngredients[index] = e.target.value;
                                        setEditFormData({ ...editFormData, ingredients: newIngredients });
                                      }}
                                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                      placeholder={`Ingredient ${index + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newIngredients = (editFormData.ingredients || []).filter((_: any, i: number) => i !== index);
                                        setEditFormData({ ...editFormData, ingredients: newIngredients });
                                      }}
                                      className="px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                {(!editFormData.ingredients || editFormData.ingredients.length === 0) && (
                                  <p className="text-gray-500 text-sm italic">No ingredients added yet. Click "Add Ingredient" to start.</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-900">Steps</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const steps = editFormData.steps || [];
                                    setEditFormData({ 
                                      ...editFormData, 
                                      steps: [...steps, '']
                                    });
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-semibold transition"
                                >
                                  + Add Step
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(editFormData.steps || []).map((step: string, index: number) => (
                                  <div key={index} className="flex gap-2">
                                    <div className="flex items-center justify-center w-8 h-10 bg-blue-100 text-blue-800 rounded-lg font-bold text-sm">
                                      {index + 1}
                                    </div>
                                    <textarea
                                      value={step}
                                      onChange={(e) => {
                                        const newSteps = [...(editFormData.steps || [])];
                                        newSteps[index] = e.target.value;
                                        setEditFormData({ ...editFormData, steps: newSteps });
                                      }}
                                      rows={2}
                                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                                      placeholder={`Step ${index + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSteps = (editFormData.steps || []).filter((_: any, i: number) => i !== index);
                                        setEditFormData({ ...editFormData, steps: newSteps });
                                      }}
                                      className="px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition self-start"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                {(!editFormData.steps || editFormData.steps.length === 0) && (
                                  <p className="text-gray-500 text-sm italic">No steps added yet. Click "Add Step" to start.</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-900">Links</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const links = editFormData.links || [];
                                    setEditFormData({ 
                                      ...editFormData, 
                                      links: [...links, '']
                                    });
                                  }}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-semibold transition"
                                >
                                  + Add Link
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(editFormData.links || []).map((link: string, index: number) => (
                                  <div key={index} className="flex gap-2">
                                    <input
                                      type="url"
                                      value={link}
                                      onChange={(e) => {
                                        const newLinks = [...(editFormData.links || [])];
                                        newLinks[index] = e.target.value;
                                        setEditFormData({ ...editFormData, links: newLinks });
                                      }}
                                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                      placeholder={`Link ${index + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newLinks = (editFormData.links || []).filter((_: any, i: number) => i !== index);
                                        setEditFormData({ ...editFormData, links: newLinks });
                                      }}
                                      className="px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                {(!editFormData.links || editFormData.links.length === 0) && (
                                  <p className="text-gray-500 text-sm italic">No links added yet. Click "Add Link" to start.</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-6 bg-white p-4 rounded-lg border border-gray-200">
                              <label className="flex items-center text-gray-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editFormData.owning !== false}
                                  onChange={(e) => setEditFormData({ ...editFormData, owning: e.target.checked })}
                                  className="mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="font-semibold">Owning Recipe</span>
                              </label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                              <button
                                onClick={onCancelEdit}
                                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 text-gray-900 font-semibold transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={onSave}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition shadow-lg hover:shadow-xl"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
      
      <style jsx>{`
        @keyframes expandDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 2000px;
            transform: translateY(0);
          }
        }
        .animate-expandDown {
          animation: expandDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
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

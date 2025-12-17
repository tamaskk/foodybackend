# Admin Panel Setup Guide

## Environment Variables

Add these variables to your `.env` file in the `apps/backend` directory:

```env
# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password-here
```

**Important**: 
- Replace `admin@example.com` with your actual admin email
- Replace `your-secure-password-here` with a strong, secure password
- Never commit the `.env` file to version control

## Accessing the Admin Panel

1. **Login Page**: Navigate to `/admin/login`
   - URL: `http://localhost:3000/admin/login`

2. **Dashboard**: After successful login, you'll be redirected to `/admin/dashboard`
   - URL: `http://localhost:3000/admin/dashboard`

## Features

### Dashboard Tab
- **Overview Statistics**:
  - Total users (all time & last 24 hours)
  - Total subscribers (all time & last 24 hours)
  - Total recipes (all time & last 24 hours)
  - Total posts (all time & last 24 hours)

### Users Tab
- View all users with pagination
- Search users by name, email, or username
- Edit user details (name, email, username, subscription tier, privacy)
- Delete users
- View subscription status

### Posts Tab
- View all social media posts with pagination
- Search posts by title or body
- Edit post content (title, body)
- Delete posts
- View likes, comments, and saves count

### Recipes Tab
- View all recipes with pagination
- Search recipes by title or description
- Edit recipe details (title, description, type, time, calories)
- Delete recipes
- View recipe author

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login

### Dashboard
- `GET /api/admin/stats` - Get dashboard statistics

### Users Management
- `GET /api/admin/users?search=&page=1&limit=50` - List users
- `GET /api/admin/users/[id]` - Get single user
- `PATCH /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Posts Management
- `GET /api/admin/posts?search=&page=1&limit=50` - List posts
- `GET /api/admin/posts/[id]` - Get single post
- `PATCH /api/admin/posts/[id]` - Update post
- `DELETE /api/admin/posts/[id]` - Delete post

### Recipes Management
- `GET /api/admin/recipes?search=&page=1&limit=50` - List recipes
- `GET /api/admin/recipes/[id]` - Get single recipe
- `PATCH /api/admin/recipes/[id]` - Update recipe
- `DELETE /api/admin/recipes/[id]` - Delete recipe

## Security Notes

1. The admin token is stored in `localStorage` after login
2. All admin API endpoints require the admin token in the Authorization header
3. Admin credentials are verified against environment variables
4. Use strong passwords and keep your `.env` file secure
5. Consider implementing additional security measures for production:
   - Rate limiting
   - IP whitelisting
   - Two-factor authentication
   - Audit logging

## Example Usage

### Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

### Get Stats
```bash
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Update User
```bash
curl -X PATCH http://localhost:3000/api/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subscriptionTier":"pro"}'
```

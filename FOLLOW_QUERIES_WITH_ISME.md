# Follow Queries with isMe Field

## Updated GraphQL Schema

```graphql
type UserSummaryDto {
  id: Int!
  username: String!
  fullname: String!
  image: String
  isFollowedByMe: Boolean!
  isMe: Boolean!  # ✅ NEW: Whether this user is the authenticated viewer
}

type PageInfoDto {
  nextCursor: Int
  hasNext: Boolean!
}

type FollowerListDto {
  users: [UserSummaryDto!]!
  pageInfo: PageInfoDto!
}

type FollowingListDto {
  users: [UserSummaryDto!]!
  pageInfo: PageInfoDto!
}
```

---

## 1. Followers Query with isMe

```graphql
query Followers($userId: Int!, $cursor: Int, $limit: Int) {
  followers(userId: $userId, cursor: $cursor, limit: $limit) {
    users {
      id
      username
      fullname
      image
      isFollowedByMe
      isMe          # ✅ Use this to hide follow button
    }
    pageInfo {
      nextCursor
      hasNext
    }
  }
}
```

**Query Variables:**
```json
{
  "userId": 123,
  "cursor": null,
  "limit": 20
}
```

**Example Response:**
```json
{
  "data": {
    "followers": {
      "users": [
        {
          "id": 45,
          "username": "john_chef",
          "fullname": "John Doe",
          "image": "https://example.com/john.jpg",
          "isFollowedByMe": true,
          "isMe": false
        },
        {
          "id": 123,
          "username": "me",
          "fullname": "Current User",
          "image": "https://example.com/me.jpg",
          "isFollowedByMe": false,
          "isMe": true    // ✅ This is the authenticated user!
        },
        {
          "id": 67,
          "username": "chef_sarah",
          "fullname": "Sarah Smith",
          "image": "https://example.com/sarah.jpg",
          "isFollowedByMe": false,
          "isMe": false
        }
      ],
      "pageInfo": {
        "nextCursor": 456789,
        "hasNext": true
      }
    }
  }
}
```

---

## 2. Following Query with isMe

```graphql
query Following($userId: Int!, $cursor: Int, $limit: Int) {
  following(userId: $userId, cursor: $cursor, limit: $limit) {
    users {
      id
      username
      fullname
      image
      isFollowedByMe
      isMe          # ✅ Use this to hide follow button
    }
    pageInfo {
      nextCursor
      hasNext
    }
  }
}
```

**Query Variables:**
```json
{
  "userId": 123,
  "cursor": null,
  "limit": 20
}
```

**Example Response:**
```json
{
  "data": {
    "following": {
      "users": [
        {
          "id": 89,
          "username": "master_chef",
          "fullname": "Gordon Ramsay",
          "image": "https://example.com/gordon.jpg",
          "isFollowedByMe": true,
          "isMe": false
        },
        {
          "id": 123,
          "username": "me",
          "fullname": "Current User",
          "image": "https://example.com/me.jpg",
          "isFollowedByMe": false,
          "isMe": true    // ✅ This is the authenticated user!
        }
      ],
      "pageInfo": {
        "nextCursor": 789012,
        "hasNext": true
      }
    }
  }
}
```

---

## Frontend Implementation

### React/TypeScript with isMe Handling

```typescript
import { gql, useQuery } from '@apollo/client';

const GET_FOLLOWERS = gql`
  query GetFollowers($userId: Int!, $cursor: Int, $limit: Int) {
    followers(userId: $userId, cursor: $cursor, limit: $limit) {
      users {
        id
        username
        fullname
        image
        isFollowedByMe
        isMe
      }
      pageInfo {
        nextCursor
        hasNext
      }
    }
  }
`;

interface UserSummary {
  id: number;
  username: string;
  fullname: string;
  image?: string;
  isFollowedByMe: boolean;
  isMe: boolean;
}

interface PageInfo {
  nextCursor?: number;
  hasNext: boolean;
}

interface FollowersData {
  followers: {
    users: UserSummary[];
    pageInfo: PageInfo;
  };
}

// ============================================================================
// User Card Component with isMe Logic
// ============================================================================

function UserCard({ user }: { user: UserSummary }) {
  return (
    <div className={`user-card ${user.isMe ? 'is-me' : ''}`}>
      <img 
        src={user.image || '/default-avatar.png'} 
        alt={user.username}
        className="user-avatar"
      />
      
      <div className="user-info">
        <div className="username-row">
          <h3>{user.fullname}</h3>
          {user.isMe && <span className="you-badge">You</span>}
        </div>
        <p>@{user.username}</p>
      </div>
      
      {/* ✅ Hide follow button if this is the current user */}
      {!user.isMe && (
        <div className="action-buttons">
          {user.isFollowedByMe ? (
            <button className="btn-following">Following</button>
          ) : (
            <button className="btn-follow">Follow</button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Followers List Component
// ============================================================================

function FollowersList({ userId }: { userId: number }) {
  const { loading, error, data, fetchMore } = useQuery<FollowersData>(
    GET_FOLLOWERS,
    {
      variables: { userId, cursor: null, limit: 20 },
      context: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    }
  );

  const loadMore = async () => {
    if (!data?.followers.pageInfo.hasNext) return;

    await fetchMore({
      variables: {
        cursor: data.followers.pageInfo.nextCursor
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          followers: {
            ...fetchMoreResult.followers,
            users: [
              ...prev.followers.users,
              ...fetchMoreResult.followers.users
            ]
          }
        };
      }
    });
  };

  if (loading) return <div>Loading followers...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="followers-list">
      <h2>Followers ({data?.followers.users.length})</h2>
      
      <div className="users-grid">
        {data?.followers.users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {data?.followers.pageInfo.hasNext && (
        <button onClick={loadMore} className="btn-load-more">
          Load More
        </button>
      )}
    </div>
  );
}

export default FollowersList;
```

---

## CSS Styling

```css
.user-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-card:hover {
  background-color: #f5f5f5;
}

.user-card.is-me {
  background-color: #f0f8ff;
  border: 1px solid #e0f0ff;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.username-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username-row h3 {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.you-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #e0e0e0;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #666;
}

.user-info p {
  font-size: 14px;
  color: #8e8e8e;
  margin: 2px 0 0 0;
}

.action-buttons {
  flex-shrink: 0;
}

.btn-follow,
.btn-following {
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-follow {
  background: #0095f6;
  color: white;
}

.btn-follow:hover {
  background: #0081d6;
}

.btn-following {
  background: #efefef;
  color: #262626;
}

.btn-following:hover {
  background: #dbdbdb;
}
```

---

## Alternative: Instagram-Style Layout

```typescript
function InstagramUserCard({ user }: { user: UserSummary }) {
  return (
    <div className="ig-user-item">
      <div className="ig-user-avatar">
        <img 
          src={user.image || '/default-avatar.png'} 
          alt={user.username}
        />
      </div>
      
      <div className="ig-user-info">
        <div className="ig-username">
          {user.username}
          {user.isMe && <span className="ig-you-tag">• You</span>}
        </div>
        <div className="ig-fullname">{user.fullname}</div>
      </div>
      
      {!user.isMe && (
        <button className={user.isFollowedByMe ? 'ig-btn-following' : 'ig-btn-follow'}>
          {user.isFollowedByMe ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}
```

**Instagram CSS:**
```css
.ig-user-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 12px;
}

.ig-user-avatar img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.ig-user-info {
  flex: 1;
  min-width: 0;
}

.ig-username {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ig-you-tag {
  font-size: 12px;
  font-weight: 400;
  color: #8e8e8e;
}

.ig-fullname {
  font-size: 14px;
  color: #8e8e8e;
  margin-top: 2px;
}

.ig-btn-follow,
.ig-btn-following {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.ig-btn-follow {
  background: #0095f6;
  color: white;
}

.ig-btn-following {
  background: #efefef;
  color: #262626;
}
```

---

## Use Cases

### 1. Hide Follow Button for Self

```typescript
{!user.isMe && (
  <button className="btn-follow">Follow</button>
)}
```

### 2. Show "You" Badge Instead

```typescript
{user.isMe ? (
  <span className="you-badge">You</span>
) : (
  <button className="btn-follow">Follow</button>
)}
```

### 3. Filter Out Self from List

```typescript
const followers = data?.followers.users.filter(user => !user.isMe) || [];
```

### 4. Different Styling for Self

```typescript
<div className={`user-card ${user.isMe ? 'highlighted' : ''}`}>
  {/* ... */}
</div>
```

---

## Testing in GraphQL Playground

**1. Open Playground:**
```
http://localhost:8080/graphql
```

**2. Set Authorization Header:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**3. Test Query:**
```graphql
query {
  followers(userId: 1, limit: 10) {
    users {
      id
      username
      fullname
      isFollowedByMe
      isMe
    }
    pageInfo {
      nextCursor
      hasNext
    }
  }
}
```

**Expected Result:**
- Users where `isMe: true` should be the authenticated user from JWT
- Users where `isMe: false` are other users

---

## Summary

✅ **Added `isMe` field to:**
- `UserSummaryDto` (GraphQL DTO)
- `UserSummary` (gRPC interface)
- `mapUserSummaryDto()` mapping method

✅ **Frontend can now:**
- Hide follow/following buttons when `isMe === true`
- Show "You" badge for current user
- Apply different styling to own profile
- Filter out self from lists if needed

✅ **No Breaking Changes:**
- Field is additive only
- Existing queries continue to work
- New field is always included in response

Perfect for Instagram-style follower/following lists! 🚀

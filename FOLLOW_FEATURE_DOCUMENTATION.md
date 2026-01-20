# Follow Feature Documentation

## Overview
Follow feature terintegrasi dengan engagement service melalui gRPC untuk mengelola social graph (followers & following). Module ini menyediakan GraphQL queries untuk listing followers dan following dengan cursor-based pagination.

## Architecture
- **gRPC Service**: `engagement-service:50051`
- **Package**: `engagement.FollowService`
- **Proto File**: `proto/engagement.proto`
- **Module**: `UserModule` (integrated in user module)
- **Authentication**: JWT-based (required)

---

## GraphQL API

### 1. List Followers Query

Get list of users who follow the target user.

```graphql
query Followers($userId: Int!, $cursor: Int, $limit: Int) {
  followers(userId: $userId, cursor: $cursor, limit: $limit) {
    users {
      id
      username
      fullname
      image
      isFollowedByMe
    }
    pageInfo {
      nextCursor
      hasNext
    }
  }
}
```

**Variables (First Page):**
```json
{
  "userId": 123,
  "cursor": null,
  "limit": 20
}
```

**Variables (Next Page):**
```json
{
  "userId": 123,
  "cursor": 456789,
  "limit": 20
}
```

**Response Example:**
```json
{
  "data": {
    "followers": {
      "users": [
        {
          "id": 45,
          "username": "john_chef",
          "fullname": "John Doe",
          "image": "https://example.com/avatar.jpg",
          "isFollowedByMe": true
        },
        {
          "id": 67,
          "username": "chef_sarah",
          "fullname": "Sarah Smith",
          "image": "https://example.com/avatar2.jpg",
          "isFollowedByMe": false
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

### 2. List Following Query

Get list of users that the target user follows.

```graphql
query Following($userId: Int!, $cursor: Int, $limit: Int) {
  following(userId: $userId, cursor: $cursor, limit: $limit) {
    users {
      id
      username
      fullname
      image
      isFollowedByMe
    }
    pageInfo {
      nextCursor
      hasNext
    }
  }
}
```

**Variables (First Page):**
```json
{
  "userId": 123,
  "cursor": null,
  "limit": 20
}
```

**Variables (Next Page):**
```json
{
  "userId": 123,
  "cursor": 789012,
  "limit": 20
}
```

**Response Example:**
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
          "isFollowedByMe": true
        },
        {
          "id": 101,
          "username": "pastry_queen",
          "fullname": "Julia Child",
          "image": null,
          "isFollowedByMe": false
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

## Frontend Implementation Examples

### React/TypeScript Implementation

```typescript
import { gql, useQuery } from '@apollo/client';
import { useState } from 'react';

// ============================================================================
// GraphQL Queries
// ============================================================================

const FOLLOWERS_QUERY = gql`
  query Followers($userId: Int!, $cursor: Int, $limit: Int) {
    followers(userId: $userId, cursor: $cursor, limit: $limit) {
      users {
        id
        username
        fullname
        image
        isFollowedByMe
      }
      pageInfo {
        nextCursor
        hasNext
      }
    }
  }
`;

const FOLLOWING_QUERY = gql`
  query Following($userId: Int!, $cursor: Int, $limit: Int) {
    following(userId: $userId, cursor: $cursor, limit: $limit) {
      users {
        id
        username
        fullname
        image
        isFollowedByMe
      }
      pageInfo {
        nextCursor
        hasNext
      }
    }
  }
`;

// ============================================================================
// Followers Component
// ============================================================================

interface UserSummary {
  id: number;
  username: string;
  fullname: string;
  image?: string;
  isFollowedByMe: boolean;
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

function FollowersListComponent({ userId }: { userId: number }) {
  const { data, loading, error, fetchMore } = useQuery<FollowersData>(
    FOLLOWERS_QUERY,
    {
      variables: {
        userId,
        limit: 20,
      },
      context: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      },
    }
  );

  const loadMore = async () => {
    if (!data?.followers?.pageInfo?.hasNext) return;

    await fetchMore({
      variables: {
        cursor: data.followers.pageInfo.nextCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          followers: {
            ...fetchMoreResult.followers,
            users: [
              ...prev.followers.users,
              ...fetchMoreResult.followers.users,
            ],
          },
        };
      },
    });
  };

  if (loading) return <div>Loading followers...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="followers-list">
      <h2>Followers</h2>
      
      {data?.followers.users.map((user) => (
        <div key={user.id} className="user-card">
          <img
            src={user.image || '/default-avatar.png'}
            alt={user.username}
            className="avatar"
          />
          <div className="user-info">
            <h3>{user.fullname}</h3>
            <p>@{user.username}</p>
          </div>
          <button
            className={user.isFollowedByMe ? 'following' : 'follow'}
          >
            {user.isFollowedByMe ? 'Following' : 'Follow'}
          </button>
        </div>
      ))}

      {data?.followers.pageInfo.hasNext && (
        <button onClick={loadMore} className="load-more">
          Load More
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Following Component
// ============================================================================

interface FollowingData {
  following: {
    users: UserSummary[];
    pageInfo: PageInfo;
  };
}

function FollowingListComponent({ userId }: { userId: number }) {
  const { data, loading, error, fetchMore } = useQuery<FollowingData>(
    FOLLOWING_QUERY,
    {
      variables: {
        userId,
        limit: 20,
      },
      context: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      },
    }
  );

  const loadMore = async () => {
    if (!data?.following?.pageInfo?.hasNext) return;

    await fetchMore({
      variables: {
        cursor: data.following.pageInfo.nextCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          following: {
            ...fetchMoreResult.following,
            users: [
              ...prev.following.users,
              ...fetchMoreResult.following.users,
            ],
          },
        };
      },
    });
  };

  if (loading) return <div>Loading following...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="following-list">
      <h2>Following</h2>
      
      {data?.following.users.map((user) => (
        <div key={user.id} className="user-card">
          <img
            src={user.image || '/default-avatar.png'}
            alt={user.username}
            className="avatar"
          />
          <div className="user-info">
            <h3>{user.fullname}</h3>
            <p>@{user.username}</p>
          </div>
          <button
            className={user.isFollowedByMe ? 'following' : 'follow'}
          >
            {user.isFollowedByMe ? 'Following' : 'Follow'}
          </button>
        </div>
      ))}

      {data?.following.pageInfo.hasNext && (
        <button onClick={loadMore} className="load-more">
          Load More
        </button>
      )}
    </div>
  );
}

export { FollowersListComponent, FollowingListComponent };
```

---

### Custom Hooks

```typescript
import { useQuery } from '@apollo/client';

// Custom hook for followers
export function useFollowers(userId: number, limit: number = 20) {
  return useQuery(FOLLOWERS_QUERY, {
    variables: { userId, limit },
    context: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    },
    skip: !userId,
  });
}

// Custom hook for following
export function useFollowing(userId: number, limit: number = 20) {
  return useQuery(FOLLOWING_QUERY, {
    variables: { userId, limit },
    context: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    },
    skip: !userId,
  });
}

// Usage in component
function UserProfilePage({ userId }: { userId: number }) {
  const { data: followersData, loading: followersLoading } = useFollowers(userId);
  const { data: followingData, loading: followingLoading } = useFollowing(userId);

  // ... render logic
}
```

---

## Implementation Details

### File Structure
```
src/modules/user/
├── user.module.ts              # Module with FollowService integration
├── follow.service.ts           # Business logic & gRPC communication
├── follow.resolver.ts          # GraphQL resolvers
├── dto/
│   └── follow.dto.ts          # GraphQL DTOs
└── grpc/
    ├── follow.interface.ts    # gRPC TypeScript interfaces
    └── engagement-service.module.ts  # gRPC client (reused)
```

### Key Features

1. **Viewer Context**
   - `viewer_id` automatically extracted from JWT token
   - Used to determine `isFollowedByMe` flag for each user
   - No need to send viewer ID from frontend

2. **Cursor-based Pagination**
   - ID-based cursor (user_follows.id)
   - More efficient than offset-based pagination
   - Consistent results even with data changes

3. **Data Mapping**
   - snake_case (gRPC) ↔ camelCase (GraphQL)
   - `is_followed_by_me` → `isFollowedByMe`
   - Proper null handling for optional fields

4. **Error Handling**
   - All errors wrapped in GraphQLError
   - Proper error messages from gRPC service

---

## Parameters

### Query: `followers`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | Int | ✅ Yes | - | Target user whose followers to retrieve |
| `cursor` | Int | ❌ No | null | Pagination cursor (user_follows.id) |
| `limit` | Int | ❌ No | 20 | Max results per page (max 100) |

### Query: `following`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | Int | ✅ Yes | - | Target user whose following to retrieve |
| `cursor` | Int | ❌ No | null | Pagination cursor (user_follows.id) |
| `limit` | Int | ❌ No | 20 | Max results per page (max 100) |

---

## Response Schema

### UserSummary

```graphql
type UserSummary {
  id: Int!
  username: String!
  fullname: String!
  image: String          # Nullable - null if no profile image
  isFollowedByMe: Boolean!
}
```

### PageInfo

```graphql
type PageInfo {
  nextCursor: Int        # Nullable - null if no more pages
  hasNext: Boolean!
}
```

### FollowerListDto

```graphql
type FollowerListDto {
  users: [UserSummary!]!
  pageInfo: PageInfo!
}
```

### FollowingListDto

```graphql
type FollowingListDto {
  users: [UserSummary!]!
  pageInfo: PageInfo!
}
```

---

## Security

### Authentication
- ✅ **JWT Required** - Both queries require authentication
- ✅ **Viewer ID from Token** - Extracted automatically from JWT
- ✅ **No manual viewer ID** - Cannot spoof viewer identity

### Authorization
- Public data - Anyone can view anyone's followers/following
- Privacy controlled at engagement service level
- Future: Support for private accounts

---

## Testing

### GraphQL Playground

1. **Start Application**
   ```bash
   npm run start:dev
   ```

2. **Open Playground**
   ```
   http://localhost:8080/graphql
   ```

3. **Set HTTP Headers**
   ```json
   {
     "Authorization": "Bearer YOUR_JWT_TOKEN"
   }
   ```

4. **Test Followers Query**
   ```graphql
   query {
     followers(userId: 1, limit: 5) {
       users {
         id
         username
         fullname
         isFollowedByMe
       }
       pageInfo {
         nextCursor
         hasNext
       }
     }
   }
   ```

5. **Test Following Query**
   ```graphql
   query {
     following(userId: 1, limit: 5) {
       users {
         id
         username
         fullname
         isFollowedByMe
       }
       pageInfo {
         hasNext
       }
     }
   }
   ```

---

## Pagination Flow

### Initial Request
```graphql
query {
  followers(userId: 123, limit: 20) {
    users { id, username }
    pageInfo {
      nextCursor    # e.g., 456789
      hasNext       # true
    }
  }
}
```

### Next Page
```graphql
query {
  followers(userId: 123, cursor: 456789, limit: 20) {
    users { id, username }
    pageInfo {
      nextCursor    # e.g., 567890
      hasNext       # true or false
    }
  }
}
```

### Last Page
```graphql
{
  "pageInfo": {
    "nextCursor": null,
    "hasNext": false
  }
}
```

---

## Common Use Cases

### 1. User Profile - Followers Tab
```typescript
function FollowersTab({ userId }: { userId: number }) {
  const { data, fetchMore } = useFollowers(userId, 20);
  
  return (
    <InfiniteScroll
      dataLength={data?.followers.users.length || 0}
      next={() => fetchMore({ variables: { cursor: data?.followers.pageInfo.nextCursor } })}
      hasMore={data?.followers.pageInfo.hasNext || false}
    >
      {data?.followers.users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </InfiniteScroll>
  );
}
```

### 2. User Profile - Following Tab
```typescript
function FollowingTab({ userId }: { userId: number }) {
  const { data, fetchMore } = useFollowing(userId, 20);
  
  return (
    <InfiniteScroll
      dataLength={data?.following.users.length || 0}
      next={() => fetchMore({ variables: { cursor: data?.following.pageInfo.nextCursor } })}
      hasMore={data?.following.pageInfo.hasNext || false}
    >
      {data?.following.users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </InfiniteScroll>
  );
}
```

### 3. Search in Followers/Following
```typescript
function SearchableFollowers({ userId }: { userId: number }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data } = useFollowers(userId, 100); // Get more for client-side filtering
  
  const filteredUsers = data?.followers.users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      {filteredUsers?.map(user => <UserCard key={user.id} user={user} />)}
    </>
  );
}
```

---

## Performance Considerations

1. **Cursor Pagination**: More efficient than offset for large datasets
2. **Default Limit**: 20 items (adjustable, max 100)
3. **Viewer Context**: Calculated server-side for efficiency
4. **gRPC Communication**: Fast binary protocol
5. **No N+1 Queries**: All data fetched in single gRPC call

---

## Future Improvements

1. **Mutual Followers**: Add field to show mutual followers count
2. **Filtering**: Filter by mutual connections, verified users, etc.
3. **Sorting**: Sort by follow date, follower count, etc.
4. **Search**: Server-side search in followers/following
5. **Real-time Updates**: WebSocket notifications for new followers

---

## Migration Notes

- No database changes (data managed by engagement service)
- No breaking changes to existing user module
- Fully additive feature
- Backward compatible

---

Perfect for building Instagram-style follower/following lists! 🚀

# Updated Feed GraphQL Examples (with FeedUser Object)

## Overview
Feed responses now include a **user object** instead of just `userId`. This provides more context about the feed author directly in the response.

## Changes from Previous Version

### Before (Old):
```graphql
{
  id
  userId        # Just the ID
  content
}
```

### After (New):
```graphql
{
  id
  user {        # Full user object
    id
    username
    profileImageUrl
  }
  content
}
```

---

## Updated GraphQL Queries

### 1. Home Feeds (with User Object)

```graphql
query HomeFeeds($cursor: String, $limit: Int) {
  homeFeeds(cursor: $cursor, limit: $limit) {
    feeds {
      id
      user {
        id
        username
        profileImageUrl
      }
      recipeId
      content
      createdAt
      updatedAt
      images {
        id
        imageUrl
        position
      }
    }
    nextCursor
    hasMore
  }
}
```

**Variables:**
```json
{
  "cursor": null,
  "limit": 10
}
```

**Example Response:**
```json
{
  "data": {
    "homeFeeds": {
      "feeds": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "user": {
            "id": 123,
            "username": "john_chef",
            "profileImageUrl": "https://example.com/avatar/john.jpg"
          },
          "recipeId": 456,
          "content": "Just made the best Nasi Goreng! 🍳",
          "createdAt": "2026-01-10T08:30:00Z",
          "updatedAt": "2026-01-10T08:30:00Z",
          "images": [
            {
              "id": "img-uuid-1",
              "imageUrl": "https://example.com/feeds/image1.jpg",
              "position": 1
            }
          ]
        }
      ],
      "nextCursor": "eyJjcmVhdGVkX2F0IjoiMjAyNi0wMS0xMFQwODozMDowMFoifQ==",
      "hasMore": true
    }
  }
}
```

---

### 2. User Feeds (with User Object)

```graphql
query UserFeeds($userId: Int!, $cursor: String, $limit: Int) {
  userFeeds(userId: $userId, cursor: $cursor, limit: $limit) {
    feeds {
      id
      user {
        id
        username
        profileImageUrl
      }
      recipeId
      content
      createdAt
      updatedAt
      images {
        id
        imageUrl
        position
      }
    }
    nextCursor
    hasMore
  }
}
```

**Variables:**
```json
{
  "userId": 123,
  "cursor": null,
  "limit": 10
}
```

---

### 3. Get Single Feed (with User Object)

```graphql
query GetFeed($id: ID!) {
  feed(id: $id) {
    id
    user {
      id
      username
      profileImageUrl
    }
    recipeId
    content
    createdAt
    updatedAt
    images {
      id
      imageUrl
      position
    }
  }
}
```

**Variables:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 4. Create Feed (Response includes User Object)

```graphql
mutation CreateFeed($input: CreateFeedInput!) {
  createFeed(input: $input) {
    id
    user {
      id
      username
      profileImageUrl
    }
    recipeId
    content
    createdAt
    updatedAt
    images {
      id
      imageUrl
      position
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "content": "Check out my cooking adventure! 👨‍🍳",
    "recipeId": 789,
    "images": [
      {
        "imageUrl": "https://cdn.example.com/feed-img.jpg",
        "position": 1
      }
    ]
  }
}
```

**Example Response:**
```json
{
  "data": {
    "createFeed": {
      "id": "new-feed-uuid",
      "user": {
        "id": 123,
        "username": "john_chef",
        "profileImageUrl": "https://example.com/avatar/john.jpg"
      },
      "recipeId": 789,
      "content": "Check out my cooking adventure! 👨‍🍳",
      "createdAt": "2026-01-10T10:00:00Z",
      "updatedAt": "2026-01-10T10:00:00Z",
      "images": [
        {
          "id": "img-uuid-new",
          "imageUrl": "https://cdn.example.com/feed-img.jpg",
          "position": 1
        }
      ]
    }
  }
}
```

---

### 5. Update Feed (Response includes User Object)

```graphql
mutation UpdateFeed($id: ID!, $input: UpdateFeedInput!) {
  updateFeed(id: $id, input: $input) {
    id
    user {
      id
      username
      profileImageUrl
    }
    recipeId
    content
    createdAt
    updatedAt
    images {
      id
      imageUrl
      position
    }
  }
}
```

---

## Frontend Implementation Examples

### React Component with User Object

```typescript
import { gql, useQuery } from '@apollo/client';

const HOME_FEEDS_QUERY = gql`
  query HomeFeeds($cursor: String, $limit: Int) {
    homeFeeds(cursor: $cursor, limit: $limit) {
      feeds {
        id
        user {
          id
          username
          profileImageUrl
        }
        recipeId
        content
        createdAt
        images {
          imageUrl
          position
        }
      }
      nextCursor
      hasMore
    }
  }
`;

function FeedList() {
  const { data, loading, error } = useQuery(HOME_FEEDS_QUERY, {
    variables: { limit: 10 }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.homeFeeds?.feeds.map((feed) => (
        <div key={feed.id} className="feed-card">
          {/* User Info - Now available directly! */}
          <div className="feed-header">
            <img 
              src={feed.user.profileImageUrl} 
              alt={feed.user.username}
              className="avatar"
            />
            <div>
              <h4>{feed.user.username}</h4>
              <small>{new Date(feed.createdAt).toLocaleString()}</small>
            </div>
          </div>

          {/* Content */}
          <p>{feed.content}</p>

          {/* Images */}
          <div className="feed-images">
            {feed.images.map((img) => (
              <img key={img.position} src={img.imageUrl} alt="" />
            ))}
          </div>

          {/* Recipe Link */}
          {feed.recipeId && (
            <a href={`/recipes/${feed.recipeId}`}>View Recipe</a>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Benefits of User Object

### 1. **Reduced API Calls**
```typescript
// Before: Need to fetch user data separately
const feed = await getFeed(feedId);
const user = await getUser(feed.userId); // Extra API call!

// After: User data included
const feed = await getFeed(feedId);
console.log(feed.user.username); // Already available!
```

### 2. **Better UX**
- Show author name and avatar immediately
- No loading states for user info
- Consistent data across all feeds

### 3. **Simpler Frontend Code**
```typescript
// Before: Complex state management
const [feeds, setFeeds] = useState([]);
const [users, setUsers] = useState({});

// After: Simple, straightforward
const [feeds, setFeeds] = useState([]);
// User data is already in each feed!
```

---

## Migration Notes

### GraphQL Schema Changes
- ✅ `Feed.userId: Int` → `Feed.user: FeedUserDto`
- ✅ Added `FeedUserDto` type with `id`, `username`, `profileImageUrl`
- ✅ All feed queries/mutations return full user object

### Backward Compatibility
- ❌ **Breaking Change**: `userId` field no longer exists
- ✅ Frontend must update to use `user.id` instead of `userId`
- ✅ User information now richer (username, profile image)

### Frontend Migration Guide

```typescript
// ❌ Old Code (will break)
const userId = feed.userId;

// ✅ New Code (correct)
const userId = feed.user.id;
const username = feed.user.username;
const avatar = feed.user.profileImageUrl;
```

---

## Type Definitions (TypeScript)

```typescript
interface FeedUser {
  id: number;
  username: string;
  profileImageUrl: string;
}

interface FeedImage {
  id: string;
  imageUrl: string;
  position: number;
}

interface Feed {
  id: string;
  user: FeedUser;           // Changed from userId: number
  recipeId?: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  images: FeedImage[];
}

interface FeedList {
  feeds: Feed[];
  nextCursor?: string;
  hasMore: boolean;
}
```

---

## Testing Examples

### GraphQL Playground Test

1. Open: `http://localhost:3000/graphql`
2. Add Authorization header (for protected queries):
   ```json
   {
     "Authorization": "Bearer YOUR_JWT_TOKEN"
   }
   ```
3. Run query:
   ```graphql
   query {
     homeFeeds(limit: 5) {
       feeds {
         id
         user {
           username
           profileImageUrl
         }
         content
       }
       hasMore
     }
   }
   ```

---

## Summary

### What Changed:
- ✅ `Feed` now includes `FeedUser` object instead of `userId`
- ✅ All feed responses enriched with user information
- ✅ No additional API calls needed for user data

### What Stayed the Same:
- ✅ All mutation/query signatures unchanged (except response fields)
- ✅ Authentication flow unchanged
- ✅ Pagination logic unchanged
- ✅ Image and recipe linking unchanged

### Action Required:
1. Update frontend GraphQL queries to include `user { id, username, profileImageUrl }`
2. Replace `feed.userId` with `feed.user.id` in code
3. Utilize new `username` and `profileImageUrl` fields for better UX


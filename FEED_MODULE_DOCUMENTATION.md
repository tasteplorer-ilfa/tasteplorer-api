# Feed Module Documentation

## Overview
Feed module terintegrasi dengan engagement service melalui gRPC untuk mengelola user feeds (posts). Module ini menyediakan CRUD operations dan listing feeds dengan cursor-based pagination.

## Architecture
- **gRPC Service**: `localhost:50050` (engagement service)
- **Package**: `engagement`
- **Proto File**: `proto/engagement.proto`
- **Authentication**: JWT-based untuk operations tertentu

## GraphQL API

### Mutations

#### 1. Create Feed
Membuat feed baru (requires authentication).

```graphql
mutation CreateFeed($input: CreateFeedInput!) {
  createFeed(input: $input) {
    id
    userId
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
    "content": "Ini adalah feed pertama saya!",
    "recipeId": 123,
    "images": [
      {
        "imageUrl": "https://example.com/image1.jpg",
        "position": 1
      },
      {
        "imageUrl": "https://example.com/image2.jpg",
        "position": 2
      }
    ]
  }
}
```

**Notes:**
- `recipeId` optional (set to 0 or null jika tidak ada recipe)
- `images` optional (bisa kosong array)
- JWT token required di header

---

#### 2. Update Feed
Update konten feed (requires authentication).

```graphql
mutation UpdateFeed($id: ID!, $input: UpdateFeedInput!) {
  updateFeed(id: $id, input: $input) {
    id
    userId
    content
    updatedAt
    images {
      imageUrl
      position
    }
  }
}
```

**Variables:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "input": {
    "content": "Updated feed content"
  }
}
```

---

#### 3. Delete Feed
Hapus feed (requires authentication).

```graphql
mutation DeleteFeed($id: ID!) {
  deleteFeed(id: $id) {
    success
    message
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

### Queries

#### 1. Get Single Feed
Ambil detail feed berdasarkan ID (public).

```graphql
query GetFeed($id: ID!) {
  feed(id: $id) {
    id
    userId
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

#### 2. Home Feeds
Ambil feed list untuk home timeline (requires authentication).

```graphql
query HomeFeeds($cursor: String, $limit: Int) {
  homeFeeds(cursor: $cursor, limit: $limit) {
    feeds {
      id
      userId
      recipeId
      content
      createdAt
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

**Variables (First Page):**
```json
{
  "cursor": null,
  "limit": 20
}
```

**Variables (Next Page):**
```json
{
  "cursor": "eyJjcmVhdGVkX2F0IjoiMjAyNS0wMS0wNVQxMDowMDowMFoifQ==",
  "limit": 20
}
```

**Notes:**
- Default limit: 20
- Max limit: 100
- JWT token required
- Feed berdasarkan user yang login dan following

---

#### 3. User Feeds
Ambil feed list dari user tertentu (public).

```graphql
query UserFeeds($userId: Int!, $cursor: String, $limit: Int) {
  userFeeds(userId: $userId, cursor: $cursor, limit: $limit) {
    feeds {
      id
      userId
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
  "limit": 20
}
```

**Notes:**
- Public endpoint (no auth required)
- Untuk melihat feeds user lain
- Support pagination dengan cursor

---

## Implementation Details

### File Structure
```
src/modules/feed/
├── feed.module.ts              # Module definition
├── feed.service.ts             # Business logic & gRPC communication
├── feed.resolver.ts            # GraphQL resolvers
├── dto/
│   └── feed.dto.ts            # GraphQL DTOs
└── grpc/
    ├── feed.interface.ts      # gRPC TypeScript interfaces
    └── feed-service.module.ts # gRPC client configuration
```

### Key Features

1. **JWT Metadata Handling**
   - User ID dikirim via gRPC metadata untuk authenticated operations
   - Menggunakan `Metadata` dari `@grpc/grpc-js`

2. **Error Handling**
   - Semua errors di-wrap dalam `GraphQLError`
   - Proper error messages dari gRPC service

3. **Data Mapping**
   - snake_case (gRPC) ↔ camelCase (GraphQL)
   - `recipe_id: 0` → `recipeId: null` untuk optional recipe

4. **Cursor Pagination**
   - Opaque cursor (Base64 encoded)
   - `hasMore` flag untuk UI
   - `nextCursor` untuk fetch halaman berikutnya

### Environment Variables

```env
# Optional: Override default gRPC URL
FEED_SERVICE_GRPC_URL=localhost:50050
```

Default: `localhost:50050`

---

## Security

### Protected Endpoints (JWT Required)
- `createFeed` - Create new feed
- `updateFeed` - Update feed content
- `deleteFeed` - Delete feed
- `homeFeeds` - Get personalized feed timeline

### Public Endpoints
- `feed` - Get single feed by ID
- `userFeeds` - Get feeds from specific user

### Authorization
- User ID diambil dari JWT token (`user.sub`)
- gRPC service melakukan ownership validation
- Unauthorized operations akan return error

---

## Usage Examples

### Complete Flow Example

```typescript
// 1. Create Feed (with JWT)
const createResult = await apolloClient.mutate({
  mutation: CREATE_FEED,
  variables: {
    input: {
      content: "Check out my new recipe!",
      recipeId: 456,
      images: [
        { imageUrl: "https://cdn.example.com/img1.jpg", position: 1 }
      ]
    }
  },
  context: {
    headers: {
      authorization: `Bearer ${jwtToken}`
    }
  }
});

// 2. Get Home Feeds (with JWT)
const homeFeeds = await apolloClient.query({
  query: HOME_FEEDS,
  variables: { limit: 20 },
  context: {
    headers: {
      authorization: `Bearer ${jwtToken}`
    }
  }
});

// 3. Load More (pagination)
if (homeFeeds.data.homeFeeds.hasMore) {
  const nextPage = await apolloClient.query({
    query: HOME_FEEDS,
    variables: {
      cursor: homeFeeds.data.homeFeeds.nextCursor,
      limit: 20
    }
  });
}

// 4. Get User Feeds (public, no JWT)
const userFeeds = await apolloClient.query({
  query: USER_FEEDS,
  variables: { userId: 789, limit: 20 }
});

// 5. Update Feed (with JWT)
await apolloClient.mutate({
  mutation: UPDATE_FEED,
  variables: {
    id: feedId,
    input: { content: "Updated content!" }
  }
});

// 6. Delete Feed (with JWT)
await apolloClient.mutate({
  mutation: DELETE_FEED,
  variables: { id: feedId }
});
```

---

## Testing

### Test gRPC Connection
```bash
# Test if engagement service is running
grpcurl -plaintext localhost:50050 list

# Test CreateFeed (with metadata)
grpcurl -plaintext \
  -d '{"content":"test","recipe_id":0,"images":[]}' \
  -H 'user_id: 1' \
  localhost:50050 \
  engagement.FeedService/CreateFeed
```

### GraphQL Playground
1. Start application: `npm run start:dev`
2. Open: `http://localhost:3000/graphql`
3. Set JWT in HTTP Headers:
   ```json
   {
     "authorization": "Bearer YOUR_JWT_TOKEN"
   }
   ```
4. Run queries/mutations

---

## Common Issues & Solutions

### 1. gRPC Connection Error
**Error**: `14 UNAVAILABLE: No connection established`

**Solution**: 
- Pastikan engagement service running di `localhost:50050`
- Check dengan: `nc -zv localhost 50050`

### 2. Authentication Error
**Error**: `Unauthorized` atau `User not found`

**Solution**:
- Pastikan JWT token valid dan belum expired
- Check `user.sub` exists di JWT payload

### 3. Feed Not Found
**Error**: `Feed not found`

**Solution**:
- Pastikan feed ID valid (UUID format)
- User hanya bisa update/delete feed milik sendiri

---

## Migration Notes

- No database changes (feed data di engagement service)
- No breaking changes ke existing modules
- Module fully self-contained dengan gRPC communication

---

## Future Improvements

1. **Caching**: Implement Redis cache untuk feed list
2. **Real-time**: Add subscription untuk new feeds
3. **Analytics**: Track feed views dan engagement
4. **Media Processing**: Image optimization/resize
5. **Content Moderation**: Auto-filter inappropriate content


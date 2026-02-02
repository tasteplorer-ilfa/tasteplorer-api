# Toggle Like Recipe Implementation

## Overview
This document describes the implementation of the `ToggleLikeRecipe` GraphQL mutation that integrates with the engagement microservice via gRPC to handle recipe likes/unlikes.

## Architecture
- **gRPC Service**: `engagement-service:50051` (via `ENGAGEMENT_SERVICE`)
- **Package**: `engagement.EngagementService`
- **Proto File**: `proto/engagement.proto`
- **RPC Method**: `LikeRecipe (LikeRequest) returns (EngagementResponse)`
- **Authentication**: JWT-based (required) - userId extracted from JWT token

---

## GraphQL Mutation

```graphql
mutation ToggleLikeRecipe($input: ToggleLikeRecipeInput!) {
  toggleLikeRecipe(input: $input) {
    success
    message
  }
}
```

### Variables
```json
{
  "input": {
    "recipeId": "123"
  }
}
```

### Response
```json
{
  "data": {
    "toggleLikeRecipe": {
      "success": true,
      "message": "Recipe liked successfully"
    }
  }
}
```

---

## Implementation Details

### Files Created/Modified

1. **src/modules/recipe/dto/engagement.dto.ts** (NEW)
   - `ToggleLikeRecipeInput`: GraphQL input type with `recipeId`
   - `EngagementResponseDto`: GraphQL object type for response

2. **src/modules/user/grpc/engagement.interface.ts** (UPDATED)
   - Added `LikeRequest` interface
   - Added `EngagementResponse` interface
   - Added `EngagementService` interface with `likeRecipe()` method

3. **src/modules/recipe/recipe.service.ts** (UPDATED)
   - Implements `OnModuleInit` to initialize gRPC client
   - Added `engagementService` property
   - Added `toggleLikeRecipe()` method with full error handling
   - Metadata handling: user-id sent via gRPC metadata

4. **src/modules/recipe/recipe.resolver.ts** (UPDATED)
   - Added `toggleLikeRecipe` mutation
   - Protected with `@UseGuards(JwtAuthGuard)`
   - Uses `@CurrentUser()` decorator to extract userId from JWT

5. **src/modules/recipe/recipe.module.ts** (UPDATED)
   - Imported `EngagementServiceModule` for gRPC client access

---

## Security Features

✅ **JWT Authentication Required**: Mutation protected with `JwtAuthGuard`
✅ **User ID from JWT**: userId extracted from authenticated token (user.sub)
✅ **NOT from GraphQL Input**: userId cannot be spoofed via mutation input
✅ **gRPC Metadata**: userId sent securely via gRPC metadata header

---

## Error Handling

The implementation handles various error scenarios:

| Error Code | HTTP Status | GraphQL Error Message |
|------------|-------------|----------------------|
| `UNAVAILABLE` (14) | Service Unavailable | "Engagement service is currently unavailable. Please try again later." |
| `UNAUTHENTICATED` (16) | Unauthorized | "Failed to authenticate with engagement service: [details]" |
| `NOT_FOUND` (5) | Not Found | "Recipe not found." |
| Other | Internal Error | "Failed to toggle like: [message]" |

---

## Testing

### Prerequisites
1. Ensure engagement service is running on `localhost:50051`
2. Have a valid JWT token
3. Recipe must exist in the system

### GraphQL Playground Test

1. Open GraphQL Playground: `http://localhost:3000/graphql`

2. Set Authorization Header:
```json
{
  "authorization": "Bearer YOUR_JWT_TOKEN"
}
```

3. Run Mutation:
```graphql
mutation {
  toggleLikeRecipe(input: { recipeId: "123" }) {
    success
    message
  }
}
```

### Expected Behaviors

**First Call (Like):**
```json
{
  "data": {
    "toggleLikeRecipe": {
      "success": true,
      "message": "Recipe liked successfully"
    }
  }
}
```

**Second Call (Unlike):**
```json
{
  "data": {
    "toggleLikeRecipe": {
      "success": true,
      "message": "Recipe unliked successfully"
    }
  }
}
```

**Without Auth Token:**
```json
{
  "errors": [
    {
      "message": "Unauthorized",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

---

## gRPC Communication Flow

1. Client sends GraphQL mutation with JWT token
2. `JwtAuthGuard` validates token and extracts userId
3. `RecipeResolver.toggleLikeRecipe()` receives authenticated request
4. `RecipeService.toggleLikeRecipe()` is called with recipeId and userId
5. gRPC metadata is created with `user-id` header
6. Request sent to engagement service via gRPC `EngagementService.LikeRecipe`
7. Response mapped to `EngagementResponseDto`
8. Data returned to client

---

## Key Implementation Patterns

### 1. gRPC Metadata Handling
```typescript
const metadata = new Metadata();
metadata.set('user-id', userId.toString());
```

### 2. Service Method Call
```typescript
const response = await firstValueFrom(
  this.engagementService.likeRecipe(request, metadata),
);
```

### 3. Error Handling
```typescript
if (error.code === 'UNAVAILABLE' || error.code === 14) {
  throw new GraphQLError('Engagement service is currently unavailable...');
}
```

---

## Environment Variables

Uses existing `ENGAGEMENT_SERVICE_GRPC_URL` configuration:
```bash
ENGAGEMENT_SERVICE_GRPC_URL=localhost:50051
```

Default: `engagement-service:50051`

---

## Proto Definition (Reference)

```protobuf
message LikeRequest {
    string userId = 1;
    string recipeId = 2;
}

message EngagementResponse {
    bool success = 1;
    string message = 2;
}

service EngagementService {
    rpc LikeRecipe (LikeRequest) returns (EngagementResponse);
}
```

---

## Future Enhancements

- [ ] Add optimistic UI updates
- [ ] Cache like status per user/recipe
- [ ] Add batch like/unlike operations
- [ ] Implement real-time like count updates via subscriptions
- [ ] Add rate limiting for like toggles

---

## Troubleshooting

### Issue: "Engagement service is currently unavailable"
**Solution**: 
- Check if engagement service is running: `nc -zv localhost 50051`
- Verify `ENGAGEMENT_SERVICE_GRPC_URL` environment variable

### Issue: "Failed to authenticate with engagement service"
**Solution**:
- Verify JWT token is valid and not expired
- Check user exists in database
- Ensure metadata is correctly formatted

### Issue: "Recipe not found"
**Solution**:
- Verify recipeId exists in engagement service
- Check recipeId format (should be string)

---

## References

- Proto File: `proto/engagement.proto`
- gRPC Module: `src/modules/user/grpc/engagement-service.module.ts`
- Existing Pattern: Follow same pattern as `FeedService` and `UserService`

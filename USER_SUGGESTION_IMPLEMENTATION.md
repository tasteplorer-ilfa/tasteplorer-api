# User Suggestion List Implementation

## Overview
This document describes the implementation of the user suggestion feature using gRPC communication with the engagement service.

## Architecture

### Files Created

1. **proto/engagement.proto**
   - Protocol Buffer definition for engagement service
   - Defines `UserSuggestionService` with `GetSuggestedUsers` RPC method
   - Contains message definitions for requests and responses

2. **src/modules/user/grpc/engagement-service.module.ts**
   - NestJS module for gRPC client configuration
   - Connects to engagement service at `localhost:50051` (configurable via env)
   - Exports ClientsModule for dependency injection

3. **src/modules/user/grpc/engagement.interface.ts**
   - TypeScript interfaces for gRPC service
   - Defines `UserSuggestionService` interface
   - Type-safe request/response structures

4. **src/modules/user/dto/user.dto.ts** (Updated)
   - Added `SuggestedUserDto` for individual suggestions
   - Added `UserSuggestionListDto` for the response

5. **src/modules/user/user.service.ts** (Updated)
   - Implements `OnModuleInit` to initialize gRPC client
   - Added `getSuggestedUsers()` method
   - Handles metadata with user-id from JWT token
   - Includes error handling for gRPC failures

6. **src/modules/user/user.resolver.ts** (Updated)
   - Added `userSuggestionList` GraphQL query
   - Protected with `JwtAuthGuard`
   - Supports pagination with limit/offset parameters

7. **src/modules/user/user.module.ts** (Updated)
   - Imports `EngagementServiceModule`

8. **.env.example** (Updated)
   - Added `ENGAGEMENT_SERVICE_GRPC_URL` configuration

## GraphQL Query

```graphql
query UserSuggestionList($limit: Int, $offset: Int) {
  userSuggestionList(limit: $limit, offset: $offset) {
    users {
      userId
      username
      fullName
      profileImageUrl
      followerCount
      mutualFollowerCount
      mutualConnectionUsernames
      suggestionScore
      suggestionReason
    }
    totalCount
    hasMore
  }
}
```

### Query Variables
```json
{
  "limit": 20,
  "offset": 0
}
```

## Features

### Security
- ✅ JWT authentication required via `@UseGuards(JwtAuthGuard)`
- ✅ User ID automatically extracted from JWT token using `@CurrentUser()` decorator
- ✅ User ID sent to engagement service via gRPC metadata

### Best Practices
- ✅ Clean code architecture following existing patterns
- ✅ Type-safe interfaces for gRPC communication
- ✅ Proper error handling with user-friendly messages
- ✅ Input validation (max limit: 100)
- ✅ Graceful degradation if service unavailable
- ✅ No breaking changes to existing code

### Error Handling
- Validates limit cannot exceed 100
- Returns empty array if service unavailable
- Provides specific error message for connection issues
- Falls back gracefully on any gRPC errors

## Configuration

### Environment Variables
Add to your `.env` file:
```bash
ENGAGEMENT_SERVICE_GRPC_URL=localhost:50051
```

### Default Values
- **Limit**: 20 (max: 100)
- **Offset**: 0
- **Service URL**: localhost:50051

## Testing

### Example Request
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "query { userSuggestionList(limit: 20, offset: 0) { users { userId username fullName } totalCount hasMore } }"
  }'
```

### Expected Response
```json
{
  "data": {
    "userSuggestionList": {
      "users": [
        {
          "userId": "102",
          "username": "zoro_samurai",
          "fullName": "Roronoa Zoro",
          "profileImageUrl": "",
          "followerCount": 3,
          "mutualFollowerCount": 1,
          "mutualConnectionUsernames": ["shirohige_onepiece"],
          "suggestionScore": 6,
          "suggestionReason": "Followed by 1 people you follow"
        }
      ],
      "totalCount": 6,
      "hasMore": false
    }
  }
}
```

## gRPC Communication Flow

1. Client sends GraphQL query with JWT token
2. `JwtAuthGuard` validates token and extracts user ID
3. `UserResolver` receives authenticated request
4. `UserService.getSuggestedUsers()` is called with user ID
5. gRPC metadata is created with user-id header
6. Request sent to engagement service via gRPC
7. Response mapped to GraphQL DTOs
8. Data returned to client

## Implementation Notes

- User ID from JWT is automatically sent in gRPC metadata header `user-id`
- The engagement service uses this metadata to personalize suggestions
- Pagination uses offset-based approach (can be enhanced with cursor-based later)
- Service follows the same pattern as `SearchService` for consistency

## Future Enhancements

- [ ] Add caching layer for suggestions
- [ ] Implement cursor-based pagination
- [ ] Add metrics/monitoring for gRPC calls
- [ ] Add retry logic with exponential backoff
- [ ] Implement circuit breaker pattern

## Dependencies

No new dependencies required. Uses existing:
- `@nestjs/microservices` for gRPC client
- `@grpc/grpc-js` for metadata handling
- `rxjs` for Observable streams

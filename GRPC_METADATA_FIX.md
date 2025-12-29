# gRPC Metadata Fix - User Suggestion Implementation

## Problem
Error `16 UNAUTHENTICATED: authentication required: user-id not found in metadata` terjadi karena metadata tidak terkirim dengan benar ke engagement service.

## Root Cause
1. Menggunakan `metadata.add()` instead of `metadata.set()`
2. Metadata di-wrap dalam object `{ metadata }` instead of passing directly
3. Interface tidak mendefinisikan parameter metadata dengan type yang benar

## Solution Applied

### 1. Fixed `user.service.ts`
**Before:**
```typescript
const metadata = new Metadata();
metadata.add('user-id', userId.toString());

const response = await firstValueFrom(
  this.userSuggestionService.getSuggestedUsers(request, {
    metadata,
  } as any),
);
```

**After:**
```typescript
const metadata = new Metadata();
metadata.set('user-id', userId.toString());

const response = await firstValueFrom(
  this.userSuggestionService.getSuggestedUsers(request, metadata),
);
```

**Key Changes:**
- ✅ Changed `metadata.add()` to `metadata.set()`
- ✅ Pass metadata directly as second parameter (not wrapped in object)
- ✅ Added comprehensive error handling for UNAUTHENTICATED (code 16)
- ✅ Added debug logging to trace metadata

### 2. Fixed `engagement.interface.ts`
**Before:**
```typescript
export interface UserSuggestionService {
  getSuggestedUsers(
    request: GetSuggestedUsersRequest,
    metadata?: any,
  ): Observable<GetSuggestedUsersResponse>;
}
```

**After:**
```typescript
import { Metadata } from '@grpc/grpc-js';

export interface UserSuggestionService {
  getSuggestedUsers(
    request: GetSuggestedUsersRequest,
    metadata?: Metadata,
  ): Observable<GetSuggestedUsersResponse>;
}
```

**Key Changes:**
- ✅ Import proper `Metadata` type from `@grpc/grpc-js`
- ✅ Type-safe metadata parameter

### 3. Enhanced `engagement-service.module.ts`
**Added:**
```typescript
loader: {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
},
channelOptions: {
  'grpc.max_send_message_length': -1,
  'grpc.max_receive_message_length': -1,
},
```

**Benefits:**
- ✅ Better proto parsing with `keepCase: true`
- ✅ Proper handling of proto field names (snake_case preservation)
- ✅ No message size limits

## How Metadata is Sent Now

1. **Client Side (NestJS):**
   ```typescript
   const metadata = new Metadata();
   metadata.set('user-id', userId.toString());
   
   // Metadata automatically added to gRPC call context
   getSuggestedUsers(request, metadata)
   ```

2. **Server Side (Go):**
   ```go
   func extractUserIDFromContext(ctx context.Context) (int, error) {
       md, ok := metadata.FromIncomingContext(ctx)
       if !ok {
           return 0, errors.New("no metadata in context")
       }
       
       userIDStr := md.Get("user-id")
       if len(userIDStr) == 0 {
           return 0, errors.New("user-id not found in metadata")
       }
       
       return strconv.Atoi(userIDStr[0])
   }
   ```

## Testing

### 1. Check Logs
When you call the query, you should see logs like:
```
🔍 Sending gRPC request with metadata: {
  userId: 97,
  limit: 20,
  offset: 0,
  metadataMap: { 'user-id': '97' }
}
```

### 2. Success Response
```
✅ Received gRPC response: {
  usersCount: 6,
  totalCount: 6,
  hasMore: false
}
```

### 3. GraphQL Query
```graphql
query UserSuggestionList {
  userSuggestionList(limit: 20, offset: 0) {
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

## Debugging Tips

If you still get authentication errors:

1. **Check metadata in logs:**
   ```typescript
   console.log('Metadata being sent:', metadata.getMap());
   ```

2. **Verify proto package name:**
   - Client: `package: 'engagement'`
   - Proto file: `package engagement;`
   - Service name: `UserSuggestionService`

3. **Check gRPC server logs:**
   - Look for incoming metadata
   - Verify `extractUserIDFromContext()` is finding the metadata

4. **Verify environment variable:**
   ```bash
   ENGAGEMENT_SERVICE_GRPC_URL=localhost:50051
   ```

## Files Modified

1. ✅ `src/modules/user/user.service.ts` - Fixed metadata sending
2. ✅ `src/modules/user/grpc/engagement.interface.ts` - Added proper typing
3. ✅ `src/modules/user/grpc/engagement-service.module.ts` - Enhanced config

## Next Steps

1. Restart your NestJS application
2. Make sure engagement service is running on `localhost:50051`
3. Test the GraphQL query with a valid JWT token
4. Check console logs for metadata confirmation

## Reference
- NestJS gRPC Metadata: https://docs.nestjs.com/microservices/grpc\#grpc-metadata
- gRPC Metadata in Go: https://grpc.io/docs/guides/metadata/

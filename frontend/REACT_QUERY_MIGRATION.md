# React Query Migration Guide

## Updating from react-query to @tanstack/react-query

### 1. Update package.json

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.0.0"
  }
}
```

### 2. Update Imports

#### Before (react-query v3):
```typescript
import { useQuery, useMutation, QueryClient } from 'react-query';
```

#### After (@tanstack/react-query v5):
```typescript
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
```

### 3. Update QueryClient

#### Before:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

#### After:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000, // 5 minutes (cacheTime renamed to gcTime)
    },
  },
});
```

### 4. Update useQuery

#### Before:
```typescript
const { data, isLoading, error } = useQuery(
  ['videoInfo', url],
  () => fetchVideoInfo(url),
  {
    enabled: !!url,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  }
);
```

#### After:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['videoInfo', url],
  queryFn: () => fetchVideoInfo(url),
  enabled: !!url,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000, // cacheTime renamed to gcTime
});
```

### 5. Update useMutation

#### Before:
```typescript
const mutation = useMutation(
  (data) => convertVideo(data),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['videoInfo']);
    },
  }
);
```

#### After:
```typescript
const mutation = useMutation({
  mutationFn: (data) => convertVideo(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['videoInfo'] });
  },
});
```

### 6. Update invalidateQueries

#### Before:
```typescript
queryClient.invalidateQueries(['videoInfo']);
```

#### After:
```typescript
queryClient.invalidateQueries({ queryKey: ['videoInfo'] });
```

### 7. Add DevTools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 8. Main Changes

| Feature | v3 (react-query) | v5 (@tanstack/react-query) |
|---------|------------------|----------------------------|
| **Package name** | `react-query` | `@tanstack/react-query` |
| **cacheTime** | `cacheTime` | `gcTime` |
| **useQuery syntax** | `useQuery(key, fn, options)` | `useQuery({ queryKey, queryFn, ...options })` |
| **useMutation syntax** | `useMutation(fn, options)` | `useMutation({ mutationFn, ...options })` |
| **invalidateQueries** | `invalidateQueries(key)` | `invalidateQueries({ queryKey })` |

### 9. Example Files

- `hooks/useReactQuery.ts` - Usage examples
- `utils/queryClient.ts` - QueryClient setup
- `AppWithQuery.tsx` - App with QueryClient

### 10. Implementation Steps

1. Update package.json
2. Run `npm install`
3. Update all imports
4. Update hooks syntax
5. Update QueryClient options
6. Test the application

### 11. Benefits of Update

- **Better performance** with caching improvements
- **Enhanced TypeScript** with better types
- **Improved DevTools** with new features
- **Better Suspense support**
- **Clearer API** with object syntax

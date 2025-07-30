
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';
import { 
  JsonPlaceholderProvider, 
  useQuery, 
  useMutation,
  usePost,
  usePosts 
} from '@jsonplaceholder-client-lib/react';

// Test type checking
const client = new JsonPlaceholderClient();

// Test hook return types
function TestComponent() {
  const { data, error, isLoading } = useQuery('test', () => client.getPosts());
  const { mutate } = useMutation((data: any) => client.createPost(data));
  
  return null;
}

export default TestComponent;

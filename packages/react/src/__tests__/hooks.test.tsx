import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';
import { JsonPlaceholderProvider, usePosts } from '../index';

// Create a mock client with proper method signatures
const createMockClient = () => ({
  getPosts: jest.fn(),
  getPost: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  getUsers: jest.fn(),
  getUser: jest.fn(),
  searchComments: jest.fn(),
  getCommentsByPost: jest.fn(),
  searchPosts: jest.fn(),
  searchUsers: jest.fn(),
  getPostsWithPagination: jest.fn(),
  getCommentsWithPagination: jest.fn(),
  getUsersWithPagination: jest.fn(),
  getPostsByUser: jest.fn(),
  prefetchPost: jest.fn(),
  prefetchUser: jest.fn(),
  prefetchComments: jest.fn(),
} as unknown as JsonPlaceholderClient);

const TestComponent = () => {
  const { data: posts, isLoading, error } = usePosts();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Posts</h1>
      {posts?.map(post => (
        <div key={post.id} data-testid={`post-${post.id}`}>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
        </div>
      ))}
    </div>
  );
};

const renderWithProvider = (client: JsonPlaceholderClient) => {
  return render(
    <JsonPlaceholderProvider client={client}>
      <TestComponent />
    </JsonPlaceholderProvider>
  );
};

describe('JsonPlaceholder React Hooks', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('should render loading state initially', async () => {
    mockClient.getPosts.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve([]), 100); // Resolve after 100ms
    }));

    renderWithProvider(mockClient);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render posts when data is loaded', async () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Test Post 1',
        body: 'This is test post 1',
        userId: 1
      },
      {
        id: 2,
        title: 'Test Post 2',
        body: 'This is test post 2',
        userId: 1
      }
    ];

    mockClient.getPosts.mockResolvedValue(mockPosts);

    renderWithProvider(mockClient);

    await waitFor(() => {
      expect(screen.getByText('Posts')).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByTestId('post-1')).toBeInTheDocument();
      expect(screen.getByTestId('post-2')).toBeInTheDocument();
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    });
  });

  it('should render error state when API call fails', async () => {
    const mockError = new Error('API Error');
    mockClient.getPosts.mockRejectedValue(mockError);

    renderWithProvider(mockClient);

    await waitFor(() => {
      expect(screen.getByText('Error: API Error')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useJsonPlaceholderClient must be used within a JsonPlaceholderProvider');

    consoleSpy.mockRestore();
  });
});

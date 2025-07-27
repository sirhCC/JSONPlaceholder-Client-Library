import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { JsonPlaceholderProvider } from '../context';

// Simple test without complex mocking
describe('JsonPlaceholder React Hooks - Basic Tests', () => {
  // Mock client
  const mockClient = {
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
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render provider without crashing', () => {
    const TestComponent = () => <div>Test</div>;
    
    render(
      <JsonPlaceholderProvider client={mockClient}>
        <TestComponent />
      </JsonPlaceholderProvider>
    );

    expect(screen.getByText('Test')).toBeTruthy();
  });

  it('should export all hook functions', () => {
    // Test that our main exports exist
    const { 
      JsonPlaceholderProvider,
      useJsonPlaceholderClient,
      usePosts,
      usePost,
      useCreatePost
    } = require('../index');

    expect(JsonPlaceholderProvider).toBeDefined();
    expect(useJsonPlaceholderClient).toBeDefined();
    expect(usePosts).toBeDefined();
    expect(usePost).toBeDefined();
    expect(useCreatePost).toBeDefined();
  });

  it('should have correct package structure', () => {
    // Test that all main hook categories are exported
    const hooks = require('../index');
    
    // Context
    expect(hooks.JsonPlaceholderProvider).toBeDefined();
    expect(hooks.useJsonPlaceholderClient).toBeDefined();

    // Post hooks
    expect(hooks.usePosts).toBeDefined();
    expect(hooks.usePost).toBeDefined();
    expect(hooks.useCreatePost).toBeDefined();
    expect(hooks.useUpdatePost).toBeDefined();
    expect(hooks.useDeletePost).toBeDefined();

    // User hooks
    expect(hooks.useUsers).toBeDefined();
    expect(hooks.useUser).toBeDefined();

    // Comment hooks
    expect(hooks.useComments).toBeDefined();

    // Prefetch hooks
    expect(hooks.usePrefetchPosts).toBeDefined();
    expect(hooks.usePrefetchUser).toBeDefined();
    expect(hooks.usePrefetchComments).toBeDefined();
  });
});

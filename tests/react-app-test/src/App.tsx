import React, { useState } from 'react';
import { JsonPlaceholderProvider, useQuery, useMutation } from '@jsonplaceholder-client-lib/react';
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';
import './App.css';

// Initialize the client
const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  cacheConfig: { enabled: true },
  loggerConfig: { level: 'info' },
  securityConfig: { timeout: 10000 }
});

function PostsList() {
  const { data: posts, error, isLoading, refetch } = useQuery(
    'all-posts',
    () => client.getPosts(),
    {
      cacheTime: 300000, // 5 minutes
      retry: true
    }
  );

  if (isLoading) return <div className="loading">Loading posts...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <div className="posts-list">
      <div className="section-header">
        <h2>All Posts ({(posts as any[])?.length || 0})</h2>
        <button onClick={refetch} className="refresh-btn">Refresh</button>
      </div>
      <div className="posts-grid">
        {(posts as any[])?.slice(0, 6).map((post: any) => (
          <div key={post.id} className="post-card">
            <h3>{post.title}</h3>
            <p>{post.body.substring(0, 100)}...</p>
            <small>User ID: {post.userId}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreatePostForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [userId, setUserId] = useState('1');
  
  const { mutate: createPost, isLoading, error, data } = useMutation(
    (postData: any) => client.createPost(postData),
    {
      onSuccess: (newPost) => {
        console.log('Post created successfully:', newPost);
        setTitle('');
        setBody('');
      },
      onError: (error) => {
        console.error('Failed to create post:', error);
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost({
      title,
      body,
      userId: parseInt(userId)
    });
  };

  return (
    <div className="create-post-form">
      <h2>Create New Post</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="body">Body:</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
          />
        </div>
        <div className="form-group">
          <label htmlFor="userId">User ID:</label>
          <select
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            {[1, 2, 3, 4, 5].map(id => (
              <option key={id} value={id}>User {id}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isLoading} className="submit-btn">
          {isLoading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
      
      {error && <div className="error">Error: {error.message}</div>}
      {data && (
        <div className="success">
          <h3>Post Created Successfully!</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function SinglePostExample() {
  const [postId, setPostId] = useState('1');
  
  const { data: post, isLoading, error } = useQuery(
    `post-${postId}`,
    () => client.getPost(parseInt(postId)),
    {
      enabled: !!postId,
      cacheTime: 60000 // 1 minute
    }
  );

  return (
    <div className="single-post">
      <h2>Single Post Lookup</h2>
      <div className="form-group">
        <label htmlFor="postId">Post ID:</label>
        <input
          id="postId"
          type="number"
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
          min="1"
          max="100"
        />
      </div>
      
      {isLoading && <div className="loading">Loading post...</div>}
      {error && <div className="error">Error: {error.message}</div>}
      {post && (
        <div className="post-detail">
          <h3>{(post as any).title}</h3>
          <p>{(post as any).body}</p>
          <small>User ID: {(post as any).userId} | Post ID: {(post as any).id}</small>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <JsonPlaceholderProvider client={client}>
      <div className="App">
        <header className="App-header">
          <h1>JSONPlaceholder Client Library</h1>
          <p>React Hooks Integration Test</p>
        </header>
        
        <main className="App-main">
          <div className="test-section">
            <PostsList />
          </div>
          
          <div className="test-section">
            <SinglePostExample />
          </div>
          
          <div className="test-section">
            <CreatePostForm />
          </div>
        </main>
        
        <footer className="App-footer">
          <p>✅ React Hooks Integration Test Complete</p>
          <p>If you can see this page and interact with the components above, the React package is working correctly!</p>
        </footer>
      </div>
    </JsonPlaceholderProvider>
  );
}

export default App;

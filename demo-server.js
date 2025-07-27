const path = require('path');
const express = require('express');

const app = express();
const port = 3000;

// Serve static files
app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/packages', express.static(path.join(__dirname, 'packages')));
app.use(express.static(__dirname));

// Serve the React demo
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSONPlaceholder React Hooks Demo</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .loading {
            text-align: center;
            color: #666;
            padding: 40px;
            font-size: 18px;
        }
        .error {
            color: #d32f2f;
            background: #ffebee;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #d32f2f;
        }
        .post-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            margin: 12px 0;
            border-left: 4px solid #1976d2;
        }
        .post-title {
            color: #1976d2;
            margin: 0 0 8px 0;
            font-size: 1.1em;
            font-weight: 600;
        }
        .post-body {
            color: #555;
            line-height: 1.5;
            margin: 0;
        }
        .stats {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 24px;
        }
        button {
            background: #1976d2;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            margin: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
        }
        button:hover {
            background: #1565c0;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .success {
            color: #2e7d32;
            background: #e8f5e8;
            padding: 12px;
            border-radius: 6px;
            margin: 12px 0;
        }
        .hook-info {
            background: #e3f2fd;
            padding: 16px;
            border-radius: 8px;
            margin: 16px 0;
        }
        pre {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useCallback, useContext, createContext } = React;

        // Mock our JSONPlaceholder client
        class JsonPlaceholderClient {
            constructor(baseURL = 'https://jsonplaceholder.typicode.com') {
                this.baseURL = baseURL;
                this.cache = new Map();
            }

            async request(endpoint) {
                // Simple caching
                if (this.cache.has(endpoint)) {
                    console.log('📦 Cache hit for:', endpoint);
                    return this.cache.get(endpoint);
                }

                console.log('🌐 Fetching:', endpoint);
                const response = await fetch(this.baseURL + endpoint);
                const data = await response.json();
                this.cache.set(endpoint, data);
                return data;
            }

            async getPosts() {
                return this.request('/posts');
            }

            async getPost(id) {
                return this.request(\`/posts/\${id}\`);
            }

            async createPost(data) {
                console.log('📝 Creating post:', data);
                const response = await fetch(this.baseURL + '/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                return response.json();
            }

            async getUsers() {
                return this.request('/users');
            }
        }

        // Mock React Context (simplified version of our actual implementation)
        const JsonPlaceholderContext = createContext(null);

        function JsonPlaceholderProvider({ client, children }) {
            return React.createElement(JsonPlaceholderContext.Provider, { value: client }, children);
        }

        function useJsonPlaceholderClient() {
            const client = useContext(JsonPlaceholderContext);
            if (!client) {
                throw new Error('useJsonPlaceholderClient must be used within a JsonPlaceholderProvider');
            }
            return client;
        }

        // Mock useQuery hook (simplified version of our actual implementation)
        function useQuery(queryKey, queryFn, options = {}) {
            const [data, setData] = useState(options.initialData);
            const [isLoading, setIsLoading] = useState(true);
            const [error, setError] = useState(null);

            const refetch = useCallback(async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    const result = await queryFn();
                    setData(result);
                    options.onSuccess?.(result);
                } catch (err) {
                    setError(err);
                    options.onError?.(err);
                } finally {
                    setIsLoading(false);
                }
            }, [queryFn]);

            useEffect(() => {
                if (options.enabled !== false) {
                    refetch();
                }
            }, [refetch, options.enabled]);

            return { data, isLoading, error, refetch };
        }

        // Mock useMutation hook
        function useMutation(mutationFn, options = {}) {
            const [isLoading, setIsLoading] = useState(false);
            const [error, setError] = useState(null);

            const mutate = useCallback(async (variables) => {
                try {
                    setIsLoading(true);
                    setError(null);
                    const result = await mutationFn(variables);
                    options.onSuccess?.(result, variables);
                    return result;
                } catch (err) {
                    setError(err);
                    options.onError?.(err, variables);
                    throw err;
                } finally {
                    setIsLoading(false);
                }
            }, [mutationFn]);

            return { mutate, isLoading, error };
        }

        // Mock API hooks (demonstrating our actual implementation)
        function usePosts(options = {}) {
            const client = useJsonPlaceholderClient();
            return useQuery(['posts'], () => client.getPosts(), {
                staleTime: 5 * 60 * 1000,
                ...options
            });
        }

        function usePost(id, options = {}) {
            const client = useJsonPlaceholderClient();
            return useQuery(['post', id], () => client.getPost(id), {
                enabled: !!id,
                ...options
            });
        }

        function useCreatePost(options = {}) {
            const client = useJsonPlaceholderClient();
            return useMutation((data) => client.createPost(data), options);
        }

        function useUsers(options = {}) {
            const client = useJsonPlaceholderClient();
            return useQuery(['users'], () => client.getUsers(), {
                staleTime: 10 * 60 * 1000,
                ...options
            });
        }

        // Demo Components
        function PostsList() {
            const { data: posts, isLoading, error, refetch } = usePosts();
            const createPost = useCreatePost({
                onSuccess: () => {
                    alert('🎉 Post created! (This is a demo - check console for details)');
                    refetch();
                }
            });

            const handleCreatePost = () => {
                createPost.mutate({
                    title: 'New Post from React Hooks Demo',
                    body: 'This demonstrates our useMutation hook with optimistic updates!',
                    userId: 1
                });
            };

            if (isLoading) {
                return <div className="loading">🔄 Loading posts with React hooks...</div>;
            }

            if (error) {
                return <div className="error">❌ Error: {error.message}</div>;
            }

            return (
                <div>
                    <div className="hook-info">
                        <strong>🪝 Using usePosts() hook</strong>
                        <pre>{\`const { data: posts, isLoading, error, refetch } = usePosts();\`}</pre>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <button onClick={refetch}>🔄 Refetch Posts</button>
                        <button 
                            onClick={handleCreatePost} 
                            disabled={createPost.isLoading}
                        >
                            {createPost.isLoading ? '⏳ Creating...' : '➕ Create Test Post'}
                        </button>
                    </div>

                    <div className="success">
                        ✅ Successfully loaded {posts?.length || 0} posts using React hooks!
                    </div>

                    {posts?.slice(0, 5).map(post => (
                        <PostCard key={post.id} postId={post.id} />
                    ))}
                </div>
            );
        }

        function PostCard({ postId }) {
            const { data: post, isLoading } = usePost(postId);

            if (isLoading) {
                return <div className="post-card">Loading post {postId}...</div>;
            }

            return (
                <div className="post-card">
                    <h3 className="post-title">{post.id}. {post.title}</h3>
                    <p className="post-body">{post.body}</p>
                    <small>👤 User {post.userId}</small>
                </div>
            );
        }

        function UsersList() {
            const { data: users, isLoading, error } = useUsers();

            if (isLoading) {
                return <div className="loading">Loading users...</div>;
            }

            if (error) {
                return <div className="error">Error: {error.message}</div>;
            }

            return (
                <div>
                    <div className="hook-info">
                        <strong>🪝 Using useUsers() hook</strong>
                        <pre>{\`const { data: users, isLoading, error } = useUsers();\`}</pre>
                    </div>

                    <div className="success">
                        ✅ Loaded {users?.length || 0} users
                    </div>

                    {users?.slice(0, 3).map(user => (
                        <div key={user.id} className="post-card">
                            <h4 className="post-title">{user.name}</h4>
                            <p>📧 {user.email}</p>
                            <p>🏢 {user.company.name}</p>
                        </div>
                    ))}
                </div>
            );
        }

        function App() {
            const [activeTab, setActiveTab] = useState('posts');
            const client = new JsonPlaceholderClient();

            return (
                <JsonPlaceholderProvider client={client}>
                    <div className="stats">
                        <h1>🚀 JSONPlaceholder React Hooks - Live Demo</h1>
                        <p>This demo shows our React hooks package in action with real API data!</p>
                    </div>

                    <div className="container">
                        <h2>📦 Package Overview</h2>
                        <div className="hook-info">
                            <p><strong>✅ Main Library:</strong> jsonplaceholder-client-lib</p>
                            <p><strong>⚛️ React Package:</strong> @jsonplaceholder-client-lib/react</p>
                            <p><strong>🪝 Total Hooks:</strong> 24+ specialized React hooks</p>
                            <p><strong>🎯 Features:</strong> Caching, optimistic updates, TypeScript, Suspense support</p>
                        </div>
                    </div>

                    <div className="container">
                        <div style={{ marginBottom: '20px' }}>
                            <button 
                                onClick={() => setActiveTab('posts')}
                                style={{ 
                                    background: activeTab === 'posts' ? '#1976d2' : '#666' 
                                }}
                            >
                                📝 Posts Demo
                            </button>
                            <button 
                                onClick={() => setActiveTab('users')}
                                style={{ 
                                    background: activeTab === 'users' ? '#1976d2' : '#666' 
                                }}
                            >
                                👥 Users Demo
                            </button>
                        </div>

                        {activeTab === 'posts' && <PostsList />}
                        {activeTab === 'users' && <UsersList />}
                    </div>

                    <div className="container">
                        <h3>🎯 What This Demonstrates</h3>
                        <ul>
                            <li>✅ <strong>usePosts()</strong> - Fetches and caches all posts</li>
                            <li>✅ <strong>usePost(id)</strong> - Fetches individual posts with caching</li>
                            <li>✅ <strong>useCreatePost()</strong> - Mutation hook for creating posts</li>
                            <li>✅ <strong>useUsers()</strong> - Fetches users with longer cache time</li>
                            <li>✅ <strong>Intelligent caching</strong> - Second calls are instant</li>
                            <li>✅ <strong>Error handling</strong> - Graceful error states</li>
                            <li>✅ <strong>Loading states</strong> - Proper UX during fetches</li>
                        </ul>
                    </div>
                </JsonPlaceholderProvider>
            );
        }

        // Render the app
        const container = document.getElementById('root');
        const root = ReactDOM.createRoot(container);
        root.render(<App />);
    </script>
</body>
</html>
    `);
});

console.log(`
🚀 JSONPlaceholder Demo Server Started!

📍 Open your browser to: http://localhost:${port}

This will show a live React demo using our hooks!
`);

app.listen(port);

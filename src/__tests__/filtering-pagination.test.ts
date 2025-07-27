import MockAdapter from 'axios-mock-adapter';
import { JsonPlaceholderClient } from '../client';
import { Post, Comment, User } from '../types';

describe('JsonPlaceholderClient Advanced Filtering & Pagination', () => {
  let client: JsonPlaceholderClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new JsonPlaceholderClient();
    mock = new MockAdapter(client.client);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('Posts Filtering & Pagination', () => {
    const mockPosts: Post[] = [
      { id: 1, userId: 1, title: 'Post 1', body: 'Body 1' },
      { id: 2, userId: 1, title: 'Post 2', body: 'Body 2' },
      { id: 3, userId: 2, title: 'Post 3', body: 'Body 3' },
    ];

    it('should get posts with pagination', async () => {
      mock.onGet('/posts?_page=1&_limit=2').reply(200, mockPosts.slice(0, 2), {
        'x-total-count': '100'
      });

      const result = await client.getPostsWithPagination({ _page: 1, _limit: 2 });
      
      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should search posts by userId', async () => {
      const userPosts = mockPosts.filter(p => p.userId === 1);
      mock.onGet('/posts?userId=1').reply(200, userPosts);

      const result = await client.searchPosts({ userId: 1 });
      expect(result).toHaveLength(2);
      expect(result.every(p => p.userId === 1)).toBe(true);
    });

    it('should get posts by user with pagination', async () => {
      const userPosts = mockPosts.filter(p => p.userId === 1);
      mock.onGet('/posts?_page=1&_limit=10&userId=1').reply(200, userPosts);

      const result = await client.getPostsByUser(1, { _page: 1, _limit: 10 });
      expect(result).toHaveLength(2);
      expect(result.every(p => p.userId === 1)).toBe(true);
    });

    it('should search posts with sorting', async () => {
      mock.onGet('/posts?_sort=title&_order=desc').reply(200, [...mockPosts].reverse());

      const result = await client.searchPosts({ _sort: 'title', _order: 'desc' });
      expect(result[0].title).toBe('Post 3');
    });

    it('should search posts with full-text search', async () => {
      mock.onGet('/posts?q=searchterm').reply(200, [mockPosts[0]]);

      const result = await client.searchPosts({ q: 'searchterm' });
      expect(result).toHaveLength(1);
    });

    it('should handle complex search with multiple filters', async () => {
      mock.onGet('/posts?userId=1&_sort=id&_order=asc&_page=1&_limit=5').reply(200, userPosts);
      const userPosts = mockPosts.filter(p => p.userId === 1);

      const result = await client.searchPosts({
        userId: 1,
        _sort: 'id',
        _order: 'asc',
        _page: 1,
        _limit: 5
      });
      expect(result).toEqual(userPosts);
    });
  });

  describe('Comments Filtering & Pagination', () => {
    const mockComments: Comment[] = [
      { id: 1, postId: 1, name: 'Comment 1', email: 'test1@example.com', body: 'Body 1' },
      { id: 2, postId: 1, name: 'Comment 2', email: 'test2@example.com', body: 'Body 2' },
      { id: 3, postId: 2, name: 'Comment 3', email: 'test3@example.com', body: 'Body 3' },
    ];

    it('should get comments with pagination', async () => {
      mock.onGet('/comments?_page=1&_limit=2').reply(200, mockComments.slice(0, 2), {
        'x-total-count': '50'
      });

      const result = await client.getCommentsWithPagination({ _page: 1, _limit: 2 });
      
      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(50);
    });

    it('should search comments by postId', async () => {
      const postComments = mockComments.filter(c => c.postId === 1);
      mock.onGet('/comments?postId=1').reply(200, postComments);

      const result = await client.searchComments({ postId: 1 });
      expect(result).toHaveLength(2);
      expect(result.every(c => c.postId === 1)).toBe(true);
    });

    it('should get comments by post with options', async () => {
      const postComments = mockComments.filter(c => c.postId === 1);
      mock.onGet('/comments?_limit=5&postId=1').reply(200, postComments);

      const result = await client.getCommentsByPost(1, { _limit: 5 });
      expect(result).toHaveLength(2);
      expect(result.every(c => c.postId === 1)).toBe(true);
    });

    it('should search comments by email', async () => {
      mock.onGet('/comments?email=test1@example.com').reply(200, [mockComments[0]]);

      const result = await client.searchComments({ email: 'test1@example.com' });
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('test1@example.com');
    });
  });

  describe('Users Filtering & Pagination', () => {
    const mockUsers: User[] = [
      {
        id: 1,
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        address: {
          street: 'Kulas Light',
          suite: 'Apt. 556',
          city: 'Gwenborough',
          zipcode: '92998-3874',
          geo: { lat: '-37.3159', lng: '81.1496' }
        },
        phone: '1-770-736-8031 x56442',
        website: 'hildegard.org',
        company: {
          name: 'Romaguera-Crona',
          catchPhrase: 'Multi-layered client-server neural-net',
          bs: 'harness real-time e-markets'
        }
      },
      {
        id: 2,
        name: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        address: {
          street: 'Victor Plains',
          suite: 'Suite 879',
          city: 'Wisokyburgh',
          zipcode: '90566-7771',
          geo: { lat: '-43.9509', lng: '-34.4618' }
        },
        phone: '010-692-6593 x09125',
        website: 'anastasia.net',
        company: {
          name: 'Deckow-Crist',
          catchPhrase: 'Proactive didactic contingency',
          bs: 'synergize scalable supply-chains'
        }
      }
    ];

    it('should get users', async () => {
      mock.onGet('/users').reply(200, mockUsers);

      const result = await client.getUsers();
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockUsers);
    });

    it('should get users with pagination', async () => {
      mock.onGet('/users?_page=1&_limit=1').reply(200, mockUsers.slice(0, 1), {
        'x-total-count': '10'
      });

      const result = await client.getUsersWithPagination({ _page: 1, _limit: 1 });
      
      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.hasNext).toBe(true);
    });

    it('should search users by name', async () => {
      mock.onGet('/users?name=John Doe').reply(200, [mockUsers[0]]);

      const result = await client.searchUsers({ name: 'John Doe' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should search users by username', async () => {
      mock.onGet('/users?username=janesmith').reply(200, [mockUsers[1]]);

      const result = await client.searchUsers({ username: 'janesmith' });
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('janesmith');
    });

    it('should search users with sorting', async () => {
      mock.onGet('/users?_sort=name&_order=asc').reply(200, mockUsers);

      const result = await client.searchUsers({ _sort: 'name', _order: 'asc' });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('Query String Building', () => {
    it('should handle empty options', async () => {
      mock.onGet('/posts').reply(200, []);

      await client.getPostsWithPagination({});
      expect(mock.history.get[0].url).toBe('/posts');
    });

    it('should ignore undefined and null values', async () => {
      mock.onGet('/posts?_page=1').reply(200, []);

      await client.getPostsWithPagination({ _page: 1, _limit: undefined, userId: null });
      expect(mock.history.get[0].url).toBe('/posts?_page=1');
    });

    it('should properly encode query parameters', async () => {
      mock.onGet('/posts?title=Test%20Post&userId=1').reply(200, []);

      await client.searchPosts({ title: 'Test Post', userId: 1 });
      expect(mock.history.get[0].url).toBe('/posts?title=Test%20Post&userId=1');
    });
  });
});

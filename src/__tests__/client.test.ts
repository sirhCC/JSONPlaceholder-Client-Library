import MockAdapter from 'axios-mock-adapter';
import { JsonPlaceholderClient } from '../client';
import { Post } from '../types';

describe('JsonPlaceholderClient', () => {
  let client: JsonPlaceholderClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new JsonPlaceholderClient();
    mock = new MockAdapter(client.client);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should fetch posts', async () => {
    const posts: Post[] = [{ id: 1, userId: 1, title: 'Test Post', body: 'This is a test post.' }];
    mock.onGet('/posts').reply(200, posts);

    const result = await client.getPosts();
    expect(result).toEqual(posts);
  });

  it('should fetch a single post', async () => {
    const post: Post = { id: 1, userId: 1, title: 'Test Post', body: 'This is a test post.' };
    mock.onGet('/posts/1').reply(200, post);

    const result = await client.getPost(1);
    expect(result).toEqual(post);
  });

  it('should create a post', async () => {
    const newPost: Omit<Post, 'id'> = { userId: 1, title: 'New Post', body: 'This is a new post.' };
    const createdPost: Post = { id: 101, ...newPost };
    mock.onPost('/posts').reply(201, createdPost);

    const result = await client.createPost(newPost);
    expect(result).toEqual(createdPost);
  });

  it('should update a post', async () => {
    const updatedPost: Partial<Post> = { title: 'Updated Post' };
    const returnedPost: Post = { id: 1, userId: 1, title: 'Updated Post', body: 'This is a test post.' };
    mock.onPatch('/posts/1').reply(200, returnedPost);

    const result = await client.updatePost(1, updatedPost);
    expect(result).toEqual(returnedPost);
  });

  it('should delete a post', async () => {
    mock.onDelete('/posts/1').reply(200);

    await expect(client.deletePost(1)).resolves.not.toThrow();
  });
});

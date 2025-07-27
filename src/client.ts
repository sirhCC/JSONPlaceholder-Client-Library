import axios, { AxiosInstance } from 'axios';
import { Post, Comment, User } from './types';

const defaultApiUrl = 'https://jsonplaceholder.typicode.com';

export class JsonPlaceholderClient {
  client: AxiosInstance;

  constructor(baseURL: string = defaultApiUrl) {
    this.client = axios.create({
      baseURL,
    });
  }

  async getPosts(): Promise<Post[]> {
    const response = await this.client.get<Post[]>('/posts');
    return response.data;
  }

  async getPost(id: number): Promise<Post> {
    const response = await this.client.get<Post>(`/posts/${id}`);
    return response.data;
  }

  async getComments(postId: number): Promise<Comment[]> {
    const response = await this.client.get<Comment[]>(`/posts/${postId}/comments`);
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response = await this.client.get<User>(`/users/${id}`);
    return response.data;
  }

  async createPost(postData: Omit<Post, 'id'>): Promise<Post> {
    const response = await this.client.post<Post>('/posts', postData);
    return response.data;
  }

  async updatePost(id: number, postData: Partial<Post>): Promise<Post> {
    const response = await this.client.patch<Post>(`/posts/${id}`, postData);
    return response.data;
  }

  async deletePost(id: number): Promise<void> {
    await this.client.delete(`/posts/${id}`);
  }
}

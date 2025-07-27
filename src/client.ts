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
// ... existing code ...
    const response = await this.client.get<User>(`/users/${id}`);
    return response.data;
  }

  async createPost(postData: Omit<Post, 'id'>): Promise<Post> {
    const response = await this.client.post<Post>('/posts', postData);
    return response.data;
  }

  export class JsonPlaceholderClient {
  client: AxiosInstance;

  constructor(baseURL: string = defaultApiUrl) {
    this.client = axios.create({
      baseURL,
    });
  }

  // ... existing code ...

  async updatePost(id: number, postData: Partial<Post>): Promise<Post> {
    const response = await this.client.patch<Post>(`/posts/${id}`, postData);
    return response.data;
  }

  async deletePost(id: number): Promise<void> {
// ... existing code ...
// ... existing code ...

class ApiClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string, baseUrl: string) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    authenticate(): void {
        // Logic for user authentication
    }

    async getRequest(endpoint: string): Promise<any> {
        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        return this.handleResponse(response);
    }

    async postRequest(endpoint: string, data: any): Promise<any> {
        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    private async handleResponse(response: Response): Promise<any> {
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error: ${errorData.message}`);
        }
        return response.json();
    }
}
import { Observable } from 'rxjs';

export interface SearchRequest {
  keyword: string;
  cursor?: string; // base64 encoded createdAt
  limit: number;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  servings: number;
  cookingTime: number;
  userId: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  ingredients: Array<{
    id: number;
    ingredient: string;
    recipeId: number;
    createdAt: string;
    updatedAt: string;
  }>;
  instructions: Array<{
    id: number;
    instruction: string;
    recipeId: number;
    createdAt: string;
    updatedAt: string;
  }>;
  image: {
    id: number;
    url: string;
    recipeId: number;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface SearchResponse {
  recipes: {
    data: Recipe[];
    total: number;
    endCursor?: string;
    hasNextPage?: boolean;
  };
}

export interface SearchService {
  searchRecipes(request: SearchRequest): Observable<SearchResponse>;
}

import { Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { EntityManager } from 'typeorm';
import { MetaData } from '@common/dto/metaData.dto';
import { RecipeDto, RecipeInput, RecipeListDataDto } from './dto/recipe.dto';
import { utcToAsiaJakarta } from '@common/utils/timezone-converter';
import { RecipeIngredientDto } from './dto/recipe-ingredient.dto';
import { RecipeInstructionDto } from './dto/recipe-instruction.dto';
import { RecipeMediaDto } from './dto/recipe-media.dto';
import { UserDto } from '@module/user/dto/user.dto';
import { RecipeRepository } from './recipe.repository';
import { decodeCompositeCursor, decodeCursor } from '@common/utils/cursor';
import { Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import {
  EngagementService,
  LikeRequest,
} from '@module/user/grpc/engagement.interface';
import { EngagementResponseDto } from './dto/engagement.dto';

function safeSerializeError(err: any): string {
  try {
    if (err instanceof Error) {
      return err.stack || err.message;
    }
    const obj: any = {};
    Object.getOwnPropertyNames(err || {}).forEach((k) => {
      try {
        const v = (err as any)[k];
        // primitive or JSON-serializable only
        if (typeof v === 'object') {
          obj[k] = Object.prototype.toString.call(v);
        } else if (typeof v === 'function') {
          obj[k] = '[function]';
        } else {
          obj[k] = v;
        }
      } catch (e) {
        obj[k] = '[unreadable]';
      }
    });
    return JSON.stringify(obj);
  } catch (e) {
    return 'Unserializable error';
  }
}

@Injectable()
export class RecipeService implements OnModuleInit {
  private engagementService: EngagementService;

  constructor(
    private readonly recipeRepository: RecipeRepository,
    private readonly entityManager: EntityManager,
    @Inject('ENGAGEMENT_SERVICE')
    private readonly engagementClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.engagementService =
      this.engagementClient.getService<EngagementService>('EngagementService');
  }

  async create(
    createRecipeInput: RecipeInput,
    userId: number,
  ): Promise<RecipeDto> {
    try {
      const createdRecipe = await this.recipeRepository.create(
        createRecipeInput,
        userId,
      );

      return this.findOne(createdRecipe);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GraphQLError(message);
    }
  }

  async findAll(
    after?: string,
    limit: number = 25,
    search?: string,
  ): Promise<RecipeListDataDto> {
    try {
      let recipes: RecipeDto[] = [];
      let meta: MetaData;

      if (search && search !== '') {
        const [result, total, endCursor, hasNextPage] =
          await this.recipeRepository.searchRecipes(
            search,
            after, // use after as a cursor
            limit,
          );
        recipes = result.data.map((recipe) => this.mapRecipeDto(recipe));
        meta = {
          total,
          ...(endCursor && { endCursor }),
          ...(hasNextPage !== undefined ? { hasNextPage } : {}),
        };
      } else {
        // Cursor-based pagination for hot feed using composite cursor
        let afterScore: number | undefined = undefined;
        let afterDate: string | undefined = undefined;

        if (after) {
          const decoded = decodeCompositeCursor(after);
          if (decoded) {
            afterScore = decoded.score;
            afterDate = decoded.date;
          } else {
            // Fallback for legacy date-only cursor
            const dateOnly = decodeCursor(after);
            afterDate = dateOnly;
          }
        }

        try {
          const result = await this.recipeRepository.findAll({
            afterScore,
            afterDate,
            limit,
          });
          recipes = result.recipes.map((recipe) => this.mapRecipeDto(recipe));
          meta = {
            total: result.meta.total,
            ...(result.meta.endCursor && { endCursor: result.meta.endCursor }),
            ...(result.meta.hasNextPage !== undefined
              ? { hasNextPage: result.meta.hasNextPage }
              : {}),
          };
        } catch (repoError) {
          // Safely serialize repository error for logs and throw a clean GraphQLError
          let serialized: string;
          if (repoError instanceof Error) {
            serialized = repoError.stack || repoError.message;
          } else {
            try {
              serialized = String(repoError);
            } catch (ee) {
              serialized = 'Unserializable error';
            }
          }
          console.error('RecipeRepository.findAll error:', serialized);
          const message =
            repoError instanceof Error
              ? repoError.message
              : 'Internal server error';
          throw new Error(message);
        }
      }

      return new RecipeListDataDto({ recipes, meta });
    } catch (error) {
      // Log safely and return a generic GraphQLError to avoid GraphQL exposing internals
      console.error(
        'RecipeService.findAll unexpected error:',
        safeSerializeError(error),
      );
      throw new GraphQLError('Internal server error');
    }
  }

  private mapRecipeDto(recipe: any): RecipeDto {
    try {
      const createdAt: string = utcToAsiaJakarta(recipe.createdAt);
      const updatedAt: string = utcToAsiaJakarta(recipe.updatedAt);
      const ingredients = recipe.ingredients.map(
        (ingredient) =>
          new RecipeIngredientDto({
            ...ingredient,
            createdAt: utcToAsiaJakarta(ingredient.createdAt),
            updatedAt: utcToAsiaJakarta(ingredient.updatedAt),
          }),
      );
      const instructions = recipe.instructions.map(
        (instruction) =>
          new RecipeInstructionDto({
            ...instruction,
            createdAt: utcToAsiaJakarta(instruction.createdAt),
            updatedAt: utcToAsiaJakarta(instruction.updatedAt),
          }),
      );
      const image: RecipeMediaDto = new RecipeMediaDto({
        ...recipe.image,
        createdAt: utcToAsiaJakarta(recipe.image.createdAt),
        updatedAt: utcToAsiaJakarta(recipe.image.updatedAt),
      });
      const author: UserDto = new UserDto({
        ...recipe.user,
        createdAt: utcToAsiaJakarta(recipe.user.createdAt),
        updatedAt: utcToAsiaJakarta(recipe.user.updatedAt),
      });
      return {
        ...recipe,
        ingredients,
        instructions,
        image,
        author,
        createdAt,
        updatedAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GraphQLError(message);
    }
  }

  async findOne(id: number, userId?: number): Promise<RecipeDto> {
    try {
      const recipe = await this.recipeRepository.findById(id);

      if (!recipe) {
        throw new GraphQLError('Recipe not found.');
      }

      // Check if user has liked this recipe
      const isLiked = await this.recipeRepository.checkIsLiked(id, userId);

      const ingredients = recipe.ingredients.map((ingredient) => {
        const recipeIngredientDto: RecipeIngredientDto =
          new RecipeIngredientDto({
            ...ingredient,
            createdAt: utcToAsiaJakarta(ingredient.createdAt),
            updatedAt: utcToAsiaJakarta(ingredient.updatedAt),
          });

        return recipeIngredientDto;
      });

      const instructions = recipe.instructions.map((instruction) => {
        const recipeInstructionDto: RecipeInstructionDto =
          new RecipeInstructionDto({
            ...instruction,
            createdAt: utcToAsiaJakarta(instruction.createdAt),
            updatedAt: utcToAsiaJakarta(instruction.updatedAt),
          });

        return recipeInstructionDto;
      });

      const image: RecipeMediaDto = new RecipeMediaDto({
        ...recipe.image,
        createdAt: utcToAsiaJakarta(recipe.image.createdAt),
        updatedAt: utcToAsiaJakarta(recipe.image.updatedAt),
      });

      const author: UserDto = new UserDto({
        ...recipe.user,
        createdAt: utcToAsiaJakarta(recipe.user.createdAt),
        updatedAt: utcToAsiaJakarta(recipe.user.updatedAt),
      });

      const result: RecipeDto = {
        ...recipe,
        ingredients,
        instructions,
        image,
        author,
        isLiked,
        createdAt: utcToAsiaJakarta(recipe.createdAt),
        updatedAt: utcToAsiaJakarta(recipe.updatedAt),
      };

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GraphQLError(message);
    }
  }

  async findAllMyRecipes(
    userId: number,
    after?: string,
    limit: number = 25,
    search?: string,
  ): Promise<RecipeListDataDto> {
    try {
      // Cursor-based pagination
      const result = await this.recipeRepository.findAllMyRecipes(
        userId,
        after,
        limit,
        search,
      );

      const recipes: RecipeDto[] = result.recipes.map((recipe) => {
        const createdAt: string = utcToAsiaJakarta(recipe.createdAt);
        const updatedAt: string = utcToAsiaJakarta(recipe.updatedAt);

        const ingredients = recipe.ingredients.map((ingredient) => {
          const recipeIngredientDto: RecipeIngredientDto =
            new RecipeIngredientDto({
              ...ingredient,
              createdAt: utcToAsiaJakarta(ingredient.createdAt),
              updatedAt: utcToAsiaJakarta(ingredient.updatedAt),
            });

          return recipeIngredientDto;
        });

        const instructions = recipe.instructions.map((instruction) => {
          const recipeInstructionDto: RecipeInstructionDto =
            new RecipeInstructionDto({
              ...instruction,
              createdAt: utcToAsiaJakarta(instruction.createdAt),
              updatedAt: utcToAsiaJakarta(instruction.updatedAt),
            });

          return recipeInstructionDto;
        });

        const image: RecipeMediaDto = new RecipeMediaDto({
          ...recipe.image,
          createdAt: utcToAsiaJakarta(recipe.image.createdAt),
          updatedAt: utcToAsiaJakarta(recipe.image.updatedAt),
        });

        const author: UserDto = new UserDto({
          ...recipe.user,
          createdAt: utcToAsiaJakarta(recipe.user.createdAt),
          updatedAt: utcToAsiaJakarta(recipe.user.updatedAt),
        });

        const recipeDto: RecipeDto = {
          ...recipe,
          ingredients,
          instructions,
          image,
          author,
          createdAt,
          updatedAt,
        };

        return recipeDto;
      });

      const metaData: MetaData = {
        total: result.meta.total,
        ...(result.meta.endCursor && { endCursor: result.meta.endCursor }),
        ...(result.meta.hasNextPage !== undefined
          ? { hasNextPage: result.meta.hasNextPage }
          : {}),
      };

      const recipeList: RecipeListDataDto = new RecipeListDataDto({
        recipes,
        meta: metaData,
      });

      return recipeList;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GraphQLError(message);
    }
  }

  async findAllUserRecipes(
    userId: number,
    after?: string,
    limit: number = 25,
    search?: string,
  ): Promise<RecipeListDataDto> {
    try {
      // Cursor-based pagination
      const result = await this.recipeRepository.findAllUserRecipes(
        userId,
        after,
        limit,
        search,
      );

      const recipes: RecipeDto[] = result.recipes.map((recipe) => {
        const createdAt: string = utcToAsiaJakarta(recipe.createdAt);
        const updatedAt: string = utcToAsiaJakarta(recipe.updatedAt);

        const ingredients = recipe.ingredients.map((ingredient) => {
          const recipeIngredientDto: RecipeIngredientDto =
            new RecipeIngredientDto({
              ...ingredient,
              createdAt: utcToAsiaJakarta(ingredient.createdAt),
              updatedAt: utcToAsiaJakarta(ingredient.updatedAt),
            });

          return recipeIngredientDto;
        });

        const instructions = recipe.instructions.map((instruction) => {
          const recipeInstructionDto: RecipeInstructionDto =
            new RecipeInstructionDto({
              ...instruction,
              createdAt: utcToAsiaJakarta(instruction.createdAt),
              updatedAt: utcToAsiaJakarta(instruction.updatedAt),
            });

          return recipeInstructionDto;
        });

        const image: RecipeMediaDto = new RecipeMediaDto({
          ...recipe.image,
          createdAt: utcToAsiaJakarta(recipe.image.createdAt),
          updatedAt: utcToAsiaJakarta(recipe.image.updatedAt),
        });

        const author: UserDto = new UserDto({
          ...recipe.user,
          createdAt: utcToAsiaJakarta(recipe.user.createdAt),
          updatedAt: utcToAsiaJakarta(recipe.user.updatedAt),
        });

        const recipeDto: RecipeDto = {
          ...recipe,
          ingredients,
          instructions,
          image,
          author,
          createdAt,
          updatedAt,
        };

        return recipeDto;
      });

      const metaData: MetaData = {
        total: result.meta.total,
        ...(result.meta.endCursor && { endCursor: result.meta.endCursor }),
        ...(result.meta.hasNextPage !== undefined
          ? { hasNextPage: result.meta.hasNextPage }
          : {}),
      };

      const recipeList: RecipeListDataDto = new RecipeListDataDto({
        recipes,
        meta: metaData,
      });

      return recipeList;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GraphQLError(message);
    }
  }

  async findOneMyRecipe(id: number, userId: number): Promise<RecipeDto> {
    try {
      const recipe = await this.recipeRepository.findOneMyRecipe(id, userId);
      if (!recipe) {
        throw new GraphQLError('Recipe not found.');
      }

      // Check if user has liked this recipe
      const isLiked = await this.recipeRepository.checkIsLiked(id, userId);

      const ingredients = recipe.ingredients.map((ingredient) => {
        const recipeIngredientDto: RecipeIngredientDto =
          new RecipeIngredientDto({
            ...ingredient,
            createdAt: utcToAsiaJakarta(ingredient.createdAt),
            updatedAt: utcToAsiaJakarta(ingredient.updatedAt),
          });

        return recipeIngredientDto;
      });

      const instructions = recipe.instructions.map((instruction) => {
        const recipeInstructionDto: RecipeInstructionDto =
          new RecipeInstructionDto({
            ...instruction,
            createdAt: utcToAsiaJakarta(instruction.createdAt),
            updatedAt: utcToAsiaJakarta(instruction.updatedAt),
          });

        return recipeInstructionDto;
      });

      const image: RecipeMediaDto = new RecipeMediaDto({
        ...recipe.image,
        createdAt: utcToAsiaJakarta(recipe.image.createdAt),
        updatedAt: utcToAsiaJakarta(recipe.image.updatedAt),
      });

      const author: UserDto = new UserDto({
        ...recipe.user,
        createdAt: utcToAsiaJakarta(recipe.user.createdAt),
        updatedAt: utcToAsiaJakarta(recipe.user.updatedAt),
      });

      const result: RecipeDto = {
        ...recipe,
        ingredients,
        instructions,
        image,
        author,
        isLiked,
        createdAt: utcToAsiaJakarta(recipe.createdAt),
        updatedAt: utcToAsiaJakarta(recipe.updatedAt),
      };

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GraphQLError(message);
    }
  }

  async update(
    id: number,
    updateRecipeInput: RecipeInput,
    userId: number,
  ): Promise<RecipeDto> {
    try {
      const existingRecipe = await this.findOne(id);

      if (existingRecipe.author.id !== userId) {
        throw new GraphQLError('Recipe not found for this user id.');
      }

      await this.recipeRepository.update(id, updateRecipeInput, existingRecipe);

      return this.findOne(existingRecipe.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GraphQLError(message);
    }
  }

  async remove(id: number, userId: number): Promise<string> {
    try {
      const existingRecipe = await this.findOne(id);

      if (existingRecipe.author.id !== userId) {
        throw new GraphQLError('Recipe not found for this user id.');
      }

      await this.recipeRepository.delete(id);

      return 'Recipe berhasil dihapus.';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GraphQLError(message);
    }
  }

  async toggleLikeRecipe(
    recipeId: string,
    userId: number,
  ): Promise<EngagementResponseDto> {
    try {
      // Create metadata with user-id for authentication
      const metadata = new Metadata();
      metadata.set('user-id', userId.toString());

      console.log('🔍 Sending LikeRecipe gRPC request:', {
        userId,
        recipeId,
        metadataMap: metadata.getMap(),
      });

      // Create gRPC request
      const request: LikeRequest = {
        userId: userId.toString(),
        recipeId: recipeId,
      };

      // Call gRPC service with metadata
      const response = await firstValueFrom(
        this.engagementService.likeRecipe(request, metadata),
      );

      console.log('✅ Received LikeRecipe gRPC response:', response);

      // Ensure we operate on a plain JS object because some gRPC loaders
      // return protobuf message instances with toObject()/toJSON() methods.
      let rawResp: any = response as any;
      if (rawResp && typeof rawResp.toObject === 'function') {
        rawResp = rawResp.toObject({ defaults: false });
      } else if (rawResp && typeof rawResp.toJSON === 'function') {
        rawResp = rawResp.toJSON();
      } else {
        try {
          rawResp = JSON.parse(JSON.stringify(rawResp));
        } catch (e) {
          // leave as-is if it cannot be serialized
        }
      }

      // Add debug log for normalized response to help troubleshoot missing field
      console.log('🔬 Normalized LikeRecipe response:', rawResp);

      // Deep search helper: look for the first occurrence of any candidate keys in object tree
      const findKeyDeep = (obj: any, candidates: string[]): any => {
        if (obj == null) return undefined;
        if (typeof obj !== 'object') return undefined;
        for (const key of Object.keys(obj)) {
          if (candidates.includes(key)) return obj[key];
        }
        for (const key of Object.keys(obj)) {
          try {
            const val = (obj as any)[key];
            if (val && typeof val === 'object') {
              const found = findKeyDeep(val, candidates);
              if (found !== undefined) return found;
            }
          } catch (e) {
            // ignore
          }
        }
        return undefined;
      };

      // Try direct properties first, then deep search fallback
      let rawIsLiked = rawResp?.is_liked ?? rawResp?.isLiked ?? null;
      if (rawIsLiked === null || rawIsLiked === undefined) {
        rawIsLiked = findKeyDeep(rawResp, ['is_liked', 'isLiked']);
      }

      // Coerce possible types to a proper boolean (handle string/number/bool)
      let isLikedValue: boolean | null = null;
      if (rawIsLiked !== null && rawIsLiked !== undefined) {
        if (typeof rawIsLiked === 'boolean') {
          isLikedValue = rawIsLiked;
        } else if (typeof rawIsLiked === 'number') {
          isLikedValue = rawIsLiked === 1;
        } else if (typeof rawIsLiked === 'string') {
          const lower = rawIsLiked.toLowerCase();
          isLikedValue = lower === 'true' || lower === '1';
        } else {
          isLikedValue = Boolean(rawIsLiked);
        }
      }

      // Construct explicit DTO instance to ensure GraphQL picks up fields correctly
      const resultDto: EngagementResponseDto = new EngagementResponseDto();
      (resultDto as any).success = rawResp?.success ?? response.success;
      (resultDto as any).message = rawResp?.message ?? response.message;
      (resultDto as any).isLiked = isLikedValue;

      console.log('🔬 Returning DTO from toggleLikeRecipe:', resultDto);

      return resultDto;
    } catch (error) {
      console.error('❌ gRPC Error Details:', {
        code: error.code,
        message: error.message,
        details: error.details,
      });

      // Handle gRPC errors gracefully
      if (error.code === 'UNAVAILABLE' || error.code === 14) {
        throw new GraphQLError(
          'Engagement service is currently unavailable. Please try again later.',
        );
      }
      if (error.code === 'UNAUTHENTICATED' || error.code === 16) {
        throw new GraphQLError(
          'Failed to authenticate with engagement service: ' + error.message,
        );
      }
      if (error.code === 'NOT_FOUND' || error.code === 5) {
        throw new GraphQLError('Recipe not found.');
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new GraphQLError(`Failed to toggle like: ${message}`);
    }
  }
}

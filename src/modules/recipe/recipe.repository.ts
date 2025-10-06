import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { EntityManager, Repository } from 'typeorm';
import { RecipeDto, RecipeInput } from './dto/recipe.dto';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeInstruction } from './entities/recipe-instruction.entity';
import { RecipeMedia } from './entities/recipe-media.entity';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SearchRequest, SearchService } from './grpc/search.interface';

@Injectable()
export class RecipeRepository implements OnModuleInit {
  private searchService: SearchService;

  constructor(
    @InjectRepository(Recipe)
    private readonly repository: Repository<Recipe>,
    private readonly entityManager: EntityManager,
    @Inject('SEARCH_SERVICE') private readonly searchClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.searchService =
      this.searchClient.getService<SearchService>('SearchService');
  }

  async create(input: RecipeInput, userId: number) {
    const {
      title,
      description,
      image,
      servings,
      cookingTime,
      ingredients,
      instructions,
    } = input;

    return this.entityManager.transaction(async (manager: EntityManager) => {
      const recipe = await manager
        .createQueryBuilder()
        .insert()
        .into(Recipe)
        .values({
          title,
          description,
          servings,
          cookingTime,
          userId,
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning('*')
        .execute();

      const savedRecipe = recipe.identifiers[0];

      const recipeIngredients = ingredients.map((ingredient) => ({
        ingredient,
        recipeId: savedRecipe.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const insertIngredients = manager
        .createQueryBuilder()
        .insert()
        .into(RecipeIngredient)
        .values(recipeIngredients)
        .execute();

      const recipeInstructions = instructions.map((instruction) => ({
        instruction,
        recipeId: savedRecipe.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const insertInstructions = manager
        .createQueryBuilder()
        .insert()
        .into(RecipeInstruction)
        .values(recipeInstructions)
        .execute();

      await Promise.all([
        insertIngredients,
        insertInstructions,
        manager
          .createQueryBuilder()
          .insert()
          .into(RecipeMedia)
          .values({
            url: image,
            recipeId: savedRecipe.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .execute(),
      ]);

      return savedRecipe.id;
    });
  }

  async findAll(offset: number, limit: number) {
    return this.repository
      .createQueryBuilder('recipes')
      .innerJoinAndSelect(
        'recipes.ingredients',
        'ingredients',
        'ingredients.deleted_at IS NULL',
      )
      .innerJoinAndSelect(
        'recipes.instructions',
        'instructions',
        'instructions.deleted_at IS NULL',
      )
      .innerJoinAndSelect('recipes.image', 'image', 'image.deleted_at IS NULL')
      .innerJoinAndSelect('recipes.user', 'user')
      .where('recipes.deleted_at IS NULL')
      .orderBy('recipes.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  async findById(id: number) {
    return this.repository
      .createQueryBuilder('recipes')
      .innerJoinAndSelect(
        'recipes.ingredients',
        'ingredients',
        'ingredients.deleted_at IS NULL',
      )
      .innerJoinAndSelect(
        'recipes.instructions',
        'instructions',
        'instructions.deleted_at IS NULL',
      )
      .innerJoinAndSelect('recipes.image', 'image', 'image.deleted_at IS NULL')
      .innerJoinAndSelect('recipes.user', 'user')
      .where('recipes.id = :id', { id })
      .andWhere('recipes.deleted_at IS NULL')
      .getOne();
  }

  async findAllMyRecipes(offset: number, limit: number, userId: number) {
    return this.repository
      .createQueryBuilder('recipes')
      .innerJoinAndSelect(
        'recipes.ingredients',
        'ingredients',
        'ingredients.deleted_at IS NULL',
      )
      .innerJoinAndSelect(
        'recipes.instructions',
        'instructions',
        'instructions.deleted_at IS NULL',
      )
      .innerJoinAndSelect('recipes.image', 'image', 'image.deleted_at IS NULL')
      .innerJoinAndSelect('recipes.user', 'user')
      .where('recipes.deleted_at IS NULL')
      .andWhere('recipes.userId = :userId', { userId })
      .orderBy('recipes.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }

  async findOneMyRecipe(id: number, userId: number) {
    return this.repository
      .createQueryBuilder('recipes')
      .innerJoinAndSelect(
        'recipes.ingredients',
        'ingredients',
        'ingredients.deleted_at IS NULL',
      )
      .innerJoinAndSelect(
        'recipes.instructions',
        'instructions',
        'instructions.deleted_at IS NULL',
      )
      .innerJoinAndSelect('recipes.image', 'image', 'image.deleted_at IS NULL')
      .innerJoinAndSelect('recipes.user', 'user')
      .where('recipes.id = :id', { id })
      .andWhere('recipes.deleted_at IS NULL')
      .andWhere('recipes.userId = :userId', { userId })
      .getOne();
  }

  async update(id: number, input: RecipeInput, existingRecipe: RecipeDto) {
    const {
      title,
      description,
      image,
      servings,
      cookingTime,
      ingredients,
      instructions,
    } = input;

    return this.entityManager.transaction(async (manager: EntityManager) => {
      const deleteRecipeIngredients = existingRecipe.ingredients.map(() => {
        return manager
          .createQueryBuilder()
          .delete()
          .from(RecipeIngredient)
          .where('recipeId = :recipeId', { recipeId: existingRecipe.id })
          .execute();
      });

      const deleteRecipeInstructions = existingRecipe.instructions.map(() => {
        return manager
          .createQueryBuilder()
          .delete()
          .from(RecipeInstruction)
          .where('recipeId = :recipeId', { recipeId: existingRecipe.id })
          .execute();
      });

      await Promise.all([deleteRecipeIngredients, deleteRecipeInstructions]);

      await manager
        .createQueryBuilder()
        .update(Recipe)
        .set({
          title,
          description,
          servings,
          cookingTime,
          isFavorite: false,
          updatedAt: new Date(),
        })
        .where('id = :id', { id })
        .execute();

      const recipeIngredients = ingredients.map((ingredient) => ({
        ingredient,
        recipeId: existingRecipe.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const insertIngredients = manager
        .createQueryBuilder()
        .insert()
        .into(RecipeIngredient)
        .values(recipeIngredients)
        .execute();

      const recipeInstructions = instructions.map((instruction) => ({
        instruction,
        recipeId: existingRecipe.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const insertInstructions = manager
        .createQueryBuilder()
        .insert()
        .into(RecipeInstruction)
        .values(recipeInstructions)
        .execute();

      const updateImage = manager
        .createQueryBuilder()
        .update(RecipeMedia)
        .set({
          url: image,
          recipeId: existingRecipe.id,
          updatedAt: new Date(),
        })
        .where('id = :id', { id: existingRecipe.image.id })
        .execute();
      await Promise.all([insertIngredients, insertInstructions, updateImage]);
    });
  }

  async delete(id: number) {
    return this.repository
      .createQueryBuilder()
      .update(Recipe)
      .set({
        deletedAt: new Date(),
      })
      .where('id = :id', { id })
      .execute();
  }

  async searchRecipes(
    keyword: string,
    page: number,
    limit: number,
  ): Promise<[any[], number]> {
    try {
      const searchRequest: SearchRequest = {
        keyword,
        page,
        limit,
      };

      const response = await firstValueFrom(
        this.searchService.searchRecipes(searchRequest),
      );

      console.log('responseSearchService: ', response);

      // Handle cases where response or nested properties are undefined
      if (!response || !response.recipes) {
        console.log('No response or recipes found, returning empty results');
        return [[], 0];
      }

      // Return the data with fallback to empty array and 0 count
      return [response.recipes.data || [], response.recipes.total || 0];
    } catch (error) {
      console.log('errorBro: ', error);
      // Return empty results instead of throwing error for better UX
      console.log('Search service error, returning empty results');
      return [[], 0];
    }
  }
}

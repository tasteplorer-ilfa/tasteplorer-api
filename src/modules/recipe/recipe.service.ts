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

@Injectable()
export class RecipeService {
  constructor(
    private readonly recipeRepository: RecipeRepository,
    private readonly entityManager: EntityManager,
  ) {}

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
      throw new GraphQLError(error.message);
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
        // Cursor-based pagination
        const result = await this.recipeRepository.findAll({ after, limit });
        recipes = result.recipes.map((recipe) => this.mapRecipeDto(recipe));
        meta = {
          total: result.meta.total,
          ...(result.meta.endCursor && { endCursor: result.meta.endCursor }),
          ...(result.meta.hasNextPage !== undefined
            ? { hasNextPage: result.meta.hasNextPage }
            : {}),
        };
      }

      return new RecipeListDataDto({ recipes, meta });
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  private mapRecipeDto(recipe: any): RecipeDto {
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
  }

  async findOne(id: number): Promise<RecipeDto> {
    try {
      const recipe = await this.recipeRepository.findById(id);

      if (!recipe) {
        throw new GraphQLError('Recipe not found.');
      }

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
        createdAt: utcToAsiaJakarta(recipe.createdAt),
        updatedAt: utcToAsiaJakarta(recipe.updatedAt),
      };

      return result;
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async findAllMyRecipes(
    userId: number,
    after?: string,
    limit: number = 25,
  ): Promise<RecipeListDataDto> {
    try {
      // Cursor-based pagination
      const result = await this.recipeRepository.findAllMyRecipes(
        userId,
        after,
        limit,
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
      throw new GraphQLError(error.message);
    }
  }

  async findOneMyRecipe(id: number, userId: number): Promise<RecipeDto> {
    try {
      const recipe = await this.recipeRepository.findOneMyRecipe(id, userId);
      if (!recipe) {
        throw new GraphQLError('Recipe not found.');
      }

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
        createdAt: utcToAsiaJakarta(recipe.createdAt),
        updatedAt: utcToAsiaJakarta(recipe.updatedAt),
      };

      return result;
    } catch (error) {
      throw new GraphQLError(error.message);
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
      throw new GraphQLError(error.message);
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
      throw new GraphQLError(error.message);
    }
  }
}

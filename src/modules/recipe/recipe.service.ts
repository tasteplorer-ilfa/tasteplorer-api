import { maxPageValidation, setPage } from '@common/utils/maxPageValidation';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GraphQLError } from 'graphql';
import { Recipe } from './entities/recipe.entity';
import { EntityManager, Repository } from 'typeorm';
import { MetaData } from '@common/dto/metaData.dto';
import { RecipeDto, RecipeInput, RecipeListDataDto } from './dto/recipe.dto';
import { utcToAsiaJakarta } from '@common/utils/timezone-converter';
import { RecipeIngredientDto } from './dto/recipe-ingredient.dto';
import { RecipeInstructionDto } from './dto/recipe-instruction.dto';
import { RecipeMediaDto } from './dto/recipe-media.dto';
import { UserDto } from '@module/user/dto/user.dto';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeInstruction } from './entities/recipe-instruction.entity';
import { RecipeMedia } from './entities/recipe-media.entity';

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(
    createRecipeInput: RecipeInput,
    userId: number,
  ): Promise<RecipeDto> {
    const {
      title,
      description,
      image,
      servings,
      cookingTime,
      ingredients,
      instructions,
    } = createRecipeInput;

    try {
      const createdRecipe = await this.entityManager.transaction(
        async (manager: EntityManager) => {
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
        },
      );

      return this.findOne(createdRecipe);
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }

  async findAll(page: number, pageSize: number): Promise<RecipeListDataDto> {
    maxPageValidation(pageSize);
    const offset = setPage(page, pageSize);

    try {
      const data = await this.recipeRepository
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
        .innerJoinAndSelect(
          'recipes.image',
          'image',
          'image.deleted_at IS NULL',
        )
        .innerJoinAndSelect('recipes.user', 'user')
        .where('recipes.deleted_at IS NULL')
        .orderBy('recipes.createdAt', 'DESC')
        .skip(offset)
        .take(pageSize)
        .getManyAndCount();

      const recipes: RecipeDto[] = data[0].map((recipe) => {
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
        pageSize,
        currentPage: page,
        total: data[1],
        totalPage: Math.ceil(data[1] / pageSize),
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

  async findOne(id: number): Promise<RecipeDto> {
    try {
      const recipe = await this.recipeRepository
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
        .innerJoinAndSelect(
          'recipes.image',
          'image',
          'image.deleted_at IS NULL',
        )
        .innerJoinAndSelect('recipes.user', 'user')
        .where('recipes.id = :id', { id })
        .andWhere('recipes.deleted_at IS NULL')
        .getOne();

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
    page: number,
    pageSize: number,
    userId: number,
  ): Promise<RecipeListDataDto> {
    maxPageValidation(pageSize);
    const offset = setPage(page, pageSize);

    try {
      const data = await this.recipeRepository
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
        .innerJoinAndSelect(
          'recipes.image',
          'image',
          'image.deleted_at IS NULL',
        )
        .innerJoinAndSelect('recipes.user', 'user')
        .where('recipes.deleted_at IS NULL')
        .andWhere('recipes.userId = :userId', { userId })
        .orderBy('recipes.createdAt', 'DESC')
        .skip(offset)
        .take(pageSize)
        .getManyAndCount();

      const recipes: RecipeDto[] = data[0].map((recipe) => {
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
        pageSize,
        currentPage: page,
        total: data[1],
        totalPage: Math.ceil(data[1] / pageSize),
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
      const recipe = await this.recipeRepository
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
        .innerJoinAndSelect(
          'recipes.image',
          'image',
          'image.deleted_at IS NULL',
        )
        .innerJoinAndSelect('recipes.user', 'user')
        .where('recipes.id = :id', { id })
        .andWhere('recipes.deleted_at IS NULL')
        .andWhere('recipes.userId = :userId', { userId })
        .getOne();

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
      const {
        title,
        description,
        image,
        servings,
        cookingTime,
        ingredients,
        instructions,
      } = updateRecipeInput;

      const existingRecipe = await this.findOne(id);

      if (existingRecipe.author.id !== userId) {
        throw new GraphQLError('Recipe not found for this user id.');
      }

      await this.entityManager.transaction(async (manager: EntityManager) => {
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

      await this.recipeRepository
        .createQueryBuilder()
        .update(Recipe)
        .set({
          deletedAt: new Date(),
        })
        .where('id = :id', { id })
        .execute();

      return 'Recipe berhasil dihapus.';
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }
}

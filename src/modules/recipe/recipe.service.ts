import { maxPageValidation, setPage } from '@common/utils/maxPageValidation';
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
    page: number,
    pageSize: number,
    search: string,
  ): Promise<RecipeListDataDto> {
    maxPageValidation(pageSize);

    const offset = setPage(page, pageSize);

    try {
      let data: any[] = [];
      let total = 0;

      if (search && search !== '') {
        const searchResult = await this.recipeRepository.searchRecipes(
          search,
          page,
          pageSize,
        );
        data = searchResult[0];
        total = searchResult[1];
        console.log(
          'resultnyo: ',
          await this.recipeRepository.searchRecipes(search, page, pageSize),
        );
        console.log('imageDTO: ', data[0]);
      } else {
        const dbResult = await this.recipeRepository.findAll(offset, pageSize);
        data = dbResult[0];
        total = dbResult[1];
      }

      const recipes: RecipeDto[] = data.map((recipe) => {
        console.log('recipeCreatedAt: ', recipe.createdAt);

        const createdAt: string = utcToAsiaJakarta(recipe.createdAt);
        console.log('cnvtredCreatedAt: ', createdAt);

        const updatedAt: string = utcToAsiaJakarta(recipe.updatedAt);

        console.log('ing: ', recipe.ingredients);

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

        console.log('imageNyo: ', image);

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
        total,
        totalPage: Math.ceil(total / pageSize),
      };

      const recipeList: RecipeListDataDto = new RecipeListDataDto({
        recipes,
        meta: metaData,
      });

      return recipeList;
    } catch (error) {
      console.log('errNih: ', error);

      throw new GraphQLError(error.message);
    }
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
    page: number,
    pageSize: number,
    userId: number,
  ): Promise<RecipeListDataDto> {
    maxPageValidation(pageSize);
    const offset = setPage(page, pageSize);

    try {
      const [data, total] = await this.recipeRepository.findAllMyRecipes(
        offset,
        pageSize,
        userId,
      );

      const recipes: RecipeDto[] = data.map((recipe) => {
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
        total,
        totalPage: Math.ceil(total / pageSize),
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

import { Resolver, Query, Args, Int, Mutation, ID } from '@nestjs/graphql';
import { RecipeService } from './recipe.service';
import { Recipe } from './entities/recipe.entity';
import { RecipeDto, RecipeInput, RecipeListDataDto } from './dto/recipe.dto';
import { CurrentUser } from '@module/user/decorator/current-user.decorator';
import { TokenPayload } from '@common/dto/tokenPayload.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@module/auth/guards/jwt-auth.guard';
import { InputValidationPipe } from '@common/middleware/auth/input-validation.pipe';
import {
  CreateRecipeSchema,
  UpdateRecipeSchema,
} from './dto/recipe.validation.schema';

@Resolver(() => Recipe)
export class RecipeResolver {
  constructor(private readonly recipeService: RecipeService) {}

  @Mutation(() => RecipeDto)
  @UseGuards(JwtAuthGuard)
  createRecipe(
    @Args('input', new InputValidationPipe(CreateRecipeSchema))
    createRecipeInput: RecipeInput,
    @CurrentUser() user: TokenPayload,
  ): Promise<RecipeDto> {
    return this.recipeService.create(createRecipeInput, user.sub);
  }

  @Mutation(() => RecipeDto)
  @UseGuards(JwtAuthGuard)
  async updateRecipe(
    @Args('id', { type: () => ID }) id: number,
    @Args('input', new InputValidationPipe(UpdateRecipeSchema))
    updateRecipeInput: RecipeInput,
    @CurrentUser() user: TokenPayload,
  ): Promise<RecipeDto> {
    return this.recipeService.update(id, updateRecipeInput, user.sub);
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard)
  async removeRecipe(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: TokenPayload,
  ): Promise<string> {
    return this.recipeService.remove(id, user.sub);
  }

  @Query(() => RecipeListDataDto, { name: 'recipeList' })
  async recipeList(
    @Args('after', { type: () => String, nullable: true }) after: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit: number,
    @Args('search', { type: () => String, nullable: true }) search: string,
  ): Promise<RecipeListDataDto> {
    return this.recipeService.findAll(after, limit, search);
  }

  @Query(() => RecipeDto, { name: 'recipeDetail' })
  async recipeDetail(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<RecipeDto> {
    return this.recipeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => RecipeListDataDto, { name: 'myRecipeList' })
  async myRecipeList(
    @Args('page', { type: () => Int }) page: number,
    @Args('pageSize', { type: () => Int }) pageSize: number,
    @CurrentUser() user: TokenPayload,
  ): Promise<RecipeListDataDto> {
    return this.recipeService.findAllMyRecipes(page, pageSize, user.sub);
  }

  @Query(() => RecipeDto, { name: 'myRecipeDetail' })
  @UseGuards(JwtAuthGuard)
  async myRecipeDetail(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: TokenPayload,
  ): Promise<RecipeDto> {
    return this.recipeService.findOneMyRecipe(id, user.sub);
  }

  // TODO: Add myRecipeDetail, it can handle when user open their own recipe and when redirect to recipe edit page in front, so if user try to by pass recipe id from url, it will call this query, so it will face the error because the recipe is not his own recipe.
}

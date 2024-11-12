import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeResolver } from './recipe.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeInstruction } from './entities/recipe-instruction.entity';
import { RecipeMedia } from './entities/recipe-media.entity';
import { AuthModule } from '@module/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recipe,
      RecipeIngredient,
      RecipeInstruction,
      RecipeMedia,
    ]),
    AuthModule,
  ],
  providers: [RecipeResolver, RecipeService],
})
export class RecipeModule {}


import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { RecipeService } from "../recipes/recipe.service";

@Injectable({providedIn: 'root'})
export class DataStorageService {
  private recipeUrl = 'https://ng-course-recipe-book-80127.firebaseio.com/recipes.json';

  constructor(private http: HttpClient, private recipeService: RecipeService) {}

  public storeRecipe(): void {
    const recipes = this.recipeService.getRecipes();

    this.http.put(this.recipeUrl, recipes)
      .subscribe(response => {
        console.log(response);
      });
  }
}

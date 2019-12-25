
import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { RecipeService } from "../recipes/recipe.service";
import { Recipe } from "../recipes/recipe.model";
import { map, tap, take, exhaustMap} from 'rxjs/operators';
import { Observable } from "rxjs";
import { AuthService } from "../auth/auth.service";

@Injectable({providedIn: 'root'})
export class DataStorageService {
  private recipeUrl = 'https://ng-course-recipe-book-80127.firebaseio.com/recipes.json';

  constructor(private http: HttpClient, private recipeService: RecipeService, private authService: AuthService) {}

  public storeRecipe(): void {
    const recipes = this.recipeService.getRecipes();

    this.http.put(this.recipeUrl, recipes)
      .subscribe(response => {
        console.log(response);
      });
  }

  public fetchRecipes() {
    return this.http.get<Recipe[]>(this.recipeUrl)
      .pipe(
        map(recipes => {
          return recipes.map(recipe => {
            return {
              ... recipe, 
              ingredients: recipe.ingredients ? recipe.ingredients : []
            }
          });
        }),
        tap(recipes => {
          this.recipeService.setRecipes(recipes);
        })
      );
  }
}

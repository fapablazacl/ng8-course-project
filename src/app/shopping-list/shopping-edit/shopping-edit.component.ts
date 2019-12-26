import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild
} from '@angular/core';

import { Ingredient } from '../../shared/ingredient.model';
import { ShoppingListService } from '../shopping-list.service';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { AddIngredient, UpdateIngredient, DeleteIngredient } from '../store/shopping-list.actions';

@Component({
  selector: 'app-shopping-edit',
  templateUrl: './shopping-edit.component.html',
  styleUrls: ['./shopping-edit.component.css']
})
export class ShoppingEditComponent implements OnInit, OnDestroy {
  @ViewChild('f', {static: false}) slForm: NgForm;

  subscription: Subscription;
  editMode = false;
  editedItemIndex: number;
  editedItem: Ingredient;

  constructor(
      private slService: ShoppingListService, 
      private store: Store<{ingredients: Ingredient[]}>
  ) {}

  ngOnInit() {
    this.subscription = this.slService.startedEditing
      .subscribe((index: number) => {
        this.editedItemIndex = index;
        this.editMode = true;
        this.editedItem = this.slService.getIngredient(index);
        this.slForm.setValue({
          name: this.editedItem.name,
          amount: this.editedItem.amount
        });
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onSubmit(form: NgForm) {
    const value = form.value;
    const newIngredient = new Ingredient(value.name, value.amount);

    if (this.editMode) {
      // this.slService.updateIngredient(this.editedItemIndex, newIngredient);

      this.store.dispatch(
        new UpdateIngredient({index: this.editedItemIndex, ingredient: newIngredient}));
    } else {
      // OLD WAY
      // this.slService.addIngredient(newIngredient);

      // NEW WAY
      // DOC: dispatch some action
      this.store.dispatch(new AddIngredient(newIngredient));
    }

    this.editMode = false;
    form.reset();
  }

  onClear(): void {
    this.slForm.reset();
    this.editMode = false;
  }

  onDelete(): void {
    // this.slService.deleteIngredient(this.editedItemIndex);
    this.store.dispatch(new DeleteIngredient(this.editedItemIndex));
    this.onClear();
  }
}

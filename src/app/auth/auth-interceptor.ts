
import { Injectable } from "@angular/core";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpParams } from "@angular/common/http";
import { AuthService } from "./auth.service";
import { exhaustMap, take, map } from "rxjs/operators";
import * as fromApp from '../store/app.reducer';
import { Store } from "@ngrx/store";
import { authReducer } from "./store/auth.reducer";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private store: Store<fromApp.AppState>) {}

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    return this.store.select('auth').pipe(
      take(1),
      map(authState => {
        return authState.user;
      }),
      exhaustMap(user => {
        if (user) {
          const modifiedRequest = request.clone({params: new HttpParams().set('auth', user.token)});
          return next.handle(modifiedRequest);
        } 

        return next.handle(request);
      })
    );

    /*
    return this.authService.userSubject.pipe(
      take(1),
      exhaustMap(user => {

        if (user) {
          const modifiedRequest = request.clone({params: new HttpParams().set('auth', user.token)});
          return next.handle(modifiedRequest);
        } 

        return next.handle(request);
      })
    );
    */
  }
}

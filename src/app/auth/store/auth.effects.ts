import { Actions, ofType, Effect } from '@ngrx/effects';

import * as AuthActions from './auth.actions';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

@Injectable()
export class AuthEffects {
  @Effect()
  authSignup = this.actions$.pipe(
    ofType(AuthActions.SIGNUP_START)
  );

  @Effect()
  authLogin = this.actions$.pipe(
    ofType(AuthActions.LOGIN_START),
    switchMap((authData: AuthActions.LoginStart) => {
      const url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=' + environment.firebaseAPIKey;

      return this.http.post<AuthResponseData> (
        url, {
          email: authData.payload.email,
          password: authData.payload.password,
          returnSecureToken: true
        }).pipe(
          /*
          catchError( (error) => {
            return of();
          }), */
          map( (responseData: AuthResponseData) => {
            const expirationDate = new Date(new Date().getTime() + +responseData.expiresIn * 1000);

            return new AuthActions.AuthenticateSuccess({
              email: responseData.email,
              userId: responseData.localId,
              token: responseData.idToken,
              expirationDate: expirationDate
            });
          }), 
          catchError( (errorResponse) => {
            let msg = "Unknown error ocurred!";

            if (!errorResponse.error || !errorResponse.error.error) {
              return of(new AuthActions.AuthenticateFail(msg));
            }
        
            switch (errorResponse.error.error.message) {
              case 'EMAIL_EXISTS':
                msg = "The email exists already";
                break;
        
              case 'EMAIL_NOT_FOUND':
                msg = "The email doesn't exists";
                break;
        
              case 'INVALID_PASSWORD':
                msg = "Invalid passwrod";
                break;
            }
        
            return of(new AuthActions.AuthenticateFail(msg));
          })
        );
    })
  );

  @Effect({dispatch: false})
  authSuccess = this.actions$.pipe(
    ofType(AuthActions.AUTHENTICATE_SUCCESS), 
    tap(() => {
      this.router.navigate(['/']);
    })
  );

  constructor(private actions$: Actions, private http: HttpClient, private router: Router) {}
}

import { Actions, ofType, Effect } from '@ngrx/effects';

import * as AuthActions from './auth.actions';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../user.model';
import { AuthService } from '../auth.service';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

const handleAuthentication = (responseData: AuthResponseData) => {
  const expirationDate = new Date(new Date().getTime() + +responseData.expiresIn * 1000);

  const user = new User(responseData.email,
    responseData.localId,
    responseData.idToken, expirationDate
  );

  console.log("Stored into localStorare!");

  localStorage.setItem('userData', JSON.stringify(user));

  return new AuthActions.AuthenticateSuccess({
    email: responseData.email,
    userId: responseData.localId,
    token: responseData.idToken,
    expirationDate: expirationDate
  });
}

const handleError = (errorResponse) => {
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
}


@Injectable()
export class AuthEffects {
  @Effect()
  authSignup = this.actions$.pipe(
    ofType(AuthActions.SIGNUP_START),
    switchMap( (signupAction: AuthActions.SignupStart) => {
      const url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=' + environment.firebaseAPIKey;
      return this.http
        .post<AuthResponseData> (
          url, {
            email: signupAction.payload.email,
            password: signupAction.payload.password,
            returnSecureToken: true
          })
        .pipe(
          tap(responseData => {
            this.authService.setLogoutTimer(+responseData.expiresIn * 1000);
          }),
          map(handleAuthentication),
          catchError(handleError)
        );
    })
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
          map(handleAuthentication), 
          catchError(handleError)
        );
    })
  );

  @Effect({dispatch: false})
  authRedirect = this.actions$.pipe(
    ofType(AuthActions.AUTHENTICATE_SUCCESS, AuthActions.LOGOUT), 
    tap(() => {
      this.router.navigate(['/']);
    })
  );

  @Effect()
  authLogout = this.actions$.pipe(
    ofType(AuthActions.LOGOUT),
    tap(() => {
      localStorage.removeItem('userData');
    })
  );

  @Effect()
  autoLogin = this.actions$.pipe(
    ofType(AuthActions.AUTO_LOGIN),
    map(() => {
      const userData: {
        email: string;
        id: string;
        _token: string;
        _tokenExpirationDate: string;
      } = JSON.parse(localStorage.getItem('userData'));
  
      if (!userData) {
        return {type: 'DUMMY'};
      }
  
      const loadedUser = new User(
        userData.email, 
        userData.id, 
        userData._token, 
        new Date(userData._tokenExpirationDate)
      );
  
      if (loadedUser.token) {
        // this.userSubject.next(loadedUser);
        return new AuthActions.AuthenticateSuccess({
          email: loadedUser.email,
          userId: loadedUser.id,
          token: loadedUser.token,
          expirationDate: new Date(userData._tokenExpirationDate)
        });
  
        // const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
        // this.autoLogout(expirationDuration);
      }

      return {type: 'DUMMY'};
    })
  );

  constructor(
    private actions$: Actions, 
    private http: HttpClient, 
    private router: Router,
    private authService: AuthService
  ) {}
}

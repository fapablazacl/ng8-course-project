
import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { catchError, tap } from "rxjs/operators";
import { throwError, Subject, BehaviorSubject } from "rxjs";
import { User } from "./user.model";
import { Router } from "@angular/router";
import { environment } from '../../environments/environment';
import { Store } from "@ngrx/store";
import * as fromApp from '../store/app.reducer';
import * as AuthActions from './store/auth.actions';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

@Injectable({providedIn: 'root'})
export class AuthService {
  private tokenExpirationTimer: any;
  
  constructor(
    private http: HttpClient, 
    private router: Router, 
    private store: Store<fromApp.AppState>
  ) {}

  signup(email:string, password: string) {
    const url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=' + environment.firebaseAPIKey;

    return this.http.post<AuthResponseData> (
      url, {
        email: email,
        password: password,
        returnSecureToken: true
      })
      .pipe(catchError(this.handleError), tap(responseData => {
        this.handleAuthentication(
          responseData.email, 
          responseData.localId, 
          responseData.idToken, 
          +responseData.expiresIn
        )
      }));
  }

  login(email: string, password: string) {
    const url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=' + environment.firebaseAPIKey;

    return this.http.post<AuthResponseData> (
      url, {
        email: email,
        password: password,
        returnSecureToken: true
      })
      .pipe(
        catchError(this.handleError),
        tap(responseData => {
          this.handleAuthentication(
            responseData.email, 
            responseData.localId, 
            responseData.idToken, 
            +responseData.expiresIn
          )
        })
      );
  }

  private handleAuthentication(email: string, userId: string, token: string, expiresIn: number) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);

    // this.userSubject.next(user);
    this.store.dispatch(new AuthActions.Login({
      email, userId, token, expirationDate
    }));

    this.autoLogout(expiresIn * 1000);

    localStorage.setItem('userData', JSON.stringify(user));
  }

  private handleError(errorResponse: HttpErrorResponse) {
    let msg = "Unknown error ocurred!";

    if (!errorResponse.error || !errorResponse.error.error) {
      return throwError(msg);
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

    return throwError(msg);
  }

  logout() {
    // this.userSubject.next(null);
    this.store.dispatch(new AuthActions.Logout());

    this.router.navigate(['/auth']);

    localStorage.removeItem('userData');

    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  autoLogin() {
    const userData: {
      email: string;
      id: string;
      _token: string;
      _tokenExpirationDate: string;
    } = JSON.parse(localStorage.getItem('userData'));

    if (!userData) {
      return;
    }

    const loadedUser = new User(
      userData.email, 
      userData.id, 
      userData._token, 
      new Date(userData._tokenExpirationDate)
    );

    if (loadedUser.token) {
      // this.userSubject.next(loadedUser);
      this.store.dispatch(new AuthActions.Login({
        email: loadedUser.email,
        userId: loadedUser.id,
        token: loadedUser.token,
        expirationDate: new Date(userData._tokenExpirationDate)
      }));

      const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();

      this.autoLogout(expirationDuration);
    }
  }
}

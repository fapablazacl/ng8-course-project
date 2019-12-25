
import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { catchError } from "rxjs/operators";
import { throwError } from "rxjs";
import { NoPreloading } from "@angular/router";

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

  constructor(private http: HttpClient) {}

  signup(email:string, password: string) {
    const url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key= AIzaSyDozjoocYJyAtj0J6thHkL4hTsQFUFWEr0';

    return this.http.post<AuthResponseData> (
      url, {
        email: email,
        password: password,
        returnSecureToken: true
      })
      .pipe(catchError(this.handleError));
  }

  login(email: string, password: string) {
    const url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyDozjoocYJyAtj0J6thHkL4hTsQFUFWEr0';

    return this.http.post<AuthResponseData> (
      url, {
        email: email,
        password: password,
        returnSecureToken: true
      })
      .pipe(catchError(this.handleError));
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
}

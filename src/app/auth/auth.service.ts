
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError } from "rxjs/operators";
import { throwError } from "rxjs";

interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

@Injectable({providedIn: 'root'})
export class AuthService {
  private url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key= AIzaSyDozjoocYJyAtj0J6thHkL4hTsQFUFWEr0';

  constructor(private http: HttpClient) {}

  signup(email:string, password: string) {
    return this.http.post<AuthResponseData> (
      this.url, {
        email: email,
        password: password,
        returnSecureToken: true
      })
      .pipe(catchError( (errorResponse) => {
        let msg = "Unknown error ocurred!";

        if (!errorResponse.error || !errorResponse.error.error) {
          return throwError(msg);
        }

        switch (errorResponse.error.error.message) {
          case 'EMAIL_EXISTS':
            msg = "The email exists already";
        }

        return throwError(msg);
      }))
      ;
  }
}

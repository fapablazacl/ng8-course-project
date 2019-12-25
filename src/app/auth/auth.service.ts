
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

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
      });
  }
}

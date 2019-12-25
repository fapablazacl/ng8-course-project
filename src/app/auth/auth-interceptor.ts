
import { Injectable } from "@angular/core";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpParams } from "@angular/common/http";
import { AuthService } from "./auth.service";
import { exhaustMap, take } from "rxjs/operators";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler) {
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
  }
}

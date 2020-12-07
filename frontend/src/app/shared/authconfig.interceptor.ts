import { AuthService } from './../services/auth.service';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

// Para inyectar en constructores
@Injectable()

export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}

    // Modifica la petición HTTP añadiendole la cabecera con el jwt
    intercept(req: HttpRequest<any>, next: HttpHandler){
        if(this.authService.isLoggedIn()){
            const authToken = this.authService.getToken();
            console.log('authToken', authToken);
            const authReq = req.clone({
                setHeaders: {
                    Authorization: 'Bearer ' + authToken
                }
            });
            console.log('authReq', authReq);
            return next.handle(authReq);
        }
        return next.handle(req);
    }
}
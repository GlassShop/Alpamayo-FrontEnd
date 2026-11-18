import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';
import { AppErrorStore } from './shared/application/app-error.store';

import { routes } from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideTranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';
import {iamInterceptor} from './iam/infrastructure/iam.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([iamInterceptor])),
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json'}),
      fallbackLang: 'es',
    }),
    // A page that fails to open must never leave a blank screen.
    provideRouter(routes, withNavigationErrorHandler(event => inject(AppErrorStore).handleNavigationError(event.error)))
  ]
};

import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideTranslateService} from '@ngx-translate/core';
import {routes} from './app.routes';

describe('app routes', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes), provideHttpClient(), provideHttpClientTesting(),
        provideTranslateService({fallbackLang: 'es'})
      ]
    });
    router = TestBed.inject(Router);
  });

  it('sends the root "/" to the quoter instead of a blank page', async () => {
    await router.navigateByUrl('/');
    expect(router.url).toBe('/cotizador');
  });

  it('keeps the sign-in page reachable', async () => {
    await router.navigateByUrl('/iniciar-sesion');
    expect(router.url).toBe('/iniciar-sesion');
  });

  it('shows the not-found page for unknown paths', async () => {
    await router.navigateByUrl('/no-existe');
    expect(router.url).toBe('/no-existe');
  });
});

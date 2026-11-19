import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideTranslateService} from '@ngx-translate/core';
import {routes} from './app.routes';
import {signInAs} from './testing/iam-testing';

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

  describe('without a session', () => {
    it('sends the root "/" to sign in instead of a blank page', async () => {
      await router.navigateByUrl('/');
      expect(router.url).toBe('/iniciar-sesion?volver=%2Fcotizador');
    });

    it('protects every page and remembers where the user was going', async () => {
      await router.navigateByUrl('/catalogo');
      expect(router.url).toBe('/iniciar-sesion?volver=%2Fcatalogo');
    });

    it('keeps the sign-in page public', async () => {
      await router.navigateByUrl('/iniciar-sesion');
      expect(router.url).toBe('/iniciar-sesion');
    });

    it('shows the not-found page for unknown paths', async () => {
      await router.navigateByUrl('/no-existe');
      expect(router.url).toBe('/no-existe');
    });
  });

  describe('as a seller', () => {
    beforeEach(async () => {
      signInAs('SELLER');
      await router.navigateByUrl('/'); // settle the post-sign-in navigation
    });

    it('opens the quoter, saved quotes, the agenda, the catalog, the inventory, purchases and the settings', async () => {
      for (const url of ['/cotizador', '/cotizaciones', '/agenda', '/catalogo', '/inventario', '/inventario/compras', '/configuracion']) {
        await router.navigateByUrl(url);
        expect(router.url).toBe(url);
      }
    });

    it('is sent to the quoter when opening CEO-only pages', async () => {
      await router.navigateByUrl('/usuarios');
      expect(router.url).toBe('/cotizador');
    });

    it('takes old links of merged pages to their new place', async () => {
      await router.navigateByUrl('/compras');
      expect(router.url).toBe('/inventario/compras');
      await router.navigateByUrl('/inventario/costos');
      expect(router.url).toBe('/inventario');
      // The catalog ignores the edit mode for roles without prices.manage.
      await router.navigateByUrl('/catalogo/precios');
      expect(router.url).toBe('/catalogo?editar=precios');
    });

    it('cannot go back to the sign-in page while signed in', async () => {
      await router.navigateByUrl('/iniciar-sesion');
      expect(router.url).toBe('/cotizador');
    });
  });

  describe('as warehouse staff', () => {
    it('has the same access as a seller', async () => {
      signInAs('WAREHOUSE');
      await router.navigateByUrl('/catalogo');
      expect(router.url).toBe('/catalogo');
      await router.navigateByUrl('/agenda');
      expect(router.url).toBe('/agenda');
      await router.navigateByUrl('/usuarios');
      expect(router.url).toBe('/cotizador');
    });
  });

  describe('as the CEO', () => {
    it('opens price editing, users and the agenda', async () => {
      signInAs('CEO');
      await router.navigateByUrl('/agenda');
      expect(router.url).toBe('/agenda');
      await router.navigateByUrl('/catalogo?editar=precios');
      expect(router.url).toBe('/catalogo?editar=precios');
      await router.navigateByUrl('/usuarios');
      expect(router.url).toBe('/usuarios');
    });
  });
});

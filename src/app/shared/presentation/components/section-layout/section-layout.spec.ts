import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ActivatedRoute, provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideTranslateService} from '@ngx-translate/core';
import {SECTION_BADGES, SectionLayout, SectionTab} from './section-layout';
import {signInAs} from '../../../../testing/iam-testing';
import {Role} from '../../../../iam/domain/model/role';

const TABS: SectionTab[] = [
  {link: '/configuracion', labelKey: 'nav.preferences', icon: 'tune'},
  {link: '/usuarios', labelKey: 'nav.users', icon: 'group', permission: 'users.manage'}
];

describe('SectionLayout', () => {
  function render(role: Role, badges?: Record<string, ReturnType<typeof signal<number | null>>>) {
    TestBed.configureTestingModule({
      imports: [SectionLayout],
      providers: [
        provideRouter([{path: '**', children: []}]), provideHttpClient(), provideHttpClientTesting(), provideTranslateService({fallbackLang: 'es'}),
        {provide: ActivatedRoute, useValue: {snapshot: {data: {labelKey: 'nav.settings', tabs: TABS}}}},
        ...(badges ? [{provide: SECTION_BADGES, useValue: badges}] : [])
      ]
    });
    signInAs(role);
    const fixture = TestBed.createComponent(SectionLayout);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows every page of the section the role can open', () => {
    const tabs = render('CEO').querySelectorAll('.sl-tab');
    expect([...tabs].map(t => t.getAttribute('href'))).toEqual(['/configuracion', '/usuarios']);
  });

  it('hides the row when only one page is left for the role', () => {
    expect(render('SELLER').querySelector('.sl-tabs')).toBeNull();
  });

  it('shows a badge only when its number is set', () => {
    const el = render('CEO', {'/usuarios': signal<number | null>(3), '/configuracion': signal<number | null>(null)});
    expect([...el.querySelectorAll('.sl-badge')].map(b => b.textContent?.trim())).toEqual(['3']);
  });
});

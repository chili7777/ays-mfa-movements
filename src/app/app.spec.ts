import { TestBed } from '@angular/core/testing';
import { App } from './app';
describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });
  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
  it('should render micro-frontend title and message', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('ays-mfa-movements');
    expect(compiled.querySelector('p')?.textContent).toContain('Micro-frontend loaded successfully.');
  });
});

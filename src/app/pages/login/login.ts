// login.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputPasswordModule } from 'primeng/inputpassword';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
selector: 'app-login',
standalone: true,
imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputPasswordModule,
    ButtonModule,
    CheckboxModule,
    MessageModule,
    IconFieldModule,
    InputIconModule,
    FloatLabelModule
],
templateUrl: './login.html',
styleUrls: ['./login.css'],
})
export class LoginComponent {
private fb = new FormBuilder();
private authService = inject(AuthService);
private router = inject(Router);
loading = signal(false);
errorMessage = signal<string | null>(null);

form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    remember: [false],
});

mask = true;

async onSubmit() {
    if (this.form.invalid) {
        this.form.markAllAsTouched();
        this.errorMessage.set('Rellena los campos obligatorios');
        return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.form.getRawValue();

    try {
    await firstValueFrom(this.authService.login({
        username: username ?? '',
        password: password ?? '',
    }));
    await this.router.navigate(['/dashboard']);
    } catch {
    this.errorMessage.set('Usuario o contraseña incorrectos.');
    } finally {
    this.loading.set(false);
    }
}
}

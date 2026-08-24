// login.component.ts
import { Component, signal } from '@angular/core';
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
loading = signal(false);
errorMessage = signal<string | null>(null);

form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    remember: [false],
});

mask = true;

onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    // Reemplaza esto con tu llamada real de autenticación
    setTimeout(() => {
    this.loading.set(false);
    this.errorMessage.set('Usuario o contraseña incorrectos.');
    }, 1200);
}
}

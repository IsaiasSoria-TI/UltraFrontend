import { Component, ElementRef, computed, effect, model, signal, viewChild } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { Hsv, esHexValido, hexARgb, hsvARgb, rgbAHex, rgbAHsv } from '../../utils/marca';

let siguienteId = 0;

// Tono alrededor (0° arriba, sentido horario) y saturación del centro (blanco) al borde (color puro)
const FONDO_RUEDA =
  'radial-gradient(circle closest-side, #fff, transparent), ' +
  'conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';

/**
 * Selector de color con rueda (tono y saturación), barra de brillo y campo hexadecimal (color base).
 * [(valor)] es siempre un #rrggbb en minúsculas. Teclado: con el foco en el marcador de la rueda,
 * ← → cambian el tono y ↑ ↓ la saturación (con Mayús, pasos más grandes).
 */
@Component({
  selector: 'app-rueda-color',
  standalone: true,
  imports: [InputTextModule],
  styles: `
    .brillo {
      appearance: none;
      height: 0.75rem;
      border-radius: 9999px;
      cursor: pointer;
    }
    .brillo::-webkit-slider-thumb {
      appearance: none;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 9999px;
      background: #fff;
      border: 2px solid #111827;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
    }
    .brillo::-moz-range-thumb {
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 9999px;
      background: #fff;
      border: 2px solid #111827;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
    }
  `,
  template: `
    <div class="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div
        #rueda
        class="relative aspect-square w-52 max-w-full shrink-0 cursor-crosshair touch-none select-none rounded-full shadow-inner"
        [style.background]="fondoRueda"
        (pointerdown)="empezar($event)"
        (pointermove)="mover($event)"
        (pointerup)="terminar()"
        (pointercancel)="terminar()"
      >
        <!-- Oscurece la rueda según el brillo elegido -->
        <div class="pointer-events-none absolute inset-0 rounded-full bg-black" [style.opacity]="1 - hsv().v"></div>
        <div
          role="slider"
          tabindex="0"
          aria-label="Tono y saturación del color"
          aria-description="Flechas izquierda y derecha cambian el tono; arriba y abajo, la saturación."
          aria-valuemin="0"
          aria-valuemax="359"
          [attr.aria-valuenow]="redondear(hsv().h)"
          [attr.aria-valuetext]="'Tono ' + redondear(hsv().h) + ' grados, saturación ' + redondear(hsv().s * 100) + ' %'"
          (keydown)="teclado($event)"
          class="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md ring-1 ring-black/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:focus-visible:outline-white"
          [style.left.%]="posicion().x"
          [style.top.%]="posicion().y"
          [style.background-color]="hex()"
        ></div>
      </div>

      <div class="flex w-full min-w-0 flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label [for]="id + '-brillo'" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Brillo</label>
          <input
            [id]="id + '-brillo'"
            type="range"
            min="0"
            max="100"
            step="1"
            class="brillo w-full"
            [value]="redondear(hsv().v * 100)"
            [attr.aria-valuetext]="redondear(hsv().v * 100) + ' %'"
            [style.background]="'linear-gradient(to right, #000, ' + tonoPuro() + ')'"
            (input)="cambiarBrillo($event)"
          />
        </div>
        <div class="flex items-end gap-3">
          <span class="h-10 w-10 shrink-0 rounded-lg border border-gray-200 dark:border-zinc-700" [style.background-color]="hex()" aria-hidden="true"></span>
          <div class="flex min-w-0 flex-1 flex-col gap-1.5">
            <label [for]="id + '-hex'" class="text-sm font-medium text-gray-700 dark:text-zinc-300">Color base</label>
            <input
              pInputText
              [id]="id + '-hex'"
              class="w-full font-mono uppercase"
              maxlength="7"
              spellcheck="false"
              autocomplete="off"
              [value]="textoHex()"
              [invalid]="hexInvalido()"
              [attr.aria-describedby]="hexInvalido() ? id + '-error' : null"
              (input)="escribirHex($event)"
              (blur)="salirHex()"
            />
          </div>
        </div>
        @if (hexInvalido()) {
          <small [id]="id + '-error'" class="text-xs text-red-600 dark:text-red-400">Usa el formato #RRGGBB, por ejemplo #7F1D1D.</small>
        }
      </div>
    </div>
  `,
})
export class RuedaColorComponent {
  readonly valor = model<string>('#7f1d1d');

  protected readonly id = `rueda-color-${siguienteId++}`;
  protected readonly fondoRueda = FONDO_RUEDA;
  private readonly rueda = viewChild.required<ElementRef<HTMLDivElement>>('rueda');

  protected readonly hsv = signal<Hsv>(rgbAHsv(hexARgb('#7f1d1d')));
  protected readonly hex = computed(() => rgbAHex(hsvARgb(this.hsv())));
  // El color con brillo máximo: extremo derecho de la barra de brillo
  protected readonly tonoPuro = computed(() => rgbAHex(hsvARgb({ ...this.hsv(), v: 1 })));
  protected readonly posicion = computed(() => {
    const { h, s } = this.hsv();
    const rad = (h * Math.PI) / 180;
    return { x: 50 + 50 * s * Math.sin(rad), y: 50 - 50 * s * Math.cos(rad) };
  });
  protected readonly textoHex = signal('#7f1d1d');
  protected readonly hexInvalido = signal(false);

  // Último valor emitido por este componente: al volver por [(valor)] no recalcula el tono
  // (un gris pierde el tono al pasar a hex y el marcador saltaría)
  private emitido: string | null = null;
  private arrastrando = false;

  constructor() {
    effect(() => {
      const v = this.valor();
      if (v === this.emitido || !esHexValido(v)) return;
      this.hsv.set(rgbAHsv(hexARgb(v)));
      this.textoHex.set(v.toLowerCase());
      this.hexInvalido.set(false);
    });
  }

  protected redondear(n: number): number {
    return Math.round(n);
  }

  protected empezar(e: PointerEvent): void {
    this.arrastrando = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.desdePuntero(e);
  }

  protected mover(e: PointerEvent): void {
    if (this.arrastrando) this.desdePuntero(e);
  }

  protected terminar(): void {
    this.arrastrando = false;
  }

  protected teclado(e: KeyboardEvent): void {
    const paso = e.shiftKey ? 15 : 3;
    const { h, s, v } = this.hsv();
    switch (e.key) {
      case 'ArrowRight':
        this.fijar({ h: (h + paso) % 360, s, v });
        break;
      case 'ArrowLeft':
        this.fijar({ h: (h - paso + 360) % 360, s, v });
        break;
      case 'ArrowUp':
        this.fijar({ h, s: Math.min(1, s + paso / 100), v });
        break;
      case 'ArrowDown':
        this.fijar({ h, s: Math.max(0, s - paso / 100), v });
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  protected cambiarBrillo(e: Event): void {
    this.fijar({ ...this.hsv(), v: Number((e.target as HTMLInputElement).value) / 100 });
  }

  protected escribirHex(e: Event): void {
    let texto = (e.target as HTMLInputElement).value.trim().toLowerCase();
    if (texto && !texto.startsWith('#')) texto = '#' + texto;
    this.textoHex.set(texto);
    if (esHexValido(texto)) {
      this.hexInvalido.set(false);
      this.emitido = texto;
      this.hsv.set(rgbAHsv(hexARgb(texto)));
      this.valor.set(texto);
    }
  }

  // Al salir del campo con un valor incompleto se marca el error (mientras se escribe no)
  protected salirHex(): void {
    this.hexInvalido.set(!esHexValido(this.textoHex()));
  }

  private desdePuntero(e: PointerEvent): void {
    const caja = this.rueda().nativeElement.getBoundingClientRect();
    const dx = e.clientX - (caja.left + caja.width / 2);
    const dy = e.clientY - (caja.top + caja.height / 2);
    const s = Math.min(1, Math.hypot(dx, dy) / (caja.width / 2));
    const h = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    // Con un color casi negro la rueda no mostraría el tono elegido: se sube el brillo
    const v = this.hsv().v < 0.15 ? 0.75 : this.hsv().v;
    this.fijar({ h, s, v });
  }

  private fijar(hsv: Hsv): void {
    this.hsv.set(hsv);
    const hex = this.hex();
    this.emitido = hex;
    this.textoHex.set(hex);
    this.hexInvalido.set(false);
    this.valor.set(hex);
  }
}

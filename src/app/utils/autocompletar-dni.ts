import { DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { EMPTY, Observable, Subject, catchError, finalize, map, startWith, switchMap, tap } from 'rxjs';
import { ClienteService } from '../services/cliente.service';
import { DatosDni } from '../models/cliente.model';
import { mensajeError } from './http-error';

export interface AvisoDni {
  tipo: 'autocompletado' | 'registrado' | 'aviso';
  texto: string;
  // Solo cuando tipo = 'registrado'
  idCliente?: number;
}

const CAMPOS_NOMBRE = ['nombre', 'apellidoPaterno', 'apellidoMaterno'] as const;

/**
 * Autocompleta nombre y apellidos con el DNI cuando la recepcionista pulsa "Consultar" (no es
 * automático: cada consulta gasta del plan de apiperu.dev). Una consulta nueva cancela la anterior.
 * Si falla, los campos quedan vacíos y habilitados para escribir a mano. Llamar en un contexto de
 * inyección; el grupo debe tener los controles tipoDocumento, numeroDocumento, nombre,
 * apellidoPaterno y apellidoMaterno.
 */
export function autocompletarDni(form: FormGroup, activo: () => boolean) {
  const clienteService = inject(ClienteService);
  const destroyRef = inject(DestroyRef);
  const consultando = signal(false);
  const aviso = signal<AvisoDni | null>(null);
  const solicitudes = new Subject<string>();

  // DNI de 8 dígitos listo para consultar (habilita el botón)
  const documento = toSignal(
    form.valueChanges.pipe(
      startWith(null),
      map(() => ({
        tipo: form.get('tipoDocumento')?.value,
        numero: String(form.get('numeroDocumento')?.value ?? '').trim(),
      })),
    ),
    { requireSync: true },
  );
  const disponible = computed(() => documento().tipo === 'DNI');
  const puedeConsultar = computed(() => disponible() && /^\d{8}$/.test(documento().numero) && !consultando());

  const campos = (accion: 'enable' | 'disable') =>
    CAMPOS_NOMBRE.forEach((c) => form.get(c)?.[accion]({ emitEvent: false }));

  const consultar = (dni: string): Observable<DatosDni> => {
    consultando.set(true);
    aviso.set(null);
    campos('disable');
    return clienteService.consultarDni(dni).pipe(
      tap((d) => {
        form.patchValue({ nombre: d.nombres ?? '', apellidoPaterno: d.apellidoPaterno ?? '', apellidoMaterno: d.apellidoMaterno ?? '' });
        aviso.set({ tipo: 'autocompletado', texto: 'Datos obtenidos automáticamente. Verifícalos con el cliente.' });
      }),
      catchError((e: unknown) => {
        if (e instanceof HttpErrorResponse && e.status === 409) {
          aviso.set({ tipo: 'registrado', texto: mensajeError(e, 'Este DNI ya está registrado'), idCliente: e.error?.idCliente });
        } else {
          aviso.set({ tipo: 'aviso', texto: mensajeError(e, 'El autocompletado no está disponible. Ingresa los datos manualmente.') });
        }
        return EMPTY;
      }),
      finalize(() => {
        campos('enable');
        consultando.set(false);
      }),
    );
  };

  solicitudes.pipe(switchMap((dni) => consultar(dni)), takeUntilDestroyed(destroyRef)).subscribe();

  // El aviso corresponde al número consultado: se quita al cambiarlo
  form.get('numeroDocumento')!.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
    if (!consultando()) aviso.set(null);
  });

  return {
    consultando: consultando.asReadonly(),
    aviso: aviso.asReadonly(),
    // Hay que mostrar el botón (tipo DNI) y si se puede pulsar (8 dígitos, sin otra consulta en curso)
    disponible,
    puedeConsultar,
    consultar: () => {
      if (activo() && puedeConsultar()) solicitudes.next(documento().numero);
    },
    limpiar: () => aviso.set(null),
  };
}

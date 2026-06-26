'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import type { DisenoPredefinido } from '@/lib/types';
import { DisenoPredefinidoService } from '../services/diseno-predefinido.service';

interface DisenosPredefinidosManagementScreenProps {
  panel: 'admin' | 'vendedor';
}

interface ImageDimensions {
  width: number;
  height: number;
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MIN_IMAGE_SIZE = 500;
const MAX_IMAGE_SIZE = 2000;

function obtenerDimensionesImagen(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: image.width,
        height: image.height,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen seleccionada.'));
    };

    image.src = objectUrl;
  });
}

async function validarImagen(file: File): Promise<void> {
  const formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg'];

  if (!formatosPermitidos.includes(file.type)) {
    throw new Error('Solo se permiten imágenes PNG o JPG.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('La imagen no debe superar los 2 MB.');
  }

  const dimensions = await obtenerDimensionesImagen(file);

  const resolucionInvalida =
    dimensions.width < MIN_IMAGE_SIZE ||
    dimensions.height < MIN_IMAGE_SIZE ||
    dimensions.width > MAX_IMAGE_SIZE ||
    dimensions.height > MAX_IMAGE_SIZE;

  if (resolucionInvalida) {
    throw new Error(
      'La imagen debe tener una resolución entre 500×500 y 2000×2000 píxeles.',
    );
  }
}

export function DisenosPredefinidosManagementScreen({
  panel,
}: DisenosPredefinidosManagementScreenProps) {
  const [disenos, setDisenos] = useState<DisenoPredefinido[]>([]);
  const [nombre, setNombre] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const cargarDisenos = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await DisenoPredefinidoService.listarActivos();
      setDisenos(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || 'No se pudieron cargar los diseños predefinidos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDisenos();
  }, [cargarDisenos]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const limpiarFormulario = () => {
    setNombre('');
    setFile(null);
    setFieldError(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleFileSelected = async (selectedFile: File | undefined) => {
    setFieldError(null);

    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    try {
      await validarImagen(selectedFile);

      if (previewUrl) URL.revokeObjectURL(previewUrl);

      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } catch (error: any) {
      setFile(null);
      setPreviewUrl(null);
      setFieldError(error.message || 'La imagen seleccionada no es válida.');
    }
  };

  const handleGuardar = async () => {
    const nombreNormalizado = nombre.trim().replace(/\s+/g, ' ');

    if (!nombreNormalizado) {
      setFieldError('El nombre del estampado es obligatorio.');
      return;
    }

    if (nombreNormalizado.length < 2) {
      setFieldError('El nombre del estampado debe tener al menos 2 caracteres.');
      return;
    }

    if (!file) {
      setFieldError('Debes adjuntar una imagen PNG o JPG.');
      return;
    }

    try {
      setIsSaving(true);
      setFieldError(null);

      await DisenoPredefinidoService.registrar({
        nombre: nombreNormalizado,
        file,
      });

      toast({
        title: 'Imagen predefinida registrada exitosamente.',
        description:
          'El estampado ya está disponible para la personalización de prendas.',
      });

      limpiarFormulario();
      await cargarDisenos();
    } catch (error: any) {
      setFieldError(
        error.message || 'No se pudo registrar la imagen predefinida.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async (diseno: DisenoPredefinido) => {
    const id = diseno.idDisenoPredefinido;

    if (!id) {
      toast({
        title: 'Error',
        description: 'El diseño seleccionado no tiene un identificador válido.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas eliminar el estampado "${diseno.nombre}"?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      await DisenoPredefinidoService.desactivar(id);

      toast({
        title: 'Diseño predefinido eliminado.',
        description:
          'El estampado ya no estará disponible para los clientes.',
      });

      setDisenos((prev) =>
        prev.filter((item) => item.idDisenoPredefinido !== id),
      );
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || 'No se pudo eliminar el diseño predefinido.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">
            Diseños predefinidos
          </h1>
          <p className="text-muted-foreground">
            Gestiona estampados disponibles para personalización de prendas.
          </p>
        </div>

        <Badge variant="secondary" className="w-fit">
          {panel === 'admin' ? 'Administrador' : 'Vendedor'}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" />
              Agregar imagen predefinida
            </CardTitle>
            <CardDescription>
              Registra un estampado PNG/JPG de 500×500 a 2000×2000 px y máximo
              2 MB.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-estampado">Nombre del estampado</Label>
              <Input
                id="nombre-estampado"
                placeholder="Ej: Logo Gamer"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagen-estampado">Archivo de imagen</Label>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center transition-colors hover:border-accent/60">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Previsualización del estampado"
                    className="h-28 w-28 rounded-md border bg-card object-contain"
                  />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Selecciona una imagen
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG o JPG, máximo 2 MB
                    </span>
                  </>
                )}

                <input
                  id="imagen-estampado"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  disabled={isSaving}
                  onChange={(event) =>
                    handleFileSelected(event.target.files?.[0])
                  }
                />
              </label>
            </div>

            {fieldError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{fieldError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="flex-1 gap-2"
                onClick={handleGuardar}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Guardar
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={limpiarFormulario}
                disabled={isSaving}
              >
                Agregar otra imagen
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Después de guardar, el formulario queda listo para registrar otro
              estampado sin salir del módulo.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-accent" />
                Estampados registrados
              </CardTitle>
              <CardDescription>
                Imágenes disponibles para clientes durante la personalización.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={cargarDisenos}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Actualizar
            </Button>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex min-h-[260px] items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Cargando estampados...
              </div>
            ) : disenos.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No hay estampados registrados</p>
                <p className="text-sm text-muted-foreground">
                  Agrega una imagen para que los clientes puedan seleccionarla.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {disenos.map((diseno) => (
                  <div
                    key={diseno.idDisenoPredefinido ?? diseno.nombre}
                    className="overflow-hidden rounded-xl border bg-card"
                  >
                    <div className="flex aspect-square items-center justify-center bg-muted/40 p-4">
                      {diseno.urlImagen ? (
                        <img
                          src={diseno.urlImagen}
                          alt={diseno.nombre}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>

                    <div className="space-y-3 p-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {diseno.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID #{diseno.idDisenoPredefinido}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-destructive hover:text-destructive"
                        disabled={deletingId === diseno.idDisenoPredefinido}
                        onClick={() => handleEliminar(diseno)}
                      >
                        {deletingId === diseno.idDisenoPredefinido ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
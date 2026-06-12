"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  Shield,
  AlertTriangle,
  Activity,
  Wrench,
  Trash2,
  Download,
  RefreshCw,
  User,
  Calendar,
  FileText,
  XCircle,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Tipos locales ────────────────────────────────────────────────────────────

type AuditAction = "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "VIEW"
type ErrorLevel  = "ERROR" | "WARNING" | "INFO"

interface AuditLog {
  id: number
  timestamp: string
  usuario: string
  rol: string
  accion: AuditAction
  descripcion: string
  ip: string
  exito: boolean
}

interface ErrorLog {
  id: number
  timestamp: string
  nivel: ErrorLevel
  modulo: string
  mensaje: string
  resuelto: boolean
}

interface MaintenanceConfig {
  activo: boolean
  fechaInicio: string
  fechaFin: string
  mensaje: string
}

// ─── Datos mock locales ───────────────────────────────────────────────────────

const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 1, timestamp: "2026-06-12T10:30:00Z", usuario: "admin@gamarrin.com", rol: "ADMINISTRADOR", accion: "LOGIN", descripcion: "Inicio de sesión exitoso", ip: "192.168.1.5", exito: true },
  { id: 2, timestamp: "2026-06-12T10:35:00Z", usuario: "admin@gamarrin.com", rol: "ADMINISTRADOR", accion: "UPDATE", descripcion: "Actualizó precio del producto ID 3", ip: "192.168.1.5", exito: true },
  { id: 3, timestamp: "2026-06-12T09:15:00Z", usuario: "vendedor1@gamarrin.com", rol: "VENDEDOR", accion: "CREATE", descripcion: "Cotización COT-005 enviada al cliente", ip: "192.168.1.10", exito: true },
  { id: 4, timestamp: "2026-06-12T08:50:00Z", usuario: "desconocido", rol: "-", accion: "LOGIN", descripcion: "Intento de login fallido (3 intentos)", ip: "10.0.0.99", exito: false },
  { id: 5, timestamp: "2026-06-11T17:00:00Z", usuario: "admin@gamarrin.com", rol: "ADMINISTRADOR", accion: "DELETE", descripcion: "Eliminó vendedor ID 7 del sistema", ip: "192.168.1.5", exito: true },
  { id: 6, timestamp: "2026-06-11T14:20:00Z", usuario: "vendedor2@gamarrin.com", rol: "VENDEDOR", accion: "VIEW", descripcion: "Consultó listado de cotizaciones", ip: "192.168.1.12", exito: true },
]

const MOCK_ERROR_LOGS: ErrorLog[] = [
  { id: 1, timestamp: "2026-06-12T10:20:00Z", nivel: "ERROR", modulo: "Pagos", mensaje: "Timeout al conectar con pasarela de pago (código: GATEWAY_TIMEOUT)", resuelto: false },
  { id: 2, timestamp: "2026-06-12T09:00:00Z", nivel: "WARNING", modulo: "Catálogo", mensaje: "Imagen de producto ID 12 no encontrada en almacenamiento", resuelto: true },
  { id: 3, timestamp: "2026-06-11T22:00:00Z", nivel: "INFO", modulo: "Autenticación", mensaje: "Token JWT próximo a expirar para sesión larga", resuelto: true },
  { id: 4, timestamp: "2026-06-11T18:30:00Z", nivel: "ERROR", modulo: "Base de Datos", mensaje: "Consulta tardía detectada (> 5s) en endpoint /productos", resuelto: false },
  { id: 5, timestamp: "2026-06-10T12:00:00Z", nivel: "WARNING", modulo: "Email", mensaje: "3 correos de cotización no pudieron enviarse (SMTP error 550)", resuelto: false },
]

const MAINTENANCE_KEY = "gtt_maintenance"

function getMaintenanceConfig(): MaintenanceConfig {
  if (typeof window === "undefined") return { activo: false, fechaInicio: "", fechaFin: "", mensaje: "" }
  try {
    const stored = localStorage.getItem(MAINTENANCE_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return { activo: false, fechaInicio: "", fechaFin: "", mensaje: "El sistema estará en mantenimiento programado. Disculpe las molestias." }
}

function saveMaintenanceConfig(config: MaintenanceConfig) {
  if (typeof window !== "undefined") {
    localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(config))
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const auditActionLabels: Record<AuditAction, { label: string; color: string }> = {
  LOGIN:  { label: "Login",    color: "bg-blue-100 text-blue-800" },
  LOGOUT: { label: "Logout",   color: "bg-slate-100 text-slate-700" },
  CREATE: { label: "Creación", color: "bg-green-100 text-green-800" },
  UPDATE: { label: "Edición",  color: "bg-yellow-100 text-yellow-800" },
  DELETE: { label: "Eliminar", color: "bg-red-100 text-red-800" },
  VIEW:   { label: "Consulta", color: "bg-purple-100 text-purple-800" },
}

const errorLevelConfig: Record<ErrorLevel, { icon: React.ReactNode; color: string; badge: string }> = {
  ERROR:   { icon: <XCircle className="w-4 h-4" />,    color: "text-red-600",    badge: "bg-red-100 text-red-800" },
  WARNING: { icon: <AlertTriangle className="w-4 h-4" />, color: "text-yellow-600", badge: "bg-yellow-100 text-yellow-800" },
  INFO:    { icon: <Info className="w-4 h-4" />,        color: "text-blue-600",   badge: "bg-blue-100 text-blue-800" },
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminConfiguracionPage() {
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>({ activo: false, fechaInicio: "", fechaFin: "", mensaje: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [auditSearch, setAuditSearch] = useState("")
  const [errorFilter, setErrorFilter] = useState<ErrorLevel | "all">("all")
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  useEffect(() => {
    setMaintenance(getMaintenanceConfig())
  }, [])

  const filteredAudit = MOCK_AUDIT_LOGS.filter(log =>
    log.usuario.includes(auditSearch) ||
    log.descripcion.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.accion.toLowerCase().includes(auditSearch.toLowerCase())
  )

  const filteredErrors = MOCK_ERROR_LOGS.filter(log =>
    errorFilter === "all" || log.nivel === errorFilter
  )

  const unresolvedErrors = MOCK_ERROR_LOGS.filter(e => !e.resuelto).length

  const handleSaveMaintenance = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 600)) // simular latencia
    saveMaintenanceConfig(maintenance)
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleExportLogs = (type: "audit" | "errors") => {
    const data = type === "audit" ? MOCK_AUDIT_LOGS : MOCK_ERROR_LOGS
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${type}_logs_${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Configuracion del Sistema</h1>
        <p className="text-muted-foreground">Logs de auditoría, registro de errores y mantenimiento programado</p>
      </div>

      {/* Alerta de errores sin resolver */}
      {unresolvedErrors > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-800">Atención: {unresolvedErrors} error{unresolvedErrors > 1 ? "es" : ""} sin resolver</p>
            <p className="text-sm text-red-700">Revisa el registro de errores para más detalles.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="auditoria">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="auditoria" className="gap-2">
            <Shield className="w-4 h-4" />
            Auditoria
          </TabsTrigger>
          <TabsTrigger value="errores" className="gap-2">
            <Activity className="w-4 h-4" />
            Errores
            {unresolvedErrors > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs px-1">
                {unresolvedErrors}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mantenimiento" className="gap-2">
            <Wrench className="w-4 h-4" />
            Mantenimiento
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Auditoría ── */}
        <TabsContent value="auditoria" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Log de Auditoria
                  </CardTitle>
                  <CardDescription>Registro de acciones realizadas por usuarios en el sistema (R-30)</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportLogs("audit")}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Buscar por usuario, accion o descripcion..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                className="max-w-sm"
              />
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha / Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Accion</TableHead>
                      <TableHead>Descripcion</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudit.map(log => {
                      const actionCfg = auditActionLabels[log.accion]
                      return (
                        <TableRow key={log.id} className={cn(!log.exito && "bg-red-50/50")}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(log.timestamp).toLocaleString("es-PE", { timeZone: "UTC" })}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{log.usuario}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{log.rol}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs", actionCfg.color)}>{actionCfg.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{log.descripcion}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{log.ip}</TableCell>
                          <TableCell className="text-center">
                            {log.exito
                              ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                              : <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                            }
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                Mostrando {filteredAudit.length} de {MOCK_AUDIT_LOGS.length} registros
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Errores ── */}
        <TabsContent value="errores" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Registro de Errores
                  </CardTitle>
                  <CardDescription>Errores del sistema, advertencias e información operativa (R-31)</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportLogs("errors")}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setClearConfirmOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar Resueltos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Resumen de errores */}
              <div className="grid grid-cols-3 gap-4">
                {(["ERROR", "WARNING", "INFO"] as ErrorLevel[]).map(nivel => {
                  const cfg = errorLevelConfig[nivel]
                  const count = MOCK_ERROR_LOGS.filter(e => e.nivel === nivel).length
                  return (
                    <button
                      key={nivel}
                      onClick={() => setErrorFilter(errorFilter === nivel ? "all" : nivel)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        errorFilter === nivel ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                      )}
                    >
                      <div className={cn("flex items-center gap-2 mb-1", cfg.color)}>
                        {cfg.icon}
                        <span className="text-sm font-medium">{nivel}</span>
                      </div>
                      <p className="text-2xl font-bold">{count}</p>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha / Hora</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Modulo</TableHead>
                      <TableHead>Mensaje</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredErrors.map(log => {
                      const cfg = errorLevelConfig[log.nivel]
                      return (
                        <TableRow key={log.id} className={cn(!log.resuelto && log.nivel === "ERROR" && "bg-red-50/30")}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("es-PE", { timeZone: "UTC" })}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs gap-1", cfg.badge)}>
                              {cfg.icon}
                              {log.nivel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{log.modulo}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.mensaje}</TableCell>
                          <TableCell className="text-center">
                            {log.resuelto
                              ? <Badge className="bg-green-100 text-green-800 text-xs">Resuelto</Badge>
                              : <Badge className="bg-red-100 text-red-800 text-xs">Pendiente</Badge>
                            }
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Mantenimiento ── */}
        <TabsContent value="mantenimiento" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Mantenimiento Programado
              </CardTitle>
              <CardDescription>
                Configura ventanas de mantenimiento que mostrarán un banner de aviso a todos los usuarios (R-33)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estado actual */}
              <div className={cn(
                "flex items-center justify-between p-4 rounded-lg border-2",
                maintenance.activo ? "border-yellow-400 bg-yellow-50" : "border-border bg-muted/30"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    maintenance.activo ? "bg-yellow-200" : "bg-muted"
                  )}>
                    <Wrench className={cn("w-5 h-5", maintenance.activo ? "text-yellow-800" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className="font-medium">Modo Mantenimiento</p>
                    <p className="text-sm text-muted-foreground">
                      {maintenance.activo ? "Activado — el banner es visible para los usuarios" : "Desactivado"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={maintenance.activo}
                  onCheckedChange={checked => setMaintenance(prev => ({ ...prev, activo: checked }))}
                  id="maintenance-toggle"
                />
              </div>

              {/* Preview del banner */}
              {maintenance.activo && (
                <div className="flex items-start gap-3 p-4 bg-yellow-400/20 border border-yellow-400 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900 text-sm">Vista previa del banner</p>
                    <p className="text-yellow-800 text-sm mt-1">
                      {maintenance.mensaje || "Mantenimiento programado en curso..."}
                    </p>
                    {maintenance.fechaInicio && maintenance.fechaFin && (
                      <p className="text-yellow-700 text-xs mt-1">
                        {new Date(maintenance.fechaInicio).toLocaleString("es-PE")} → {new Date(maintenance.fechaFin).toLocaleString("es-PE")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Formulario */}
              <div className="grid gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicio">Fecha y Hora de Inicio</Label>
                    <Input
                      id="fechaInicio"
                      type="datetime-local"
                      value={maintenance.fechaInicio}
                      onChange={e => setMaintenance(prev => ({ ...prev, fechaInicio: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaFin">Fecha y Hora de Fin</Label>
                    <Input
                      id="fechaFin"
                      type="datetime-local"
                      value={maintenance.fechaFin}
                      onChange={e => setMaintenance(prev => ({ ...prev, fechaFin: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje para los Usuarios</Label>
                  <Textarea
                    id="mensaje"
                    placeholder="Ej: Estaremos en mantenimiento programado el sábado de 2am a 5am. Disculpe las molestias."
                    rows={3}
                    value={maintenance.mensaje}
                    onChange={e => setMaintenance(prev => ({ ...prev, mensaje: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este mensaje aparecerá en el banner de advertencia visible para todos los visitantes.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {saveSuccess && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Configuracion guardada correctamente</span>
                    </>
                  )}
                </div>
                <Button onClick={handleSaveMaintenance} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Guardar Configuracion
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Historial de ventanas de mantenimiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4" />
                Historial de Mantenimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { fecha: "2026-05-20", inicio: "02:00", fin: "04:30", motivo: "Actualización de base de datos", exitoso: true },
                  { fecha: "2026-04-15", inicio: "01:00", fin: "03:00", motivo: "Migración de servidor", exitoso: true },
                  { fecha: "2026-03-10", inicio: "00:00", fin: "02:00", motivo: "Parche de seguridad crítico", exitoso: true },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{m.motivo}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.fecha} — {m.inicio} a {m.fin}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">Completado</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm clear dialog */}
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Limpiar errores resueltos?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente todos los errores marcados como resueltos del registro. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearConfirmOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => {
                // En producción, llamaría al endpoint de limpieza de logs
                setClearConfirmOpen(false)
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

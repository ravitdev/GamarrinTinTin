"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Edit,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  UserX,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TipoDocumento, RolUsuario } from "@/lib/types"
import { useAuth } from "@/features/auth/hooks/use-auth"
import {
  UserService,
  type UpdateProfilePayload,
  type UserProfile,
} from "@/features/user/services/user.service"
import { toast } from "@/hooks/use-toast"

interface EditFormState {
  nombres: string
  apellidos: string
  email: string
  telefono: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  direccion: string
}

function profileToForm(profile: UserProfile): EditFormState {
  return {
    nombres: profile.nombres,
    apellidos: profile.apellidos,
    email: profile.email,
    telefono: profile.telefono,
    tipoDocumento: profile.tipoDocumento,
    numeroDocumento: profile.numeroDocumento,
    direccion: profile.direccion ?? "",
  }
}

function syncCachedUser(profile: UserProfile) {
  if (typeof window === "undefined") return
  const raw = window.localStorage.getItem("gtt_user")
  if (!raw) return
  try {
    const cached = JSON.parse(raw)
    window.localStorage.setItem(
      "gtt_user",
      JSON.stringify({
        ...cached,
        nombres: profile.nombres,
        apellidos: profile.apellidos,
        email: profile.email,
        telefono: profile.telefono,
        tipoDocumento: profile.tipoDocumento,
        numeroDocumento: profile.numeroDocumento,
        direccion: profile.direccion ?? "",
      }),
    )
  } catch {
    // ignore corrupt cache
  }
}

export default function MiCuentaPage() {
  const router = useRouter()
  const { isLoggedIn, isHydrating, user: authUser } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({})

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [isRequestingDeactivation, setIsRequestingDeactivation] = useState(false)

  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [documentForm, setDocumentForm] = useState({
    tipoDocumento: TipoDocumento.DNI,
    numeroDocumento: "",
  })
  const [isRequestingDocumentChange, setIsRequestingDocumentChange] = useState(false)
  const [documentFieldErrors, setDocumentFieldErrors] = useState<Record<string, string>>({})

  const canRequestDocumentChange =
    profile?.rol === RolUsuario.CLIENTE || profile?.rol === RolUsuario.VENDEDOR

  useEffect(() => {
    if (isHydrating) return
    if (!isLoggedIn) {
      router.push("/login?callback=/mi-cuenta")
      return
    }

    const loadProfile = async () => {
      setIsLoadingProfile(true)
      try {
        const data = await UserService.getProfile()
        setProfile(data)
        setEditForm(profileToForm(data))
      } catch (error) {
        toast({
          title: "Error al cargar perfil",
          description: error instanceof Error ? error.message : "Intenta nuevamente.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [isHydrating, isLoggedIn, router])

  const handleSaveProfile = async () => {
    if (!profile || !editForm) return

    setProfileFieldErrors({})

    const nextErrors: Record<string, string> = {}
    const telefonoNormalizado = editForm.telefono.replace(/\D/g, "")

    if (!editForm.nombres.trim()) {
      nextErrors.nombres = "Los nombres son obligatorios."
    }

    if (!editForm.apellidos.trim()) {
      nextErrors.apellidos = "Los apellidos son obligatorios."
    }

    if (telefonoNormalizado.length !== 9) {
      nextErrors.telefono = "El teléfono debe tener 9 dígitos."
    } else if (!telefonoNormalizado.startsWith("9")) {
      nextErrors.telefono = "El teléfono debe empezar con 9."
    }

    if (Object.keys(nextErrors).length > 0) {
      setProfileFieldErrors(nextErrors)
      return
    }

    setIsSavingProfile(true)

    try {
      const payload: UpdateProfilePayload = {
        nombres: editForm.nombres.trim(),
        apellidos: editForm.apellidos.trim(),
        email: editForm.email.trim(),
        telefono: telefonoNormalizado,
        direccion: editForm.direccion.trim() || null,
      }

      const updated = await UserService.updateProfile(payload)
      setProfile(updated)
      setEditForm(profileToForm(updated))
      syncCachedUser(updated)
      setIsEditing(false)
      toast({
        title: "Perfil actualizado",
        description: "Tus datos fueron actualizados correctamente.",
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Revisa los datos ingresados."

      const normalizedMessage = message.toLowerCase()

      if (normalizedMessage.includes("nombre")) {
        setProfileFieldErrors((prev) => ({
          ...prev,
          nombres: message,
        }))
      }

      if (normalizedMessage.includes("apellido")) {
        setProfileFieldErrors((prev) => ({
          ...prev,
          apellidos: message,
        }))
      }

      if (normalizedMessage.includes("email") || normalizedMessage.includes("correo")) {
        setProfileFieldErrors((prev) => ({
          ...prev,
          email: message,
        }))
      }

      if (
        normalizedMessage.includes("teléfono") ||
        normalizedMessage.includes("telefono") ||
        normalizedMessage.includes("celular")
      ) {
        setProfileFieldErrors((prev) => ({
          ...prev,
          telefono: message,
        }))
      }

      toast({
        title: "Error al actualizar perfil",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleCancelEdit = () => {
    if (profile) setEditForm(profileToForm(profile))
    setProfileFieldErrors({})
    setIsEditing(false)
  }

  const handleChangePassword = async () => {
    setPasswordError("")
    setPasswordSuccess(false)

    if (!passwordForm.currentPassword.trim()) {
      setPasswordError("La contraseña actual es obligatoria")
      return
    }

    if (!passwordForm.newPassword.trim()) {
      setPasswordError("La nueva contraseña es obligatoria")
      return
    }

    if (!passwordForm.confirmPassword.trim()) {
      setPasswordError("Debes confirmar la nueva contraseña")
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("La nueva contraseña debe ser diferente a la actual")
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (!/[A-Za-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
      setPasswordError("La contraseña debe incluir letras y números")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    setIsChangingPassword(true)
    try {
      await UserService.changePassword({
        contrasenaActual: passwordForm.currentPassword,
        contrasenaNueva: passwordForm.newPassword,
      })
      setPasswordSuccess(true)
      setTimeout(() => {
        setIsChangePasswordOpen(false)
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setPasswordSuccess(false)
      }, 2000)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "No fue posible cambiar la contraseña")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleRequestDeactivation = async () => {
    setIsRequestingDeactivation(true)
    try {
      await UserService.requestAccountDeactivation()
      const refreshed = await UserService.getProfile()
      setProfile(refreshed)
      setIsDeactivateDialogOpen(false)
      toast({
        title: "Solicitud enviada",
        description: "Su cuenta será desactivada por un administrador.",
      })
    } catch (error) {
      toast({
        title: "No se pudo enviar la solicitud",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsRequestingDeactivation(false)
    }
  }

  const handleRequestDocumentChange = async () => {
    const numeroDocumento = documentForm.numeroDocumento.replace(/\D/g, "")

    const nextErrors: Record<string, string> = {}

    if (documentForm.tipoDocumento === TipoDocumento.DNI && numeroDocumento.length !== 8) {
      nextErrors.numeroDocumento = "El DNI debe tener 8 dígitos."
    }

    if (documentForm.tipoDocumento === TipoDocumento.RUC && numeroDocumento.length !== 11) {
      nextErrors.numeroDocumento = "El RUC debe tener 11 dígitos."
    }

    if (Object.keys(nextErrors).length > 0) {
      setDocumentFieldErrors(nextErrors)
      return
    }

    setIsRequestingDocumentChange(true)
    setDocumentFieldErrors({})

    try {
      await UserService.requestDocumentChange({
        tipoDocumento: documentForm.tipoDocumento,
        numeroDocumento,
      })

      const refreshed = await UserService.getProfile()
      setProfile(refreshed)
      setIsDocumentDialogOpen(false)

      const successMessage =
        profile?.rol === RolUsuario.VENDEDOR
          ? "Su solicitud de cambio de DNI será evaluada por un administrador."
          : "Su solicitud de cambio de RUC o DNI será evaluada por un administrador."

      toast({ title: "Solicitud registrada", description: successMessage })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Revisa los datos ingresados."

      const normalizedMessage = message.toLowerCase()

      if (
        normalizedMessage.includes("documento") ||
        normalizedMessage.includes("dni") ||
        normalizedMessage.includes("ruc")
      ) {
        setDocumentFieldErrors((prev) => ({
          ...prev,
          numeroDocumento: message,
        }))
      }

      toast({
        title: "Error en la solicitud",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsRequestingDocumentChange(false)
    }
  }

  const getInitials = () => {
    if (!profile) return "?"
    return `${profile.nombres.charAt(0)}${profile.apellidos.charAt(0)}`
  }

  if (isHydrating || isLoadingProfile || !profile || !editForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const rolLabel =
    profile.rol === RolUsuario.ADMINISTRADOR
      ? "administrador"
      : profile.rol === RolUsuario.VENDEDOR
        ? "vendedor"
        : "cliente"

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header cartItemCount={2} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  {profile.nombres} {profile.apellidos}
                </h1>
                <p className="text-muted-foreground">{profile.email}</p>
                <Badge variant="secondary" className="mt-1 capitalize">{rolLabel}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  {authUser?.rol === RolUsuario.ADMINISTRADOR ? "Gestionar cuenta" : "Editar Perfil"}
                </Button>
              )}
              <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Lock className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogDescription>
                      Ingresa tu contraseña actual y la nueva contraseña
                    </DialogDescription>
                  </DialogHeader>

                  {passwordSuccess ? (
                    <div className="py-8 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-green-600">Contraseña actualizada</h3>
                      <p className="text-sm text-muted-foreground mt-1">Tu contraseña ha sido cambiada exitosamente</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Contraseña Actual</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Nueva Contraseña</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">Minimo 8 caracteres, letras y numeros</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {passwordError && (
                          <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {passwordError}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)} disabled={isChangingPassword}>
                          Cancelar
                        </Button>
                        <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                          {isChangingPassword ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Actualizando...
                            </>
                          ) : (
                            "Actualizar Contraseña"
                          )}
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="perfil" className="space-y-6">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="perfil" className="flex-1 sm:flex-initial">Perfil</TabsTrigger>
              <TabsTrigger value="seguridad" className="flex-1 sm:flex-initial">Seguridad</TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informacion Personal
                  </CardTitle>
                  <CardDescription>
                    Tus datos personales registrados en la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nombres">Nombres</Label>
                        <Input
                          id="nombres"
                          value={editForm.nombres}
                          onChange={(e) => {
                            setEditForm({ ...editForm, nombres: e.target.value })
                            if (profileFieldErrors.nombres) {
                              setProfileFieldErrors((prev) => ({ ...prev, nombres: "" }))
                            }
                          }}
                          className={profileFieldErrors.nombres ? "border-destructive" : ""}
                        />
                        {profileFieldErrors.nombres && (
                          <p className="text-xs text-destructive">{profileFieldErrors.nombres}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellidos">Apellidos</Label>
                        <Input
                          id="apellidos"
                          value={editForm.apellidos}
                          onChange={(e) => {
                            setEditForm({ ...editForm, apellidos: e.target.value })
                            if (profileFieldErrors.apellidos) {
                              setProfileFieldErrors((prev) => ({ ...prev, apellidos: "" }))
                            }
                          }}
                          className={profileFieldErrors.apellidos ? "border-destructive" : ""}
                        />
                        {profileFieldErrors.apellidos && (
                          <p className="text-xs text-destructive">{profileFieldErrors.apellidos}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="correo">Correo Electronico</Label>
                        <Input
                          id="correo"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => {
                            setEditForm({ ...editForm, email: e.target.value })
                            if (profileFieldErrors.email) {
                              setProfileFieldErrors((prev) => ({ ...prev, email: "" }))
                            }
                          }}
                          className={profileFieldErrors.email ? "border-destructive" : ""}
                        />
                        {profileFieldErrors.email && (
                          <p className="text-xs text-destructive">{profileFieldErrors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="celular">Celular</Label>
                        <Input
                          id="celular"
                          type="tel"
                          maxLength={9}
                          value={editForm.telefono}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 9)
                            setEditForm({ ...editForm, telefono: value })
                            if (profileFieldErrors.telefono) {
                              setProfileFieldErrors((prev) => ({ ...prev, telefono: "" }))
                            }
                          }}
                          className={profileFieldErrors.telefono ? "border-destructive" : ""}
                        />
                        {profileFieldErrors.telefono && (
                          <p className="text-xs text-destructive">{profileFieldErrors.telefono}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                        <Input id="tipoDocumento" value={editForm.tipoDocumento} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="documento">Numero de Documento</Label>
                        <Input id="documento" value={editForm.numeroDocumento} disabled />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nombre Completo</p>
                          <p className="font-medium">{profile.nombres} {profile.apellidos}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Correo Electronico</p>
                          <p className="font-medium">{profile.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Celular</p>
                          <p className="font-medium">{profile.telefono}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">{profile.tipoDocumento}</p>
                          <p className="font-medium">{profile.numeroDocumento}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {canRequestDocumentChange && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium">Cambio de documento</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.solicitudCambioDocumentoPendiente
                            ? profile?.rol === RolUsuario.VENDEDOR
                              ? "Su solicitud de cambio de DNI será evaluada por un administrador."
                              : "Su solicitud de cambio de RUC o DNI será evaluada por un administrador."
                            : profile.rol === RolUsuario.VENDEDOR
                              ? "Para modificar tu DNI debes solicitar el cambio a un administrador."
                              : "Para modificar tu RUC o DNI debes solicitar el cambio a un administrador."}
                        </p>
                      </div>
                      {!profile.solicitudCambioDocumentoPendiente && (
                        <Dialog
                          open={isDocumentDialogOpen}
                          onOpenChange={(open) => {
                            setIsDocumentDialogOpen(open)
                            setDocumentFieldErrors({})

                            if (open && profile.rol === RolUsuario.VENDEDOR) {
                              setDocumentForm({
                                tipoDocumento: TipoDocumento.DNI,
                                numeroDocumento: "",
                              })
                            }

                            if (!open) {
                              setDocumentForm({
                                tipoDocumento: TipoDocumento.DNI,
                                numeroDocumento: "",
                              })
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Solicitar cambio</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Solicitar cambio de documento</DialogTitle>
                              <DialogDescription>
                                Ingresa el nuevo tipo y número de documento. Un administrador revisara tu solicitud.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Tipo de documento</Label>
                                {profile.rol === RolUsuario.VENDEDOR ? (
                                  <Input value="DNI" disabled />
                                ) : (
                                  <Select
                                    value={documentForm.tipoDocumento}
                                    onValueChange={(value: TipoDocumento) => {
                                      setDocumentForm({ tipoDocumento: value, numeroDocumento: "" })
                                      setDocumentFieldErrors({})
                                    }}
                                  >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="DNI">DNI</SelectItem>
                                      <SelectItem value="RUC">RUC</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label>Nuevo numero</Label>
                                <Input
                                  value={documentForm.numeroDocumento}
                                  maxLength={documentForm.tipoDocumento === TipoDocumento.DNI ? 8 : 11}
                                  placeholder={
                                    documentForm.tipoDocumento === TipoDocumento.DNI
                                      ? "Ingrese 8 dígitos"
                                      : "Ingrese 11 dígitos"
                                  }
                                  onChange={(e) => {
                                    const maxLength = documentForm.tipoDocumento === TipoDocumento.DNI ? 8 : 11
                                    const value = e.target.value.replace(/\D/g, "").slice(0, maxLength)

                                    setDocumentForm({
                                      ...documentForm,
                                      numeroDocumento: value,
                                    })

                                    if (documentFieldErrors.numeroDocumento) {
                                      setDocumentFieldErrors((prev) => ({ ...prev, numeroDocumento: "" }))
                                    }
                                  }}
                                  className={documentFieldErrors.numeroDocumento ? "border-destructive" : ""}
                                />
                                {documentFieldErrors.numeroDocumento && (
                                  <p className="text-xs text-destructive">{documentFieldErrors.numeroDocumento}</p>
                                )}
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleRequestDocumentChange}
                                disabled={isRequestingDocumentChange || !documentForm.numeroDocumento.trim()}
                              >
                                {isRequestingDocumentChange ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Enviando...
                                  </>
                                ) : (
                                  "Enviar solicitud"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Direccion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="direccion">Direccion</Label>
                      <Input
                        id="direccion"
                        value={editForm.direccion}
                        onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <p className="font-medium">{profile.direccion || "No registrada"}</p>
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" onClick={handleCancelEdit} disabled={isSavingProfile}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          "Guardar Cambios"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Informacion de la Cuenta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Miembro desde</p>
                      <p className="font-medium">
                        {new Date(profile.fechaRegistro).toLocaleDateString("es-PE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seguridad" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Seguridad de la Cuenta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Contraseña</p>
                        <p className="text-sm text-muted-foreground">Actualiza tu contraseña cuando lo necesites</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)}>
                      Cambiar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {profile.rol === RolUsuario.CLIENTE && (
                <Card className="border-amber-300/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                      <UserX className="w-5 h-5" />
                      Desactivar Cuenta
                    </CardTitle>
                    <CardDescription>
                      Desactiva tu cuenta de forma temporal o permanente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.solicitudDesactivacionPendiente ? (
                      <div className="flex items-start gap-3 p-4 border border-amber-300 rounded-lg bg-amber-50">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">Solicitud enviada</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Su cuenta será desactivada por un administrador.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 border border-amber-300/50 rounded-lg bg-amber-50/50">
                        <div>
                          <p className="font-medium">Desactivar mi Cuenta</p>
                          <p className="text-sm text-muted-foreground">
                            Tu cuenta sera desactivada y no podras acceder al sistema.
                          </p>
                        </div>
                        <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                              Desactivar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Confirmar desactivacion de cuenta
                              </AlertDialogTitle>
                              <AlertDialogDescription asChild>
                                <div className="space-y-4">
                                  {!profile.puedeDesactivarse ? (
                                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                                      <p className="text-destructive font-medium">No puedes desactivar tu cuenta</p>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {profile.motivoNoDesactivacion}
                                      </p>
                                    </div>
                                  ) : (
                                    <p>
                                      Estas a punto de solicitar la desactivacion de tu cuenta. Un administrador
                                      revisara tu solicitud y procedera con la desactivacion.
                                    </p>
                                  )}
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isRequestingDeactivation}>Cancelar</AlertDialogCancel>
                              {profile.puedeDesactivarse && (
                                <AlertDialogAction
                                  onClick={handleRequestDeactivation}
                                  disabled={isRequestingDeactivation}
                                  className="bg-amber-600 text-white hover:bg-amber-700"
                                >
                                  {isRequestingDeactivation ? "Enviando..." : "Confirmar Desactivacion"}
                                </AlertDialogAction>
                              )}
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}

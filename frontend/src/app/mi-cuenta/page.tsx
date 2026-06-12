"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  AlertTriangle
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
import { TipoDocumento } from "@/lib/types"

// Mock user data - would come from auth/database
const mockUser = {
  id: "user-1",
  nombres: "Juan Carlos",
  apellidos: "Rodriguez Perez",
  correo: "juan.rodriguez@email.com",
  celular: "+51 999 888 777",
  documento: "12345678",
  tipoDocumento: TipoDocumento.DNI,
  direccion: "Av. Javier Prado 1234, San Isidro",
  distrito: "San Isidro",
  provincia: "Lima",
  departamento: "Lima",
  rol: "cliente" as const,
  estado: "activo" as const,
  createdAt: new Date("2024-01-15"),
  avatarUrl: "",
}

export default function MiCuentaPage() {
  const [user, setUser] = useState(mockUser)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(user)
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
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [deactivationRequested, setDeactivationRequested] = useState(false)
  const [hasPendingOrders] = useState(false) // Would come from API in real app

  const handleSaveProfile = () => {
    setUser(editForm)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditForm(user)
    setIsEditing(false)
  }

  const handleChangePassword = () => {
    setPasswordError("")
    setPasswordSuccess(false)

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    // Simulate password change
    setPasswordSuccess(true)
    setTimeout(() => {
      setIsChangePasswordOpen(false)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setPasswordSuccess(false)
    }, 2000)
  }

  const getInitials = () => {
    return `${user.nombres.charAt(0)}${user.apellidos.charAt(0)}`
  }

  const handleRequestDeactivation = () => {
    // In real app, this would send a request to the backend
    setDeactivationRequested(true)
    setIsDeactivateDialogOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header cartItemCount={2} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  {user.nombres} {user.apellidos}
                </h1>
                <p className="text-muted-foreground">{user.correo}</p>
                <Badge variant="secondary" className="mt-1 capitalize">{user.rol}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
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
                          <p className="text-xs text-muted-foreground">Minimo 8 caracteres</p>
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
                        <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleChangePassword}>
                          Actualizar Contraseña
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Content */}
          <Tabs defaultValue="perfil" className="space-y-6">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="perfil" className="flex-1 sm:flex-initial">Perfil</TabsTrigger>
              <TabsTrigger value="seguridad" className="flex-1 sm:flex-initial">Seguridad</TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="space-y-6">
              {/* Personal Information */}
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
                          onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellidos">Apellidos</Label>
                        <Input
                          id="apellidos"
                          value={editForm.apellidos}
                          onChange={(e) => setEditForm({ ...editForm, apellidos: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="correo">Correo Electronico</Label>
                        <Input
                          id="correo"
                          type="email"
                          value={editForm.correo}
                          onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="celular">Celular</Label>
                        <Input
                          id="celular"
                          value={editForm.celular}
                          onChange={(e) => setEditForm({ ...editForm, celular: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                        <Select 
                          value={editForm.tipoDocumento}
                          onValueChange={(value: TipoDocumento) => setEditForm({ ...editForm, tipoDocumento: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DNI">DNI</SelectItem>
                            <SelectItem value="RUC">RUC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="documento">Numero de Documento</Label>
                        <Input
                          id="documento"
                          value={editForm.documento}
                          onChange={(e) => setEditForm({ ...editForm, documento: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nombre Completo</p>
                          <p className="font-medium">{user.nombres} {user.apellidos}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Correo Electronico</p>
                          <p className="font-medium">{user.correo}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Celular</p>
                          <p className="font-medium">{user.celular}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">{user.tipoDocumento}</p>
                          <p className="font-medium">{user.documento}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Direccion de Envio
                  </CardTitle>
                  <CardDescription>
                    Direccion predeterminada para tus pedidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="direccion">Direccion</Label>
                        <Input
                          id="direccion"
                          value={editForm.direccion}
                          onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="distrito">Distrito</Label>
                        <Input
                          id="distrito"
                          value={editForm.distrito}
                          onChange={(e) => setEditForm({ ...editForm, distrito: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provincia">Provincia</Label>
                        <Input
                          id="provincia"
                          value={editForm.provincia}
                          onChange={(e) => setEditForm({ ...editForm, provincia: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="departamento">Departamento</Label>
                        <Input
                          id="departamento"
                          value={editForm.departamento}
                          onChange={(e) => setEditForm({ ...editForm, departamento: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{user.direccion}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.distrito}, {user.provincia}, {user.departamento}
                        </p>
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        Guardar Cambios
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Info */}
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
                        {user.createdAt.toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
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
                  <CardDescription>
                    Gestiona la seguridad de tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Contraseña</p>
                        <p className="text-sm text-muted-foreground">Ultima actualizacion hace 30 dias</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)}>
                      Cambiar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Correo Verificado</p>
                        <p className="text-sm text-muted-foreground">{user.correo}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      <Check className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  </div>
                </CardContent>
              </Card>

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
                  {deactivationRequested ? (
                    <div className="flex items-start gap-3 p-4 border border-amber-300 rounded-lg bg-amber-50">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Solicitud enviada</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Tu solicitud de desactivacion ha sido enviada. Un administrador procesara tu solicitud 
                          y seras notificado por correo electronico cuando tu cuenta sea desactivada.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-amber-300/50 rounded-lg bg-amber-50/50">
                      <div>
                        <p className="font-medium">Desactivar mi Cuenta</p>
                        <p className="text-sm text-muted-foreground">
                          Tu cuenta sera desactivada y no podras acceder al sistema. Tus datos se mantendran almacenados.
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
                                {hasPendingOrders ? (
                                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                                    <p className="text-destructive font-medium">No puedes desactivar tu cuenta</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Tienes pedidos en proceso. Debes esperar a que todos tus pedidos sean 
                                      entregados o cancelados antes de poder desactivar tu cuenta.
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <p>
                                      Estas a punto de solicitar la desactivacion de tu cuenta. Un administrador
                                      revisara tu solicitud y procedera con la desactivacion.
                                    </p>
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="text-sm font-medium">Al desactivar tu cuenta:</p>
                                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                                        <li>- No podras acceder al sistema</li>
                                        <li>- Tus datos permaneceran almacenados</li>
                                        <li>- Podras solicitar la reactivacion contactando a soporte</li>
                                      </ul>
                                    </div>
                                  </>
                                )}
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            {!hasPendingOrders && (
                              <AlertDialogAction 
                                onClick={handleRequestDeactivation}
                                className="bg-amber-600 text-white hover:bg-amber-700"
                              >
                                Confirmar Desactivacion
                              </AlertDialogAction>
                            )}
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}

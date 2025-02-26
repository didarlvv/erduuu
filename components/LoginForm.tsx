"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Lock, Loader2 } from "lucide-react"
import { login } from "@/lib/auth"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

const translations = {
  ru: {
    username: "Имя пользователя",
    enterUsername: "Введите имя пользователя",
    password: "Пароль",
    enterPassword: "Введите пароль",
    login: "Войти",
    loggingIn: "Вход...",
    invalidCredentials: "Неверное имя пользователя или пароль",
    errorTitle: "Ошибка входа",
  },
  tk: {
    username: "Ulanyjy ady",
    enterUsername: "Ulanyjy adyňyzy giriziň",
    password: "Parol",
    enterPassword: "Parolyňyzy giriziň",
    login: "Giriş",
    loggingIn: "Giriş edilýär...",
    invalidCredentials: "Nädogry ulanyjy ady ýa-da parol",
    errorTitle: "Giriş säwligi",
  },
  en: {
    username: "Username",
    enterUsername: "Enter your username",
    password: "Password",
    enterPassword: "Enter your password",
    login: "Login",
    loggingIn: "Logging in...",
    invalidCredentials: "Invalid username or password",
    errorTitle: "Login Error",
  },
}

const translate = (key: string, language: string) => {
  return translations[language as keyof typeof translations][key as keyof (typeof translations)["en"]] || key
}

export function LoginForm() {
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("Hello123")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { language } = useLanguage()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(username, password)
      router.push("/dashboard")
    } catch (err) {
      setError(translate("invalidCredentials", language))
      toast({
        variant: "destructive",
        title: translate("errorTitle", language),
        description: translate("invalidCredentials", language),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-sm font-medium text-gray-700">
          {translate("username", language)}
        </Label>
        <div className="relative group">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors group-hover:text-blue-500" />
          <Input
            id="username"
            name="username"
            type="text"
            required
            className="pl-10 w-full transition-shadow hover:shadow-md focus:shadow-md"
            placeholder={translate("enterUsername", language)}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          {translate("password", language)}
        </Label>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors group-hover:text-blue-500" />
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="pl-10 w-full transition-shadow hover:shadow-md focus:shadow-md"
            placeholder={translate("enterPassword", language)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">{error}</div>}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {translate("loggingIn", language)}
          </div>
        ) : (
          translate("login", language)
        )}
      </Button>
    </form>
  )
}


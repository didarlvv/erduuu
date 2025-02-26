"use client"

import Image from "next/image"
import { LoginForm } from "@/components/LoginForm"
import { LanguageSelector } from "@/components/LanguageSelector"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/contexts/LanguageContext"

const translations = {
  ru: {
    sidebar: {
      ministryLogo: "Логотип Министерства энергетики",
      ministryName1: "Министерство энергетики",
      ministryName2: "Туркменистана",
    },
    loginForm: {
      login: "Вход в систему",
      loginDescription: "Введите свои учетные данные для входа в систему",
    },
  },
  tk: {
    sidebar: {
      ministryLogo: "Energetika ministrliginiň logotipi",
      ministryName1: "Türkmenistanyň",
      ministryName2: "Energetika ministrligi",
    },
    loginForm: {
      login: "Ulgama giriş",
      loginDescription: "Ulgama girmek üçin hasap maglumatlaryňyzy giriziň",
    },
  },
  en: {
    sidebar: {
      ministryLogo: "Ministry of Energy Logo",
      ministryName1: "Ministry of Energy",
      ministryName2: "of Turkmenistan",
    },
    loginForm: {
      login: "System Login",
      loginDescription: "Enter your credentials to access the system",
    },
  },
}

function translate(key: string, language: string): string {
  const keys = key.split(".")
  let result: any = translations[language as keyof typeof translations]
  for (const k of keys) {
    if (result && result[k]) {
      result = result[k]
    } else {
      return key // Return the key if translation is not found
    }
  }
  return result as string
}

export default function LoginPage() {
  const { language } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col w-screen absolute top-0 right-0">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="p-0">
            <div className="bg-gradient-to-b from-blue-50 to-white p-8 rounded-t-lg">
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-6 transform hover:scale-105 transition-transform duration-300">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-wjTnDDr5vGt6haZTkljVCbMMF60pP6.png"
                    alt={translate("sidebar.ministryLogo", language)}
                    fill
                    className="object-contain"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
                  {translate("sidebar.ministryName1", language)}
                </h2>
                <h2 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
                  {translate("sidebar.ministryName2", language)}
                </h2>
              </div>
            </div>
            <div className="p-8 pt-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-center text-gray-900">
                  {translate("loginForm.login", language)}
                </h3>
                <p className="mt-2 text-sm text-center text-gray-600">
                  {translate("loginForm.loginDescription", language)}
                </p>
              </div>
              <LoginForm />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


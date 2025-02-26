"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

const translations = {
  ru: {
    languageSelector: {
      ru: "Русский",
      tk: "Туркменский",
      en: "Английский",
    },
  },
  tk: {
    languageSelector: {
      ru: "Rus dili",
      tk: "Türkmen dili",
      en: "Iňlis dili",
    },
  },
  en: {
    languageSelector: {
      ru: "Russian",
      tk: "Turkmen",
      en: "English",
    },
  },
}

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  const translate = (key: string) => {
    const keys = key.split(".")
    let result = translations[language]
    for (const k of keys) {
      if (result && typeof result === "object" && k in result) {
        result = result[k]
      } else {
        return key // Return the original key if translation is not found
      }
    }
    return result as string
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white">
          <Globe className="h-4 w-4 mr-2" />
          {translate(`languageSelector.${language}`)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("ru")}>{translate("languageSelector.ru")}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("tk")}>{translate("languageSelector.tk")}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("en")}>{translate("languageSelector.en")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


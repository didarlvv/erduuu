export const mailTranslations = {
  ru: {
    mails: {
      title: "Письма",
      inbox: "Входящие",
      sent: "Отправленные",
      create: "Создать письмо",
      creating: "Создание письма...",
      sender: "Отправитель",
      receiver: "Получатель",
      subject: "Тема",
      description: "Описание",
      status: {
        new: "Новое",
        progress: "В процессе",
        answered: "Отвечено",
      },
      sentTime: "Время отправки",
      createdAt: "Создано",
      viewedAt: "Просмотрено",
      notViewed: "Не просмотрено",
      noMails: "Писем не найдено",
      searchPlaceholder: "Поиск писем...",
      filterByStatus: "Фильтр по статусу",
      filterByDate: "Фильтр по дате",
      startDate: "Начальная дата",
      endDate: "Конечная дата",
      all: "Все",
      errors: {
        loadFailed: "Не удалось загрузить письма",
      },
    },
    common: {
      loading: "Загрузка...",
      previous: "Предыдущая",
      next: "Следующая",
      currentPage: "Страница {current}",
      filters: "Фильтры",
      clearFilters: "Очистить фильтры",
      itemsPerPage: "Элементов на странице",
      sortBy: "Сортировать по",
      orderDirection: "Направление сортировки",
      ascending: "По возрастанию",
      descending: "По убыванию",
      yes: "Да",
      no: "Нет",
      accessDenied: "Доступ запрещен",
      noPermission: "У вас нет разрешения на просмотр этой страницы",
    },
  },
  tk: {
    mails: {
      title: "Hatlar",
      inbox: "Gelen hatlar",
      sent: "Iberilen hatlar",
      create: "Hat döretmek",
      creating: "Hat döredilýär...",
      sender: "Iberiji",
      receiver: "Alyjy",
      subject: "Tema",
      description: "Düşündiriş",
      status: {
        new: "Täze",
        progress: "Işlenýär",
        answered: "Jogap berilen",
      },
      sentTime: "Iberilen wagty",
      createdAt: "Döredilen",
      viewedAt: "Görülen",
      notViewed: "Görülmedik",
      noMails: "Hat tapylmady",
      searchPlaceholder: "Hatlary gözlemek...",
      filterByStatus: "Ýagdaýa görä filtirlemek",
      filterByDate: "Senä görä filtirlemek",
      startDate: "Başlangyç senesi",
      endDate: "Soňky senesi",
      all: "Ählisi",
      errors: {
        loadFailed: "Hatlary ýükläp bolmady",
      },
    },
    common: {
      loading: "Ýüklenýär...",
      previous: "Öňki",
      next: "Indiki",
      currentPage: "Sahypa {current}",
      filters: "Filtrler",
      clearFilters: "Filtrleri arassalamak",
      itemsPerPage: "Sahypa başyna element",
      sortBy: "Tertiplemek",
      orderDirection: "Tertip ugry",
      ascending: "Ösýän tertipde",
      descending: "Kemelýän tertipde",
      yes: "Hawa",
      no: "Ýok",
      accessDenied: "Giriş gadagan",
      noPermission: "Bu sahypany görmäge rugsadyň ýok",
    },
  },
  en: {
    mails: {
      title: "Mails",
      inbox: "Inbox",
      sent: "Sent",
      create: "Create Mail",
      creating: "Creating Mail...",
      sender: "Sender",
      receiver: "Receiver",
      subject: "Subject",
      description: "Description",
      status: {
        new: "New",
        progress: "In Progress",
        answered: "Answered",
      },
      sentTime: "Sent Time",
      createdAt: "Created At",
      viewedAt: "Viewed At",
      notViewed: "Not Viewed",
      noMails: "No mails found",
      searchPlaceholder: "Search mails...",
      filterByStatus: "Filter by Status",
      filterByDate: "Filter by Date",
      startDate: "Start Date",
      endDate: "End Date",
      all: "All",
      errors: {
        loadFailed: "Failed to load mails",
      },
    },
    common: {
      loading: "Loading...",
      previous: "Previous",
      next: "Next",
      currentPage: "Page {current}",
      filters: "Filters",
      clearFilters: "Clear Filters",
      itemsPerPage: "Items per page",
      sortBy: "Sort by",
      orderDirection: "Order direction",
      ascending: "Ascending",
      descending: "Descending",
      yes: "Yes",
      no: "No",
      accessDenied: "Access Denied",
      noPermission: "You don't have permission to view this page",
    },
  },
};

export const translate = (
  key: string,
  language: string,
  params: Record<string, string | number> = {}
): string => {
  const keys = key.split(".");
  let translation: any =
    mailTranslations[language as keyof typeof mailTranslations];
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key;
    }
    translation = translation[k];
  }
  if (typeof translation === "string") {
    return Object.entries(params).reduce(
      (str, [key, value]) =>
        str.replace(new RegExp(`{${key}}`, "g"), String(value)),
      translation
    );
  }
  return key;
};

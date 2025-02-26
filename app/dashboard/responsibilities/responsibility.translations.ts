export const responsibilityTranslations = {
  ru: {
    responsibilities: {
      title: "Должности",
      createResponsibility: "Создать должность",
      editResponsibility: "Редактировать должность",
      deleteResponsibility: "Удалить должность",
      name: "Название",
      organization: "Организация",
      permissions: "Права",
      actions: "Действия",
      noResponsibilitiesFound: "Должности не найдены",
      searchPlaceholder: "Поиск должностей...",
      manageResponsibilities: "Управление должностями",
      manageDescription: "Создавайте, редактируйте и удаляйте должности",
      loadError: "Ошибка при загрузке должностей",
      readAll: "Читать все",
      sendAll: "Отправлять все",
    },
    common: {
      items: "записей",
      sortBy: "Сортировать по",
      sortDirection: "Направление сортировки",
      ascending: "По возрастанию",
      descending: "По убыванию",
      filters: "Фильтры",
      actions: "Действия",
      edit: "Редактировать",
      openMenu: "Открыть меню",
      showing: "Показано",
      of: "из",
      results: "результатов",
      page: "Страница",
      previous: "Предыдущая",
      next: "Следующая",
      loading: "Загрузка...",
    },
  },
  tk: {
    responsibilities: {
      title: "Wezipeler",
      createResponsibility: "Wezipe döret",
      editResponsibility: "Wezipäni üýtget",
      deleteResponsibility: "Wezipäni poz",
      name: "Ady",
      organization: "Edara",
      permissions: "Rugsatlar",
      actions: "Hereketler",
      noResponsibilitiesFound: "Wezipe tapylmady",
      searchPlaceholder: "Wezipeleri gözle...",
      manageResponsibilities: "Wezipeleri dolandyrmak",
      manageDescription: "Wezipeleri dörediň, üýtgediň we pozuň",
      loadError: "Wezipeleri ýüklemekde ýalňyşlyk ýüze çykdy",
      readAll: "Hemmesini oka",
      sendAll: "Hemmesini iber",
    },
    common: {
      items: "ýazgy",
      sortBy: "Tertiple",
      sortDirection: "Tertip ugry",
      ascending: "Ösýän tertipde",
      descending: "Kemelýän tertipde",
      filters: "Süzgüçler",
      actions: "Hereketler",
      edit: "Üýtget",
      openMenu: "Menýuny aç",
      showing: "Görkezilýär",
      of: "dan",
      results: "netije",
      page: "Sahypa",
      previous: "Öňki",
      next: "Indiki",
      loading: "Ýüklenýär...",
    },
  },
  en: {
    responsibilities: {
      title: "Responsibilities",
      createResponsibility: "Create Responsibility",
      editResponsibility: "Edit Responsibility",
      deleteResponsibility: "Delete Responsibility",
      name: "Name",
      organization: "Organization",
      permissions: "Permissions",
      actions: "Actions",
      noResponsibilitiesFound: "No responsibilities found",
      searchPlaceholder: "Search responsibilities...",
      manageResponsibilities: "Manage Responsibilities",
      manageDescription: "Create, edit, and delete responsibilities",
      loadError: "Error loading responsibilities",
      readAll: "Read All",
      sendAll: "Send All",
    },
    common: {
      items: "items",
      sortBy: "Sort by",
      sortDirection: "Sort direction",
      ascending: "Ascending",
      descending: "Descending",
      filters: "Filters",
      actions: "Actions",
      edit: "Edit",
      openMenu: "Open menu",
      showing: "Showing",
      of: "of",
      results: "results",
      page: "Page",
      previous: "Previous",
      next: "Next",
      loading: "Loading...",
    },
  },
};

export const translate = (key: string, language: string): string => {
  const keys = key.split(".");
  let translation: any =
    responsibilityTranslations[
      language as keyof typeof responsibilityTranslations
    ];
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key;
    }
    translation = translation[k];
  }
  return translation;
};

## Использование

1. Получить входящий вебхук с доступом CRM

   - Зайти в панель управления Битрикс 24, в выпадающем меню слева выбрать "Разработчикам"

   - Другое > Входящий вебхук

   - В настройке прав (внизу страницы) выбрать `CRM (crm)`

   - Скопировать ссылку из поля "Вебхук для вызова rest api"

     > Ссылка выглядит примерно так: `https://b24-ep1gyi.bitrix24.ru/rest/421/j9f2incnbdn2r3d5/`

   - Нажать "Сохранить"

   - URL этого вебхука понадобится в следующем пункте

2. Создать исходящий вебхук (для отправки событий)

   - Другое > Исходящий вебхук

   - В настройке событий выбрать 3 пункта: `Создание сделки (ONCRMDEALADD), Обновление сделки (ONCRMDEALUPDATE), Удаление сделки (ONCRMDEALDELETE)`

   - В поле "URL вашего обработчика" вставить `https://artginzburg.runkit.io/turnakolskiy-api/branches/master/:bitrixIncomingWebhook`

   - Заменить `:bitrixIncomingWebhook` на URL входящего вебхука из пункта 1 в [формате URL-encoded][urlencode]

     > Должно получиться что-то вроде: `https://artginzburg.runkit.io/turnakolskiy-api/branches/master/https%3A%2F%2Fb24-ep1gyi.bitrix24.ru%2Frest%2F421%2Fj9f2incnbdn2r3d5%2F`

   - Нажать "Сохранить"

3. Создать переменную окружения [BITRIX_INCOMING_WEBHOOK](https://github.com/artginzburg/turnakolskiy-webhooks/settings/secrets/actions/BITRIX_INCOMING_WEBHOOK) в репозитории

   - `Settings` > [`Secrets`](https://github.com/artginzburg/turnakolskiy-webhooks/settings/secrets/actions) > [`New repository secret`](https://github.com/artginzburg/turnakolskiy-webhooks/settings/secrets/actions/new)

   - Опять же, вставить URL входящего вебхука из пункта 1 в [формате URL-encoded][urlencode]

## Отправить /check с любой даты

- Открыть браузер, вставить в адресную строку полный URL исходящего вебхука из пункта 2

- Дописать в конец строки `/check/:date`, заменив `:date` на дату, с которой нужно проверить все сделки.

  > Например, для проверки сделок с 1-го сентября 2021-го должно получиться что-то вроде: `https://artginzburg.runkit.io/turnakolskiy-api/branches/master/https%3A%2F%2Fb24-ep1gyi.bitrix24.ru%2Frest%2F421%2Fj9f2incnbdn2r3d5%2F/check/01.09.2021`

- Также можно дописать время через запятую, например `.../check/01.09.2021,23:00`. Учтите, что время указывается в формате UTC, то есть `01.09.2021,23:00` на самом деле проверит сделки, обновлённые с `02.09.2021,02:00` по Москве (GMT+3)

## Принудительно обновить все сделки с любой даты (/update)

- Открыть браузер, вставить в адресную строку полный URL исходящего вебхука из пункта 2

- Дописать в конец строки `/update/:date`, заменив `:date` на дату, с которой нужно проверить все сделки.

  > Например, для обновления сделок с 1-го сентября 2021-го должно получиться что-то вроде: `https://artginzburg.runkit.io/turnakolskiy-api/branches/master/https%3A%2F%2Fb24-ep1gyi.bitrix24.ru%2Frest%2F421%2Fj9f2incnbdn2r3d5%2F/update/01.09.2021`

- Также можно дописать время через запятую, например `.../update/01.09.2021,23:00`. Учтите, что время указывается в формате UTC, то есть `01.09.2021,23:00` на самом деле проверит сделки, обновлённые с `02.09.2021,02:00` по Москве (GMT+3)

Так как RunKit позволяет запросу "висеть" всего минуту, принудительно обновлять большое количество сделок лучше так:

- Добавить в репозиторий на GitHub переменную окружения [UPDATE_FROM_DATE](https://github.com/artginzburg/turnakolskiy-webhooks/settings/secrets/actions/UPDATE_FROM_DATE) в формате, описанном выше.

- Во вкладке "Actions" на GitHub запустить ["Force update deals analytics" (update.yml)](https://github.com/artginzburg/turnakolskiy-webhooks/actions/workflows/update.yml).

- После использования переменную окружения UPDATE_FROM_DATE желательно удалить.

<br />

## Тест

Установить зависимости

```ps1
npm i
```

Запустить тест

```ps1
npm test
```

Скопировать ссылку на локальный туннель, вставить её в исходящий вебхук на события ONCRMDEALADD, ONCRMDEALUPDATE, ONCRMDEALDELETE

Попробовать создать новую сделку, сохранить, обновить в ней какие-нибудь данные, и удалить её. Если в мониторинг сервиса аналитики пришли данные о сделке и в консоли не появляется ошибок — всё работает правильно.

[urlencode]: https://meyerweb.com/eric/tools/dencoder/

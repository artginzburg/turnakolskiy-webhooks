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

   - В поле "URL вашего обработчика" вставить `https://artginzburg.runkit.io/turnakolsky-webhooks/branches/master/:bitrixIncomingWebhook`

   - Заменить `:bitrixIncomingWebhook` на URL входящего вебхука из пункта 1 в [формате URL](https://meyerweb.com/eric/tools/dencoder/)

     > Должно получиться что-то вроде: `https://artginzburg.runkit.io/turnakolsky-webhooks/branches/master/https%3A%2F%2Fb24-ep1gyi.bitrix24.ru%2Frest%2F421%2Fj9f2incnbdn2r3d5%2F`

   - Нажать "Сохранить"

## Тест

Установить зависимости

```ps1
npm i
```

Запустить тест

```
npm test
```

Скопировать ссылку на локальный туннель, вставить её в исходящий вебхук на события ONCRMDEALADD, ONCRMDEALUPDATE, ONCRMDEALDELETE

Попробовать создать новую сделку, сохранить, обновить в ней какие-нибудь данные, и удалить её. Если в мониторинг сервиса аналитики пришли данные о сделке и в консоли не появляется ошибок — всё работает правильно.

# Tic-Tac-Toe Promo (Next.js + Telegram notify)

Игра «Крестики-нолики», где игрок играет против компьютера.

## Логика
- Победа игрока: показывается рандомный 5-значный промокод и отправляется сообщение в Telegram:
  `Победа! Промокод выдан: XXXXX`
- Проигрыш: отправляется `Проигрыш`, на экране предлагается сыграть ещё раз.

## Безопасность
Telegram Bot Token хранится только на сервере (ENV) и не попадает в браузер.
Отправка реализована через serverless endpoint: `POST /api/notify`.

## Запуск локально
1) Установить зависимости:
   - npm i
2) Создать .env.local по примеру .env.example и заполнить TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID
3) Запуск:
   - npm run dev

Откройте http://localhost:3000

## Тест API локально
- Победа:
  curl -s -X POST "http://localhost:3000/api/notify" -H "Content-Type: application/json" -d '{"result":"win","code":"12345"}'
- Проигрыш:
  curl -s -X POST "http://localhost:3000/api/notify" -H "Content-Type: application/json" -d '{"result":"lose"}'

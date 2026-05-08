import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Політика конфіденційності — Prozorro Analytics',
  description: 'Як ми збираємо, зберігаємо та захищаємо ваші персональні дані.',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed text-foreground">
      <h1 className="mb-2 text-2xl font-bold">Політика конфіденційності</h1>
      <p className="mb-8 text-xs text-muted">Редакція від 8 травня 2026 р.</p>

      <Section title="1. Хто ми">
        <p>
          Prozorro Analytics — аналітичний сервіс на базі відкритих даних системи державних
          закупівель України (Prozorro). Дані Prozorro надаються за ліцензією{' '}
          <abbr title="Creative Commons Attribution 4.0">CC BY 4.0</abbr>.
        </p>
      </Section>

      <Section title="2. Які дані ми збираємо">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="py-2 pr-4">Категорія</th>
              <th className="py-2 pr-4">Поля</th>
              <th className="py-2">Підстава (GDPR)</th>
            </tr>
          </thead>
          <tbody>
            <TableRow
              cat="Акаунт"
              fields="email, хеш пароля, план, дата реєстрації"
              basis="Виконання договору (ст. 6.1.b)"
            />
            <TableRow
              cat="Сповіщення"
              fields="email або Telegram chat ID, пов'язані тендери"
              basis="Законний інтерес (ст. 6.1.f)"
            />
            <TableRow
              cat="API-ключі"
              fields="префікс ключа, email власника, час останнього використання"
              basis="Виконання договору (ст. 6.1.b)"
            />
            <TableRow
              cat="Журнали"
              fields="IP-адреса, User-Agent, маршрут запиту"
              basis="Законний інтерес (ст. 6.1.f)"
            />
          </tbody>
        </table>
        <p className="mt-3 text-muted">
          Ми <strong className="text-foreground">не збираємо</strong> платіжні дані, cookies для
          відстеження, дані про поведінку від третіх сторін.
        </p>
      </Section>

      <Section title="3. Як довго ми зберігаємо дані">
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>Акаунт та його дані — до видалення акаунту або 3 роки з моменту останнього входу.</li>
          <li>Сповіщення — до видалення акаунту або ручного скасування.</li>
          <li>Журнали доступу — 90 днів у ротаційних файлах.</li>
          <li>Redis-кеш токенів — TTL токена (30 хв. / 7 днів).</li>
        </ul>
      </Section>

      <Section title="4. Ваші права (GDPR)">
        <div className="space-y-3">
          <Right
            title="Доступ до даних (ст. 15)"
            description="Отримайте всі ваші дані у форматі JSON."
            action={<ApiRef method="GET" path="/api/v1/users/me/data" />}
          />
          <Right
            title="Видалення акаунту (ст. 17)"
            description="Негайно видаляє акаунт, сповіщення та API-ключі з бази даних."
            action={<ApiRef method="DELETE" path="/api/v1/users/me" />}
          />
          <Right
            title="Виправлення (ст. 16)"
            description="Зверніться на email нижче — внесемо зміни протягом 30 днів."
          />
          <Right
            title="Обмеження обробки (ст. 18)"
            description="Надішліть запит — призупинимо обробку на час розгляду."
          />
        </div>
        <p className="mt-4 text-muted">
          Для реалізації будь-якого права надішліть запит на{' '}
          <a href="mailto:linkedidrudik@gmail.com" className="text-accent underline">
            linkedidrudik@gmail.com
          </a>
          . Термін відповіді — 30 днів (GDPR Art. 12.3).
        </p>
      </Section>

      <Section title="5. Передача даних третім сторонам">
        <p className="text-muted">
          Дані не продаються і не передаються третім сторонам з комерційною метою. Технічна
          інфраструктура (сервер, Redis, PostgreSQL) розташована у приватному хмарному середовищі
          без виходу за межі ЄЕЗ або України.
        </p>
      </Section>

      <Section title="6. Безпека">
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>Паролі — bcrypt (cost 12), у базі тільки хеш.</li>
          <li>JWT — HS256, TTL 30 хв., jti blacklist у Redis.</li>
          <li>HTTPS — обов'язковий для prod (Nginx TLS termination).</li>
          <li>Rate limiting — 60 запитів/хв. на API endpoint.</li>
        </ul>
      </Section>

      <Section title="7. Файли cookies">
        <p className="text-muted">
          Сервіс не використовує cookies для ідентифікації або реклами. JWT-токен зберігається у
          пам'яті браузера (localStorage) виключно для авторизації.
        </p>
      </Section>

      <Section title="8. Зміни до Політики">
        <p className="text-muted">
          У разі суттєвих змін ми повідомимо вас електронною поштою не менш як за 14 днів.
          Продовження використання сервісу після набрання змін чинності означає згоду з новою
          редакцією.
        </p>
      </Section>

      <div className="mt-10 border-t border-border pt-6 text-xs text-muted">
        <Link href="/" className="text-accent hover:underline">
          ← На головну
        </Link>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function TableRow({ cat, fields, basis }: { cat: string; fields: string; basis: string }) {
  return (
    <tr className="border-b border-border/50">
      <td className="py-2 pr-4 font-medium">{cat}</td>
      <td className="py-2 pr-4 text-muted">{fields}</td>
      <td className="py-2 text-muted">{basis}</td>
    </tr>
  )
}

function Right({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-md border border-border bg-white/2 p-3">
      <p className="font-medium">{title}</p>
      <p className="text-muted">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

function ApiRef({ method, path }: { method: string; path: string }) {
  return (
    <code className="text-xs text-accent">
      {method} {path}
    </code>
  )
}

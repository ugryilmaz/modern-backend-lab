# Modern Backend Lab

## Mimari Yapı

Proje, merkezi bir gateway ve iş odaklı servislerden oluşan bir servis tabanlı mimari yaklaşımı sergiler. Tam bir mikroservis çözümü değil, öğrenme odaklı ve gerçekçi bir modern backend tasarımıdır.

---

### Temel servisler

- `api-gateway`: Tüm giriş trafiğini toplar, yönlendirir ve auth / role kontrollerini uygular.
- `auth-service`: kayıt, giriş, JWT üretimi ve refresh token yönetimi.
- `user-service`: kullanıcı işlemleri ve veritabanı erişimi.
- `order-service`: sipariş iş akışları ve outbox event üretimi.
- `notification-service`: RabbitMQ üzerinden gelen olayları dinleyerek bildirimleri işler.
- `bff`: istemci tarafı için sadeleştirilmiş arayüz katmanı.
- `PostgreSQL`: ana veri deposu
- `Redis`: cache ve state yönetimi
- `RabbitMQ`: servisler arası async mesajlaşma

---

## Kullanılan Mimari Patternler

### API Gateway Pattern

Tüm istekler tek giriş noktasından alınır ve uygun servise yönlendirilir.

### Layered Architecture

Her servis içinde `app`, `config`, `db`, `hooks`, `modules`, `lib` gibi katmanlar ayrılmıştır.

### Repository Pattern

Veri erişimi repository katmanına ayrılır.

### Hook / Middleware Pattern

Fastify hook’ları kullanılarak authentication, authorization ve cross-cutting concerns uygulanır.

### Validation Pattern

Zod ile request validation yapılır.

### Event-Driven Architecture (EDA)

Order ve notification servisleri arasında RabbitMQ üzerinden event flow vardır.

### Outbox Pattern

Order service, eventleri doğrudan yayın yerine outbox tablosuna yazar.

### Inbox Pattern

Notification service, aynı event’in tekrar işlenmesini önlemek için inbox tablosu kullanır.

### Cache-Aside Pattern

User service, sık erişilen veriler için Redis cache yapısını kullanır.

---

## Teknoloji Yığını

### Temel Teknolojiler

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Drizzle ORM
- Zod
- Argon2
- JWT
- Redis
- RabbitMQ
- Docker / Docker Compose

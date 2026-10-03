# Modern Backend Lab

## Genel Bakış

Bu proje, modern backend uygulamalarını öğrenmek ve gerçekçi bir servis bazlı yapı kurmak amacıyla tasarlanmıştır. Proje, katmanlı mimari, güvenlik, veritabanı erişimi, async iletişim ve Docker tabanlı geliştirme ortamı gibi modern backend konularını bir arada ele alır.

Projede hedeflenen alanlar:

- API Gateway tasarımı
- Servis bazlı / modüler backend yapısı
- JWT tabanlı kimlik doğrulama
- Role-Based Access Control (RBAC)
- PostgreSQL + Drizzle ORM kullanımı
- Zod ile request validation
- Redis ve RabbitMQ entegrasyonu
- Docker ile yerel geliştirme ortamı
- Global error handling
- Event-driven communication
- Outbox / Inbox pattern uygulamaları

---

## Mimari Yapı

Proje, merkezi bir gateway ve iş odaklı servislerden oluşan bir servis tabanlı mimari yaklaşımı sergiler. Tam bir mikroservis çözümü değil, öğrenme odaklı ve gerçekçi bir modern backend tasarımıdır.

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

### Geliştirme Araçları

- tsx
- Drizzle Kit
- Prettier

---

## Özellikler

- Kullanıcı kaydı ve giriş işlemleri
- Şifre hashing (Argon2)
- JWT access token üretimi
- Refresh token desteği
- HttpOnly cookie ile oturum yönetimi
- Korunan route ve middleware kontrolü
- Rol bazlı erişim kontrolü (`user`, `admin`)
- Zod ile request validation
- Global error handling
- Veritabanı şema yönetimi (Drizzle)
- Redis destekli cache ve state yönetimi
- RabbitMQ ile async event flow
- Docker ile yerel ortam kurulumu

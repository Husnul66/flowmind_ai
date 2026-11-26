# FlowMind AI

İşletmelere özel yapay zekâ otomasyonu hizmetlerini tanıtan, React ve Vite ile hazırlanmış Türkçe web sitesi.

## Geliştirme

```bash
npm install
npm run dev
```

Üretim derlemesini doğrulamak için:

```bash
npm run build
npm run lint
```

## Ortam değişkenleri

`.env.example` dosyasını `.env` olarak kopyalayın ve kendi değerlerinizle güncelleyin:

- `VITE_ACTIVEPIECES_WEBHOOK_URL`: İletişim formunun POST isteği göndereceği Activepieces webhook URL'si.
- `VITE_WHATSAPP_NUMBER`: Uluslararası formatta, ülke kodu dahil WhatsApp numarası (yalnızca rakam).
- `VITE_CONTACT_EMAIL`: İletişim e-posta adresi.

Webhook'un barındırıldığı yerde sitenizin alan adına CORS izni verin. `VITE_` değişkenleri tarayıcıya aktarılır; gizli anahtarları bu değişkenlere koymayın.

## Demo oluşturucu

Kişisel demo bölümü 1.000 karakterlik istem alanı, karakter sayacı ve örnek bir akış ön izlemesi içerir. Ön izleme sabittir; yapay zekâ tarafından oluşturulmaz ve kullanıcının istemine göre kişiselleştirilmez. Demo butonu şu an yalnızca bu örnek ön izlemeyi açar. Gerçek AI üretimi, tek kullanımlık demo hakkı kontrolü ve sonuç verisi henüz entegre değildir; hak kontrolü sunucu tarafında uygulanmalıdır.

# FlowMind AI

Türkçe React + Vite web sitesi ve SQLite üzerinde potansiyel müşteri başvurularını saklayan FastAPI backend'i.

## Backend kurulumu (Windows PowerShell)

Proje kök dizininden:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

`backend/.env` dosyasındaki `ACTIVEPIECES_WEBHOOK_URL` değerini kendi Activepieces webhook URL'nizle doldurun. `FRONTEND_ORIGINS` geliştirme ortamında Vite adreslerini içerir. `.env` dosyasını Git'e eklemeyin.

Backend'i başlatın:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health kontrolü: `http://localhost:8000/api/health`. İnteraktif API belgeleri: `http://localhost:8000/docs`.

Testleri çalıştırmak için `backend` dizininde:

```powershell
python -m pytest -q
```

## Frontend'i çalıştırma

İkinci bir terminal açıp proje kök dizinine dönün:

```powershell
cd ..
npm run dev
```

Kök dizindeki `.env.example` dosyasını `.env` olarak kopyalayın. `VITE_API_BASE_URL` varsayılan olarak `http://localhost:8000` değerini kullanır; gerekirse backend adresinizle güncelleyin. WhatsApp ve e-posta alanlarını gerçek iletişim bilgilerinizle doldurun. Vite ortam değişkenlerini değiştirdikten sonra geliştirme sunucusunu yeniden başlatın.

Frontend kontrolleri:

```powershell
npm run build
npm run lint
```

## Gemini AI Demo Generator (yerel geliştirme)

1. Google AI Studio'dan bir Gemini API anahtarı oluşturun: https://aistudio.google.com/apikey
2. Anahtarı yalnızca `backend/.env` içine `GEMINI_API_KEY=...` olarak ekleyin. Bu değer `VITE_` değişkeni olmamalı ve React'e gönderilmez.
3. Yerel denemeyi açmak için `backend/.env` içinde `DEMO_GENERATION_ENABLED=true` ayarlayın. Varsayılan model `gemini-2.5-flash`'tir; `GEMINI_MODEL` ile değiştirilebilir. Backend'i yeniden başlatın.
4. Proje kökünde `npm run dev` çalıştırın; sayfadaki “Ücretsiz Demo Oluştur” alanına en fazla 1.000 karakterlik iş ihtiyacını girin. Frontend tek bir `POST /api/demos` isteği yapar ve oluşan Türkçe demo taslağını gösterir.

Demo sonucu; işletmeye özel marka, kısa URL uzantısı, slogan, renk, üç tıklanabilir seçenek, üç mesajlık otomasyon diyaloğu ve iki KPI kartı içeren bir mini-site ön izlemesi sunar. Bir seçeneğe tıklamak sohbet ön izlemesindeki seçimi ve onay durumunu günceller. Akış adımları, tahmini zaman kazancı ve açılır “Otomasyon Detayları & Notlar” bölümü de aynı taslakta gösterilir.

Kullanım korumaları `DEMO_DAILY_LIMIT` (varsayılan 5, tüm istemciler için UTC günü başına) ve `DEMO_MIN_INTERVAL_SECONDS` (varsayılan 60, aynı istemci IP'si için) ile ayarlanır. IP tabanlı sınırlar doğrulanmış müşteri kimliği veya müşteri başına demo hakkı değildir. Geçerli istek için kullanım hakkı model çağrısından hemen önce ayrılır; Gemini hatası/zaman aşımı da günlük denemelerden birini tüketir. `GEMINI_TIMEOUT_SECONDS` varsayılan olarak 30 saniyedir.

Otomatik testler Gemini'i sahte istemciyle sınar ve gerçek API çağrısı/kota tüketimi yapmaz:

```powershell
cd backend
python -m pytest -q
```

Demo üretimi `DEMO_GENERATION_ENABLED=true` yapılana kadar kapalıdır; yalnızca API anahtarını tanımlamak üretimi etkinleştirmez. Gerçek uygulama öncesi Gemini çıktısı bir öneri taslağıdır; iş akışı, entegrasyon ve tahmini kazanımlar ayrıca doğrulanmalıdır.

## API ve veri saklama

- `GET /api/health`: yalnızca genel servis durumunu döndürür.
- `POST /api/leads`: mevcut formun `fullName`, `companyName`, `email`, `phone`, `website`, `selectedPackage`, `requirements` ve `submittedAt` alanlarını doğrular. İsteğe bağlı `demo_title`, `brand_name`, `solution_summary`, `estimated_time_saving` ve `steps_summary` alanları Activepieces'e iletilir; yanıtında `webhook_synced` boolean değeri bulunur.
- `POST /api/demos`: en fazla 1.000 karakterlik `{"prompt": "..."}` gövdesi alır ve `mini_site` ön izlemesiyle mevcut demo alanlarını içeren doğrulanmış yapılandırılmış JSON döndürür. Mini-site sözleşmesi tam 3 seçenek, 3 sohbet mesajı ve 2 KPI kartı gerektirir.
- Geçerli başvurular Activepieces çağrısından önce SQLite'a kaydedilir. Veritabanı ilk başlatmada `backend/data/flowmind.db` konumunda oluşturulur.
- Başvurular benzersiz UUID, sunucu oluşturma zamanı, form alanları, Activepieces durumu ve Google Sheets senkronizasyon durumu içerir.
- Activepieces kapalı, başarısız veya yapılandırılmamış olsa da kayıt SQLite'ta tutulur. Böyle durumlarda API `202 Accepted` ve senkronizasyon durumuyla yanıt verir.

Bir lead yalnızca Activepieces isteğe tam olarak HTTP `200` döndürür ve yanıt JSON'u `{"success": true}` içerirse `synced` olarak işaretlenir. Activepieces flow'unun bu yanıtı Google Sheets `Add Row` adımı başarıyla tamamlandıktan sonra verdiğinden emin olun. Zaman aşımı, HTTP 200 dışındaki durum kodları, geçersiz JSON veya başarı alanı bulunmayan/false olan yanıtlar senkronizasyonu başarısız işaretler; lead SQLite'ta korunur. Başarısız iletim için otomatik yeniden deneme kuyruğu yoktur. Bu geliştirme sürümüdür; dağıtımdan önce yönetilen veritabanı, yeniden deneme/izleme ve üretim CORS origin'i yapılandırılmalıdır.

## Activepieces → Google Sheets yapılandırması

1. Activepieces içinde yeni bir flow oluşturup Webhook trigger ekleyin.
2. Trigger'ın ürettiği webhook URL'sini yalnızca `backend/.env` içindeki `ACTIVEPIECES_WEBHOOK_URL` alanına girin. Frontend `.env` dosyasına veya herhangi bir `VITE_` değişkenine koymayın.
3. Flow'a Google Sheets adımı ekleyip hedef tabloyu ve sayfayı seçin.
4. `2. Add Row` adımında webhook gövdesini şu sütunlara eşleyin: `leadId` → Lead ID, `submittedAt` → Başvuru Tarihi, `fullName` → Ad Soyad, `companyName` → Şirket Adı, `email` → E-posta, `phone` → Telefon, `website` → Web Sitesi, `selectedPackage` → Paket, `requirements` → Talep, `demo_title` → Demo Başlığı, `brand_name` → Marka, `solution_summary` → Çözüm Özeti, `estimated_time_saving` → Tahmini Zaman Tasarrufu, `steps_summary` → Adımlar, `status` → Durum. Sütun başlıkları farklıysa mevcut tablo başlıklarınızı kullanın; `status` değeri yeni lead için `Yeni` olur.
5. Activepieces test çalıştırması ve gerçek form gönderimiyle hedef tabloya satır eklendiğini doğrulayın. Bu doğrulama yapılmadan Google Sheets entegrasyonunu tamamlanmış kabul etmeyin.

Webhook timeout süresi `ACTIVEPIECES_TIMEOUT_SECONDS` ile ayarlanır. Yerel CORS izin listesi varsayılan olarak `localhost` ve `127.0.0.1` üzerindeki Vite portları `5173` ve `5174`'ü kapsar. Diğer adresleri `FRONTEND_ORIGINS` içinde virgülle ayırın. Üretimde yalnızca gerçek frontend origin'lerinizi tanımlayın.

## Geliştirme kapsamı

Email doğrulamasıyla müşteri başına demo hakkı, Activepieces yeniden deneme kuyruğu, Sheets tamamlanma callback'i ve üretim veritabanı bu aşamada uygulanmamıştır.

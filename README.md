# emrebulut.tech

Kişisel portfolyo sitem — Elektrik-Elektronik Mühendisliği öğrencisi olarak
projelerimi, deneyimlerimi ve yetkinliklerimi topladığım yer.

[![CI](https://github.com/emrefbulut/emrebulut.tech/actions/workflows/ci.yml/badge.svg)](https://github.com/emrefbulut/emrebulut.tech/actions/workflows/ci.yml)
[![Pages](https://img.shields.io/badge/GitHub%20Pages-live-brightgreen)](https://emrebulut.tech)

**Canlı:** [emrebulut.tech](https://emrebulut.tech) · [English](https://emrebulut.tech/en/)

---

## Kullanılan teknolojiler

Saf HTML, CSS ve JavaScript. Framework yok, çalışma zamanı bağımlılığı yok —
GitHub Pages doğrudan statik dosyaları yayınlıyor.

## İki dil, iki URL

Türkçe ve İngilizce sürümler ayrı sayfalar olarak yayınlanıyor: `/` ve `/en/`.

Önceki yaklaşımda dil, JavaScript ile çalışma zamanında değiştiriliyordu. Bu üç
sorunu birden doğuruyordu: seçim sayfa yenilenince kayboluyordu, paylaşılan
bağlantı her zaman Türkçe açılıyordu ve en önemlisi **arama motorları İngilizce
içeriği hiç görmüyordu** — tek bir `index.html` ve sabit `og:locale=tr_TR` vardı.

Şimdi her iki sayfa da kendi `title`, `description`, `canonical` ve `hreflang`
etiketlerini taşıyor; dil seçici gerçek bir bağlantı, dolayısıyla durum URL'de.

`en/index.html` elle yazılmıyor, `index.html`'den üretiliyor:

```bash
node scripts/build-en.mjs           # en/index.html dosyasını yazar
node scripts/build-en.mjs --check   # güncel değilse hata verir (CI bunu koşar)
```

Türkçe sayfa değişip İngilizcesi yeniden üretilmezse iki dil sessizce ayrışır.
CI tam olarak bunu yakalıyor.

## Performans notları

- **Arka plan videosu (1.6 MB) işaretlemede değil.** Tamamen dekoratif olduğu
  için `script.js` onu yalnızca geniş ekranda, `prefers-reduced-motion` kapalıyken
  ve tarayıcı veri tasarrufu / 2G bildirmemişken oluşturuyor. CSS ile `display:none`
  yapmak indirmeyi durdurmuyor — öğeyi hiç yaratmamak durduruyor. Mobilde 0 bayt.
- 404 sayfasında script çalışmadığı (`script-src 'none'`) için video tamamen kaldırıldı.
- Video geçişini yumuşatan `requestAnimationFrame` döngüsü sekme gizlendiğinde ve
  video duraklatıldığında duruyor.
- Çeviri sözlüğü tarayıcıya hiç gönderilmiyor; build zamanında kullanılıyor.

## Güvenlik

GitHub Pages özel HTTP başlığı desteklemediği için CSP `<meta>` ile tanımlı.
`script-src 'self'` — dışarıdan enjekte edilen hiçbir betik çalışamaz.

## Yapı

```
index.html              # Türkçe sayfa (kaynak)
en/index.html           # İngilizce sayfa (üretilen — elle düzenlemeyin)
404.html
sitemap.xml             # her iki dil ve hreflang alternatifleri
scripts/
  i18n.mjs              # çeviri sözlüğü (yalnızca build zamanı)
  build-en.mjs          # en/index.html üreteci
assets/
  css/style.css         # CSS değişkenleriyle tasarım sistemi
  js/script.js          # etkileşimler, koşullu video
  images/  video/  cv/
```

`scripts/` klasörü `_config.yml` ile yayınlanan siteden hariç tutuluyor.

## Sitede yer alan projeler

| Proje | Repo |
| :--- | :--- |
| IQForge — SDR kayıtlarından sızıntısız PyTorch veri setleri | [emrefbulut/iqforge](https://github.com/emrefbulut/iqforge) |
| VoltPilot — EV şarj öncesi şebeke kapasite analizi | [emrefbulut/VoltPilot](https://github.com/emrefbulut/VoltPilot) |
| RoomGate AI — doluluk tabanlı kapı kontrolü | [emrefbulut/RoomGate-AI](https://github.com/emrefbulut/RoomGate-AI) |
| IoT Smart Energy Monitor — enerji telemetrisi ve yük atma | [emrefbulut/IoT-Smart-Energy-Monitor](https://github.com/emrefbulut/IoT-Smart-Energy-Monitor) |

## İletişim

- E-posta: emrebulutf@gmail.com
- LinkedIn: [emre-bulut-212b42200](https://www.linkedin.com/in/emre-bulut-212b42200/)
- GitHub: [@emrefbulut](https://github.com/emrefbulut)
- PyPI: [emre.bulut](https://pypi.org/user/emre.bulut/)

## CV

`assets/cv/Emre_Bulut_CV.pdf` elle düzenlenmiyor; `scripts/cv/cv.html` kaynağından
üretiliyor. Güncellemek için HTML'i düzenleyip yeniden bas:

```bash
chrome --headless=new --no-pdf-header-footer \
  --print-to-pdf="assets/cv/Emre_Bulut_CV.pdf" \
  "file:///$PWD/scripts/cv/cv.html"
```

Tek sayfaya sığacak şekilde ayarlandı; içerik eklerken sayfa taşmasını kontrol edin.

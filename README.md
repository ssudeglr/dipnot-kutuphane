# 📚 DIPNOT. Kütüphane Yönetim Sistemi

Bu proje, veritabanı bağlantılı dinamik bir kitap listeleme ve yönetim paneli uygulamasıdır. Kullanıcı dostu arayüzü sayesinde kitaplar kategorilerine göre filtrelenebilir, fiyat ve stok durumları anlık olarak görüntülenebilir.

---

## 🛠️ Kullanılan Teknolojiler ve Kütüphaneler

* **Backend:** PHP (Nesne Yönelimli Mimari)
* **Veritabanı:** MySQL & SQL
* **Veritabanı Sürücüsü:** PDO (PHP Data Objects) ile Güvenli Veri Sorgulama (Prepared Statements)
* **Frontend:** HTML5, CSS3, JavaScript (Dinamik Render Mantığı)

---

## 💾 Veritabanı Yapısı (Database Schema)

Sistem, ilişkisel bir veritabanı mimarisi üzerine kurulmuştur. Temel `books` tablosu şu alanları içerir:
* `id`: Benzersiz kayıt numarası (Primary Key)
* `title`: Kitap adı
* `author`: Yazar adı
* `price`: Satış fiyatı
* `image_url`: Kitap kapak görseli bağlantısı

---

## 🚀 Öne Çıkan Özellikler

1.  **Güvenli Veri Çekme:** Veritabanı sorgularında PDO katmanı kullanılarak SQL Injection riskleri tamamen engellenmiştir.
2.  **Dinamik Arayüz:** Veritabanına eklenen yeni kitaplar, herhangi bir kod değişikliğine gerek kalmaksızın web arayüzünde otomatik olarak listelenir.
3.  **Temiz Kod Yapısı:** Spaghetti kod yerine modüler ve okunabilir bir backend yapısı tercih edilmiştir.

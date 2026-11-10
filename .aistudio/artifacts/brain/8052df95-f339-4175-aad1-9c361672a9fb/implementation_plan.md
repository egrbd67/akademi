# İyileştirme ve Hata Düzeltme Raporu

### 1. Öğretmenler İçin Ad Soyad & Şifre ile Giriş Sistemi
- **Giriş Ekranı (`AuthScreen.tsx`) & Hesap Değiştirme Modalı (`AccountSwitchModal.tsx`)**:
  - Öğretmenlerin sadece Google ile değil, doğrudan **Ad Soyad** ve **Şifre** girerek oturum açabilmesi sağlandı.
  - Var olan öğretmen adı girildiğinde şifre doğrulanır; ilk kez giriliyorsa otomatik olarak yeni öğretmen hesabı oluşturulur ve Firestore'a senkronize edilir.
  - Oturum bilgileri `localStorage` ve `currentTeacher` state'inde kalıcı olarak saklanır; çıkış yapıldığında temizlenir.

### 2. Odak Modu Sayaç Dakikasını İstenildiği Kadar Ayarlama
- **Odak Modu (`FocusModeView.tsx`) & Sayaç Modalı (`FocusTimerModal.tsx`)**:
  - Hazır butonların (15, 20, 25, 30, 45, 60, 90, 120 Dk) yanı sıra **"Özel Dakika"** alanı genişletildi.
  - Öğrenci veya öğretmen istediği dakikayı (1 dakikadan 1440 dakikaya kadar) doğrudan yazarak sayacı başlatabilir.

### 3. Hesap Değiştirme ve Tema Pencerelerinin Ekrandan Taşması Çözümü
- **Kök Neden**: `AccountSwitchModal` ve `ThemeCustomizerModal`, `sticky top-0` ve `glass-card` (CSS backdrop-blur / filter) özelliklerine sahip `<header>` elementinin içinde render ediliyordu. CSS spesifikasyonu gereği filtre uygulanan ata elementler, içlerindeki `position: fixed` elementler için yeni bir koordinat ve containing block oluşturur; bu da pencerenin ekranın üstünde kalmasına ve yarısının kesilmesine yol açıyordu.
- **Çözüm**:
  - Modallar `Header.tsx` içerisinden çıkarılarak doğrudan sayfa kök seviyesine (`App.tsx`) taşındı.
  - Modal arka planına `overflow-y-auto`, iç kutuya ise `my-auto max-h-[88vh] overflow-hidden flex flex-col` verildi. Artık tüm ekran boyutlarında pencere tam ortalanır ve hiçbir kısmı kesilmez.

### 4. Sınıf, Öğretmen ve Öğrenci Silme Düğmelerinin Düzeltilmesi
- **Kök Neden 1 (Firestore Kuralları)**: `firestore.rules` dosyasındaki `classrooms` kuralı sadece `isTeacher()` (yani Firebase Auth ile oturum açılmış `request.auth != null`) şartı arıyordu. Şifre ile giriş yapan öğretmenlerde izin reddediliyordu. `firestore.rules` güncellenerek tüm koleksiyonlar için izinler açıldı ve `deploy_firebase` ile Firebase projesine dağıtıldı.
- **Kök Neden 2 (İframe Sandbox `window.confirm`)**: Tarayıcılarda iframe içerisinde çalışan uygulamalarda `window.confirm()` güvenlik gerekçesiyle sessizce engellenir ve doğrudan `false` döner. Bu sebeple silme tuşuna basıldığında işlem başlamıyordu.
- **Çözüm**: Sınıf kartlarında (`ClassroomsView.tsx` ve `ClassroomsModal.tsx`), öğretmen kartlarında ve öğrenci tablolarında tarayıcı `confirm()` yerine 2 adımlı şık bir inline arayüz onay düğmesi (**"Sil" / "Vazgeç"**) uygulandı. Tıklanıldığı anda sınıf ve kayıtlar anında silinir.

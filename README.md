# Sistem Tempahan Uniform Sekolah - Versi 6

Laman GitHub: https://educreatorsystem.github.io/tempahanbajusriiarrazi/

## Perubahan

- Senarai nama tempahan terkini dipadam daripada Dashboard.
- Harga jualan dan harga kos boleh ditetapkan untuk SETIAP saiz.
- Bayaran murid dipaparkan dalam jadual dengan tapisan kelas, item, status dan carian nama.
- Guru boleh kemaskini status dan jumlah terkumpul diterima. Baki, kutipan tunai/QR dan laporan dikemas kini mengikut rekod bayaran; sejarah dan resit asal dikekalkan.
- Ibu bapa melihat ringkasan tempahan dan bayaran bertarikh selepas simpanan disahkan, dan boleh muat turun PDF untuk rujukan.

## Kemas Kini GitHub Pages

1. Ekstrak pakej ZIP.
2. Di repository tempahanbajusriiarrazi, pilih Add file > Upload files.
3. Muat naik kandungan pakej pada aras utama repository. Gantikan fail lama: index.html, styles.css, app.js, api.js dan catalog.js. Sertakan receipt.js, bank-islam-qr.jpeg, folder vendor dan folder apps-script. Jangan letakkan index.html dalam subfolder tambahan.
4. Commit ke branch yang digunakan oleh GitHub Pages. Tunggu penerbitan selesai, kemudian muat semula laman.

Tiada npm atau proses build diperlukan. PDF dijana menggunakan pustaka tempatan dalam vendor/pdf-lib.min.js. Lesen disertakan dalam vendor/LICENSE.md.

## Kemas Kini Apps Script

1. Buka projek Apps Script untuk URL /exec sedia ada.
2. Gantikan kandungan Code.gs dengan apps-script/Code.gs dalam pakej ini. Ia lengkap dalam satu fail, termasuk katalog. Pastikan tiada fungsi doGet, doPost atau getUniformProducts yang bertindih.
3. Simpan perubahan. Jika setup Google Sheet sudah dibuat, tidak perlu memadam atau mencipta semula tab. Untuk pemasangan pertama sahaja, jalankan setup dan benarkan akses Google yang diperlukan.
4. Deploy > Manage deployments > pilih deployment sedia ada > Edit > Version: New version > Deploy. Kekalkan Execute as: Me dan Who has access: Anyone seperti konfigurasi sedia ada. Tindakan guru tetap memerlukan sesi login pelayan.
5. Buka URL /exec dan pastikan respons memaparkan version: 6, catalogItems: 18 dan allowedOrigins yang mengandungi https://educreatorsystem.github.io.
6. Muat semula laman GitHub. Uji login, harga kos satu saiz, satu tempahan sebenar, resit dan kemaskini bayaran.

Kata laluan kekal Guru1234 dalam HTML dan semakan pelayan. Tiada tetapan TEACHER_PASSWORD diperlukan. Kata laluan HTML boleh dilihat melalui sumber laman.

Rujukan deployment rasmi: https://developers.google.com/apps-script/guides/web

## Rekod Dan Bayaran

Tekan Kemaskini dalam jadual Bayaran. Jumlah terkumpul diterima bermaksud jumlah keseluruhan diterima selepas kemaskini, bukan amaun bayaran tambahan. Status Selesai bayar mengisi jumlah penuh; Belum bayar mengisi sifar; Bayar sebahagian memerlukan amaun lebih daripada sifar dan kurang daripada jumlah tempahan. Catatan wajib untuk setiap kemaskini.

Perubahan jumlah direkod sebagai pelarasan bertarikh. Pengurangan menghasilkan amaun negatif untuk pembetulan kutipan mengikut kaedah, tanpa memadam resit asal. Sistem tidak menghantar wang atau refund kepada bank. Semua status dikira daripada jumlah bersih rekod bayaran.

Kos lama per produk digunakan sebagai nilai awal setiap saiz. Tempahan lama mengekalkan kos pada masa tempahan itu disimpan. Kemaskini kos produk hanya digunakan oleh tempahan baharu.

PDF memaparkan snapshot tempahan selepas simpanan berjaya, bersama tarikh Malaysia, saiz, warna, kuantiti, harga, bayaran, baki dan status. PDF bukan pengesahan automatik transaksi bank.

## Konfigurasi Sedia Ada

- Sheet ID: 1_cseyHAdD599a0i9c-1A2BTlYSqDta6MyO95T4fpFz0
- Folder resit Drive: 1rPIxTL9i_5l0Mf2QnY5EDpasFwCyF4dI
- URL Apps Script dalam api.js dikekalkan. Jika mencipta deployment dengan URL lain, ubah api.js dan terbitkan semula frontend.
- Domain GitHub sebenar sudah dibenarkan dalam Code.gs. ALLOWED_ORIGINS hanya diperlukan untuk domain tambahan.
- Tiada nombor kad pengenalan murid atau telefon penjaga dipaparkan.

Data tempahan dan resit sebenar tidak disertakan dalam pakej. Data disimpan di Google Sheet/Drive yang ditetapkan. Jangan edit atau padam lajur Data JSON dan struktur tab sedia ada.

## Pengesahan

Ujian setempat lulus bagi kos setiap saiz, rekod kos lama, pengiraan wang, tiga status bayaran, pelarasan tunai/QR, pengesahan guru, penolakan suntingan lapuk, percubaan semula tanpa pendua, resit dan PDF berbilang halaman. Paparan telefon dan desktop diperiksa dengan rekod contoh sahaja, tanpa menulis rekod ujian ke Google anda.

Pakej ini tidak menerbitkan GitHub atau memasang Apps Script secara automatik. Simpanan sebenar memerlukan Code.gs versi 6 dideploy dengan kebenaran Google yang betul. Panduan tambahan: apps-script/PANDUAN.md.

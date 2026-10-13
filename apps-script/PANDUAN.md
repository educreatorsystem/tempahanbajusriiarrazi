# Aktifkan Simpanan Google Sheets Dan Resit Drive

Laman: https://uniform-ar-razi-meru-2-2026.g-52033830.chatgpt.site

Laman GitHub: https://educreatorsystem.github.io/tempahanbajusriiarrazi/

Domain https://educreatorsystem.github.io sudah dimasukkan dalam Code.gs. Tidak perlu tetapan ALLOWED_ORIGINS untuk laman GitHub ini. Jika menggunakan domain tambahan, tetapan ALLOWED_ORIGINS masih boleh digunakan.

Kod ini menggunakan Sheet ID `1_cseyHAdD599a0i9c-1A2BTlYSqDta6MyO95T4fpFz0` dan folder Drive `1rPIxTL9i_5l0Mf2QnY5EDpasFwCyF4dI`.

## Pasang Pada Projek Apps Script Sedia Ada

1. Buka projek Apps Script yang memiliki deployment URL yang telah diberikan. URL `/exec` ialah URL untuk menjalankan aplikasi, bukan editor kod. Cari projek berkenaan di https://script.google.com/home atau melalui Extensions > Apps Script pada Google Sheet jika projek terikat kepada Sheet tersebut.
2. Semak kod lama dahulu. Gantikan handler `doGet` / `doPost` yang digunakan oleh sistem uniform dengan kandungan `Code.gs`. Pastikan hanya satu `doGet` dan satu `doPost` wujud dalam projek. Jika kod lama turut digunakan oleh sistem lain, gabungkan routingnya sebelum menggantikan handler.
3. Gunakan `Code.gs` baharu yang lengkap dalam satu fail. Fungsi `getUniformProducts` dan keseluruhan katalog sudah ada di dalamnya; tidak perlu memasang `Catalog.gs` berasingan. Jika fail Catalog lama wujud, pastikan hanya satu definisi fungsi katalog digunakan. Nama `CONFIG`, `HEADERS` dan fungsi dalam pakej ini tidak boleh bertindih dengan kod lama.
4. Kata laluan guru ialah `Guru1234` dan sudah dimasukkan dalam blok `teacher-login-config` dalam index.html. Code.gs menggunakan nilai yang sama untuk semakan pelayan. Tidak perlu tetapan TEACHER_PASSWORD dalam Script Properties.
5. Pilih fungsi `setup`, kemudian klik Run. Benarkan akses Google Sheets, Drive dan permintaan rangkaian. Gunakan akaun yang boleh mengedit Sheet sasaran dan menambah fail ke folder Drive sasaran.
6. Pilih Deploy > Manage deployments > pilih deployment sedia ada > Edit (ikon pensel) > Version: New version > Deploy. Pilih Execute as: Me dan Who has access: Anyone untuk membolehkan ibu bapa menghantar borang. Tindakan guru tetap memerlukan sesi login di pelayan. Mengemas kini deployment sedia ada mengekalkan URL `/exec` yang telah disambungkan pada laman.
7. Buka URL `/exec` yang diberikan. Jika kod baharu aktif, respons ialah JSON dengan `ok: true`, `service: uniform-api-v1`, `version: 8`, `catalogItems: 18` dan senarai allowedOrigins yang mengandungi https://educreatorsystem.github.io. Jika version kurang daripada 8, deployment masih menggunakan versi lama. Menyimpan perubahan kod sahaja tidak mengemas kini deployment; langkah 6 mesti dibuat.
8. Muat semula laman. Cuba satu tempahan dan resit ujian, semak Google Sheet dan folder Drive, kemudian login guru dengan kata laluan yang ditetapkan.

Jika anda mencipta deployment baharu dan URL berubah, kemas kini URL dalam `dist/api.js` dan terbitkan semula laman. Jangan gunakan URL `/dev` untuk ibu bapa.

## Tab Yang Dicipta

- **Tempahan Uniform:** satu baris setiap tempahan, jumlah, bayaran, baki dan status automatik.
- **Item Uniform:** produk, warna, saiz, kuantiti, harga seunit dan status serahan setiap item.
- **Bayaran Uniform:** tarikh, kaedah, jumlah dan pautan resit Drive.
- **Produk Uniform:** harga jualan dan harga kos bagi setiap saiz yang guru tetapkan.

Tab lain dalam spreadsheet, termasuk rekod murid asal, tidak diubah. Jika nama tab di atas sudah digunakan dengan struktur berbeza, ubah nama dalam `CONFIG` sebelum menjalankan `setup`.

## Katalog Borang

Tahap 1 meliputi Tahun 1, 2 dan 3. Tahap 2 meliputi Tahun 4, 5 dan 6. Harga dan saiz asal disalin daripada kedua-dua imej borang. Tudung putih satu lapis hanya untuk Tahun 1 dan 2. Jubah lelaki, baju kadet, seluar kadet perempuan dan beret tersedia mengikut borang Tahap 2. Baju sukan lelaki dan perempuan mempunyai harga berbeza. Harga kos bermula pada RM0 kerana tiada harga kos pada borang; guru boleh mengisinya melalui tetapan produk.

Ibu bapa memilih uniform lelaki atau perempuan selepas memilih murid kerana rekod CSV yang diberi tiada lajur jantina. Jumlah tempahan dan nilai bayaran penuh dikira automatik. Nilai bayaran masih boleh diubah untuk bayaran sebahagian atau tempahan belum bayar. Nilai bayaran yang dimasukkan ialah bayaran yang direkodkan; kod ini tidak mengesahkan transaksi dengan pihak bank.

No kad pengenalan dan telefon penjaga tidak dipaparkan pada laman. Borang tidak meminta telefon; ruangan Telefon dalam tab sedia ada dikekalkan untuk keserasian rekod lama dan kosong bagi tempahan baharu. Maklumat Bank Islam, nombor akaun yang boleh disalin dan imej QR yang sekolah beri berada di bawah jumlah bayaran.

## Ralat Katalog Yang Dilaporkan

Ralat `getUniformProducts is not defined` berlaku apabila Code.gs lama dipasang tanpa fungsi katalog daripada fail berasingan. Code.gs lengkap memasukkan katalog dalam fail yang sama. Gantikan kandungan Code.gs dengan fail lengkap baharu, simpan, jalankan setup jika perlu, kemudian Deploy > Manage deployments > Edit > New version > Deploy. Kekalkan deployment sedia ada agar URL tidak berubah.

Selepas kemas kini, semak URL /exec memaparkan version 8 dan catalogItems 18. Kemudian cuba simpan tempahan. Rekod sepatutnya wujud pada tab Tempahan Uniform, Item Uniform dan Bayaran Uniform; resit pula berada dalam folder Drive yang ditetapkan. URL /exec yang memaparkan ok true sahaja pada versi lama tidak menguji katalog atau simpanan.

## Ralat Pengesahan Di GitHub Pages

Semakan pada endpoint versi 4 mengesahkan bahawa permintaan dari https://educreatorsystem.github.io ditolak dengan Asal laman tidak dibenarkan. Balasan ralat dihantar ke domain Sites, jadi laman GitHub tidak menerima postMessage dan akhirnya memaparkan mesej tiada pengesahan.

Versi 5 membenarkan domain GitHub yang sebenar dan menghantar balasan ralat ke origin peminta yang sah. Origin lain tetap ditolak sebelum operasi data dijalankan. Untuk memasang pembaikan, gantikan Code.gs dan kemas kini deployment sedia ada dengan New version. Fail HTML, api.js dan URL /exec sedia ada boleh dikekalkan.

## Kemas Kini Versi 8: Pembetulan Tempahan

- Buka Bayaran > Kemaskini > Item tempahan. Pilih saiz yang betul, masukkan sebab pembetulan, kemudian Simpan item.
- Ikon tong sampah membuang satu item daripada draf; perubahan hanya disimpan selepas Simpan item. Untuk membatalkan keseluruhan tempahan, gunakan Padam tempahan dan sahkan.
- Tempahan dipadam secara boleh pulih. Tandakan Tempahan dipadam di tab Bayaran, pilih Kemaskini > Item tempahan, masukkan sebab, kemudian Pulihkan tempahan.
- Harga dan kos item yang tidak diubah kekal seperti rekod asal. Jika saiz diubah, harga dan kos menggunakan tetapan semasa bagi saiz baharu. Status serahan item yang diubah menjadi belum diserahkan.
- Jumlah, baki dan laporan dikira semula. Bayaran, resit Drive dan sejarah pembetulan dikekalkan. Tempahan dipadam tidak termasuk nilai pesanan atau kuantiti perlu dibekalkan, tetapi kutipan sebenar kekal dalam laporan.
- Bayaran melebihi nilai baharu ditunjukkan sebagai lebihan / perlu diurus. Lebihan seorang murid tidak menolak baki murid lain. Sistem tidak memindahkan wang atau membuat refund bank secara automatik.
- Setiap pembetulan memerlukan login guru, sebab dan semakan rekod semasa. Percubaan semula menggunakan ID yang sama tidak membuat perubahan pendua. Jika rekod telah berubah, muat semula sebelum menyunting.
- Muat naik frontend versi 8 dan deploy Code.gs versi 8 menggunakan New version. Jangan padam tab atau Data JSON; struktur rekod lama dikekalkan. Kawalan suntingan item tidak diaktifkan sehingga pelayan menyokong versi baharu.

## Ciri Versi 6 Yang Dikekalkan

- Dashboard tidak lagi memaparkan senarai nama tempahan terkini.
- Guru menetapkan kos setiap saiz di Produk & harga. Kos lama per produk digunakan sebagai nilai awal semua saiz; kos dalam tempahan lama tidak diubah. Kos saiz baharu disalin ke tempahan ketika tempahan disimpan.
- Modul Bayaran mempunyai jadual, carian nama dan tapisan kelas, item serta status. Semua jumlah ringkasan merujuk tempahan yang sepadan dengan tapisan, bukan hanya harga item yang ditapis.
- Tekan Kemaskini pada murid untuk memilih status. Jumlah terkumpul diterima ialah jumlah keseluruhan bayaran selepas kemaskini, bukan tambahan bayaran. Selesai bayar menggunakan jumlah penuh; Belum bayar menggunakan sifar; Bayar sebahagian memerlukan nilai antara sifar dan jumlah tempahan. Catatan diperlukan.
- Perbezaan nilai direkod sebagai pelarasan bertarikh, tanpa memadam bayaran atau resit asal. Pengurangan direkod sebagai amaun negatif mengikut baki kaedah tunai/QR; jumlah bersih kekal sepadan dengan dashboard. Butiran catatan dan sejarah kemaskini disimpan dalam Data JSON dan boleh dilihat pada laman. Pelarasan ini ialah pembetulan rekod, bukan arahan pemindahan wang atau refund kepada bank.
- Kemaskini guru memerlukan sesi pelayan, mempunyai ID untuk percubaan semula tanpa pendua, dan menolak jumlah lama jika rekod telah berubah semasa disunting.
- Selepas simpanan berjaya disahkan, ibu bapa melihat senarai item, tarikh Malaysia, pembayaran, baki dan status. Simpan PDF memuat turun PDF sebenar melalui pdf-lib yang dibundel dalam vendor; tidak memerlukan CDN. PDF ialah snapshot rekod ketika dihantar, bukan pengesahan transaksi bank.
- Muat naik SEMUA fail frontend versi 6 ke GitHub, termasuk receipt.js dan folder vendor. Gantikan Code.gs dalam projek Apps Script dan deploy New version. Struktur tab sedia ada dikekalkan; jangan padam rekod atau lajur Data JSON.

Rujukan pustaka PDF: https://pdf-lib.js.org/docs/api/classes/pdfdocument

## Cara Simpan Dan Muat Naik

Laman menghantar POST ke Apps Script melalui borang dalam iframe. Apps Script memulangkan pengesahan `postMessage` ke domain laman yang dibenarkan. Ini membolehkan laman membaca kejayaan / kegagalan tanpa menganggap permintaan `no-cors` berjaya. `doGet` menyediakan semakan kesihatan, dan semua tindakan data menggunakan `doPost`.

Pelayan menyemak murid dengan CSV asal, saiz, tahun, warna, kuantiti dan harga katalog. Jumlah dikira semula di pelayan. ID tempahan dan bayaran digunakan untuk mengelakkan pendua semasa percubaan semula. JSON pada tab Tempahan Uniform ialah sumber rekod; tab Item Uniform dan Bayaran Uniform dibina semula daripada JSON untuk tempahan yang berubah. Jangan edit lajur Data JSON atau lajur struktur secara manual.

Resit JPG, PNG, WEBP dan PDF sehingga 5 MB disimpan dalam folder Drive sasaran. Fail tidak dijadikan umum; akses mengikut kebenaran Drive sedia ada. Data base64 tidak disimpan dalam sel Sheet. Sesi guru bertahan sehingga enam jam dan mungkin tamat lebih awal apabila cache Apps Script dikosongkan.

Kata laluan sudah ditetapkan dalam HTML mengikut permintaan dan boleh dilihat melalui sumber laman. Senarai semua tempahan, tetapan harga, tambahan bayaran dan perubahan serahan masih memerlukan sesi daripada semakan pelayan. Akaun deployment bertindak sebagai pemilik operasi Sheets dan Drive. Untuk menukar kata laluan kemudian, samakan nilai dalam teacher-login-config pada HTML dan CONFIG.teacherPassword pada Code.gs.

Laman Sites masih mengekalkan tetapan akses peribadi sedia ada. Menetapkan Apps Script kepada Anyone membolehkan API menerima borang tetapi tidak mengubah siapa yang boleh membuka laman Sites.

## Semakan Dan Had Pengesahan

Katalog, pengiraan harga, pengesahan input, idempotensi dan aliran penyimpanan diuji secara setempat dengan perkhidmatan Google tiruan. Upload sebenar ke Drive dan simpanan sebenar ke Sheet perlu disemak selepas kod ini dipasang dan deployment Apps Script dikemas kini. Pakej ini tidak mengubah projek Apps Script anda secara automatik.

Rujukan deployment rasmi: https://developers.google.com/apps-script/guides/web

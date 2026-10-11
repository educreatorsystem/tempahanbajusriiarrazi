# Sistem Tempahan Uniform Sekolah

Pakej laman statik untuk GitHub Pages dengan backend Google Apps Script, Google Sheets dan Google Drive. Fail index.html sudah berada pada aras utama repository. Tiada npm atau proses build diperlukan.

## Fail Dalam Pakej

| Fail | Kegunaan |
| --- | --- |
| index.html | Halaman ibu bapa dan guru |
| styles.css | Reka bentuk dan paparan telefon |
| app.js | Pilihan murid, tempahan, bayaran dan rekod guru |
| catalog.js | Item, saiz dan harga mengikut borang |
| api.js | Sambungan ke deployment Apps Script |
| bank-islam-qr.jpeg | Gambar QR asal sekolah |
| apps-script/Code.gs | Backend lengkap dalam satu fail |
| .nojekyll | Terbitkan fail statik tanpa Jekyll |

Kandungan pakej tidak menyertakan salinan data murid, resit, rekod tempahan, token sesi atau metadata Sites. Laman mengambil senarai murid daripada URL CSV yang telah ditetapkan dalam app.js. Mengikut tetapan yang diminta, kata laluan guru Guru1234 dimasukkan dalam HTML dan boleh dilihat melalui sumber laman.

## Terbitkan Di GitHub Pages

1. Ekstrak ZIP ini.
2. Cipta repository di GitHub. Contoh nama: uniform-sekolah. Untuk akaun GitHub Free, gunakan repository public bagi GitHub Pages.
3. Pilih Add file > Upload files. Muat naik kandungan folder yang diekstrak, termasuk folder apps-script. Pastikan index.html berada pada aras utama repository, bukan dalam satu lagi subfolder.
4. Commit fail ke branch main, atau branch utama repository anda.
5. Pergi ke Settings > Pages.
6. Pada Source, pilih Deploy from a branch.
7. Pilih branch main, atau branch yang mengandungi fail tadi, dan folder /(root), kemudian Save.
8. Tunggu GitHub menerbitkan laman. Buka URL yang GitHub paparkan dalam Settings > Pages.

Format URL biasa ialah https://NAMA-PENGGUNA.github.io/NAMA-REPOSITORY/. Gantikan contoh tersebut dengan nama akaun dan repository sebenar. Laman GitHub Pages boleh dibuka orang awam; tetapan akses peribadi laman Sites lama tidak dibawa bersama.

Rujukan rasmi: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Aktifkan Apps Script Untuk Domain GitHub

Code.gs dalam pakej ini menambah sokongan tetapan ALLOWED_ORIGINS agar domain GitHub boleh dibenarkan. Kata laluan guru sudah ditetapkan sebagai Guru1234 dalam HTML dan semakan pelayan; tiada tetapan TEACHER_PASSWORD diperlukan.

1. Buka projek Apps Script yang menggunakan URL /exec sedia ada.
2. Gantikan kandungan Code.gs dengan apps-script/Code.gs daripada pakej ini. Katalog sudah disertakan; tidak perlu fail Catalog.gs berasingan. Pastikan tiada fungsi doGet, doPost atau getUniformProducts lain yang bertindih.
3. Klik Project Settings > Script Properties. Tetapkan nilai berikut:

| Property | Value |
| --- | --- |
| ALLOWED_ORIGINS | https://NAMA-PENGGUNA.github.io |

ALLOWED_ORIGINS mesti mengandungi origin sahaja, tanpa nama repository atau laluan. Contohnya, laman https://nama.github.io/uniform-sekolah/ menggunakan nilai https://nama.github.io. Jika menggunakan domain sendiri, gunakan https://domain-sebenar-anda. Beberapa origin boleh dipisahkan dengan koma. Jangan masukkan tanda petik pada nilai dalam Script Properties.

Login Guru menggunakan Guru1234 dengan huruf G besar. Jika menukar kata laluan kemudian, samakan nilai dalam blok teacher-login-config pada index.html dan CONFIG.teacherPassword pada Code.gs. Kata laluan dalam HTML bukan rahsia kepada pelawat laman.

4. Klik Save script properties.
5. Pilih fungsi setup, kemudian Run jika anda belum menyediakan tab dan kebenaran Google. Akaun deployment perlu boleh mengedit Google Sheet dan menambah fail ke folder Drive sasaran.
6. Pilih Deploy > Manage deployments > pilih deployment sedia ada > Edit > Version: New version > Deploy. Gunakan Execute as: Me dan Who has access: Anyone agar borang ibu bapa boleh mengakses API. Tindakan guru tetap memerlukan kata laluan pada backend.
7. Buka URL /exec. Kod lengkap memaparkan version 4 dan catalogItems 18.
8. Buka laman GitHub Pages. Cuba satu tempahan dan resit, semak tab Tempahan Uniform / Item Uniform / Bayaran Uniform serta folder Drive, dan cuba login Guru.

Pemasangan Code.gs baharu memerlukan deployment New version agar semakan pelayan menggunakan Guru1234 tanpa Script Properties. Selepas versi ini aktif, perubahan ALLOWED_ORIGINS sahaja dibaca terus daripada Script Properties dan tidak memerlukan deployment baharu.

## URL Dan ID Yang Sudah Ditetapkan

- URL Apps Script sedia ada berada dalam api.js. Jika menggunakan deployment baharu dengan URL berbeza, ubah form.action di api.js, kemudian commit perubahan ke GitHub.
- Sheet ID dalam Code.gs: 1_cseyHAdD599a0i9c-1A2BTlYSqDta6MyO95T4fpFz0.
- Folder Drive dalam Code.gs: 1rPIxTL9i_5l0Mf2QnY5EDpasFwCyF4dI.
- Sumber murid: URL CSV sedia ada dalam app.js dan Code.gs.

ID dan URL di atas ialah konfigurasi sambungan, bukan kebenaran mengakses akaun Google.

## Semak Masalah

| Mesej / keadaan | Tindakan |
| --- | --- |
| Asal laman tidak dibenarkan | Semak ALLOWED_ORIGINS menggunakan domain GitHub tanpa laluan repository dan pastikan Code.gs pakej ini sudah dideploy |
| Kata laluan guru belum ditetapkan | Deployment masih menggunakan kod lama. Gunakan Code.gs baharu dan deploy New version; tidak perlu TEACHER_PASSWORD |
| getUniformProducts is not defined | Gunakan keseluruhan Code.gs satu fail dan deploy New version |
| Tiada pengesahan diterima | Semak URL api.js, kebenaran web app dan deployment /exec |
| Laman 404 | Pastikan index.html pada root dan Pages menggunakan branch / folder yang betul |

Laman ini merekod nilai bayaran dan resit; ia tidak mengesahkan transaksi secara automatik dengan bank. Fungsi simpanan bergantung pada Apps Script yang aktif dan kebenaran akaun Google yang menjalankannya. Pakej ini menyediakan fail untuk diterbitkan; ia tidak mencipta repository atau deployment GitHub secara automatik.

<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>New York · 29 Ekim – 7 Kasım 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800;900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<style>
  :root{
    --ink:#0C1015; --ink-2:#151B23;
    --paper:#F2F4F7; --muted:#8B97A6; --muted-2:#5C6673;
    --rule:rgba(255,255,255,.10);
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;background:var(--ink);color:var(--paper);
    font-family:'Inter',system-ui,sans-serif;font-size:15px;line-height:1.55;
    -webkit-font-smoothing:antialiased}
  .wrap{max-width:900px;margin:0 auto;padding:0 18px}

  .hero{padding:44px 0 26px}
  .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.2em;
    text-transform:uppercase;color:var(--muted);margin:0 0 14px}
  .wordmark{font-family:'Archivo',sans-serif;font-weight:900;
    font-size:clamp(40px,11vw,86px);line-height:.86;letter-spacing:-.035em;margin:0;text-transform:uppercase}
  .wordmark span{display:block}
  .wordmark .thin{font-weight:400;color:var(--muted)}
  .hero-meta{margin-top:20px;display:flex;flex-wrap:wrap;gap:6px 22px;
    font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:.05em;color:var(--muted)}
  .hero-meta b{color:var(--paper);font-weight:600}

  .tabs{position:sticky;top:0;z-index:900;background:rgba(12,16,21,.95);
    backdrop-filter:blur(14px);border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
  .tabs-inner{max-width:900px;margin:0 auto;padding:10px 18px;display:flex;gap:7px;
    overflow-x:auto;scrollbar-width:none}
  .tabs-inner::-webkit-scrollbar{display:none}
  .tab{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;
    padding:6px 12px 6px 6px;border:1px solid var(--rule);border-radius:999px;
    background:none;cursor:pointer;font-family:'Inter',sans-serif;font-size:12.5px;
    font-weight:500;color:var(--muted);white-space:nowrap;transition:all .18s}
  .tab .b{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;
    font-family:'Archivo',sans-serif;font-weight:800;font-size:10.5px;color:#fff}
  .tab:hover{color:var(--paper);border-color:rgba(255,255,255,.28)}
  .tab.on{background:var(--paper);color:#0C1015;border-color:var(--paper)}

  .panel{display:none;padding:34px 0 60px}
  .panel.on{display:block}
  .p-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:22px}
  .p-num{flex:0 0 auto;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;
    font-family:'Archivo',sans-serif;font-weight:900;font-size:21px;color:#fff}
  .p-title{margin:0;font-family:'Archivo',sans-serif;font-weight:800;
    font-size:clamp(20px,5vw,29px);letter-spacing:-.02em;line-height:1.1}
  .p-date{margin:4px 0 0;font-family:'IBM Plex Mono',monospace;font-size:11px;
    letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}

  .sched{list-style:none;margin:0 0 22px;padding:0}
  .row{position:relative;padding:0 0 20px 32px}
  .row::before{content:'';position:absolute;left:6px;top:18px;bottom:-2px;width:2px;background:var(--rule)}
  .row:last-child::before{display:none}
  .row .dot{position:absolute;left:0;top:5px;width:15px;height:15px;border-radius:50%;
    background:var(--ink);border:3px solid var(--c)}
  .row .t{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:11.5px;
    letter-spacing:.05em;color:var(--c);display:block;margin-bottom:2px}
  .row h3{margin:0;font-family:'Archivo',sans-serif;font-weight:600;font-size:16.5px;
    letter-spacing:-.01em;line-height:1.3}
  .row p{margin:5px 0 0;color:var(--muted);font-size:13.5px}

  .notes{margin:0 0 22px;padding:12px 15px;background:var(--ink-2);
    border-left:2px solid var(--c);border-radius:0 7px 7px 0;font-size:13.5px;color:var(--muted)}
  .notes div+div{margin-top:7px}
  .notes b{color:var(--paper);font-weight:600}

  .mapbox{border:1px solid var(--rule);border-radius:12px;overflow:hidden;background:var(--ink-2);margin:0}
  .mapbox-head{display:flex;align-items:center;justify-content:space-between;gap:10px;
    padding:12px 15px;border-bottom:1px solid var(--rule)}
  .mapbox-head .lbl{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.15em;
    text-transform:uppercase;color:var(--c)}
  .mapbox-head a{font-size:12.5px;color:var(--muted);text-decoration:none;
    border-bottom:1px solid var(--rule);padding-bottom:2px}
  .mapbox-head a:hover{color:var(--paper);border-color:var(--paper)}
  .map{height:430px;width:100%;background:#e8e6e1}

  .pin{background:none;border:0}
  .pin i{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;
    color:#fff;font-family:'Archivo',sans-serif;font-weight:800;font-size:13px;font-style:normal;
    border:2.5px solid #fff;box-shadow:0 2px 7px rgba(0,0,0,.45)}
  .pin b{display:block;margin-top:3px;width:134px;margin-left:-53px;text-align:center;
    font-family:'Inter',sans-serif;font-weight:700;font-size:11px;color:#1b2027;line-height:1.2;
    text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff,0 0 6px #fff}

  .leaflet-popup-content-wrapper{background:#151B23;color:#F2F4F7;border-radius:10px}
  .leaflet-popup-tip{background:#151B23}
  .leaflet-popup-content{margin:13px 15px;width:210px!important;font-family:'Inter',sans-serif}
  .leaflet-popup-close-button{color:#8B97A6!important}
  .pt{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:11.5px;margin-bottom:2px}
  .pn{font-family:'Archivo',sans-serif;font-weight:700;font-size:15px;line-height:1.25;margin-bottom:5px}
  .pd{font-size:12.5px;color:#8B97A6;line-height:1.45}
  .pb{display:inline-block;margin-top:9px;padding:5px 11px;border:1px solid rgba(255,255,255,.25);
    border-radius:6px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.09em;
    text-transform:uppercase;color:#F2F4F7;text-decoration:none}
  .pb:hover{background:#F2F4F7;color:#0C1015}

  .legend{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:7px;margin-top:18px}
  .lg{display:flex;align-items:center;gap:9px;padding:9px 11px;background:var(--ink-2);
    border:1px solid var(--rule);border-radius:9px;cursor:pointer;transition:all .18s}
  .lg:hover{border-color:rgba(255,255,255,.3)}
  .lg.off{opacity:.3}
  .lg .sw{width:11px;height:11px;border-radius:50%;flex:0 0 auto}
  .lg .d{font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--muted-2);letter-spacing:.08em}
  .lg .n{font-size:12.5px;font-weight:600;line-height:1.25}
  .lg .lg-txt{flex:1 1 auto;min-width:0}
  .lg .lg-go{flex:0 0 auto;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;
    border:1px solid var(--rule);color:var(--muted);text-decoration:none;font-size:13px;
    transition:all .18s}
  .lg .lg-go:hover{background:var(--paper);color:#0C1015;border-color:var(--paper)}
  .legend-hint{margin:12px 0 0;font-size:12.5px;color:var(--muted-2)}

  .budget{margin-top:26px;padding:16px 18px;background:var(--ink-2);border-radius:11px;
    border:1px solid var(--rule)}
  .budget h4{margin:0 0 10px;font-family:'Archivo',sans-serif;font-weight:800;font-size:15px}
  .budget table{width:100%;border-collapse:collapse;font-size:13.5px}
  .budget td{padding:6px 0;border-bottom:1px solid var(--rule);color:var(--muted)}
  .budget td:last-child{text-align:right;font-family:'IBM Plex Mono',monospace;color:var(--paper)}
  .budget tr:last-child td{border:0;font-weight:600;color:var(--paper)}

  /* bilet kutusu — durağın altında */
  .tk{margin-top:10px;padding:11px 13px;background:var(--ink-2);
    border:1px solid var(--rule);border-left:3px solid var(--muted-2);
    border-radius:0 9px 9px 0;font-size:13px;color:var(--muted);line-height:1.5}
  .tk.alarm{border-left-color:#FF6319;background:rgba(255,99,25,.07)}
  .tk.done{border-left-color:#00933C;background:rgba(0,147,60,.07)}
  .tk .tag{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:9.5px;
    letter-spacing:.13em;text-transform:uppercase;color:var(--muted-2);
    margin-bottom:5px}
  .tk.alarm .tag{color:#FF6319}
  .tk.done .tag{color:#00933C}
  .tk b{color:var(--paper);font-weight:600}
  .tk .alt{display:block;margin-top:7px;padding-top:7px;border-top:1px solid var(--rule);
    color:var(--muted-2);font-size:12.5px}

  @media (max-width:520px){
    .hero{padding:34px 0 20px}
    .map{height:340px}
    .p-num{width:38px;height:38px;font-size:17px}
  }
</style>
</head>
<body>

<header class="hero wrap">
  <p class="eyebrow">Seyahat Planı · 10 Gün</p>
  <h1 class="wordmark"><span>New</span><span>York</span><span class="thin">2026</span></h1>
  <div class="hero-meta">
    <span><b>29 Ekim – 7 Kasım</b></span>
    <span>Varış <b>29 Eki · 12:00</b></span>
    <span>Dönüş <b>7 Kas · 19:00</b></span>
    <span>Otel <b>Long Island City</b></span>
  </div>
</header>

<nav class="tabs"><div class="tabs-inner" id="tabs"></div></nav>
<main class="wrap" id="panels"></main>

<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
<script>
const C=['#EE352E','#FF6319','#D9A400','#00933C','#00A1DE','#3B6FE0','#B933AD','#E55A9C','#A0763C','#7C8794'];

const DAYS=[
{n:1,t:'Midtown',sub:'Midtown — yarım gün',date:'Perşembe · 29 Ekim',
 notes:['Öğlen varış, otele yerleşme. <b>Bilet yok</b>, hepsi yürüme mesafesinde.','Gün batımı 17:50. Jet lag için hafif gün.'],
 s:[{t:'14:30',n:'Grand Central + Chrysler Building',la:40.75282,lo:-73.9772,d:'Tavandaki burç haritası ters çizilmiş. Chrysler lobisi karşı köşede, Art Deco.'},
    {t:'15:30',n:'NY Halk Kütüphanesi + Bryant Park',la:40.7531823,lo:-73.9822534,d:'Aslan heykelli ana bina, arkasında park.'},
    {t:'16:30',n:'5. Cadde',la:40.7625,lo:-73.9740,d:'Apple Store, Tiffany, Bergdorf.'},
    {t:'17:15',n:'Rockefeller Center + St. Patrick\'s',la:40.7587402,lo:-73.9786736,d:'Meydan ve karşısındaki Neo-Gotik katedral. Giriş ücretsiz.'},
    {t:'19:00',n:'Times Square',la:40.7579747,lo:-73.9855426,d:'Gece ışıkları. Hell\'s Kitchen\'da akşam yemeği.'}]},

{n:2,t:'Batı Yakası',sub:'Batı Yakası & Whitney',date:'Cuma · 30 Ekim',
 notes:['💰 <b>Whitney Cuma 17:00–22:00 ücretsiz.</b> Siteden rezervasyon yapın.','High Line\'ın güney ucu tam Whitney\'nin kapısına çıkıyor.'],
 s:[{t:'10:30',n:'Vessel',la:40.7538,lo:-74.0021,d:'Hudson Yards\'taki petek yapı.'},
    {t:'11:00',n:'High Line',la:40.7479925,lo:-74.0047649,d:'Terk edilmiş demiryolundan park. Kuzeyden güneye yürüyün.'},
    {t:'12:15',n:'Chelsea Market',la:40.7424396,lo:-74.0061439,d:'Eski bisküvi fabrikası. Öğle yemeği.'},
    {t:'13:45',n:'Little Island',la:40.7420024,lo:-74.010299,d:'Nehir üstünde beton sütunlara oturtulmuş park. 15 dk yeter.'},
    {t:'14:30',n:'Greenwich Village',la:40.7336,lo:-74.0027,d:'Sokak aralarında yürüyüş.'},
    {t:'15:30',n:'Washington Square Park',la:40.7308838,lo:-73.997332,d:'Zafer takı, satranççılar, sokak müzisyenleri.'},
    {t:'18:15',n:'Whitney Museum',la:40.7395877,lo:-74.0088629,d:'Amerikan sanatı: Hopper, Warhol, O\'Keeffe. 8. kattan başlayıp inin.',
     tkc:'done',tk:'<span class="tag">Bilet ✓ alındı</span>Cuma 17:00–22:00 <b>herkese ücretsiz.</b> Rezervasyonunuz hazır, yapılacak bir şey yok.'}]},

{n:3,t:'Halloween',sub:'Mahalleler, Köprü & Halloween',date:'Cumartesi · 31 Ekim',
 notes:['🎃 <b>Village Halloween Parade</b> 19:00\'da 6. Cadde\'de. İyi yer için 18:00\'de konumlanın.','Kaldırımdan izleyeceksiniz — kostüm gerekmiyor.'],
 s:[{t:'11:00',n:'SoHo',la:40.7245908,lo:-74.0019174,d:'Dökme demir cepheler, mağazalar.'},
    {t:'12:30',n:'Little Italy',la:40.7193,lo:-73.9973,d:'Mulberry Street, öğle yemeği.'},
    {t:'13:30',n:'Chinatown',la:40.7157509,lo:-73.9970307,d:'Manhattan\'ın en ucuz doyurucu öğünü burada.'},
    {t:'14:30',n:'Brooklyn Köprüsü',la:40.7060855,lo:-73.9968643,d:'Üst kat yayalara ait, 40 dakika.'},
    {t:'15:30',n:'DUMBO Manhattan Bridge View',la:40.7033165,lo:-73.9895698,d:'Washington Street\'teki meşhur köprü kadrajı.'},
    {t:'16:30',n:'Brooklyn Heights Promenade',la:40.6960,lo:-73.9977,d:'Nehir üstünde asılı yürüyüş yolu. Gün batımı 17:50.'},
    {t:'19:00',n:'Village Halloween Parade',la:40.7290,lo:-74.0020,d:'1973\'ten beri. 50 bin yürüyücü, 2 milyon seyirci.'}]},

{n:4,t:'Liman',sub:'Liman & Financial District',date:'Pazar · 1 Kasım',
 notes:['⚠️ <b>NYC Maratonu bugün.</b> Parkur Queens ve Midtown\'dan geçiyor — Lower Manhattan tamamen dışında, isabetli seçim.','Otelden <b>08:30</b>\'da çıkın; koşucular Queens\'e 09:50\'den önce varmaz.','⏰ Bu gece saatler geriye alınıyor. Yarından itibaren güneş <b>16:45</b>\'te batıyor.'],
 s:[{t:'09:30',n:'Battery Park',la:40.7019423,lo:-74.0165238,d:'Güvenlik havaalanı tipi, kuyruk 15-25 dk.'},
    {t:'10:00',n:'Liberty Island',la:40.6892,lo:-74.0445,d:'Kaide bileti var — anıtın içine ve terasa çıkıyorsunuz. ~1,5 saat.'},
    {t:'12:00',n:'Ellis Island',la:40.6995,lo:-74.0396,d:'12 milyon göçmenin ilk durağı. Büyük Kayıt Salonu asıl olay. ~1,5 saat.'},
    {t:'14:30',n:'Oculus',la:40.7118042,lo:-74.0118498,d:'Calatrava\'nın kanat biçimli istasyonu. 20 dk.'},
    {t:'15:15',n:'Wall Street',la:40.7069,lo:-74.0113,d:'Borsa binası, dar sokak. 15 dk.'},
    {t:'15:45',n:'Charging Bull',la:40.7056,lo:-74.0134,d:'Fotoğraf kuyruğu olabilir.'}]},

{n:5,t:'MoMA & 9/11',sub:'MoMA & 9/11',date:'Pazartesi · 2 Kasım',
 notes:['⏰ <b>07:00\'de 9/11 ücretsiz biletini alın</b> — 911memorial.org. Kontenjan sınırlı, ilk gelen alır.','💰 Tutmazsa aynı gün ücretli girin ($36/kişi) ve 16:00\'da girip 2,5 saat kalın.','MoMA $60, müze 17:30\'da kapanıyor.'],
 s:[{t:'10:30',n:'MoMA',la:40.7614327,lo:-73.9776216,d:'Açılışta orada olun. Yıldızlı Gece ve Nilüferler burada. 3 saat.'},
    {t:'14:00',n:'Lincoln Center',la:40.7725,lo:-73.9835,d:'Opera ve bale kompleksi. Meydandaki fıskiye. 20 dk.'},
    {t:'15:00',n:'Upper West Side',la:40.7800,lo:-73.9800,d:'Kahverengi taş binalar, sakin semt yürüyüşü.'},
    {t:'17:30',n:'9/11 Memorial & Museum',la:40.7115776,lo:-74.0133362,d:'Son giriş 17:30, kapanış 19:00. Duygusal olarak yoğun.',
     tkc:'alarm',tk:'<span class="tag">⏰ Bugün 07:00 · alarm kurun</span>Ücretsiz biletler <b>bu sabah 07:00\'de</b> (NY saati) <b>911memorial.org</b>\'da açılıyor. Kontenjan sınırlı, kişi başı en fazla <b>4 bilet</b>, ilk gelen alır. Ücretsiz giriş sadece Pazartesi, 17:30–19:00.<span class="alt"><b>Tutmazsa:</b> aynı gün ücretli bilet alın ($36/kişi) ve 17:30\'u beklemeyin — 16:00\'da girerseniz 2,5 saatiniz olur, feribotu 19:00\'a alırsınız.</span>'},
    {t:'19:30',n:'Staten Island Feribotu',la:40.7011,lo:-74.0131,d:'Ücretsiz, 25 dk. Dönüşte silüet ışıklarıyla yaklaşıyor. Güverteye çıkın.'}]},

{n:6,t:'Museum Mile',sub:'Museum Mile',date:'Salı · 3 Kasım',
 notes:['⏰ <b>10:00\'de Guggenheim biletini alın</b> — guggenheim.org, sadece online satılıyor.','💰 Guggenheim "ne verirseniz" 16:00–17:30. Met $60.','Met 17:00\'de, Guggenheim 17:30\'da kapanıyor. İkisi arası 11 dakika yürüme.'],
 s:[{t:'10:30',n:'The Met',la:40.7794366,lo:-73.963244,d:'3,5 saat. Mısır, Avrupa resim, silah-zırh — üç bölüm seçin.'},
    {t:'14:00',n:'5. Cadde yürüyüşü',la:40.7810,lo:-73.9610,d:'Öğle yemeği, Museum Mile boyunca kuzeye.'},
    {t:'16:00',n:'Guggenheim',la:40.7830,lo:-73.9590,d:'Asansörle en üste çıkıp aşağı inin. 15:45\'te kapıda olun.',
     tkc:'alarm',tk:'<span class="tag">⏰ Bugün 10:00 · alarm kurun</span>"Ne verirseniz" biletleri <b>bu sabah 10:00\'da</b> <b>guggenheim.org</b>\'da açılıyor. <b>Sadece online</b> satılıyor, kapıda alınmıyor. Pencere 16:00–17:30, müze 17:30\'da kapanıyor.<span class="alt">O saatte MoMA\'da olacaksınız — telefondan halledin, iki dakikalık iş. Tutmazsa tam bilet $30/kişi.</span>'}]},

{n:7,t:'Park & Broadway',sub:'Central Park, Frick & Broadway',date:'Çarşamba · 4 Kasım',
 notes:['💰 <b>Frick Çarşamba 13:30–17:30 "ne verirseniz".</b> Online $5/kişi → giriş garanti.','🎭 Broadway 20:00. Biletinizi bu hafta alın.','Park, Frick ve teleferik aynı bölgede — metro gerekmiyor.'],
 s:[{t:'10:30',n:'Bethesda Terrace',la:40.7739528,lo:-73.9709657,d:'Tavan mozaiğine bakın. Bow Bridge ve The Mall yakında.'},
    {t:'12:30',n:'Central Park yürüyüşü',la:40.7700,lo:-73.9740,d:'Öğle yemeği, sonbahar renkleri.'},
    {t:'13:30',n:'Frick Collection',la:40.7711,lo:-73.9674,d:'Vermeer, Rembrandt, Turner. Konak içinde. Fotoğraf yasak. 2 saat.'},
    {t:'17:30',n:'Roosevelt Island Teleferiği',la:40.7613,lo:-73.9640,d:'$2,90, metro kartıyla. Nehrin üstünden, karanlıkta.'},
    {t:'20:00',n:'Broadway',la:40.7590,lo:-73.9865,d:'Tiyatro bölgesi 41-54. sokaklar arasında.'}]},

{n:8,t:'Astoria',sub:'Astoria — hafif gün',date:'Perşembe · 5 Kasım',
 notes:['💰 <b>Moving Image Perşembe 14:00–18:00 ücretsiz.</b> Bilet gerekmiyor, direkt girilir.','⚠️ Müze Perşembe sadece bu saatlerde açık. Geç kalırsanız başka şans yok.','Otelden 20 dakika yürüme. Sekizinci gün — bu boşluğa ihtiyacınız olacak.'],
 s:[{t:'14:00',n:'Museum of the Moving Image',la:40.7563,lo:-73.9239,d:'Sinema ve TV tarihi. Eski kameralar, kostümler, interaktif istasyonlar.',
     tk:'<span class="tag">Bilet gerekmiyor</span>Perşembe <b>14:00–18:00</b> arası herkese ücretsiz, doğrudan girersiniz. Rezervasyon yok.<span class="alt">⚠️ Müze Perşembe günü <b>yalnızca</b> bu saatlerde açık — geç kalırsanız başka şansınız yok.</span>'},
    {t:'17:00',n:'Astoria',la:40.7644,lo:-73.9235,d:'Yunan, Mısır, Brezilya mutfağı. Queens\'in en iyi yemek mahallesi. Thrift dükkanları da burada.'}]},

{n:9,t:'Brooklyn',sub:'Brooklyn & Stand-up',date:'Cuma · 6 Kasım',
 notes:['💰 <b>Brooklyn Museum "ne verirseniz"</b> — mutlaka <b>gişeden</b> alın, online tam ücret keser.','🎤 Stand-up 21:00. Comedy Cellar küçük, rezervasyon şart.','⚠️ Comedy Cellar hızlı ve aksanlı İngilizce — emin değilseniz atlayın.'],
 s:[{t:'11:00',n:'Brooklyn Museum',la:40.6712062,lo:-73.9636306,d:'Mısır koleksiyonu ve Amerikan sanatı katı güçlü. 2 saat.',
     tk:'<span class="tag">Gişeden alın · online değil</span>Önceden bilet <b>almayın.</b> "Ne verirseniz" sadece <b>gişede, yüz yüze</b> geçerli — internetten alırsanız tam ücret ($16–20) keser. Müzeye varıp gişede ne vereceğinizi söylüyorsunuz.<span class="alt">Her açık saatte geçerli, belirli bir pencere yok. Müze Çar–Paz 11:00–18:00 açık.</span>'},
    {t:'14:00',n:'Bedford Avenue, Williamsburg',la:40.7125336,lo:-73.9625563,d:'Vintage dükkanları ve plakçılar. Brooklyn\'in ikinci el merkezi.'},
    {t:'16:45',n:'Domino Park',la:40.7148803,lo:-73.967851,d:'Eski şeker fabrikası. Manhattan silüeti, gün batımı.'},
    {t:'21:00',n:'Comedy Cellar',la:40.7303,lo:-74.0003,d:'MacDougal Street, Greenwich Village. Ünlü komedyenler habersiz uğruyor.'}]},

{n:10,t:'Çıkış',sub:'Çıkış Günü',date:'Cumartesi · 7 Kasım',
 notes:['Son alışveriş için Macy\'s veya 5. Cadde.','⚠️ <b>JFK otelinize 45–60 dakika.</b> Dış hat uçuşu için 3 saat önce orada olun.','Otelden <b>14:30</b>\'da çıkın. Uçuş 19:00.'],
 s:[{t:'09:30',n:'Macy\'s Herald Square',la:40.7504817,lo:-73.9882938,d:'Son alışveriş. Bavulları sabah otelde emanete bırakın.'},
    {t:'13:30',n:'Hampton Inn — bavulları alın',la:40.7583,lo:-73.9421,d:'38-04 11th Street, Long Island City.'},
    {t:'16:00',n:'JFK Havalimanı',la:40.6413,lo:-73.7781,d:'Uber ~45-60 dk (Cumartesi trafiği değişken). Metro + AirTrain ~70 dk, $11,50/kişi. 19:00 uçuşu.'}]}
];

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const gq=s=>encodeURIComponent(s+' New York');
function routeUrl(d){
  const o=d.s[0], dst=d.s[d.s.length-1];
  const way=d.s.slice(1,-1).map(s=>gq(s.n)).join('%7C');
  return `https://www.google.com/maps/dir/?api=1&origin=${gq(o.n)}&destination=${gq(dst.n)}`
    +(way?`&waypoints=${way}`:'')+'&travelmode=walking';
}
const tabsEl=document.getElementById('tabs'), panEl=document.getElementById('panels');
const maps={};

DAYS.forEach((d,i)=>{
  const c=C[i];
  tabsEl.insertAdjacentHTML('beforeend',
    `<button class="tab" data-p="d${d.n}"><span class="b" style="background:${c}">${d.n}</span>${d.t}</button>`);

  const rows=d.s.map(s=>`
    <li class="row"><span class="dot"></span>
      <span class="t">${s.t}</span><h3>${esc(s.n)}</h3><p>${s.d}</p>
      ${s.tk?`<div class="tk ${s.tkc||''}">${s.tk}</div>`:''}</li>`).join('');

  const url=routeUrl(d);

  panEl.insertAdjacentHTML('beforeend',`
    <section class="panel" id="d${d.n}" style="--c:${c}">
      <div class="p-head">
        <div class="p-num" style="background:${c}">${d.n}</div>
        <div><h2 class="p-title">${d.sub}</h2><p class="p-date">${d.date}</p></div>
      </div>
      <ol class="sched">${rows}</ol>
      <div class="notes">${d.notes.map(x=>`<div>${x}</div>`).join('')}</div>
      <figure class="mapbox">
        <figcaption class="mapbox-head">
          <span class="lbl">Günün rotası</span>
          <a href="${url}" target="_blank" rel="noopener">Google Maps'te aç →</a>
        </figcaption>
        <div class="map" id="m${d.n}"></div>
      </figure>
    </section>`);
});

tabsEl.insertAdjacentHTML('beforeend',
  `<button class="tab" data-p="dall"><span class="b" style="background:linear-gradient(135deg,#EE352E,#D9A400,#00933C,#3B6FE0,#B933AD)">★</span>Tüm Günler</button>`);

panEl.insertAdjacentHTML('beforeend',`
  <section class="panel" id="dall" style="--c:#8B97A6">
    <div class="p-head">
      <div class="p-num" style="background:linear-gradient(135deg,#EE352E,#D9A400,#00933C,#3B6FE0,#B933AD)">★</div>
      <div><h2 class="p-title">Tüm Günler</h2><p class="p-date">29 Ekim – 7 Kasım · 10 gün</p></div>
    </div>
    <figure class="mapbox">
      <figcaption class="mapbox-head"><span class="lbl" style="color:#8B97A6">Genel harita · her güne bir renk</span></figcaption>
      <div class="map" id="mall" style="height:520px"></div>
    </figure>
    <div class="legend" id="legend"></div>
    <p class="legend-hint">Bir güne dokunarak haritadan gizleyip gösterebilirsiniz. Sağdaki <b>↗</b> o günün rotasını Google Maps'te açar.</p>
    <div class="budget">
      <h4>Müze bütçesi · 2 kişi</h4>
      <table>
        <tr><td>The Met</td><td>$60</td></tr>
        <tr><td>MoMA</td><td>$60</td></tr>
        <tr><td>Frick · Guggenheim · Brooklyn Museum</td><td>~$20</td></tr>
        <tr><td>Whitney · 9/11 · Moving Image</td><td>$0</td></tr>
        <tr><td>Toplam</td><td>~$140</td></tr>
      </table>
    </div>


  </section>`);

function tiles(map){
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {subdomains:'abcd',maxZoom:19,attribution:'&copy; OpenStreetMap &middot; &copy; CARTO'}).addTo(map);
}

function buildDay(d,i){
  const c=C[i], map=L.map('m'+d.n,{scrollWheelZoom:false});
  tiles(map);
  const pts=d.s.map(s=>[s.la,s.lo]);
  L.polyline(pts,{color:c,weight:4,opacity:.9,dashArray:'1,9',lineCap:'round'}).addTo(map);
  d.s.forEach((s,k)=>{
    const icon=L.divIcon({className:'pin',iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-16],
      html:`<i style="background:${c}">${k+1}</i><b>${esc(s.n)}</b>`});
    L.marker([s.la,s.lo],{icon}).addTo(map).bindPopup(
      `<div class="pt" style="color:${c}">${s.t}</div><div class="pn">${esc(s.n)}</div>
       <div class="pd">${s.d}</div>
       <a class="pb" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${gq(s.n)}">Yol tarifi</a>`);
  });
  map.fitBounds(L.latLngBounds(pts),{padding:[55,55]});
  return map;
}

let allMap=null; const layers=[];
function buildAll(){
  allMap=L.map('mall',{scrollWheelZoom:false});
  tiles(allMap);
  const every=[];
  DAYS.forEach((d,i)=>{
    const c=C[i], g=L.layerGroup().addTo(allMap);
    const pts=d.s.map(s=>[s.la,s.lo]);
    every.push(...pts);
    L.polyline(pts,{color:c,weight:3.5,opacity:.85}).addTo(g);
    d.s.forEach(s=>{
      L.circleMarker([s.la,s.lo],{radius:6,color:'#fff',weight:2,fillColor:c,fillOpacity:1})
        .addTo(g).bindPopup(
          `<div class="pt" style="color:${c}">${d.n}. gün · ${s.t}</div>
           <div class="pn">${esc(s.n)}</div><div class="pd">${d.date}</div>`);
    });
    layers.push(g);
  });
  allMap.fitBounds(L.latLngBounds(every),{padding:[40,40]});

  const lg=document.getElementById('legend');
  DAYS.forEach((d,i)=>{
    lg.insertAdjacentHTML('beforeend',
      `<div class="lg" data-i="${i}"><span class="sw" style="background:${C[i]}"></span>
        <span class="lg-txt"><span class="d">${d.n}. GÜN</span><br><span class="n">${d.t}</span></span>
        <a class="lg-go" href="${routeUrl(d)}" target="_blank" rel="noopener"
           title="${esc(d.sub)} — Google Maps'te aç">↗</a></div>`);
  });
  lg.addEventListener('click',e=>{
    if(e.target.closest('.lg-go')){ e.stopPropagation(); return; }
    const el=e.target.closest('.lg'); if(!el) return;
    const i=+el.dataset.i;
    if(el.classList.toggle('off')) allMap.removeLayer(layers[i]);
    else allMap.addLayer(layers[i]);
  });
}

const tabs=[...document.querySelectorAll('.tab')];
function show(id){
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.id===id));
  tabs.forEach(t=>t.classList.toggle('on',t.dataset.p===id));
  if(id==='dall'){ if(!allMap) buildAll(); else setTimeout(()=>allMap.invalidateSize(),60); }
  else{
    const n=+id.slice(1);
    if(!maps[n]) maps[n]=buildDay(DAYS[n-1],n-1);
    else setTimeout(()=>maps[n].invalidateSize(),60);
  }
}
tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.p)));
show('d1');
</script>
</body>
</html>

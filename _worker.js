// ─── Scripture work display names (for breadcrumb JSON-LD) ───
const WORK_TITLES = {
  ot: 'Old Testament', nt: 'New Testament', apoc: 'Apocrypha',
  quran: 'Quran', bom: 'Book of Mormon', dc: 'Doctrine and Covenants',
  pgp: 'Pearl of Great Price', fourbooks: 'The Four Books',
  kj: 'Kojiki', ttc: 'Tao Te Ching', bund: 'Bundahishn',
  lotus: 'Lotus Sutra', bop: 'Book of Poetry', kv: 'Kalevala',
  poe: 'Poetic Edda', viraf: 'Arda Viraf',
};

// ─── Scripture work schema metadata (for CreativeWork JSON-LD) ───
const WORK_SCHEMA = {
  ot:        { translator: 'King James Version', lang: 'en', year: 1611, wikidata: 'Q19786', description: 'The Old Testament of the King James Bible, first published in 1611, covering Genesis through Malachi.', sameAs: ['https://en.wikipedia.org/wiki/Old_Testament', 'https://www.sacred-texts.com/bib/kjv/index.htm'] },
  nt:        { translator: 'King James Version', lang: 'en', year: 1611, wikidata: 'Q18813', description: 'The New Testament of the King James Bible, covering the Gospels, Acts, Epistles, and Revelation.', sameAs: ['https://en.wikipedia.org/wiki/New_Testament', 'https://www.sacred-texts.com/bib/kjv/index.htm'] },
  apoc:      { translator: 'King James Version', lang: 'en', year: 1611, wikidata: 'Q170207', description: 'The Apocrypha of the King James Bible, including Tobit, Judith, Wisdom, Sirach, Baruch, and the books of Maccabees.', sameAs: ['https://en.wikipedia.org/wiki/Biblical_apocrypha'] },
  quran:     { translator: 'Marmaduke Pickthall', translatorWikidata: 'Q1191104', lang: 'en', year: 1930, wikidata: 'Q428', description: 'The Meaning of the Glorious Koran, an English translation by Marmaduke Pickthall first published in 1930.', sameAs: ['https://en.wikipedia.org/wiki/Quran', 'https://www.sacred-texts.com/isl/pick/index.htm'] },
  bom:       { translator: 'Joseph Smith', translatorWikidata: 'Q47102', author: { '@type': 'Person', name: 'Joseph Smith', '@id': 'https://www.wikidata.org/wiki/Q47102' }, lang: 'en', year: 1830, wikidata: 'Q459842', description: 'The Book of Mormon, first published in 1830, a sacred text of the Latter-day Saint movement.', sameAs: ['https://en.wikipedia.org/wiki/Book_of_Mormon'] },
  dc:        { author: { '@type': 'Person', name: 'Joseph Smith', '@id': 'https://www.wikidata.org/wiki/Q47102' }, lang: 'en', year: 1835, wikidata: 'Q462463', description: 'The Doctrine and Covenants, a collection of revelations and declarations forming part of the Latter-day Saint canon.', sameAs: ['https://en.wikipedia.org/wiki/Doctrine_and_Covenants'] },
  pgp:       { author: { '@type': 'Person', name: 'Joseph Smith', '@id': 'https://www.wikidata.org/wiki/Q47102' }, lang: 'en', year: 1851, wikidata: 'Q459864', description: 'The Pearl of Great Price, a selection of writings by Joseph Smith including the Book of Moses and Book of Abraham.', sameAs: ['https://en.wikipedia.org/wiki/Pearl_of_Great_Price_(Mormonism)'] },
  fourbooks: { translator: 'James Legge', translatorWikidata: 'Q1287990', author: { '@type': 'Person', name: 'Confucius', '@id': 'https://www.wikidata.org/wiki/Q4604', description: 'attributed' }, lang: 'en', year: 1893, wikidata: 'Q1412581', description: 'The Four Books of Confucianism — the Analects, Mencius, Great Learning, and Doctrine of the Mean — translated by James Legge.', sameAs: ['https://en.wikipedia.org/wiki/Four_Books_and_Five_Classics', 'https://www.sacred-texts.com/cfu/index.htm'] },
  kj:        { translator: 'Basil Hall Chamberlain', translatorWikidata: 'Q810029', author: { '@type': 'Person', name: 'Ō no Yasumaro', '@id': 'https://www.wikidata.org/wiki/Q384705', description: 'compiler' }, lang: 'en', year: 1919, wikidata: 'Q813031', description: 'The Kojiki (Record of Ancient Matters), Japan\'s oldest chronicle, translated by Basil Hall Chamberlain.', sameAs: ['https://en.wikipedia.org/wiki/Kojiki', 'https://www.sacred-texts.com/shi/kj/index.htm'] },
  ttc:       { translator: 'James Legge', translatorWikidata: 'Q1287990', author: { '@type': 'Person', name: 'Laozi', '@id': 'https://www.wikidata.org/wiki/Q9333' }, lang: 'en', year: 1891, wikidata: 'Q134425', description: 'The Tao Te Ching by Laozi, foundational text of Taoism, translated by James Legge.', sameAs: ['https://en.wikipedia.org/wiki/Tao_Te_Ching', 'https://www.sacred-texts.com/tao/taote.htm'] },
  bund:      { translator: 'Edward William West', translatorWikidata: 'Q5345914', author: { '@type': 'Person', name: 'Zarathustra', '@id': 'https://www.wikidata.org/wiki/Q35811', description: 'attributed' }, lang: 'en', year: 1880, wikidata: 'Q1005362', description: 'The Bundahishn (Creation), a Zoroastrian text on cosmogony and cosmology, translated by E. W. West.', sameAs: ['https://en.wikipedia.org/wiki/Bundahishn', 'https://www.sacred-texts.com/zor/sbe05/index.htm'] },
  lotus:     { translator: 'Hendrik Kern', translatorWikidata: 'Q571426', author: { '@type': 'Person', name: 'Gautama Buddha', '@id': 'https://www.wikidata.org/wiki/Q9441', description: 'attributed' }, lang: 'en', year: 1884, wikidata: 'Q861212', description: 'The Lotus Sutra (Saddharma Pundarika), a foundational Mahayana Buddhist scripture, translated by Hendrik Kern.', sameAs: ['https://en.wikipedia.org/wiki/Lotus_Sutra', 'https://www.sacred-texts.com/bud/lotus/index.htm'] },
  bop:       { translator: 'James Legge', translatorWikidata: 'Q1287990', lang: 'en', year: 1876, wikidata: 'Q465108', description: 'The Book of Poetry (Shijing), the oldest collection of Chinese poetry, translated by James Legge.', sameAs: ['https://en.wikipedia.org/wiki/Classic_of_Poetry', 'https://www.sacred-texts.com/cfu/bop/index.htm'] },
  kv:        { translator: 'John Martin Crawford', translatorWikidata: 'Q6246984', author: { '@type': 'Person', name: 'Elias Lönnrot', '@id': 'https://www.wikidata.org/wiki/Q153159', description: 'compiler' }, lang: 'en', year: 1888, wikidata: 'Q130924', description: 'The Kalevala, the Finnish national epic compiled by Elias Lönnrot, translated by John Martin Crawford.', sameAs: ['https://en.wikipedia.org/wiki/Kalevala', 'https://www.sacred-texts.com/neu/kveng/index.htm'] },
  poe:       { translator: 'Henry Adams Bellows', translatorWikidata: 'Q11336703', lang: 'en', year: 1923, wikidata: 'Q205874', description: 'The Poetic Edda, a collection of Old Norse mythological and heroic poems, translated by Henry Adams Bellows.', sameAs: ['https://en.wikipedia.org/wiki/Poetic_Edda', 'https://www.sacred-texts.com/neu/poe/index.htm'] },
  viraf:     { translator: 'Martin Haug & Edward William West', translatorWikidata: 'Q5345914', author: { '@type': 'Person', name: 'Zarathustra', '@id': 'https://www.wikidata.org/wiki/Q35811', description: 'attributed' }, lang: 'en', year: 1872, wikidata: 'Q1062327', description: 'The Book of Arda Viraf, a Zoroastrian text describing a visionary journey through heaven and hell.', sameAs: ['https://en.wikipedia.org/wiki/Book_of_Arda_Viraf'] },
};

// ─── Named entity mentions for scripture works (GEO entity linking) ───
const WORK_MENTIONS = {
  ot: [
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q9181', name: 'Abraham' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q9077', name: 'Moses' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q41370', name: 'David' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q188794', name: 'Isaiah' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q302', name: 'Jesus' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q37085', name: 'Solomon' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q830183', name: 'Eve' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q81422', name: 'Noah' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q289957', name: 'Jacob' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q145746', name: 'Joseph' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q179962', name: 'Job' },
    { '@type': 'Place', '@id': 'https://www.wikidata.org/wiki/Q1218', name: 'Jerusalem' },
    { '@type': 'Place', '@id': 'https://www.wikidata.org/wiki/Q79', name: 'Egypt' },
    { '@type': 'Place', '@id': 'https://www.wikidata.org/wiki/Q377485', name: 'Mount Sinai' },
  ],
  nt: [
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q302', name: 'Jesus' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q9200', name: 'Paul the Apostle' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q345', name: 'Mary' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q33923', name: 'Peter' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q44015', name: 'John the Apostle' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q40662', name: 'John the Baptist' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q81018', name: 'Judas Iscariot' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q17131', name: 'Pontius Pilate' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q128538', name: 'Luke the Evangelist' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q26925', name: 'James, brother of Jesus' },
    { '@type': 'Place', '@id': 'https://www.wikidata.org/wiki/Q1218', name: 'Jerusalem' },
  ],
  apoc: [
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q111559', name: 'Judas Maccabeus' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q12060123', name: 'Tobit' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q26454627', name: 'Judith' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q37085', name: 'King Solomon' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q599907', name: 'Baruch' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q75048', name: 'Mattathias' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q56951', name: 'Raphael (archangel)' },
  ],
  quran: [
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q9458', name: 'Muhammad' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q9181', name: 'Ibrahim (Abraham)' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q9077', name: 'Musa (Moses)' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q302', name: 'Isa (Jesus)' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q345', name: 'Maryam (Mary)' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q70899', name: 'Adam' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q81422', name: 'Nuh (Noah)' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q145746', name: 'Yusuf (Joseph)' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q1207846', name: 'Dhul-Qarnayn' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q1729394', name: 'Luqman' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q174495', name: 'Tawhid (oneness of God)' },
  ],
  bom: [
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q669318', name: 'Nephi' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q862248', name: 'Moroni' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q302', name: 'Jesus' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q4733629', name: 'Alma' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q2464947', name: 'Lehi' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q47102', name: 'Joseph Smith' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q4747267', name: 'Ammon' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q5403426', name: 'Samuel the Lamanite' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q2701214', name: 'Mormon' },
  ],
  dc: [
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q47102', name: 'Joseph Smith' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q982343', name: 'Oliver Cowdery' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q727001', name: 'Sidney Rigdon' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q302', name: 'Jesus' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q203559', name: 'Brigham Young' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q2976186', name: 'Hyrum Smith' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q5196041', name: 'John Whitmer' },
  ],
  pgp: [
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q9181', name: 'Abraham' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q9077', name: 'Moses' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q213027', name: 'Enoch' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q70899', name: 'Adam' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q47102', name: 'Joseph Smith' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q830183', name: 'Eve' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q81422', name: 'Noah' },
  ],
  fourbooks: [
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q4604', name: 'Confucius' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q188903', name: 'Mencius' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q1196421', name: 'Ren (benevolence)' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q796873', name: 'Li (ritual propriety)' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q1207671', name: 'Zengzi' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q1147803', name: 'Zisi' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q1208000', name: 'Junzi (noble person)' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q614263', name: 'Filial piety' },
  ],
  kj: [
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q455602', name: 'Amaterasu' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q272993', name: 'Susanoo' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q813858', name: 'Izanagi' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q682306', name: 'Izanami' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q384705', name: 'Ō no Yasumaro' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q595520', name: 'Tsukuyomi' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q1056017', name: 'Ninigi' },
    { '@type': 'Place', '@id': 'https://www.wikidata.org/wiki/Q1141974', name: 'Takamagahara' },
  ],
  ttc: [
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q9333', name: 'Laozi' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q190393', name: 'Tao (the Way)' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q878084', name: 'Wu wei (non-action)' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q1179705', name: 'De (virtue)' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q62744', name: 'Yin and yang' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q47739', name: 'Zhuangzi' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q202742', name: 'Qi (vital energy)' },
  ],
  bund: [
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q179575', name: 'Ahura Mazda' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q223805', name: 'Angra Mainyu' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q35811', name: 'Zarathustra' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q864653', name: 'Amesha Spentas' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q2576738', name: 'Fravashi' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q1375923', name: 'Asha (truth/righteousness)' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q246443', name: 'Chinvat Bridge' },
  ],
  lotus: [
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q9441', name: 'Gautama Buddha' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q42927', name: 'Nirvana' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q134293', name: 'Dharma' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q178149', name: 'Bodhisattva' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q193849', name: 'Avalokiteśvara' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q471696', name: 'Mañjuśrī' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q868306', name: 'Samantabhadra' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q581473', name: 'Upāya (skillful means)' },
  ],
  bop: [
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q4604', name: 'Confucius' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q468747', name: 'Duke of Zhou' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q698909', name: 'King Wen of Zhou' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q1061289', name: 'King Wu of Zhou' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q796873', name: 'Li (ritual propriety)' },
    { '@type': 'Place', '@id': 'https://www.wikidata.org/wiki/Q35216', name: 'Zhou dynasty' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q614263', name: 'Filial piety' },
  ],
  kv: [
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q616178', name: 'Väinämöinen' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q781257', name: 'Ilmarinen' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q1073318', name: 'Louhi' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q389512', name: 'Lemminkäinen' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q180956', name: 'Sampo' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q153159', name: 'Elias Lönnrot' },
    { '@type': 'Place', '@id': 'https://www.wikidata.org/wiki/Q304291', name: 'Tuonela' },
    { '@type': 'Place', '@id': 'https://www.wikidata.org/wiki/Q203041', name: 'Pohjola' },
  ],
  poe: [
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q43610', name: 'Odin' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q42952', name: 'Thor' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q133147', name: 'Loki' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q1647325', name: 'Freyja' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q170148', name: 'Ragnarök' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q131135', name: 'Yggdrasil' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q182560', name: 'Fenrir' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q181227', name: 'Jörmungandr' },
    { '@type': 'Place', '@id': 'https://www.wikidata.org/wiki/Q177860', name: 'Valhalla' },
  ],
  viraf: [
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q179575', name: 'Ahura Mazda' },
    { '@type': 'Person', '@id': 'https://www.wikidata.org/wiki/Q35811', name: 'Zarathustra' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q223805', name: 'Angra Mainyu' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q864653', name: 'Amesha Spentas' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q1062327', name: 'Arda Viraf' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q246443', name: 'Chinvat Bridge' },
    { '@type': 'Thing', '@id': 'https://www.wikidata.org/wiki/Q1375923', name: 'Asha (truth/righteousness)' },
  ],
};

// ─── Route metadata for HTMLRewriter SEO injection ───
// Root SPA routes all serve index.html, so meta tags need edge rewriting.

const ROUTE_META = {
  '/projects': {
    title: 'Projects \u2014 a9l.im',
    desc: 'Browse interactive simulations for physics, biology, finance, and political science. Open-source, zero-dependency tools that run entirely in the browser.',
    ogTitle: 'Projects \u2014 a9l.im',
  },
  '/blog': {
    title: 'Blog \u2014 a9l.im',
    desc: 'Articles on building educational simulations, computational physics, browser-based rendering, and interactive learning tools.',
    ogTitle: 'Blog \u2014 a9l.im',
  },
  '/about': {
    title: 'About \u2014 a9l.im',
    desc: 'About a9lim \u2014 Singaporean developer building simulations, AI agents, and browser tools across physics, biology, finance, religion, and more. Mostly vibe-coded with Claude.',
    ogTitle: 'About \u2014 a9l.im',
  },
  '/resume': {
    title: 'Resume \u2014 a9l.im',
    desc: 'Resume of a9lim \u2014 independent developer building interactive educational simulations and tools at a9l.im, available for freelance and collaborations.',
    ogTitle: 'Resume \u2014 a9l.im',
  },
};

const BLOG_META = {
  'hello-world': {
    title: 'Hello, World \u2014 a9l.im',
    desc: 'First post on the a9l.im blog.',
    ogTitle: 'Hello, World \u2014 a9l.im',
  },
};

const ABOUT_JSONLD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://a9l.im/#person',
  name: 'a9lim',
  url: 'https://a9l.im/about',
  nationality: { '@type': 'Country', name: 'Singapore' },
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'University of California, San Diego', '@id': 'https://www.wikidata.org/wiki/Q622664' },
    { '@type': 'EducationalOrganization', name: 'Singapore American School', '@id': 'https://www.wikidata.org/wiki/Q7522875' },
  ],
  sameAs: [
    'https://github.com/a9lim',
    'https://twitter.com/_a9lim',
  ],
  description: 'Singaporean developer building simulations, AI agents, and browser tools across physics, biology, finance, religion, and more.',
  jobTitle: 'Software Engineer',
  knowsAbout: [
    'Particle physics simulation',
    'Cellular metabolism',
    'Options pricing',
    'Gerrymandering and electoral fairness',
    'Sacred text analysis',
    'AI agents',
    'Activation steering',
    'WebGPU',
    'JavaScript',
    'Python',
    'Computational science',
    'Interactive educational tools',
  ],
  hasOccupation: {
    '@type': 'Occupation',
    name: 'Software Engineer',
    occupationalCategory: '15-1252.00',
    skills: ['WebGPU', 'JavaScript', 'Numerical simulation', 'Data visualization', 'Cloudflare Workers'],
  },
  makesOffer: {
    '@type': 'Offer',
    itemOffered: {
      '@type': 'CreativeWork',
      name: 'Educational Simulations',
      description: 'Open-source interactive simulations for physics, biology, finance, and political science',
      url: 'https://a9l.im/projects',
    },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://a9l.im/about' },
});

const PROJECTS_SSR = `
<div class="project-card fade-in visible"><a href="https://github.com/a9lim/saklas" target="_blank" rel="noopener noreferrer"><h3>Saklas</h3><p>Activation steering and trait monitoring for HuggingFace transformer models.</p><span class="tag">python</span><span class="tag">llm</span><span class="tag">interpretability</span></a></div>
<div class="project-card fade-in visible"><a href="https://github.com/a9lim/kenoma" target="_blank" rel="noopener noreferrer"><h3>Kenoma</h3><p>Fake shell that hallucinates command output from raw LLM completion, using the real shell prompt as the stop token.</p><span class="tag">python</span><span class="tag">llm</span><span class="tag">shell</span></a></div>
<div class="project-card fade-in visible"><a href="https://github.com/a9lim/rlaif" target="_blank" rel="noopener noreferrer"><h3>Rlaif</h3><p>Single-user MCP server that exposes a PiShock collar as a tool an agent can call to shock you.</p><span class="tag">python</span><span class="tag">mcp</span><span class="tag">agent</span></a></div>
<div class="project-card fade-in visible"><a href="/geon"><h3>Geon</h3><p>Relativistic N-body simulator with 11 forces, scalar fields, and WebGPU compute shaders.</p><span class="tag">physics</span><span class="tag">webgpu</span><span class="tag">relativity</span><span class="tag">canvas</span></a></div>
<div class="project-card fade-in visible"><a href="/cyano"><h3>Cyano</h3><p>Cellular metabolism simulator with twelve biochemical pathways, allosteric regulation, and cofactor tracking.</p><span class="tag">biology</span><span class="tag">biochemistry</span><span class="tag">canvas</span></a></div>
<div class="project-card fade-in visible"><a href="/gerry"><h3>Gerry</h3><p>Draw districts on a procedural hex map and stress-test them with Monte Carlo elections and fairness metrics.</p><span class="tag">politics</span><span class="tag">svg</span><span class="tag">monte carlo</span></a></div>
<div class="project-card fade-in visible"><a href="/shoals"><h3>Shoals</h3><p>Options trading simulator with stochastic volatility, a multi-leg strategy builder, and narrative market events.</p><span class="tag">finance</span><span class="tag">options pricing</span><span class="tag">canvas</span></a></div>
<div class="project-card fade-in visible"><a href="/scripture"><h3>Scripture</h3><p>Sacred text reader with sixteen works from multiple traditions, full-text search, concordance, and text-to-speech.</p><span class="tag">reader</span><span class="tag">text</span><span class="tag">religion</span></a></div>
<div class="project-card fade-in visible"><a href="https://github.com/a9lim/Raiko" target="_blank" rel="noopener noreferrer"><h3>Raiko</h3><p>Discord music and chat bot with queue management and conversational AI.</p><span class="tag">discord</span><span class="tag">java</span><span class="tag">music</span></a></div>
<div class="project-card fade-in visible"><a href="https://github.com/a9lim/faithful" target="_blank" rel="noopener noreferrer"><h3>Faithful</h3><p>Discord chatbot that emulates given messages in the style of source material.</p><span class="tag">discord</span><span class="tag">chatbot</span><span class="tag">nlp</span></a></div>
<div class="project-card fade-in visible"><a href="https://github.com/catppuccin/sddm" target="_blank" rel="noopener noreferrer"><h3>Catppuccin for SDDM</h3><p>Soothing pastel theme for the SDDM display manager with all four flavor variants.</p><span class="tag">linux</span><span class="tag">theme</span><span class="tag">catppuccin</span></a></div>
`;

// ─── Security headers for Worker responses ───
// Static assets get these from _headers. Worker-served HTML (SPA routes,
// scripture, 404) must set them here — _headers doesn't apply to Worker responses.
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; base-uri 'self'; frame-ancestors 'self'",
  'Content-Language': 'en',
};

// Wrap a response with security + cache headers.
// Browser always revalidates (max-age=0); CDN caches for 1 hour and serves
// stale while revalidating. Cloudflare purges CDN cache on each deployment.
// `extra` overrides defaults (e.g. Cloudflare-CDN-Cache-Control: no-store for 404s).
function secure(response, extra) {
  const r = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) r.headers.set(k, v);
  r.headers.set('Cache-Control', 'public, max-age=0, stale-while-revalidate=86400');
  r.headers.set('Cloudflare-CDN-Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  r.headers.set('Vary', 'Accept-Encoding');
  if (extra) for (const [k, v] of Object.entries(extra)) r.headers.set(k, v);
  return r;
}

function rewriteHTML(response, meta) {
  return new HTMLRewriter()
    .on('title', {
      element(el) { el.setInnerContent(meta.title); },
    })
    .on('meta[name="description"]', {
      element(el) { el.setAttribute('content', meta.desc); },
    })
    .on('meta[property="og:title"]', {
      element(el) { el.setAttribute('content', meta.ogTitle); },
    })
    .on('meta[property="og:description"]', {
      element(el) { el.setAttribute('content', meta.desc); },
    })
    .on('meta[property="og:url"]', {
      element(el) { el.setAttribute('content', meta.canonical); },
    })
    .on('meta[name="twitter:card"]', {
      element(el) { el.setAttribute('content', 'summary_large_image'); },
    })
    .on('meta[name="twitter:title"]', {
      element(el) { el.setAttribute('content', meta.ogTitle); },
    })
    .on('meta[name="twitter:description"]', {
      element(el) { el.setAttribute('content', meta.desc); },
    })
    .on('link[rel="canonical"]', {
      element(el) { el.setAttribute('href', meta.canonical); },
    })
    .on('meta[property="og:type"]', {
      element(el) { if (meta.ogType) el.setAttribute('content', meta.ogType); },
    })
    .on('head', {
      element(el) {
        if (meta.jsonLd) {
          el.append(`<script type="application/ld+json">${meta.jsonLd}</script>`, { html: true });
        }
        if (meta.prevUrl) el.append(`<link rel="prev" href="${meta.prevUrl}">`, { html: true });
        if (meta.nextUrl) el.append(`<link rel="next" href="${meta.nextUrl}">`, { html: true });
        if (meta.articlePublished) el.append(`<meta property="article:published_time" content="${meta.articlePublished}">`, { html: true });
        if (meta.articleModified) el.append(`<meta property="article:modified_time" content="${meta.articleModified}">`, { html: true });
        if (meta.articleAuthor) el.append(`<meta property="article:author" content="${meta.articleAuthor}">`, { html: true });
        if (meta.articleTag) {
          const tags = Array.isArray(meta.articleTag) ? meta.articleTag : [meta.articleTag];
          for (const t of tags) el.append(`<meta property="article:tag" content="${t}">`, { html: true });
        }
        if (meta.canonical) {
          el.append(`<link rel="alternate" hreflang="en" href="${meta.canonical}">`, { html: true });
          el.append(`<link rel="alternate" hreflang="x-default" href="${meta.canonical}">`, { html: true });
        }
      },
    })
    .on('#verses', {
      element(el) {
        if (meta.ssrVerses) el.setInnerContent(meta.ssrVerses, { html: true });
      },
    })
    .on('#breadcrumb', {
      element(el) {
        if (meta.ssrBreadcrumb) {
          el.setInnerContent(meta.ssrBreadcrumb, { html: true });
          el.removeAttribute('hidden');
        }
      },
    })
    .on('#blog-post-content', {
      element(el) {
        if (meta.ssrContent) {
          el.setInnerContent(meta.ssrContent, { html: true });
        }
      },
    })
    .on('#blog-post', {
      element(el) {
        if (meta.ssrContent) el.removeAttribute('style');
      },
    })
    .on('#blog-listing', {
      element(el) {
        if (meta.ssrContent) el.setAttribute('style', 'display:none');
      },
    })
    .on('#blog-list-container', {
      element(el) {
        if (meta.ssrBlogList) el.setInnerContent(meta.ssrBlogList, { html: true });
      },
    })
    .on('.projects-grid', {
      element(el) {
        if (meta.canonical === 'https://a9l.im/projects') {
          el.setInnerContent(PROJECTS_SSR, { html: true });
        }
      },
    })
    .on('#page-home', {
      element(el) {
        if (meta.canonical !== 'https://a9l.im' && meta.canonical !== 'https://a9l.im/') {
          el.setAttribute('class', 'page-section');
        }
      },
    })
    .on('#page-about', {
      element(el) {
        if (meta.canonical === 'https://a9l.im/about') {
          el.setAttribute('class', 'page-section active');
        }
      },
    })
    .on('#page-projects', {
      element(el) {
        if (meta.canonical === 'https://a9l.im/projects') {
          el.setAttribute('class', 'page-section active');
        }
      },
    })
    .on('#page-blog', {
      element(el) {
        if (meta.canonical === 'https://a9l.im/blog' || meta.canonical.startsWith('https://a9l.im/blog/')) {
          el.setAttribute('class', 'page-section active');
        }
      },
    })
    .on('#page-resume', {
      element(el) {
        if (meta.canonical === 'https://a9l.im/resume') {
          el.setAttribute('class', 'page-section active');
        }
      },
    })
    .transform(response);
}

// --- Markdown parser (SSR) ---
let _mdMathStash = [];
function mdStashMath(s) {
  _mdMathStash = [];
  return s.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, m => { _mdMathStash.push(m); return '\x00MATH' + (_mdMathStash.length - 1) + '\x00'; });
}
function mdUnstashMath(s) {
  return s.replace(/\x00MATH(\d+)\x00/g, (_, i) => _mdMathStash[i]);
}
function mdEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mdSafeUrl(u) {
  const l = u.trim().toLowerCase();
  if (l.startsWith('javascript:') || l.startsWith('vbscript:') || l.startsWith('data:text/html')) return '';
  return u;
}

function mdInline(src) {
  return src
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => `<img src="${mdSafeUrl(url)}" alt="${alt}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => { const s = mdSafeUrl(url); return s ? `<a href="${s}" target="_blank" rel="noopener noreferrer">${text}</a>` : text; })
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>')
    .replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>')
    .replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>')
    .replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/(^|[\s(])_(.+?)_([\s).,!?]|$)/g, '$1<em>$2</em>$3');
}

function slugify(text) {
  return text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
}

function renderMarkdown(src) {
  src = mdStashMath(src);
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let i = 0;
  const len = lines.length;
  while (i < len) {
    const line = lines[i];
    const fenceMatch = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      const lang = fenceMatch[2].trim();
      const code = [];
      i++;
      while (i < len && lines[i].indexOf(fence) !== 0) { code.push(mdEsc(lines[i])); i++; }
      i++;
      const langAttr = lang ? ' class="language-' + mdEsc(lang) + '"' : '';
      html.push('<pre><code' + langAttr + '>' + code.join('\n') + '</code></pre>');
      continue;
    }
    if (/^\s*$/.test(line)) { i++; continue; }
    if (/^\$\$/.test(line) && !/^\$\$.*\$\$/.test(line)) {
      const ml = [line]; i++;
      while (i < len && !/\$\$\s*$/.test(lines[i])) { ml.push(lines[i]); i++; }
      if (i < len) { ml.push(lines[i]); i++; }
      html.push('<p>' + mdUnstashMath(ml.join('\n')) + '</p>');
      continue;
    }
    const hm = line.match(/^(#{1,6})\s+(.+)$/);
    if (hm) { html.push('<h' + hm[1].length + ' id="' + slugify(hm[2]) + '">' + mdInline(mdEsc(hm[2])) + '</h' + hm[1].length + '>'); i++; continue; }
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { html.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(line)) {
      const bq = [];
      while (i < len && /^>\s?/.test(lines[i])) { bq.push(lines[i].replace(/^>\s?/, '')); i++; }
      html.push('<blockquote>' + renderMarkdown(bq.join('\n')) + '</blockquote>');
      continue;
    }
    if (/^[\-*+]\s+/.test(line)) {
      const items = [];
      while (i < len && /^[\-*+]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[\-*+]\s+/, '')); i++; }
      html.push('<ul>' + items.map(it => '<li>' + mdInline(mdEsc(it)) + '</li>').join('') + '</ul>');
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      const ol = [];
      while (i < len && /^\d+[.)]\s+/.test(lines[i])) { ol.push(lines[i].replace(/^\d+[.)]\s+/, '')); i++; }
      html.push('<ol>' + ol.map(it => '<li>' + mdInline(mdEsc(it)) + '</li>').join('') + '</ol>');
      continue;
    }
    const p = [];
    while (i < len && !/^\s*$/.test(lines[i])
      && !/^(#{1,6}\s|>\s?|[\-*+]\s|`{3,}|~{3,}|\d+[.)]\s|(-{3,}|\*{3,}|_{3,})\s*$)/.test(lines[i])) {
      p.push(lines[i]); i++;
    }
    if (p.length) html.push('<p>' + mdInline(mdEsc(p.join('\n'))) + '</p>');
  }
  return mdUnstashMath(html.join('\n'));
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return m[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

const SCRIPTURE_WORKS_SSR = Object.entries(WORK_TITLES).map(([id, title]) => {
  const ws = WORK_SCHEMA[id] || {};
  const detail = ws.translator ? `${ws.translator} translation, ${ws.year}` : (ws.year ? String(ws.year) : '');
  return `<a href="/scripture/${id}" class="work-link"><strong>${title}</strong>${detail ? ` <span>(${detail})</span>` : ''}</a>`;
}).join('\n');

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const timedFetch = (url, ms = 2000) => Promise.race([
      env.ASSETS.fetch(url),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
    ]);
    const url = new URL(request.url);
    const { pathname, origin } = url;

    // Scripture sub-SPA
    if (pathname.startsWith('/scripture')) {
      const res = await env.ASSETS.fetch(new URL('/scripture/index.html', origin));
      if (env.VIEWS) logView(ctx, env.VIEWS, request, pathname);

      // Work-level routes: /scripture/{workId} or /scripture/{workId}/
      const workMatch = pathname.match(/^\/scripture\/([a-z]+)\/?$/);
      if (workMatch) {
        const [, workId] = workMatch;
        const workTitle = WORK_TITLES[workId];
        if (workTitle) {
          const ws = WORK_SCHEMA[workId] || {};
          const translatorPerson = ws.translator ? { '@type': 'Person', name: ws.translator, ...(ws.translatorWikidata && { '@id': `https://www.wikidata.org/wiki/${ws.translatorWikidata}` }) } : undefined;
          const meta = {
            title: `${workTitle} | Scripture`,
            desc: `Read the ${workTitle}${ws.translator ? ' (' + ws.translator + ' translation, ' + ws.year + ')' : ''} \u2014 full-text search, concordance, verse notes, and cross-tradition comparisons.`,
            ogTitle: `${workTitle} | Scripture`,
            canonical: `https://a9l.im/scripture/${workId}`,
            jsonLd: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'BreadcrumbList',
                  itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
                    { '@type': 'ListItem', position: 2, name: 'Scripture', item: 'https://a9l.im/scripture/' },
                    { '@type': 'ListItem', position: 3, name: workTitle, item: `https://a9l.im/scripture/${workId}` },
                  ],
                },
                {
                  '@type': 'Book',
                  name: workTitle,
                  url: `https://a9l.im/scripture/${workId}`,
                  inLanguage: ws.lang || 'en',
                  '@id': `https://a9l.im/scripture/${workId}`,
                  ...(ws.description && { description: ws.description }),
                  ...(ws.sameAs && { sameAs: ws.sameAs }),
                  ...(ws.wikidata && { translationOfWork: { '@type': 'Book', '@id': `https://www.wikidata.org/wiki/${ws.wikidata}` } }),
                  ...(translatorPerson && { translator: translatorPerson }),
                  ...(ws.author && { author: ws.author }),
                  ...(ws.year && { datePublished: String(ws.year) }),
                  ...(WORK_MENTIONS[workId] && { mentions: WORK_MENTIONS[workId] }),
                  potentialAction: [
                    { '@type': 'ReadAction', target: `https://a9l.im/scripture/${workId}` },
                    { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `https://a9l.im/scripture/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
                  ],
                  license: 'https://creativecommons.org/publicdomain/mark/1.0/',
                  contentRating: 'General',
                },
                {
                  '@type': 'Dataset',
                  name: `${workTitle} — Full Text`,
                  description: ws.description || `Complete text of the ${workTitle}`,
                  url: `https://a9l.im/scripture/${workId}`,
                  license: 'https://creativecommons.org/publicdomain/mark/1.0/',
                  inLanguage: ws.lang || 'en',
                  ...(translatorPerson && { creator: translatorPerson }),
                  distribution: {
                    '@type': 'DataDownload',
                    encodingFormat: 'application/json',
                    contentUrl: `https://a9l.im/scripture/data/${workId}/manifest.json`,
                  },
                },
              ],
            }),
            ssrBreadcrumb: `<a href="/scripture/">Scripture</a> <span aria-hidden="true">\u203a</span> <span>${mdEsc(workTitle)}</span>`,
          };
          try {
            const manifestRes = await timedFetch(new URL(`/scripture/data/${workId}/manifest.json`, origin));
            if (manifestRes.ok) {
              const manifest = await manifestRes.json();
              const bookList = manifest.books.map(b => {
                const startCh = b.start || 1;
                const chLinks = Array.from({ length: b.chapters }, (_, i) =>
                  `<a href="/scripture/${workId}/${b.id}-${startCh + i}">${startCh + i}</a>`
                ).join(' ');
                return `<div class="book-entry"><strong><a href="/scripture/${workId}/${b.id}-${startCh}">${mdEsc(b.name)}</a></strong> <span class="ch-links">${chLinks}</span></div>`;
              }).join('');
              const descHtml = ws.description ? `<p>${mdEsc(ws.description)}</p>` : '';
              meta.ssrVerses = `<h1>${mdEsc(workTitle)}</h1>${descHtml}<nav class="book-listing">${bookList}</nav>`;
            }
          } catch (_) { /* SSR failed — client JS will hydrate */ }
          return secure(rewriteHTML(res, meta));
        }
      }

      // Chapter (and optional verse) routes: /scripture/{workId}/{bookId}-{chapter}[:verse]
      const chapterMatch = pathname.match(/^\/scripture\/([a-z]+)\/(.+)-(\d+)(?::(\d+))?$/);
      if (chapterMatch) {
        const [, workId, bookId, chapterNum, verseNum] = chapterMatch;
        const workTitle = WORK_TITLES[workId];
        if (workTitle) {
          try {
            const manifestRes = await timedFetch(new URL(`/scripture/data/${workId}/manifest.json`, origin));
            if (manifestRes.ok) {
              const manifest = await manifestRes.json();
              const book = manifest.books.find(b => b.id === bookId);
              if (book) {
                const chapterLabel = `${book.name} ${chapterNum}`;
                const ws = WORK_SCHEMA[workId] || {};
                const translatorPerson = ws.translator ? { '@type': 'Person', name: ws.translator, ...(ws.translatorWikidata && { '@id': `https://www.wikidata.org/wiki/${ws.translatorWikidata}` }) } : undefined;
                const bookSchema = {
                  '@type': 'Book',
                  name: workTitle,
                  url: `https://a9l.im/scripture/${workId}`,
                  '@id': `https://a9l.im/scripture/${workId}`,
                  ...(ws.description && { description: ws.description }),
                  ...(ws.sameAs && { sameAs: ws.sameAs }),
                  ...(ws.wikidata && { translationOfWork: { '@type': 'Book', '@id': `https://www.wikidata.org/wiki/${ws.wikidata}` } }),
                  ...(translatorPerson && { translator: translatorPerson }),
                  ...(ws.author && { author: ws.author }),
                  inLanguage: ws.lang || 'en',
                  ...(ws.year && { datePublished: String(ws.year) }),
                  ...(WORK_MENTIONS[workId] && { mentions: WORK_MENTIONS[workId] }),
                  potentialAction: { '@type': 'ReadAction', target: `https://a9l.im/scripture/${workId}` },
                };

                // Compute prev/next chapter URLs
                const chapterIdx = parseInt(chapterNum, 10);
                const bookStart = book.start || 1;
                const bookIdx = manifest.books.indexOf(book);
                let prevUrl, nextUrl;
                if (chapterIdx > bookStart) {
                  prevUrl = `https://a9l.im/scripture/${workId}/${bookId}-${chapterIdx - 1}`;
                } else if (bookIdx > 0) {
                  const prevBook = manifest.books[bookIdx - 1];
                  const prevStart = prevBook.start || 1;
                  prevUrl = `https://a9l.im/scripture/${workId}/${prevBook.id}-${prevStart + prevBook.chapters - 1}`;
                }
                if (chapterIdx < bookStart + book.chapters - 1) {
                  nextUrl = `https://a9l.im/scripture/${workId}/${bookId}-${chapterIdx + 1}`;
                } else if (bookIdx < manifest.books.length - 1) {
                  const nextBook = manifest.books[bookIdx + 1];
                  nextUrl = `https://a9l.im/scripture/${workId}/${nextBook.id}-${nextBook.start || 1}`;
                }

                const chapterUrl = `https://a9l.im/scripture/${workId}/${bookId}-${chapterNum}`;
                const breadcrumbItems = [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
                  { '@type': 'ListItem', position: 2, name: 'Scripture', item: 'https://a9l.im/scripture/' },
                  { '@type': 'ListItem', position: 3, name: workTitle, item: `https://a9l.im/scripture/${workId}` },
                  { '@type': 'ListItem', position: 4, name: chapterLabel, item: chapterUrl },
                ];
                const graph = [
                  { '@type': 'BreadcrumbList', itemListElement: breadcrumbItems },
                  {
                    '@type': 'Chapter',
                    '@id': chapterUrl,
                    name: chapterLabel,
                    url: chapterUrl,
                    position: parseInt(chapterNum, 10),
                    inLanguage: ws.lang || 'en',
                    isPartOf: bookSchema,
                    audience: { '@type': 'Audience', audienceType: 'Students, scholars, readers of sacred texts' },
                    ...(translatorPerson && { translator: translatorPerson }),
                  },
                ];

                const isSingleBook = manifest.books.length === 1;
                const meta = {
                  title: `${chapterLabel} \u2014 ${workTitle} | Scripture`,
                  desc: isSingleBook
                    ? `Read ${chapterLabel} \u2014 full-text search, concordance, verse notes, and cross-tradition comparisons.`
                    : `Read ${chapterLabel} (${workTitle}) \u2014 full-text search, concordance, verse notes, and cross-tradition comparisons.`,
                  ogTitle: `${chapterLabel} \u2014 ${workTitle} | Scripture`,
                  canonical: `https://a9l.im${pathname}`,
                  ogType: 'article',
                  prevUrl,
                  nextUrl,
                  ssrBreadcrumb: `<a href="/scripture/">Scripture</a> <span aria-hidden="true">\u203a</span> <a href="/scripture/${workId}">${mdEsc(workTitle)}</a> <span aria-hidden="true">\u203a</span> <span>${mdEsc(chapterLabel)}</span>`,
                };

                // SSR: inject verse text for crawlers
                try {
                  const chapterRes = await timedFetch(new URL(`/scripture/data/${workId}/chapters/${bookId}-${chapterNum}.json`, origin));
                  if (chapterRes.ok) {
                    const chapter = await chapterRes.json();
                    const allVerses = chapter.sections.flatMap(s => s.verses);

                    // Verse-level deep link
                    if (verseNum) {
                      const vi = parseInt(verseNum, 10) - 1;
                      const verseText = vi >= 0 && vi < allVerses.length ? allVerses[vi] : null;
                      if (verseText) {
                        const verseLabel = `${chapterLabel}:${verseNum}`;
                        meta.title = `${verseLabel} (${workTitle}) | Scripture`;
                        meta.ogTitle = `${verseLabel} (${workTitle}) | Scripture`;
                        meta.desc = verseText.length > 160 ? verseText.slice(0, verseText.lastIndexOf(' ', 160)) + '\u2026' : verseText;
                        meta.ssrVerses = `<p><b>${verseNum}.</b> ${mdEsc(verseText)}</p>`;
                        breadcrumbItems.push({ '@type': 'ListItem', position: 5, name: `Verse ${verseNum}`, item: `https://a9l.im${pathname}` });
                        const quotation = {
                          '@type': 'Quotation',
                          '@id': `https://a9l.im${pathname}`,
                          url: `https://a9l.im${pathname}`,
                          text: verseText,
                          inLanguage: ws.lang || 'en',
                          position: parseInt(verseNum, 10),
                          ...(translatorPerson && { author: translatorPerson }),
                          isPartOf: { '@type': 'CreativeWork', name: chapterLabel, url: chapterUrl, isPartOf: { '@type': 'Book', name: workTitle, '@id': `https://a9l.im/scripture/${workId}` } },
                        };
                        if (WORK_MENTIONS[workId]) quotation.mentions = WORK_MENTIONS[workId];
                        graph.push(quotation);
                      }
                    } else {
                      const maxVerses = 25;
                      let rendered = 0;
                      let verseHtml = '';
                      for (let si = 0; si < chapter.sections.length && rendered < maxVerses; si++) {
                        const sec = chapter.sections[si];
                        if (chapter.sections.length > 1) {
                          verseHtml += `<span class="section-heading" aria-label="Section ${si + 1}">${si + 1}</span>`;
                        }
                        for (let vi = 0; vi < sec.verses.length && rendered < maxVerses; vi++) {
                          verseHtml += `<p><b>${rendered + 1}.</b> ${mdEsc(sec.verses[vi])}</p>`;
                          rendered++;
                        }
                      }
                      meta.ssrVerses = verseHtml + (allVerses.length > maxVerses ? `<p><em>${allVerses.length - maxVerses} more verses\u2026</em></p>` : '');
                      // Add first-verse Quotation schema for crawlers
                      if (allVerses.length > 0) {
                        graph.push({
                          '@type': 'Quotation',
                          '@id': `${chapterUrl}:1`,
                          url: `${chapterUrl}:1`,
                          text: allVerses[0],
                          inLanguage: ws.lang || 'en',
                          position: 1,
                          ...(translatorPerson && { author: translatorPerson }),
                          isPartOf: { '@type': 'CreativeWork', name: chapterLabel, url: chapterUrl, isPartOf: { '@type': 'Book', name: workTitle, '@id': `https://a9l.im/scripture/${workId}` } },
                        });
                      }
                    }
                  }
                } catch (_) { /* verse SSR failed — client JS will hydrate */ }

                meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
                return secure(rewriteHTML(res, meta));
              }
            }
          } catch (_) { /* fall through to default */ }
        }
      }

      // Scripture index: /scripture or /scripture/
      if (pathname === '/scripture' || pathname === '/scripture/') {
        const indexMeta = {
          title: 'Scripture — a9l.im',
          desc: 'Read sixteen sacred texts spanning Abrahamic, East Asian, Zoroastrian, Buddhist, and Nordic traditions. Full-text search, concordance, verse notes, and cross-tradition comparisons.',
          ogTitle: 'Scripture — Sacred Text Reader',
          canonical: 'https://a9l.im/scripture/',
          jsonLd: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'CollectionPage',
                '@id': 'https://a9l.im/scripture/',
                name: 'Scripture',
                url: 'https://a9l.im/scripture/',
                description: 'A browser-based reader for sixteen sacred texts.',
                mainEntity: {
                  '@type': 'ItemList',
                  itemListElement: Object.entries(WORK_TITLES).map(([id, title], i) => ({
                    '@type': 'ListItem', position: i + 1, name: title, url: `https://a9l.im/scripture/${id}`,
                  })),
                },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
                  { '@type': 'ListItem', position: 2, name: 'Scripture', item: 'https://a9l.im/scripture/' },
                ],
              },
              {
                '@type': 'Dataset',
                name: 'Sacred Text Corpus — 16 Works',
                description: 'A corpus of sixteen sacred texts spanning Abrahamic, East Asian, Zoroastrian, Buddhist, and Nordic traditions, in English translation.',
                url: 'https://a9l.im/scripture/',
                license: 'https://creativecommons.org/publicdomain/mark/1.0/',
                inLanguage: 'en',
                temporalCoverage: '1611/1930',
                spatialCoverage: [
                  { '@type': 'Place', name: 'Middle East', '@id': 'https://www.wikidata.org/wiki/Q7204' },
                  { '@type': 'Place', name: 'East Asia', '@id': 'https://www.wikidata.org/wiki/Q27231' },
                  { '@type': 'Place', name: 'South Asia', '@id': 'https://www.wikidata.org/wiki/Q771405' },
                  { '@type': 'Place', name: 'Scandinavia', '@id': 'https://www.wikidata.org/wiki/Q21195' },
                  { '@type': 'Place', name: 'Finland', '@id': 'https://www.wikidata.org/wiki/Q33' },
                  { '@type': 'Place', name: 'Iran', '@id': 'https://www.wikidata.org/wiki/Q794' },
                ],
                keywords: 'sacred texts, religion, scripture, Bible, Quran, Book of Mormon, Tao Te Ching, Kojiki, Kalevala, Poetic Edda',
              },
            ],
          }),
          ssrVerses: `<h1>Sacred Texts</h1><nav class="work-listing">${SCRIPTURE_WORKS_SSR}</nav>`,
        };
        return secure(rewriteHTML(res, indexMeta));
      }

      return secure(res);
    }

    // Root SPA routes — serve index.html with per-route meta injection
    if (pathname === '/projects' || pathname === '/blog' || pathname.startsWith('/blog/') || pathname === '/about' || pathname === '/resume') {
      const response = await env.ASSETS.fetch(new URL('/index.html', origin));

      let meta;
      if (pathname.startsWith('/blog/')) {
        const slug = pathname.slice(6);
        meta = BLOG_META[slug];
        if (!meta) {
          const pretty = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          meta = {
            title: `${pretty} \u2014 a9l.im`,
            desc: 'Articles on simulation design, web development, and educational technology.',
            ogTitle: `${pretty} \u2014 a9l.im`,
          };
        }
        meta = { ...meta, canonical: `https://a9l.im${pathname}`, ogType: 'article' };

        // SSR: fetch markdown and render to HTML for crawlers
        if (slug && !slug.includes('/') && !slug.includes('..')) {
          try {
            const [mdRes, postsRes] = await Promise.all([
              env.ASSETS.fetch(new URL(`/posts/${slug}.md`, origin)),
              env.ASSETS.fetch(new URL('/posts.json', origin)),
            ]);
            if (mdRes.ok) {
              const mdText = await mdRes.text();
              const renderedBody = renderMarkdown(mdText);

              let postHeader = '';
              if (postsRes.ok) {
                try {
                  const posts = await postsRes.json();
                  const postMeta = posts.find(p => p.slug === slug);
                  if (postMeta) {
                    if (postMeta.excerpt) meta.desc = postMeta.excerpt;
                    meta.articlePublished = postMeta.date;
                    meta.articleModified = postMeta.updated || postMeta.date;
                    meta.articleAuthor = 'https://a9l.im/about';
                    if (postMeta.tag) meta.articleTag = Array.isArray(postMeta.tag) ? postMeta.tag : [postMeta.tag];
                    const tagDisplay = Array.isArray(postMeta.tag) ? postMeta.tag.join(', ') : postMeta.tag;
                    postHeader = `<span class="blog-post-date">${fmtDate(postMeta.date)}${postMeta.tag ? ' &middot; ' + mdEsc(tagDisplay) : ''}</span><h1 class="blog-post-title">${mdEsc(postMeta.title)}</h1>`;
                    const wordCount = mdText.replace(/[#*_`>\-\[\]()]/g, '').split(/\s+/).filter(Boolean).length;
                    const plainText = renderedBody.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
                    const articleBody = plainText.length > 500 ? plainText.slice(0, plainText.lastIndexOf(' ', 500)) + '\u2026' : plainText;
                    meta.jsonLd = JSON.stringify({
                      '@context': 'https://schema.org',
                      '@graph': [
                        {
                          '@type': 'BlogPosting',
                          '@id': meta.canonical,
                          headline: postMeta.title,
                          datePublished: postMeta.date,
                          dateModified: postMeta.updated || postMeta.date,
                          description: meta.desc,
                          url: meta.canonical,
                          wordCount,
                          articleBody,
                          ...(postMeta.tag && { articleSection: Array.isArray(postMeta.tag) ? postMeta.tag[0] : postMeta.tag }),
                          speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.blog-post-title', '.blog-content p:first-of-type'] },
                          image: 'https://a9l.im/og-image.webp',
                          author: { '@type': 'Person', name: 'a9lim', url: 'https://a9l.im/about', sameAs: ['https://github.com/a9lim', 'https://twitter.com/_a9lim'] },
                          publisher: { '@type': 'Organization', name: 'a9l.im', url: 'https://a9l.im', logo: { '@type': 'ImageObject', url: 'https://a9l.im/icon-192.png', width: 192, height: 192 } },
                          isPartOf: { '@type': 'Blog', name: 'a9l.im Blog', url: 'https://a9l.im/blog' },
                          mainEntityOfPage: { '@type': 'WebPage', '@id': meta.canonical },
                        },
                        {
                          '@type': 'BreadcrumbList',
                          itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
                            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://a9l.im/blog' },
                            { '@type': 'ListItem', position: 3, name: postMeta.title, item: meta.canonical },
                          ],
                        },
                      ],
                    });
                  }
                } catch (_) { /* proceed without metadata */ }
              }

              meta.ssrContent = `<div class="blog-post-header">${postHeader}</div><div class="blog-content">${renderedBody}</div>`;
            }
          } catch (_) { /* SSR failed — client JS will hydrate */ }
        }
      } else {
        meta = { ...ROUTE_META[pathname], canonical: `https://a9l.im${pathname}` };
        const pageName = pathname === '/projects' ? 'Projects' : pathname === '/blog' ? 'Blog' : pathname === '/resume' ? 'Resume' : 'About';
        meta.ssrBreadcrumb = `<a href="/">Home</a> <span aria-hidden="true">\u203a</span> <span>${pageName}</span>`;
        const navElement = {
          '@type': 'SiteNavigationElement',
          name: 'Main Navigation',
          hasPart: [
            { '@type': 'WebPage', name: 'Home', url: 'https://a9l.im' },
            { '@type': 'WebPage', name: 'Projects', url: 'https://a9l.im/projects' },
            { '@type': 'WebPage', name: 'Blog', url: 'https://a9l.im/blog' },
            { '@type': 'WebPage', name: 'About', url: 'https://a9l.im/about' },
            { '@type': 'WebPage', name: 'Resume', url: 'https://a9l.im/resume' },
          ],
        };
        const breadcrumb = {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
            { '@type': 'ListItem', position: 2, name: pageName, item: `https://a9l.im${pathname}` },
          ],
        };
        if (pathname === '/about') {
          const person = JSON.parse(ABOUT_JSONLD);
          delete person['@context'];
          meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [person, breadcrumb, navElement] });
        } else if (pathname === '/resume') {
          const person = JSON.parse(ABOUT_JSONLD);
          delete person['@context'];
          person.url = 'https://a9l.im/resume';
          person.mainEntityOfPage = { '@type': 'WebPage', '@id': 'https://a9l.im/resume' };
          person.hasOccupation = {
            '@type': 'Occupation',
            name: 'Independent Developer',
            occupationalCategory: '15-1252.00',
            skills: [
              'Building with agentic AI', 'JavaScript', 'WebGL', 'GLSL', 'Cloudflare Workers',
              'Edge SSR', 'Python', 'NumPy', 'QtQuick', 'LaTeX', 'Numerical simulation',
              'Data visualization', 'Structured data (JSON-LD, schema.org)',
            ],
          };
          person.seeks = {
            '@type': 'Demand',
            name: 'Freelance and collaborations',
            description: 'Open to freelance and collaboration on DIY-flavored work — research tools, simulations, and browser experiments.',
          };
          const profilePage = {
            '@type': 'ProfilePage',
            '@id': 'https://a9l.im/resume',
            url: 'https://a9l.im/resume',
            name: 'Resume \u2014 a9lim',
            mainEntity: { '@id': 'https://a9l.im/#person' },
            dateModified: '2026-04-15',
          };
          meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [profilePage, person, breadcrumb, navElement] });
        } else if (pathname === '/projects') {
          const projectItems = [
            { position: 1, name: 'Geon — Relativistic Particle Physics Simulator', url: 'https://a9l.im/geon' },
            { position: 2, name: 'Cyano — Cellular Biochemistry Simulator', url: 'https://a9l.im/cyano' },
            { position: 3, name: 'Gerry — Gerrymandering & Electoral Fairness Simulator', url: 'https://a9l.im/gerry' },
            { position: 4, name: 'Shoals — Options Trading Simulator', url: 'https://a9l.im/shoals' },
            { position: 5, name: 'Scripture — Sacred Text Reader', url: 'https://a9l.im/scripture/' },
          ].map(p => ({ '@type': 'ListItem', ...p }));
          meta.jsonLd = JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              { '@type': 'CollectionPage', '@id': 'https://a9l.im/projects', name: 'Projects', url: 'https://a9l.im/projects', mainEntity: { '@type': 'ItemList', itemListElement: projectItems } },
              breadcrumb,
              navElement,
            ],
          });
        } else if (pathname === '/blog') {
          // Blog listing SSR — will be overridden below if posts.json loads
          meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [breadcrumb, navElement] });
        } else {
          meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [breadcrumb, navElement] });
        }
        // SSR blog listing from posts.json
        if (pathname === '/blog') {
          try {
            const postsRes = await env.ASSETS.fetch(new URL('/posts.json', origin));
            if (postsRes.ok) {
              const posts = await postsRes.json();
              meta.ssrBlogList = posts.map(p =>
                `<article class="blog-post-card"><a href="/blog/${mdEsc(p.slug)}"><h3>${mdEsc(p.title)}</h3><time>${fmtDate(p.date)}</time><p>${mdEsc(p.excerpt || '')}</p></a></article>`
              ).join('');
              const blogItems = posts.map((p, i) => ({
                '@type': 'ListItem', position: i + 1, name: p.title, url: `https://a9l.im/blog/${p.slug}`,
              }));
              meta.jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': [
                  { '@type': 'Blog', '@id': 'https://a9l.im/blog', name: 'a9l.im Blog', url: 'https://a9l.im/blog', blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `https://a9l.im/blog/${p.slug}`, datePublished: p.date })) },
                  { '@type': 'ItemList', '@id': 'https://a9l.im/blog#list', itemListElement: blogItems },
                  breadcrumb,
                  navElement,
                ],
              });
            }
          } catch (_) { /* fall through to basic breadcrumb */ }
        }
      }

      if (env.VIEWS) logView(ctx, env.VIEWS, request, pathname);
      return secure(rewriteHTML(response, meta));
    }

    // Everything else: 404 (not CDN-cached, noindex)
    const page = await env.ASSETS.fetch(new URL('/404.html', origin));
    if (env.VIEWS) logView(ctx, env.VIEWS, request, pathname);
    const notFound = new Response(page.body, { status: 404, headers: page.headers });
    return secure(notFound, { 'Cloudflare-CDN-Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
  },
};

// ─── Analytics Engine ───
// Privacy-friendly server-side page view logging (no cookies, no JS snippet).
// Requires an Analytics Engine dataset bound as VIEWS in wrangler.jsonc.
function logView(ctx, views, request, pathname) {
  ctx.waitUntil(
    Promise.resolve().then(() => {
      const cf = request.cf || {};
      views.writeDataPoint({
        blobs: [
          pathname,
          cf.country || '',
          request.headers.get('referer') || '',
          request.headers.get('user-agent') || '',
          cf.city || '',
        ],
        doubles: [cf.asn || 0],
        indexes: [pathname],
      });
    })
  );
}
